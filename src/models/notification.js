const mongoose = require('mongoose')

// every chatroom and user combination will map to at most one notification
const notificationSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    }, 
    chatroomID:{
        type: String,
        required: true
    },
    turnedOn:{
        type: Boolean,
        required: true
    }
});



const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
