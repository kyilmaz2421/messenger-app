const Chatroom = require("../models/chatroom");
const User = require("../models/user");

const goOnline = async (socketID, user) => {
  user.lastUse = Date.now();
  user.socketIDs = user.socketIDs.concat(socketID);
  await user.save();
  return await Chatroom.find({ members: user.username });
};

const goOffline = async (socketIDs, currToken = false) => {
  const user = await User.findOne({ socketIDs });
  if (!user) {
    console.log("no user");
  } else {
    user.lastUse = Date.now();
    user.socketIDs = user.socketIDs.filter((id) => id != socketIDs);
    await user.save();
  }
};

const getUser = async (user, id = false) => {
  const query = id ? { _id: user } : { username: user };
  const userObj = await User.findOne(query);
  return userObj;
};

const updateSockets = async (sockets, user, id = false) => {
  user.socketIDs = sockets;
  await user.save();
};

module.exports = {
  goOnline,
  goOffline,
  getUser,
  updateSockets,
};
