const express = require('express')
const Chatroom = require('../models/chatroom')
const Conversation = require('../models/conversation')
const User = require('../models/user')
const auth = require('../middleware/auth') //auth verifies that client is who they say they are
const router = new express.Router()

//Helper functions

const isEditGroupRequestError = async (patchQuery,newMembers,isPatchRequest = true)=>{
    const dbQuery = isPatchRequest ? await Chatroom.findOne(patchQuery) : await Chatroom.findOne({members:newMembers});
    const queryFound = dbQuery ? true : false
    if(newMembers){ // in the 'leave' and 'name' PATCH requests we dont need to verify members
        for(const i in newMembers){
            const userQuery = await User.findOne({username:newMembers[i]})
            if(!(userQuery)) return {error:"Not all members listed in this group exist as users"}
        }
    }

    if(isPatchRequest){ // ALL PATCH REQS
        if(!queryFound) return {error:"This group doesn't exist or user is not in group"}
        //else if(await Chatroom.findOne({members:newMembers}))  ??WHAT DO WE DO IF PUR EDIT MAKES A EXISTING GROUP
        else return {chatroom:dbQuery}
    } else if(!isPatchRequest & queryFound) return {error:"This group already exist"} //FOR POST REQUEST

    return {} // an error free POST
}

const updatePatchReqMetaData = (chatroom,newMembers,newName= undefined)=>{
    const oldData = {oldDate:chatroom.lastUse}
    if(newName){
        oldData.oldName=chatroom.name
        chatroom.name=newName
    }else if(chatroom.members.join(", ")===chatroom.name){ //old members == name
        oldData.oldName=chatroom.name
        chatroom.name = newMembers.join(", ") //update name to new members
    }

    chatroom.lastUse = Date.now()
    return oldData
}

const chatroomQuery = (_id,user)=> {
    return {members:user.username,_id}
} 

const sliceAndPopulate = async (chatrooms,left,right)=>{
    const slicedChatrooms = chatrooms.slice(left,right)

    for (i = 0; i < slicedChatrooms.length; i++){
        await slicedChatrooms[i].populate({
            path:"conversation",
            options: {limit:1,skip:0}
            }).execPopulate();
        
        slicedChatrooms[i].conversation.data = slicedChatrooms[i].conversation.data.slice(-1)
    }
    return slicedChatrooms
}

const generateNotifications = async (members,chatroomID,username)=>{
    await members.forEach(async member => {
        if(member!=username){
            user = await User.findOne({username:member})
            if(!user.notifications.includes(chatroomID)){
                    user.notifications.push(chatroomID)
                    user.save()
            }
        }
    });
}

const removeNotification= async (user,chatroomID)=>{
    user.notifications = user.notifications.filter(id => id != chatroomID)
    user.save()
}

const deleteChatroom = async (chatroom,oldData)=>{
    const id = chatroom._id
    await Chatroom.findByIdAndDelete(id)
    await Conversation.findOneAndDelete({chatroomID:id}) //delete the associated conversation
    return {id,delete:true,oldData}
}

//ROUTES
router.post('/chatrooms',auth, async (req, res) => { //new conversation
    try {
       //error checking (check for dupliacte groups)
       if (req.body.members.length<2) return res.status(400).send({error:"groups must be 2 or more users"}); 
       const newMembers = req.body.members.sort((a, b) => a.localeCompare(b))

       const validation = await isEditGroupRequestError(undefined,newMembers,false)
       if(validation.error) return res.status(400).send({error: validation.error}); 
       if(!newMembers.includes(req.user.username)) return res.status(404).send({error:"User must be in the group they create"}); 
       
        const conv = new Conversation({
            data:[{
                user: "Admin",
                text: "Welcome to New Chat",
                createdAt: Date.now()
            }],
            chatroomID:"null"
        })
        
        const chatroom = await Chatroom.create({
            name: req.body.members.join(", "),
            members: newMembers,
            conversation: conv,
            lastUse: Date.now(),
            membersLength: req.body.members.length
        })

        conv.chatroomID = chatroom._id
        await conv.save()
        await generateNotifications(chatroom.members,chatroom._id,req.user.username)
        
        return res.status(200).send(chatroom)
    } catch (error) {
        return res.status(500).send({error:"Server Error"})
    }
})

