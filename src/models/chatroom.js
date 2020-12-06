const mongoose = require("mongoose");

const chatroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: {
    type: [String],
    required: true,
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Conversation",
  },
  lastUse: {
    type: Number,
    required: true,
  },
  membersLength: {
    type: Number,
    required: true,
  },
});

const Chatroom = mongoose.model("Chatroom", chatroomSchema);

module.exports = Chatroom;
