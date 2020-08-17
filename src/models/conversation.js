const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema({
    data: {type:[{
            user: {
               type: String,
               require: true
            },
            text:  {
                type: String,
                require: true
            },
            createdAt:  {
                type: Number,
                require: true
            }
         }]
        },
         
    chatroomID:{
        type:String,
        required:true
    }
})



const Conversation = mongoose.model('Conversation',conversationSchema)

module.exports = Conversation
