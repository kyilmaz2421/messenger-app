//SOCKET COMMUNICATIONS

socket.on("connect",()=>{
    if (socketID.length>0){
        console.log(socket.io.engine.id,"re-connect")
    }else console.log(socket.io.engine.id,"connect")

    socket.emit("join",{userID,prevSocketID:socketID},(ack)=>{
        console.log(ack)
    })
    socketID = socket.io.engine.id

})

socket.on("disconnect", (msg)=>{
    console.log(socketID,"SERVER-SIDE TRIGGERED DISCONNECT")
})

//SEND MESSAGE
$messageForm.addEventListener('submit',(ev)=>{
    ev.preventDefault()

    $messageFormButton.setAttribute("disabled","disabled")
    
    const text = ev.target.elements.message.value, chatroomID = chatroomIDElem.className.slice(7)

    socket.emit('sendMessage', {text,username,chatroomID} ,(message)=>{ // run upon event emitted is acknoledged by reciever
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ""
        $messageFormInput.focus()
        console.log(message)
        renderMessage(message)
        updateChatbox(document.getElementById(chatroomID),message,true);
        $messages.scrollTop = $messages.scrollHeight
    })
})

//RECIEVE MESSAGE
socket.on('message',({message,chatroomID,username:user})=>{ //general for all messages data recieved
    updateChatbox(document.getElementById(chatroomID),message,true);
    if(chatroomIDElem.className=="active-"+chatroomID){
        renderMessage(message)
        autoScroll()
    }else if(user!=username){
        toggleNotificationIcon(chatroomID,false)
    }
})


socket.on("addedToGroup",({id,data,username:user})=>{
    addChatbox(data,0,true);  
    if(user!=username) toggleNotificationIcon(id,false)
})

socket.on("newNotification",({id,data,username:user})=>{
    console.log("NOTTTIFICATION-----",data)
    if(data.method=="POST"){
        addChatbox(data,0);
        if(user!=username)toggleNotificationIcon(id,false)
    }
    if(data.delete){
        if(chatroomIDElem.className=="active-"+id) clearConvPage(true)
        removeChatBoxElem(document.getElementById(id))
    }else if(data.oldData){
        if(data.oldData.oldMembers){ //members change
            if(data.oldData.oldMembers.includes(username)&&!data.chatroom.members.includes(username)){ //delete or leave
                socket.emit("removed",{roomID:id,username},(ack)=>{
                    clearConvPage(true)
                    removeChatBoxElem(document.getElementById(id))
                })
            } 
        }       
        if(data.oldData.oldName){
            updateChatbox(document.getElementById(id),data);
            if(chatroomIDElem.className=="active-"+id){
                if(data.oldData.oldName) document.querySelector(".chatTitle h3 form").innerText = data.chatroom.name
            }else if(user!=username){
                toggleNotificationIcon(id,false)
            } 

        } 
    }
})


// $sendLocationButton.addEventListener("click",(e)=>{
//    if(!navigator.geolocation){
//     return alert("Geolocation not supported by this browser")
//    }
//    $sendLocationButton.setAttribute("disabled","disabled")
   
//    navigator.geolocation.getCurrentPosition((pos)=>{
//         socket.emit("sendLocation",{
//             long:pos.coords.longitude,
//             lat:pos.coords.latitude
//         },(ack)=>{ // run upon event emitted is acknoledged by reciever
//             console.log(ack)
//             $sendLocationButton.removeAttribute("disabled")
//         })
//    })
// })



