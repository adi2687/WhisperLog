import express from "express";
import UserModel from "../models/user.model.js";
import { verifyToken } from "../middleware/auth.middleware.js";
const router=express.Router()


router.post("/",verifyToken,async (req,res)=>{
    try {
        const searchTerm = req.body.username;
        if (!searchTerm || searchTerm.trim() === '') {
            return res.status(400).json({ message: "Search term is required" });
        }
        
        // Find all users where username contains the search term (case-insensitive)
        const users = await UserModel.find({
            username: { $regex: searchTerm, $options: 'i' },
            _id: { 
                $nin: [req.user._id] 
            }
        }).select('_id username profilePicture');

        if (users.length === 0) {
            return res.status(200).json({ 
                success: true,
                users: [],
                message: 'No users found' 
            });
        }
        // Add isFriend flag to each user
        const usersWithFriendStatus = users.map(user => ({
            _id: user._id,
            username: user.username,
            profilePicture: user.profilePicture || '',
            isFriend: req.user.friends.some(friendId => friendId.toString() === user._id.toString())
        }));
        
        res.status(200).json({ 
            success: true,
            users: usersWithFriendStatus,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal server error"})
    }
})
export default router