const Chatroom = require('../models/chatroom');
const Conversation = require('../models/conversation');


const generateMessage = async (user, text, chatroomID)=>{
    const msgData = {
        user,
        text,
        createdAt: new Date().getTime()
    };
    await updateConversation(msgData, chatroomID);
    return msgData;
}

// update conversation object with new message
const updateConversation = async (msgData, chatroomID)=>{
    //find conversation from chatroomID
    await Chatroom.findOneAndUpdate(
        {_id: chatroomID},
        {lastUse: Date.now()}
    );

    const conversation = await Conversation.findOne({chatroomID});
    conversation.data.push(msgData);
    await conversation.save();
}

module.exports = {
    generateMessage
};