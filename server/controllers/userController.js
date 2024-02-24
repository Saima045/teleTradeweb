const User = require('../models/userModel')
const AsyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const nodeMailer = require('nodemailer')
const { v4: uuidv4 } = require('uuid')

const registerUser = AsyncHandler(async (req, res) => {
    const {   name, email,phone, password, gender,about_me } = req.body;
    // check if user already exists
    const checkUser = await User.findOne({ email })
    if (checkUser) {
        res.status(400);
        throw new Error('User already exists!');
    } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const createdUser = await User.create(
            {
                name,
                email,
                phone,
                password: hashedPassword,
                gender,
                about_me
               
            }
        )

//        console.log(createdUser)

        res.send(createdUser)

 
    }

})

const getUser = AsyncHandler(async (req, res) => {
  
    const {_id}=req.query
   // console.log(category)
    const userData = await User.findOne({_id});
    console.log(userData)
    res.send(userData);
})


const updateUser = AsyncHandler(async (req, res) => {
    const { name, email,phone, gender,about_me,image,_id  } = req.body;
    // check if user already exists
    //console.log(gender)
    const findUser = await User.findOne({ _id:_id })
    if (!findUser) {
        res.status(400);
        throw new Error('User not found!');
    } 
    else 
    {
        findUser.name = name
        findUser.email = email;
        findUser.phone = phone;
        findUser.email = email;
        findUser.gender = gender;
        findUser.about_me = about_me;
        findUser.image = image;
      


        await findUser.save()
    }
        
    res.send(findUser)

 
})

const loginUser = AsyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400)
        throw new Error('Please enter the fields')
    }
    const findUser = await User.findOne({ email })
    if (!findUser) {
        res.status(404);
        throw new Error('User not found')
    }
    if (findUser && (await bcrypt.compare(password, findUser.password))) {
        res.status(200);
        res.send(findUser)
    } else {
        res.status(401);
        throw new Error('Invalid Credentials')
    }
})

const sendResetLink = AsyncHandler(async (req, res) => {
    
   
    //  get the email
    const { email } = req.body;
    // get the user with the provided email
    const findUser = await User.findOne({ email: email });
    // check if user exists
    if (!findUser) {
        res.status(404)
        throw new Error('Invalid Email address')
    } else {
       
        const token = uuidv4();
      //  console.log(token)
        const expireToken = new Date(Date.now() + 3600);
      
        // update the user
        findUser.resetToken = token;
        findUser.expirationTime = expireToken;
        await findUser.save();

      

        // send the mail
        // 1.create the configurations
        const transporter = nodeMailer.createTransport({
            service: 'gmail',
            auth: {
                user: "saima045@gmail.com",
                pass: "fqwe vnqs fogo bvuw"
            }
        })

        // 2. create the mail options
        const mailOptions = {
            from: "saima045@gmail.com",
            to: "saima045@gmail.com",
            subject: "Reset your password",
            html: `
            <img width='200px' height='200px' src='https://github.com/hsuntariq/TalkTango/blob/main/client/src/assets/logo.png?raw=true' style='display:block;margin:auto;border-radius:50%;'/><br>
            <h3>Following is the reset link</h3>
            <h4>http://localhost:3000/reset-password/${token}</h4>  
            `
        }


        try {
            
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                   // console.log(err)
                    res.status(401);
                    throw new Error(err)
                } else {
                    res.send('Email sent successfully!')
                   // console.log(info.response)
                }
            })
        } catch (error) {
           // console.log(error)
           res.status(401);
           throw new Error(err)
        }

       


    }

})


const resetPassword = AsyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const findUser = await User.findOne({ resetToken: token })
    if (!findUser) {
        res.status(404);
        throw new Error('Token Expired')
    } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)
        findUser.password = hashedPassword
        findUser.resetToken = null;
        await findUser.save()
        res.send('Password updated successfully')
    }
})

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    })
}


module.exports = {
    registerUser,
    loginUser,
    getUser,
    updateUser,
    sendResetLink,
    resetPassword
}