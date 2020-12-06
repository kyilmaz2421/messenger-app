const Notification = require('../models/notification');
const user = require('./user');

// for the members of the chatroom (minus the sending user) need a notification
const generateNotifications = async (chatroomID, members, eventCreatorUsername = null) => {
    if (eventCreatorUsername){
        members = members.filter(member => member != eventCreatorUsername);
    }
    Notification.updateMany(
        {username: members, chatroomID},
        {$set: {"turnedOn": true}}
    );
}

const getNotifications = async (username)=>{
    return await Notification.find({username, turnedOn: true});
}

const removeNotification = async (username, chatroomID)=>{
    Notification.findOneAndUpdate(
        {username, chatroomID, turnedOn: true},
        {"turnedOn": false}
    );
}

const deleteNotificationDocument = async (username, chatroomID)=>{
    await Notification.deleteOne({username, chatroomID});
}

module.exports = {
    generateNotifications,
    removeNotification,
    getNotifications,
    deleteNotificationDocument
};
