const express = require('express');
const router = new express.Router();

const auth = require('../middleware/auth'); // auth verifies that client is who they say they are
const controller = require("../controller/chatrooms");
const {generateNotifications, removeNotification, getNotifications} = require("../controller/notifications");
const {deleteNotificationDocument} = require('../controller/notifications')


const Chatroom = require('../models/chatroom');
const Conversation = require('../models/conversation');



// create new conversation
router.post('/chatrooms', auth, async (req, res) => {
    try {
       // error checking (check for duplicate groups)
       if (req.body.members.length<2){
            return res.status(400).send({
                error: "groups must be 2 or more users"
            }); 
       }

       const newMembers = req.body.members.sort((a, b) => a.localeCompare(b));
       const validation = await controller.isEditGroupRequestError(undefined, newMembers, false);
       if(validation.error){
            return res.status(400).send({
                error: validation.error
            }); 
       }
       if(!newMembers.includes(req.user.username)){
            return res.status(404).send(
                {error:"User must be in the group they create"
            }); 
       }
       
        const conv = new Conversation({
            data:[{
                user: "Admin",
                text: "Welcome to New Chat",
                createdAt: Date.now()
            }],
            chatroomID:"null"
        });
        
        const chatroom = await Chatroom.create({
            name: req.body.members.join(", "),
            members: newMembers,
            conversation: conv,
            lastUse: Date.now(),
            membersLength: req.body.members.length
        });

        conv.chatroomID = chatroom._id;
        await conv.save();
        await generateNotifications(chatroom._id, chatroom.members);
        
        return res.status(200).send(chatroom);
    } catch (error) {
        return res.status(500).send({
            error:"Server Error"
        });
    }
})

//get the list of chatrooms for a user
router.get('/chatrooms', auth, async (req, res) => {
    try {
        const dbquery = {
            members: req.user.username
        };

        if (req.query.groups === 'T'){
            dbquery.membersLength =  { "$gt": 2 } 
        }
        const lim = parseInt(req.query.limit), skip = parseInt(req.query.skip)
        // find every chatroom with a member of 'username'
        const chatrooms = await Chatroom.find(dbquery);
        chatrooms.sort((a,b) => b.lastUse - a.lastUse);
        
        if(skip == chatrooms.length && chatrooms.length > 0){
            return res.status(200).send({complete:true});
        }else{
            const slicedChatrooms = await controller.sliceAndPopulate(chatrooms, 0, lim);

            if(slicedChatrooms.length == 0){
                res.status(201).send({
                    error: "No conversations have been started"
                });
            }else{
                const notifications = await getNotifications(req.user.username);
                return res.status(200).send({
                    notifications,
                    chatrooms: slicedChatrooms
                });
            }
        }
        
    } catch (e) {
        res.status(500).send({
            error:"server error"
        });
    }
})

// get Conversation by id  or maybe we can send the chatroom obj?
router.get('/chatrooms/conversation/:chatroomid',auth, async (req, res) => {
   try {
        const lim = parseInt(req.query.limit), skip = parseInt(req.query.skip)
        
        const conversation = await Conversation.findOne({
            chatroomID: req.params.chatroomid
        });

        if(!conversation){
            return res.status(500).send({
                error: "conversation wasn't found"
            });
        }
        
        if(skip == 0){
            if(conversation.data.length >= lim){ // lst
                conversation.data = conversation.data.slice(conversation.data.length-(lim), conversation.data.length);
            } // alternativeley we send the whole thing
        }else if(skip >= conversation.data.length){// skip >0 (therefore not the lst query --> looking up chat history)
            conversation.data = [];
        }else if(conversation.data.length >= lim + skip){
            conversation.data = conversation.data.slice(conversation.data.length - (lim + skip), conversation.data.length - skip);
        }else{ // from skip to the rest
            conversation.data = conversation.data.slice(0, conversation.data.length - skip);
        }    
        
        removeNotification(req.user.username, req.params.chatroomid);

        return res.status(200).send(conversation)
    } catch (e) {
        res.status(500).send({
            error: "Server Error"
        });
    }
})

