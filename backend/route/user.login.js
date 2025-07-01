import express from 'express'
import UserModel from '../models/user.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
const SECRET_KEY = process.env.SECRET_KEY
const router = express.Router()
router.post("",async (req,res)=>{
    // console.log(req.body)
    const {username,email,password}=req.body
    try {
        const user=await UserModel.findOne({email})
        if (!user) {
            return res.status(404).json({message:"User not found"})
        }
        user.status="online"
        await user.save()
        const isPasswordValid=await bcrypt.compare(password,user.password)
        if (!isPasswordValid) {
            return res.status(401).json({message:"Invalid password"})
        }
        const token=jwt.sign({username:user.username,id:user._id,email:user.email,profilePicture:user.profileImageURL},SECRET_KEY,{expiresIn:'72h'})
        res.cookie("token",token,{
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge:24*60*60*1000
        })
        res.status(200).json({message:"User logged in successfully",user:user,token:token})
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal server error"})
    }
})
export default router