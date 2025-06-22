import express from "express";
import NotificationModel from "../models/friendreq.model.js";
const router=express.Router()
router.post("/",async (req,res)=>{
    try {
        const {senderId,receiverId,notification}=req.body
        const newNotification=new NotificationModel({
            senderId,
            receiverId,
            notification,
            isRead:false
        })
        await newNotification.save()
        res.status(200).json({message:"Notification sent successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal server error"})
    }
})
export default router