//get the list of chatrooms for a user
router.get('/chatrooms',auth, async (req, res) => {
    try {
        const dbquery = {members: req.user.username}
        if (req.query.groups === 'T'){
            dbquery.membersLength =  { "$gt": 2 } 
        }
        const lim = parseInt(req.query.limit), skip = parseInt(req.query.skip)
        // find every chatroom with a member of 'username'
        const chatrooms = await Chatroom.find(dbquery)
        chatrooms.sort((a,b)=>b.lastUse-a.lastUse)
        if(skip == chatrooms.length){
            return res.status(200).send({complete:true})
        }else{
            const slicedChatrooms = await sliceAndPopulate(chatrooms,0,lim)
            if(slicedChatrooms.length==0) res.status(201).send({error:" No Conversations have been started"})
            else return res.status(200).send({notifications:req.user.notifications,chatrooms:slicedChatrooms})
        }
        
    } catch (e) {
        res.status(500).send({error:"server error"})
    }
})

//get Conversation by id  or maybe we can send the chatroom obj?
router.get('/chatrooms/conversation/:chatroomid',auth, async (req, res) => {
   try {
        const lim = parseInt(req.query.limit),skip = parseInt(req.query.skip)
        
        const conversation = await Conversation.findOne({chatroomID:req.params.chatroomid})
        if(!conversation) return res.status(500).send({error:"conversation wasn't found"})
        
        if(skip==0){
            if(conversation.data.length>lim){ //lst
                conversation.data = conversation.data.slice(conversation.data.length-(lim),-1)
            } // alternativeley we send the whole thing
        }else if(skip>=conversation.data.length){//skip >0 (therefore not the lst query --> looking up chat history)
            conversation.data=[]
        }else if(conversation.data.length>=lim+skip){
            conversation.data = conversation.data.slice(conversation.data.length-(lim+skip),conversation.data.length-skip)
        }else{ // from skip to the rest
            conversation.data = conversation.data.slice(0,conversation.data.length-skip)
        }    
        
        removeNotification(req.user,req.params.chatroomid)

        return res.status(200).send(conversation)
    } catch (e) {
        res.status(500).send({error:"Server Error"})
    }
})

//GET MEMBERS
router.get("/chatrooms/:chatroomid/members",auth,async (req,res)=>{
    const chatroom = await Chatroom.findOne(chatroomQuery(req.params.chatroomid,req.user))
    if (!chatroom) {
        return res.status(404).send({error:"Invalid request"})
    }
    res.status(200).send(chatroom.members)
})

// GET CHATROOM NAME
router.get("/chatrooms/:chatroomid/name",auth,async (req,res)=>{
    const chatroom = await Chatroom.findOne(chatroomQuery(req.params.chatroomid,req.user))
    if (!chatroom) {
        return res.status(404).send({error:"Invalid request"})
    }
    res.status(200).send({name:chatroom.name})
})


//PATCH ROUTES
router.patch('/chatrooms/:chatroomid/edit',auth, async (req, res) => { //join an existing chat
    try {
        const newMembers = req.body.members.sort((a, b) => a.localeCompare(b)) //newMembers
        
        const validation = await isEditGroupRequestError(chatroomQuery(req.params.chatroomid,req.user),newMembers)
        if(validation.error) return res.status(400).send({error: validation.error}); 

        const oldData = updatePatchReqMetaData(validation.chatroom,newMembers)
        oldData.oldMembers = validation.chatroom.members
        if(newMembers.length<2){
            return res.status(200).send(await deleteChatroom(validation.chatroom,oldData))
        }else if(!newMembers.includes(req.user.username)){
            return res.status(400).send({leave:validation.chatroom._id})
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
        const validation = await isEditGroupRequestError(chatroomQuery(req.params.chatroomid,req.user),undefined)
        if(validation.error) return res.status(400).send({error: validation.error});

        if(req.body.name===""){
            return res.status(400).send({error:"name cant be an empty string"})
        }else{
            const oldData = updatePatchReqMetaData(validation.chatroom,undefined,req.body.name)
            await validation.chatroom.save()
            return res.send({chatroom:validation.chatroom,oldData})
        }
    } catch (error) {
        return res.status(500).send({error:"server error"})
    }
})

router.patch('/chatrooms/:chatroomid/leave',auth, async (req, res) => { //join an existing chat
    try {
        const validation = await isEditGroupRequestError(chatroomQuery(req.params.chatroomid,req.user),undefined)
        if(validation.error) return res.status(400).send({error: validation.error});

        const newMembers = validation.chatroom.members.filter(user => user != req.body.username).sort((a, b) => a.localeCompare(b))
        const oldData = updatePatchReqMetaData(validation.chatroom,newMembers)
        if((newMembers.length)<2){
            return res.send(await deleteChatroom(validation.chatroom,oldData))
        }else{
            validation.chatroom.members = newMembers
            validation.chatroom.membersLength-=1
            await validation.chatroom.save()
            return res.send({id:validation.chatroom._id,leave:true,oldData})
        }
    } catch (error) {
        return res.status(400).send({error: "server error"})
    }
})



module.exports = router