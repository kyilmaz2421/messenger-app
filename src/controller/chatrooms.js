const Chatroom = require('../models/chatroom');
const Conversation = require('../models/conversation');
const User = require('../models/user');
const {deleteNotificationDocument} = require('./notifications')



const isEditGroupRequestError = async (patchQuery, newMembers, isPatchRequest=true) =>{
    const dbQuery = isPatchRequest ? await Chatroom.findOne(patchQuery) : await Chatroom.findOne({members:newMembers});
    const queryFound = dbQuery ? true : false;
    if(newMembers){ // in the 'leave' and 'name' PATCH requests we dont need to verify members
        for(const i in newMembers){
            const userQuery = await User.findOne({username: newMembers[i]});
            if(!(userQuery)){
                return {
                    error: "Not all members listed in this group exist as users"
                };
            }
        }
    }
    if(isPatchRequest){ // ALL PATCH REQS
        if(!queryFound){
            return {
                error: "This group doesn't exist or user is not in group"
            };
        }
        else{
             return {
                    chatroom: dbQuery
                };
        }
    } else if(!isPatchRequest & queryFound) {
        return {
            error: "This group already exist"
        }; // For POST requests
    } 

    return {}; // an error free POST
}

const updatePatchReqMetaData = (chatroom, newMembers, newName=undefined) =>{
    const oldData = {
        oldDate: chatroom.lastUse
    };
    if(newName){
        oldData.oldName = chatroom.name;
        chatroom.name = newName;
    }else if(chatroom.members.join(", ") === chatroom.name){ // old members == name
        oldData.oldName = chatroom.name;
        chatroom.name = newMembers.join(", "); // update name to new members
    }

    chatroom.lastUse = Date.now()
    return oldData;
}

const chatroomQuery = (_id, user)=> {
    return {members: user.username, _id};
} 

const sliceAndPopulate = async (chatrooms, left, right)=>{
    const slicedChatrooms = chatrooms.slice(left, right);

    for (i = 0; i < slicedChatrooms.length; i++){
        await slicedChatrooms[i].populate({
            path: "conversation",
            options: {limit: 1, skip: 0}
            }).execPopulate();
        
        slicedChatrooms[i].conversation.data = slicedChatrooms[i].conversation.data.slice(-1);
    }
    return slicedChatrooms;
}

const deleteChatroom = async (chatroom, oldData)=>{
    const id = chatroom._id;
    chatroom.members.forEach( async (member)=>{
        deleteNotificationDocument(member, id)
    });
    await Chatroom.findByIdAndDelete(id);
    await Conversation.findOneAndDelete({chatroomID: id}); //delete the associated conversation
    
    return {
        id, 
        delete: true, 
        oldData
    };
}



module.exports = {
    isEditGroupRequestError,
    updatePatchReqMetaData,
    chatroomQuery,
    sliceAndPopulate,
    deleteChatroom,
};