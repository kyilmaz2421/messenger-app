//CHAT BOX FUNCTIONALITY
const sidebarScroll = document.querySelector(".conversations");

const removeChatBoxElem = (elem) => {
  const parent = elem.parentNode;
  parent.removeChild(elem);
  if (parent.children.length == 0) {
    document.querySelector(".conversations").innerHTML =
      "<div class='item'> No conversations have been started </div>";
  }
};

const addChatbox = (chatroom, location, newGroup = false) => {
  const chatboxElem = document.querySelector(".conversations");
  if (chatboxElem.innerText === "No conversations have been started") {
    chatboxElem.innerHTML = "";
  }

  const date = moment(chatroom.lastUse).format("h:mm a");

  const elemMain = document.createElement("div");
  elemMain.setAttribute("id", chatroom._id);
  elemMain.setAttribute("class", "item");

  const elemSettings = document.createElement("i");
  elemSettings.setAttribute("class", "cog icon");
  elemSettings.id = "settings-" + chatroom._id;
  elemSettings.style.display = "none";

  const elemNotification = document.createElement("i");
  elemNotification.setAttribute("class", "small blue circle icon");
  elemNotification.id = "notifications-" + chatroom._id;
  elemNotification.style.display = "none";

  const elemData = document.createElement("div"); //18
  if (newGroup) {
    elemData.innerHTML =
      '<div style="font-size:medium;">' +
      chatroom.name +
      ' </div> <p> <span id="newGroup-text" style="font-size:90%;"> You have been added to this chatroom </span> </p>';
  } else {
    const content = chatroom.conversation.data[0];
    elemData.innerHTML =
      '<div style="font-size:medium;">' +
      chatroom.name +
      ' </div> <p> <span style="font-size:90%;">' +
      content.user +
      ": " +
      content.text +
      ' <span style="font-size:6px;">&#9679;</span> ' +
      date +
      " </span> </p>";
  }

  elemMain.appendChild(elemNotification);
  elemMain.appendChild(elemSettings);
  elemMain.appendChild(elemData);

  if (location == -1) chatboxElem.appendChild(elemMain);
  //from a get request
  else chatboxElem.prepend(elemMain); //from the post request

  elemSettings.addEventListener("click", (e) =>
    editChatroomPage(true, chatroom._id)
  );
  elemMain.addEventListener("click", (e) => renderConversationPage(elemMain));

  elemMain.addEventListener(
    "mouseover",
    (e) => (elemSettings.style.display = "block")
  );
  elemMain.addEventListener(
    "mouseleave",
    (e) => (elemSettings.style.display = "none")
  );

  return elemMain;
};

const toggleNotificationIcon = (chatroomID, isRemove) => {
  const elem = document.getElementById(chatroomID);
  const icon = elem.children[0];
  if (isRemove && icon.style.display === "block") {
    //remove --> remove when it is actually there
    elem.style.fontWeight = "normal";
    icon.style.display = "none";
  } else if (!isRemove && icon.style.display === "none") {
    //add  --> add if it isn't present
    elem.style.fontWeight = "bold";
    icon.style.display = "block";
  }
};

//parent represent child of sidebar div (conversations class)
//Child is the specific chatbox
const reshuffleChatboxes = (conversationDiv, chatbox) => {
  if (!conversationDiv.firstChild.isSameNode(chatbox)) {
    conversationDiv.removeChild(chatbox);
    conversationDiv.prepend(chatbox);
  }
};

const updateChatbox = (elem, data, isMessage = false) => {
  if (data.oldData) {
    //when we have PATCH requests that don't populate conversation
    const date = moment(data.chatroom.lastUse).format("h:mm a");
    //if(notification) toggleNotificationIcon(data.chatroom._id,false)
    let buffer = elem.children[2].innerHTML;
    if (data.oldData.oldName)
      buffer = buffer.replace(data.oldData.oldName, data.chatroom.name);
    if (data.oldData.oldDate)
      buffer = buffer.replace(data.oldData.oldDate, date);
    elem.children[2].innerHTML = buffer;
  } else if (isMessage) {
    const date = moment(data.createdAt).format("h:mm a");
    let buffer = elem.children[2].innerHTML;
    let index = buffer.search("</div>");
    elem.children[2].innerHTML =
      buffer.slice(0, index) +
      ' </div> <p> <span style="font-size:90%;">' +
      data.user +
      ": " +
      data.text +
      ' <span style="font-size:6px;">&#9679;</span> ' +
      date +
      " </span> </p>";
  } else {
    //when we have the conversation populated in the chatroom (GET request)
    const content = data.chatroom.conversation.data[0];
    const date = moment(data.chatroom.lastUse).format("h:mm a");
    //if(notification){
    //elem.children[1].innerHTML = '<div style="font-size:medium;">'+chatroom.name+' </div> <p> <span style="font-size:90%;">'+content.user+': '+content.text+' <span style="font-size:6px;">&#9679;</span> '+date+' </span> </p>'
    //toggleNotificationIcon(data.chatroom._id,false)
    //}else
    elem.children[2].innerHTML =
      '<div style="font-size:medium;">' +
      data.chatroom.name +
      ' </div> <p> <span style="font-size:90%;">' +
      content.user +
      ": " +
      content.text +
      ' <span style="font-size:6px;">&#9679;</span> ' +
      date +
      " </span> </p>";
  }
  reshuffleChatboxes(elem.parentNode, elem);
};

const getChatboxes = (lim, scrollPos, onLoad = false) => {
  fetch("/chatrooms?groups=F&limit=" + lim + "&skip=" + (lim - 15), {
    method: "GET",
  })
    .then((res) => {
      res.json().then((data) => {
        if (data.error) {
          document.querySelector(".conversations").innerHTML =
            '<div class="item"> ' + data.error + " </div>";
        } else if (!data.complete) {
          if (!onLoad) {
            while (sidebarScroll.firstChild) {
              sidebarScroll.removeChild(sidebarScroll.lastChild);
            }
          }
          data.chatrooms.forEach((chatroom) => {
            addChatbox(chatroom, -1);
            if (data.notifications.includes(chatroom._id))
              toggleNotificationIcon(chatroom._id, false);
          });
          if (!onLoad) {
            document.querySelector("#sidebar").scrollTop = scrollPos;
          }
        }
      });
    })
    .catch((e) => console.log(e));
};

document.querySelector("#sidebar").onscroll = function () {
  //visible height
  const visibleHeight = this.offsetHeight;
  //height of messages conatiner
  const containerHeight = this.scrollHeight;
  //how far have I scrolled
  const scrollOffset = this.scrollTop + visibleHeight;

  if (containerHeight <= scrollOffset) {
    const len = sidebarScroll.children.length;

    const loader = renderLoader(sidebarScroll, -1);
    const scrollPos = this.scrollHeight;
    getChatboxes(len + 15, scrollPos);
    sidebarScroll.removeChild(loader);
  }
};
