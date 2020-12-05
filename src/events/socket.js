

const socketio = require('socket.io')
const {generateMessage} = require("./utils/messages")
const {getUser, goOffline, goOnline, updateSockets, generateNotifications} = require("./utils/user")
const auth = require("./utils/auth")
const Chatroom = require('../models/chatroom')
const User = require('../models/user')
const redisClient = require('./cache/redis')

const socketConfig = async (socket,io)=>{
    const token = socket.request.signedCookies.JWT
    if(!await auth(token)){
        console.log("SOCKET AUTHENTICATION FAILED: disconecting...")
        socket.disconnect()
    } 

    socket.on('join',async ({userID, prevSocketID},callback)=>{ // need to verify roomID and username auth
        
        console.log("New client connected to server", socket.id)
        if(prevSocketID){
            console.log("Previous ID:", prevSocketID)
            await goOffline(prevSocketID)
        }

        const user = await getUser(userID,true)
        const liveSockets = []
        for(let j=0; j<user.socketIDs.length; j++){
            try { // designed to remove bad sockets
                io.sockets.connected[user.socketIDs[j]]
                liveSockets.push(user.socketIDs[j])
            }catch(e){
                console.log("Unused old socket", user.socketIDs[j], "removed")
            }
        }
        await updateSockets(liveSockets, user, true)

        const chatrooms = await goOnline(socket.id, user)
        if(chatrooms.length > 0){
            chatrooms.forEach(chatroom => {
                socket.join(chatroom._id)
            });
        }
        callback("rooms updated")
    })


    socket.on('disconnect', async ()=>{  //upon disconnect we wanna update users lastUse
        console.log("Disconnected:",socket.id)
        await goOffline(socket.id, socket.request.signedCookies.JWT)
    })


    socket.on("create",async({roomID,data})=>{
        const socketIDs = []
        for(let i=0; i<data.members.length;i++){
            const user = await getUser(data.members[i]) //user is the creator
            for(let j=0; j<user.socketIDs.length;j++){
                io.sockets.connected[user.socketIDs[j]].join(roomID)
            }
        }
        socket.broadcast.to(roomID).emit("newNotification",{id:roomID,data})
    })

    socket.on("removed",async({roomID,username},callback)=>{
        const text = "User '"+username+"' has been removed from the chat!"
        const message = await generateMessage("Admin",text,roomID)
        socket.broadcast.to(roomID).emit('message',{message,chatroomID:roomID})
        socket.leave(roomID)
        callback()
    })

    socket.on('sendMessage',async ({text,username,chatroomID},callback)=>{ // need to verify roomID and username auth
        await generateNotifications(chatroomID,username)
        const message = await generateMessage(username,text,chatroomID)
        socket.broadcast.to(chatroomID).emit('message',{message,chatroomID,username})
        callback(message) // the ack (we can add params)
    })


    socket.on("sendNotification",async ({roomID,data,username})=>{ 
        if(data.leave){
            const text = "User '"+data.leave+"' has left the chat!"
            const message = await generateMessage("Admin",text,roomID)
            socket.broadcast.to(roomID).emit('message',{message,chatroomID:roomID}) //emits this to all connections
            if (data.oldData){
                socket.broadcast.to(roomID).emit("newNotification",{id:roomID,data})
            } 
        }else if(!data.delete && data.oldData.oldMembers){
            socket.broadcast.to(roomID).emit("newNotification",{id:roomID,data}) // handles all the members removed and currently in group
            const newMembers = [],removedMembers = []
            await data.chatroom.members.forEach(async member=>{
                if(!data.oldData.oldMembers.includes(member)){ //new member
                    newMembers.push(member)
                    const user = await getUser(member)
                    for(let j=0; j<user.socketIDs.length;j++){
                        io.sockets.connected[user.socketIDs[j]].join(roomID)
                        io.to(user.socketIDs[j]).emit("addedToGroup",{id:roomID,data:data.chatroom,username}) // handles all the members removed and currently in groupx
                    }
                }
            })

            data.oldData.oldMembers.forEach(member=>{
                if(!data.chatroom.members.includes(member)) removedMembers.push(member) //removed member
            })
            if(removedMembers.length>0){
                const text = "Users '"+removedMembers.join(", ")+"' have been removed from the chat!"
                const message = await generateMessage("Admin",text,roomID)
                io.to(roomID).emit('message',{message,chatroomID:roomID,username})
            }
            if(newMembers.length>0){
                const text = "Users '"+newMembers.join(", ")+"' have been added to the chat!"
                const message = await generateMessage("Admin",text,roomID)
                io.to(roomID).emit('message',{message,chatroomID:roomID,username})
            }    

        }else{ //for group name change, or group delete
            socket.broadcast.to(roomID).emit("newNotification",{id:roomID,data,username})
        }
        if(!data.delete) generateNotifications(roomID,username)

    })

    
    socket.on("sendLocation",({roomID,username,data,conv_id},callback)=>{
        const location = "https://google.com/maps?q="+data.lat+","+data.long
        io.to(roomID).emit("locationMessage",generateMessage({username,location},conv_id))
        callback("Location Shared")
    })
}

module.exports = socketConfig
