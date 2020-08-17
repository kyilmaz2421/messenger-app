const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()



router.post('/login', async (req, res) => {
    try {
        const {user,error} = await User.findByCredentials(req.body.username, req.body.password)
        if(!user){
            return res.render("login",{error})
        }
        const token =  await user.generateAuthToken()
        //max age --> 1000 * 60 * 15 = 15 mins
        res.cookie('JWT', token, {
            maxAge: 86_400_000,
            httpOnly: true,
            signed:true
        });
        return res.render("chat",{username: user.username,_id: user._id,lastUse:user.lastUse})
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/signup', async (req, res) => {
    req.body.lastUse = Date.now()
    const user = new User(req.body)
    
    if(await User.findOne({ username: user.username })){
        res.render("login",{error:"This username is already in use"})
    }

    try {
        await user.save()
        const token = await user.generateAuthToken()
        //max age --> 1000 * 60 * 15 = 15 mins
        res.cookie('JWT', token, {
            maxAge: 86_400_000,
            httpOnly: true,
            signed: true
        });
        return res.render("chat",{username: user.username,_id: user._id,lastUse:user.lastUse})
    } catch (e) {
        if (e.errors.password){
            return res.render("login",{error:e.errors.password})
        }
        res.render("login",{error:"server error"})
    }
})


//verify if a user exists
router.get('/users/:username', async (req, res) => {
    const user = await User.findOne({username:req.params.username})
    if(user) return res.status(200).send({success:"success"});
    else return res.status(200).send({error:"User '"+req.params.username+"' does not exist!"})
})



router.post('/users/:id/logout',auth, async (req, res) => {
    res.clearCookie('JWT');
    return res.render("login",{error:undefined})
})

router.delete('/users/me', async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router