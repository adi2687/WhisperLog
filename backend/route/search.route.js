import express from 'express';
import { verifyToken } from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

// Search for users by username
router.post('/newfriends', verifyToken, async (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username || username.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Search for users where username contains the search term (case-insensitive)
        const users = await User.find({
            username: { $regex: username, $options: 'i' },
            _id: { $ne: req.user.id } // Exclude the current user
        }, 'username profilePicture').limit(10);

        // Check if any users were found
        if (!users || users.length === 0) {
            return res.status(200).json({
                success: true,
                users: [],
                message: 'No users found'
            });
        }

        res.status(200).json({
            success: true,
            users: users.map(user => ({
                _id: user._id,
                username: user.username,
                profilePicture: user.profilePicture || ''
            }))
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching for users',
            error: error.message
        });
    }
});

export default router;
