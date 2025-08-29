import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import transporter from '../config/nodeMailer.js';
import userModel from '../models/userModel.js';
import {EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE} from '../config/emailTemplates.js'
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({
            success: false,
            message: "Missing details"
        });
    }

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 5);
        const user = new userModel({ name, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome to Naso",
            text: `Welcome to Naso website. Your account has been created with email id: ${email}`
        };
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error sending email:', err);
            } else {
            console.log('Email sent:', info.response);
              }
        });
        await transporter.sendMail(mailOptions);

        // ✅ Send success response
        return res.json({
            success: true,
            message: "User registered successfully and email sent!",
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};


export const login =async (req,res)=>{
    const {email,password}=req.body;
    if (!email || !password){
        return res.json({success:false,message:"email and password are required"})
    }
    try{
        const user = await userModel.findOne({email});
        if (!user){
            return res.json({success:false,message:'Invalid email'})
        }
        const isMatch =await bcrypt.compare(password,user.password)
        if (!isMatch){
            return res.json({success:false,message:'Invalid password'})
        }

        const token =jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // true only on HTTPS
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.json ({success:true})
    }catch(error){
        return res.json ({
            success:false,
            message:error.message
        })
    }
}

export const logout =async (req,res)=>{
    try{
        res.clearCookie('token',{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production'?'none': 'strict',
            maxAge:7*24*60*60*1000
        })

        return res.json({success:true,message:"Logged Out"})
    }catch (error){
        return res.json ({
            success:false,
            message:error.message
        })
    }
}

export const sendVerifyOtp =async(req,res)=>{
    try{
        const userId=req.userId ;

        const user= await userModel.findById(userId)

        if (user.isAccountVerified){
            return res.json({success:false,message:"account is already verified"})
        }
        const otp = String(Math.floor(100000+Math.random()*900000))

        user.verifyOtp =otp;
        user.verifyOtpExpireAt = Date.now()+24*60*60*1000
        await user.save();

        const mailOption={
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verfication otp",
            // text: `Your OTP is ${otp}.Verify your account using this OTP.`,
            html:EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        }
        await transporter.sendMail(mailOption);
        res.json({success:true,message:'Verification otp is sent on email'})
    }catch(error){
        res.json({success: false,message: error.message})
    }
}

export const verifyEmail =async (req,res)=>{
    const {otp}=req.body;
    const userId=req.userId;
    if (!userId || !otp){
        return res.json({success: false,message: 'Missing Details'})
    }
    try{
        const user = await userModel.findById(userId);

        if(!user){
            return res.json({success: false,message: 'User not found'})
        }
        if(user.verifyOtp==""|| user.verifyOtp!=otp){
            return res.json({success: false,message: 'invalid otp'})
        }

        if (user.verifyOtpExpireAt<Date.now()){
            return res.json({success: false,message: 'otp exp'})
        }
        user.isAccountVerified= true;
        user.verifyOtp ="";
        user.verifyOtpExpireAt=0;
        await user.save();
        return res.json({success:true,message:"Email verified"})
    }catch(error){
        res.json({success: false,message: error.message})
    }
}

export const isAuthenticated = async (req,res)=>{
    try{
        return res.json({success:true})
    }catch (error){
        res.json({success: false,message: error.message})
    }
}

export const sendResetOtp= async (req ,res)=>{
    const {email}=req.body;

    if (!email){
        return res.json({success:false, message :"email is required"})
    }
    try{

        const user = await userModel.findOne({email})
        if (!user){
            return res.json({success:false,message:"user not found"})
        }
        const otp = String(Math.floor(100000+Math.random()*900000))

        user.resetOtp =otp;
        user.resetOtpExpireAt = Date.now()+15*60*1000
        await user.save();

        const mailOption={
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "password reset otp",
            // text: `Your OTP for resetting your password is ${otp}.Use this otp to proceed with resettting your password.`
            html:PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        }
        await transporter.sendMail(mailOption);
        res.json({success:true,message:'otp is sent on email'})

    }catch(error){
        return res.json({success:false,message:error.message})
    }
}

export const resetPassword = async (req,res)=>{
   const {email,otp,newPassword}  = req.body;
   if (!email || !otp || !newPassword ){
        return res.json({success:false,message:"email,otp,newpassword are required"})
   }
   try{

    const user =await userModel.findOne({email})
    if(!user){
        return res.json({success:false,message:'User not found '})
    }
    if(user.resetOtp===''|| user.resetOtp!==otp){
        return res.json({success:false,message:'invalid otp'})
    }
    if(user.resetOtpExpireAt<Date.now()){
        return res.json({success:false,message:'Otp expired'})
    }
    const hashedPassword=await bcrypt.hash(newPassword,5);

    user.password=hashedPassword;
    user.resetOtp='';
    user.resetOtpExpireAt=0;
    await user.save();

    return res.json({success:true,message:'password changed'})
   }catch(error){
         return res.json({success:false,message:error.message})
   }
}