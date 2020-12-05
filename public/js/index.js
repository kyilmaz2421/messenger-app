// Elements

const socket = io()
const username = document.querySelector("#username").innerText
const userID = document.querySelector("#_id").innerText
const users = new Set(username)
const chatroomIDElem = document.getElementById("chatroomID")

let currentActiveElem = null
let isEdit = false
let socketID = ""

const $messageForm = document.querySelector("#message-form")
const $messageFormInput = document.querySelector("#message-content")
const $messageFormButton = document.querySelector("#message-form button")
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

//HELPER FUNCTIONS
const toggleErrorMessages = (className,message,type="negative")=>{
    const elem = document.querySelector("."+className)
    if (message){
        const newElem = document.createElement("div")
        newElem.setAttribute("class","ui "+type+" message")
        newElem.innerHTML='<div class="header">'+message+'</div>';
        elem.appendChild(newElem)
        newElem.addEventListener("click",(e)=>elem.removeChild(newElem))
         
    }else{
        elem.innerHTML = ""
    } 
}

const autoScroll = ()=>{
    //new messsage element
    const $newMessage = $messages.lastElementChild

    //height of new message
    const newMsgstyles = getComputedStyle($newMessage)
    const newMsgMargin = parseInt(newMsgstyles.marginBottom)
    const newMsgHeight =  $newMessage.offsetHeight +newMsgMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages conatiner
    const containerHeight = $messages.scrollHeight

    //how far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight-newMsgHeight <= scrollOffset){ //autoscroll
        $messages.scrollTop = $messages.scrollHeight
    }

}

const renderLoader = (elem, location=0)=>{
    const loader = document.createElement("div")
    loader.className = "ui active centered inline loader"
    if(location == 0){
        elem.prepend(loader)
    }else{
        elem.appendChild(loader)
    }
    return loader
}





