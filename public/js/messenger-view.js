// GET CONVERSATIONS
let isRendered = false;

//triggered by event listener inside chatbox
const renderConversationPage = (elemMain) => {
  clearConvPage(false);

  document.querySelector(".compose").style.display = "flex";
  chatroomIDElem.className = "active-" + elemMain.id;

  toggleNotificationIcon(elemMain.id, true);

  if (currentActiveElem != null) {
    currentActiveElem.setAttribute("class", "item");
  }
  currentActiveElem = elemMain;
  elemMain.setAttribute("class", "item active");

  getMessages(elemMain, 15, 0);
};

const getMessages = (elemMain, lim, skip, location = 0) => {
  const chatroomID = elemMain.id;
  fetch(
    "/chatrooms/conversation/" + chatroomID + "?limit=" + lim + "&skip=" + skip,
    {
      method: "GET",
    }
  )
    .then((res) => {
      res.json().then((conversation) => {
        if (conversation.error) {
          document.querySelector(".chat__messages").innerHTML =
            '<h3 style="padding-left:36%;padding-top:10%;color:rgb(168, 164, 164);"> ' +
            conversation.error +
            "</h3>";
        } else if (location == -1 || renderChatroomName(chatroomID)) {
          if (conversation.data.length == 0) {
            if (location == 0)
              document.querySelector(".chat__messages").innerHTML =
                '<h3 style="padding-left:36%;padding-top:10%;color:rgb(168, 164, 164);">No conversation yet</h3>';
            else if (
              document.querySelector(".chat__messages").children[0].innerHTML !=
              '<p style="padding-left:36%;color:rgb(168, 164, 164);">Conversation up to date</p>'
            ) {
              const message = document.createElement("div");
              message.innerHTML =
                '<p style="padding-left:36%;color:rgb(168, 164, 164);">Conversation up to date</p>';
              document.querySelector(".chat__messages").prepend(message);
            }
          } else {
            renderMessages(conversation.data, location);
            if (elemMain.innerHTML.search('id="newGroup-text"') > 0) {
              elemMain.children[2].innerHTML = elemMain.children[2].innerHTML.replace(
                'id="newGroup-text"',
                ""
              );
              updateChatbox(elemMain, res, true);
            }
            if (location == 0) {
              isRendered = true;
            }
          }
        } else {
          document.querySelector(".chat__messages").innerHTML =
            '<h3 style="padding-left:36%;padding-top:10%;color:rgb(168, 164, 164);"> Server Error: cannot retreive conversation</h3>';
        }
      });
    })
    .catch((e) => {
      document.querySelector(".chat__messages").innerHTML =
        '<h3 style="padding-left:36%;padding-top:10%;color:rgb(168, 164, 164);"> Server Error: cannot retreive conversation</h3>';
    });
};

clearConvPage = (isDeleted) => {
  while ($messages.firstChild) {
    $messages.removeChild($messages.lastChild);
  }
  document.querySelector(".chatTitle h3 form").innerText = "";

  if (isDeleted) {
    document.querySelector(".chat__messages").innerHTML =
      '<h3 style="padding-left:36%;padding-top:10%;color:rgb(168, 164, 164);">No conversation Selected</h3>';
    chatroomIDElem.className = "";
  }
  document.querySelector(".compose").style.display = "none";
  isRendered = false;
};

const toggleDisablingChatButtons = (isOn) => {
  $messageFormButton.setAttribute("disabled", "disabled");
};

const renderMessages = (conversation, location = 0) => {
  if (location == -1) conversation.reverse();
  conversation.forEach((message) => renderMessage(message, location));
  if (location == 0) $messages.scrollTop = $messages.scrollHeight;
};

const renderMessage = (message, location = 0) => {
  const elem = document.createElement("div");
  elem.setAttribute("class", "message");
  const span = document.createElement("span");

  if (message.user === username) {
    span.setAttribute("class", "user-message");
  } else {
    span.setAttribute("class", "other-message");
  }

  const time = moment(message.createdAt).format("h:mm a");

  if (message.user !== "Admin") {
    //meta data
    const metadata = document.createElement("p");
    metadata.innerHTML =
      '<span class="message__name">' +
      message.user +
      '</span> <span class="message__meta">' +
      time +
      "</span>";

    //messages
    const messages = document.createElement("p");
    messages.innerText = message.text;

    span.appendChild(metadata);
    span.appendChild(messages);
    elem.appendChild(span);
  } else {
    elem.innerHTML =
      '<p style="padding-left:30%;color:rgb(168, 164, 164);"> <span class="message__name">' +
      message.user +
      ':</span> <span class="message__meta">' +
      message.text +
      " &#9679; " +
      time +
      "</span> </p>";
  }

  if (location == -1) document.querySelector(".chat__messages").prepend(elem);
  // going through old chat
  else document.querySelector(".chat__messages").appendChild(elem); // new chat or 1st time loading
};

$messages.onscroll = function () {
  if (this.scrollTop == 0 && isRendered) {
    const loader = renderLoader($messages);
    const len = $messages.children.length;
    getMessages(
      document.getElementById(chatroomIDElem.className.slice(7)),
      15,
      len,
      -1
    );
    $messages.removeChild(loader);
  }
};
