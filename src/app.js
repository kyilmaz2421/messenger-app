const bodyParser = require("body-parser");
const express = require('express')
const cookieParser = require('cookie-parser');
const path = require('path')
const userRouter = require('./routers/authentication')
const chatroomRouter = require('./routers/chatrooms')
const auth = require("./utils/auth")


const app = express()

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(cookieParser(process.env.COOKIE_SECRET));
app.set('view engine', 'ejs')
app.use(express.static(publicDirectoryPath))

app.use(userRouter)
app.use(chatroomRouter)


app.get('/', async (req, res)=>{
    const user = await auth(req.signedCookies.JWT,true)
    if (!user){
        return res.redirect("/login");
    }
    else return res.render("chat",{username: user.username,_id: user._id,lastUse: user.lastUse})
});


module.exports= app