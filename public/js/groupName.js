//TITLE CHANGE FUNCTIONALITY

const clearNameEdit = (self, val) => {
  const parent = self.parentNode;
  parent.removeChild(self); // self is the input
  parent.innerHTML = val;
};

const updateName = (self, oldValue) => {
  const chatroomID = chatroomIDElem.className.slice(7);
  fetch("/chatrooms/" + chatroomID + "/name", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({ name: self.value }),
  })
    .then((res) => {
      res.json().then((data) => {
        if (data.error) {
          clearNameEdit(self, oldValue);
          toggleErrorMessages("chat-error-messages", data.error);
        } else {
          const chatbox = document.getElementById(chatroomID);
          clearNameEdit(self, self.value);
          updateChatbox(chatbox, data);
          socket.emit("sendNotification", { roomID: data.chatroom._id, data });
        }
      });
    })
    .catch((e) => console.log(e));
};

document
  .querySelector(".chatTitle h3 form")
  .addEventListener("click", function (e) {
    if (this.firstChild.nodeValue) {
      const input = document.createElement("input"); // this input is added between the form tags (as the only child)
      input.value = this.innerText;
      const oldValue = this.innerText;
      this.innerText = "";
      this.appendChild(input);
      this.firstChild.focus();

      input.addEventListener("focusout", function (e) {
        updateName(this, oldValue);
      });
    }
  });

const renderChatroomName = (chatroomID) => {
  let err = false;
  fetch("/chatrooms/" + chatroomID + "/name", {
    method: "GET",
  })
    .then((res) => {
      res.json().then((chatroom) => {
        if (chatroom.error) err = true;
        else {
          document.querySelector(".chatTitle h3 form").innerText =
            chatroom.name;
        }
      });
    })
    .catch((e) => (err = true));

  return !err;
};

const setChatroomName = (chatroomID) =>
  (document.querySelector(".chatTitle h3 form").innerText = newTitle);
