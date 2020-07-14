// ADD NEW CONVERSATIONS FUNCTIONALITY

const renderUserTag= (user,buttonType)=>{
    data = '<button class="ui '+buttonType+' basic button" style="margin-top: 10px;"> <span class="new-user">'+user+'</span> <i style="padding-left: 3px;" class="close icon"> </i></button>'
    const elem = document.createElement("span")
    elem.setAttribute('class',user) 
    elem.innerHTML=data
    document.querySelector(".new-additions").appendChild(elem)
    users.add(user)
    elem.addEventListener('click',function(e){
        users.delete(this.className)
        if(this.className==username){
            toggleErrorMessages("edit-convo-error-messages","NOTE: You have selected yourself to leave the group","info")
        }
        if(users.size<2){
             toggleErrorMessages("edit-convo-error-messages","NOTE: If a group with less than two members is submitted (including yourself) the group will be deleted!","info")
        }
        this.parentNode.removeChild(this)
    })
}


const addUserTag = (users)=>{
    const userInput = document.querySelector("#addUser-input input")
    toggleErrorMessages("edit-convo-error-messages",undefined)
    if(userInput.value==""){
        toggleErrorMessages("edit-convo-error-messages","Please input a username");
        userInput.value = "" //clear the input
    }
    else if(users.has(userInput.value)){
        toggleErrorMessages("edit-convo-error-messages","The user '"+userInput.value+"' has already been selected for this group");
        userInput.value = "" //clear the input
    }else{
        fetch("/users/"+userInput.value,{
            method: 'GET'
        }).then((res)=>{ 
            res.json().then((response)=>{
                if(response.error) toggleErrorMessages("edit-convo-error-messages",response.error)
                else renderUserTag(userInput.value,"positive")
                userInput.value = "" //clear the input
            })
        })
        .catch((e)=>console.log(e))
    }

}

const clearUserTags = (users)=>{
    document.querySelector(".edit__conversation h5").innerText= ""
    document.querySelector(".new-additions").innerHTML=""
    document.querySelector("#addUser-input input").value=""
    document.querySelector(".edit__conversation").style.display="none"
    document.querySelector(".chat__main").style.display = "flex"
    toggleErrorMessages("edit-convo-error-messages",undefined)
    users.forEach((key)=> {
        if (key != username) users.delete(key);
    })

    if (!users.has(username)) users.add(username) // when we leave a group
}

const renderEditPage =(chatroomid)=>{
    if (chatroomIDElem.className!=="active-"+chatroomid){
        chatroomIDElem.className="active-"+chatroomid
    }
    fetch("/chatrooms/"+chatroomid+"/members",{
        method: 'GET'
    }).then((res)=>{ 
        res.json().then((members)=>{
            members.forEach(member=>renderUserTag(member,"negative"))
        })
    })
    .catch((e)=> console.log(e))

    document.querySelector(".edit__conversation h5").innerText= "current members shown below in red (remove members by clicking)"
    document.querySelector("#submit-edit-conversation").innerText="Submit Changes"
    document.querySelector("#leave-chat").display="block"
}

const editChatroomPage = (edit,chatroomID)=>{
    clearUserTags(users)
    isEdit = edit
    if(isEdit){
        renderEditPage(chatroomID)
    }else {
        document.querySelector("#submit-edit-conversation").innerText="Create new chat"
        document.querySelector("#leave-chat").display="none"
    }

    document.querySelector(".chat__main").style.display="none"
    document.querySelector(".edit__conversation").style.display="block"
}


//TRIGGER EDIT PAGE
document.querySelector(".chat__navbar div i").addEventListener("click",e=>{
    const isNone = document.querySelector(".chat__sidebar").style.display==="none"
    document.querySelector(".chat__sidebar").style.display = isNone ? "block":"none"
})

//Open create user page (other event listener is in addChatBox())
document.querySelector("#new_conversation").addEventListener('click',(e)=>editChatroomPage(false,undefined))

//add User Tag
document.querySelector("#addUser").addEventListener('click',(e)=> addUserTag(users))

//Cancel update user operation
document.querySelector('.exit-edit-conversation').addEventListener('click',(e)=>clearUserTags(users))


document.querySelector('#leave-chat').addEventListener('click',(e)=>{
    const chatroomID = chatroomIDElem.className.slice(7)
    fetch("/chatrooms/"+chatroomID+"/leave",{
        method: 'PATCH'
        //body will be done through auth
    }).then((res)=>{ 
        res.json().then((data)=>{
            if(data.delete||data.leave){
                document.querySelector('.exit-edit-conversation').click()
                clearConvPage(true)
                removeChatBoxElem(document.getElementById(chatroom.id))
                socket.emit("sendNotification",{roomID:data.id, data})
            }
        })
    })
    .catch((e) => console.log(e))
})

//POST NEW GROUP OR PATCH
document.querySelector('#submit-edit-conversation').addEventListener('click',(e)=>{
    const chatroomID = chatroomIDElem.className.slice(7)
    toggleErrorMessages("edit-convo-error-messages",undefined)
    if (users.size>1 || isEdit){
        const method = isEdit ? "PATCH": "POST"
        const url = isEdit ? "/chatrooms/"+chatroomID+"/edit":"/chatrooms"
        const members = JSON.stringify({members:Array.from(users)}); 

        fetch(url,{
            method: method,
            headers: {
             'Content-Type': 'application/json;charset=utf-8'
             },
            body: members
         })
         .then((res)=>{
             res.json().then((data) =>{
                 data.method=method
                 if(data.error) toggleErrorMessages("edit-convo-error-messages",data.error);
                 else if(method=="POST"){
                    const elem = addChatbox(data,0);
                    renderConversationPage(elem,data.conversation._id)
                    clearUserTags(users)
                    socket.emit("create",{roomID:data._id, data})
                 }else if(data.delete || data.leave){ 
                    document.querySelector('.exit-edit-conversation').click()
                    clearConvPage(true)
                    removeChatBoxElem(document.getElementById(data.id))
                    if(data.leave) data.leave = username
                    socket.emit("sendNotification",{roomID:data.id, data,username})
                 }else{ //PATCH (change group members)
                    updateChatbox(document.getElementById(chatroomID),data);
                    if(data.oldData.oldName) document.querySelector(".chatTitle h3 form").innerText = data.chatroom.name
                    clearUserTags(users)
                    socket.emit("sendNotification",{roomID:data.chatroom._id, data,username})
                 }
             })
         })    
         .catch((e) =>{
            toggleErrorMessages("edit-convo-error-messages",e.error);
         });
    }else{
        toggleErrorMessages("edit-convo-error-messages","Please insert a username")
    }
    
})