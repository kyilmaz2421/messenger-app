const User = require('../models/user')
const jwt = require('jsonwebtoken')


const auth = async (token) => {
    try {
        const decoded = await jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }

        return user
    } catch (e) {
        return false
    }
}

module.exports=auth