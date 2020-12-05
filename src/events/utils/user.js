const Chatroom = require('../../models/chatroom')
const User = require('../../models/user')


const goOnline = async (socketID,user)=>{
    user.lastUse = Date.now()
    user.socketIDs = user.socketIDs.concat(socketID)
    await user.save()
    return await Chatroom.find({members: user.username})
}


const goOffline = async (socketIDs,currToken=false)=>{
    const user = await User.findOne({socketIDs})
    if(!user){
        console.log("no user")
    }else{
        user.lastUse = Date.now()
        user.socketIDs=user.socketIDs.filter(id => id != socketIDs)
        await user.save()
    }
  
}


const getUser = async (user,id=false)=>{
    const query = id ? {_id:user}: {username:user}
    const userObj = await User.findOne(query)
    return userObj
}


const updateSockets = async (sockets,user,id=false)=>{
    user.socketIDs = sockets
    await user.save()
}


const generateNotifications = async (chatroomID,username)=>{
    const chatroom = await Chatroom.findById(chatroomID)
    await chatroom.members.forEach(async member => {
        if(member!=username){
            user = await User.findOne({username:member})
            if(!user.notifications.includes(chatroomID)){
                user.notifications.push(chatroomID)
                user.save()
            }
        }    
    });    
}


module.exports={
    goOnline,
    goOffline,
    getUser,
    updateSockets,
    generateNotifications
}