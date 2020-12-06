const redisClient = require('../db/redis');

const { promisify } = require("util");
const get = promisify(redisClient.get).bind(redisClient);

const callback = (err, reply) => {
    console.log("REDIS:",reply);
}

const addChatroom = (chatroom) =>{
    redisClient.set(chatroom._id.toString(), chatroom.members.toString(), callback) 
}

const resetChatroom = (chatroom) =>{
    redisClient.hset(chatroom._id, chatroom.members, callback);
}

const removeFromChatroom = (chatroomID, username)=>{
    let members = getChatroom(chatroomID)
    members = members.filter(member=> member !== username)
    redisClient.set(chatroomID, members);
}

const getChatroom = (chatroomID) => {
    return get(chatroomID.toString())
}

const clearChatroom = (chatroomID) =>{
    redisClient.del(chatroomID);
}

module.exports = {
    addChatroom,
    getChatroom,
    clearChatroom,
    resetChatroom,
    removeFromChatroom
};
