const Chatroom = require('../models/chatroom')
const Conversation = require('../models/conversation')

const updateConversation = async (data,chatroomID)=>{
    //find conversation from chatroomID
    const chatroom = await Chatroom.findOne({_id:chatroomID})
    chatroom.lastUse = Date.now()
    chatroom.save()

    const conversation = await Conversation.findOne({chatroomID})
    conversation.data.push(data)
    await conversation.save()
}

const generateMessage = async (user,text,chatroomID)=>{
    const data = {
        user,
        text,
        createdAt: new Date().getTime()
    }
    await updateConversation(data,chatroomID)
    return data
}


// const generateLocationMessage= (user,url,_id)=>{
//     const data {
//         username,
//         text: url,
//         createdAt: new Date().getTime()
//     }
//     updateConversation(data,id)
//     return data
// }


module.exports = {
    generateMessage
}