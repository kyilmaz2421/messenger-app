const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Chatroom = require('./chatroom')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (value.length < 7) {
                throw new Error('password must be longer than 7 characters')
            }
        }
    },
    lastUse:{
        type: Number,
        required:true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    socketIDs: {
        type: [String],
        required: true
    },
    notifications:{
        type: [String]
    }
})


userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}


userSchema.statics.findByCredentials = async (username, password) => {
    const user = await User.findOne({ username })
    
    if (!user) {
        return {error: "Invalid Credentials!"}
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        return {error:'Invalid Credentials'}
    }

    return {user}
}

//Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

//Delete user chatrooms when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Chatroom.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User