//GET MEMBERS
router.get("/chatrooms/:chatroomid/members", auth, async (req, res) => {
    const chatroom = await Chatroom.findOne(
        controller.chatroomQuery(req.params.chatroomid, req.user)
    );
    if (!chatroom) {
        return res.status(404).send({
            error:"Invalid request"
        });
    }
    res.status(200).send(chatroom.members);
})

// GET CHATROOM NAME
router.get("/chatrooms/:chatroomid/name", auth, async (req, res) => {
    const chatroom = await Chatroom.findOne(controller.chatroomQuery(req.params.chatroomid, req.user))
    if (!chatroom) {
        return res.status(404).send({error:"Invalid request"})
    }
    res.status(200).send({name:chatroom.name})
})


//PATCH ROUTES
router.patch('/chatrooms/:chatroomid/edit', auth, async (req, res) => { // join an existing chat
    try {
        const newMembers = req.body.members.sort((a, b) => a.localeCompare(b)) //newMembers
        
        const validation = await controller.isEditGroupRequestError(
            controller.chatroomQuery(req.params.chatroomid,req.user),
            newMembers
        );
        if(validation.error){
            return res.status(400).send({error: validation.error}); 
        }

        const oldData = controller.updatePatchReqMetaData(validation.chatroom, newMembers)
        oldData.oldMembers = validation.chatroom.members
        if(newMembers.length < 2){
            return res.status(200).send(await controller.deleteChatroom(validation.chatroom, oldData))
        }else if(!newMembers.includes(req.user.username)){
            await deleteNotificationDocument(req.user.username, req.params.chatroomid)
            return res.status(400).send({
                leave: validation.chatroom._id
            });
        }else{
            validation.chatroom.members = newMembers
            validation.chatroom.membersLength = newMembers.length
            await validation.chatroom.save()
            return res.send({chatroom:validation.chatroom,oldData})
        }
        
       
    } catch (error) {
        return res.status(400).send({error:"server error"})
    }
})


router.patch('/chatrooms/:chatroomid/name',auth, async (req, res) => { //join an existing chat
   try {
        const validation = await controller.isEditGroupRequestError(
            controller.chatroomQuery(req.params.chatroomid,req.user),
            undefined
        );
        if(validation.error) return res.status(400).send({error: validation.error});

        if(req.body.name === ""){
            return res.status(400).send({error:"name cant be an empty string"})
        }else{
            const oldData = controller.updatePatchReqMetaData(validation.chatroom,undefined,req.body.name)
            await validation.chatroom.save()
            return res.send({chatroom:validation.chatroom,oldData})
        }
    } catch (error) {
        return res.status(500).send({error:"server error"})
    }
})

router.patch('/chatrooms/:chatroomid/leave',auth, async (req, res) => { //join an existing chat
    try {
        const validation = await controller.isEditGroupRequestError(
            controller.chatroomQuery(req.params.chatroomid,req.user),
            undefined
        );
        if(validation.error){
            return res.status(400).send({error: validation.error});
        }

        const newMembers = validation.chatroom.members.filter(user => user != req.body.username).sort((a, b) => a.localeCompare(b))
        const oldData = controller.updatePatchReqMetaData(validation.chatroom,newMembers)
        if((newMembers.length)<2){
            return res.send(await controller.deleteChatroom(validation.chatroom, oldData))
        }else{
            validation.chatroom.members = newMembers
            validation.chatroom.membersLength -= 1
            await validation.chatroom.save()
            await deleteNotificationDocument(req.user.username, req.params.chatroomid)
            return res.send({id:validation.chatroom._id,leave:true,oldData})
        }
        
    } catch (error) {
        return res.status(400).send({error: "server error"})
    }
})



module.exports = router