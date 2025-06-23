import express from 'express';
import { verifyToken } from "../middleware/auth.middleware.js";
import FriendRequest from "../models/friendreq.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { sendNotification } from '../socket.js';

const router = express.Router();

// Send friend request
router.post("/request", verifyToken, async (req, res) => {
    console.log('=== FRIEND REQUEST ENDPOINT HIT ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Authenticated user:', JSON.stringify({
        id: req.user.id,
        username: req.user.username,
        profilePicture: req.user.profilePicture
    }, null, 2));
    
    const senderId = req.user.id;
    const senderName = req.user.username;
    const senderProfilePic = req.user.profilePicture || '';
    const { userId, username } = req.body;
    
    console.log('Extracted values:', { senderId, senderName, userId, username });

    if (!userId || !username) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: userId and username'
        });
    }

    // Prevent users from sending friend requests to themselves
    if (senderId === userId) {
        return res.status(400).json({
            success: false,
            message: 'Cannot send friend request to yourself'
        });
    }

    try {
        console.log('Checking for existing friend requests between:', { senderId, userId });
        
        // Check if a friend request already exists between these users
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { senderId: senderId, receiverId: userId },
                { senderId: userId, receiverId: senderId }
            ]
        }).lean();
        
        console.log('Existing request check result:', existingRequest ? 'Found' : 'Not found', existingRequest || '');
        console.log(existingRequest)
        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: existingRequest.senderId.toString() === senderId 
                        ? 'Friend request already sent' 
                        : 'You already have a pending friend request from this user'
                });
            } else if (existingRequest.status === 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: 'You are already friends with this user'
                });
            }
        }

        // Create friend request with all required fields
        const friendRequestData = {
            senderId: senderId,
            receiverId: userId,
            notification: `${senderName} sent you a friend request`,
            isRead: false,
            senderProfilePicture: senderProfilePic || '',
            status: 'pending'
        };
        
        console.log('Creating friend request with data:', JSON.stringify(friendRequestData, null, 2));
        
        const newFriendRequest = new FriendRequest(friendRequestData);
        console.log('About to save friend request...');
        
        const savedRequest = await newFriendRequest.save();
        console.log('Friend request saved successfully:', savedRequest._id);
        
        // Create notification
        const notificationData = {
            userId: userId,
            senderId: senderId,
            type: 'FRIEND_REQUEST',
            message: `${senderName} sent you a friend request`,
            isRead: false,
            link: `/profile/${senderId}`,
            senderProfilePicture: senderProfilePic || '',
            relatedRequestId: savedRequest._id
        };
        
        console.log('Creating notification with data:', JSON.stringify(notificationData, null, 2));
        
        const notification = new Notification(notificationData);
        console.log('About to save notification...');
        
        const savedNotification = await notification.save();
        console.log('Notification saved successfully:', savedNotification._id);
        
        // Send real-time notification
        const notificationDataWS = {
            userId: userId,
            type: 'FRIEND_REQUEST',
            message: `${senderName} sent you a friend request`,
            senderId: senderId,
            senderName: senderName,
            senderProfilePicture: senderProfilePic || '',
            timestamp: new Date(),
            link: `/profile/${senderId}`
        };
        
        console.log('Sending real-time notification:', notificationDataWS);
        const notificationSent = await sendNotification(notificationDataWS);
        console.log('Real-time notification sent successfully');
        
        // Send success response
        return res.status(200).json({
            success: true,
            message: 'Friend request sent successfully',
            friendRequest: savedRequest,
            notification: savedNotification,
            realtimeNotificationSent: notificationSent
        });

    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to send friend request',
            error: error.message 
        });
    }
});

// Get all notifications for the current user
router.get('/notifications', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
            
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

// Accept friend request
router.patch('/request/accept', verifyToken, async (req, res) => {
    try {
        const { notificationId } = req.body;
        const userId = req.user.id;
        const recieverid = req.body.senderid;
        const senderusername=req.user.username
        if (!notificationId) {
            return res.status(400).json({
                success: false,
                message: 'Notification ID is required'
            });
        }

        // Find the notification to get the friend request ID
        const notification = await Notification.findOne({
            _id: notificationId,
            userId: userId,
            type: 'FRIEND_REQUEST'
        });
// console.log(notification)
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Friend request notification not found'
            });
        }
// console.log(notification.relatedRequestId)
        if (!notification.relatedRequestId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid friend request notification'
            });
        }

        // Find and update the friend request
        const request = await FriendRequest.findOne({
            _id: notification.relatedRequestId,
            receiverId: userId,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found or already processed'
            });
        }

        // Update the friend request status to accepted
        request.status = 'accepted';
        await request.save();
        
        // Remove the notification since the request has been accepted
        // await Notification.findByIdAndDelete(notification._id);
        
        // Add each user to the other's friends list
        await Promise.all([
            User.findByIdAndUpdate(
                request.senderId,
                { $addToSet: { friends: userId } }
            ),
            User.findByIdAndUpdate(
                userId,
                { $addToSet: { friends: request.senderId } }
            )
        ]);
console.log('saved till here')
        // Create notification for the requester
        const receiver = await User.findById(recieverid).select('username profilePicture');
        // console.log(receiver)
        const acceptNotification = new Notification({
            userId: request.senderId,
            senderId: userId,
            type: 'FRIEND_REQUEST_ACCEPTED',
            message: `${senderusername} accepted your friend request`,
            isRead: false,
            link: `/profile/${userId}`,
            senderProfilePicture: receiver.profilePicture || ''
        });
        await acceptNotification.save();
        // Send real-time notification
        sendNotification({
            userId: request.senderId,
            type: 'FRIEND_REQUEST_ACCEPTED',
            message: `${senderusername} accepted your friend request`,
            link: `/profile/${userId}`,
            senderProfilePicture: receiver.profilePicture || ''
        });

        // Mark the original notification as read
        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Friend request accepted',
            request
        });

    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept friend request',
            error: error.message
        });
    }
});

// Get unread notifications count
router.get('/notifications/unread-count', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const count = await Notification.countDocuments({
            userId: userId,
            isRead: false
        });
        
        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: error.message
        });
    }
});

// Mark notification as read
router.patch('/notifications/:notificationId/read', verifyToken, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const notification = await Notification.findOneAndUpdate(
            { 
                _id: notificationId, 
                userId: userId 
            },
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
});

// Delete notification
router.delete('/notifications/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const notification = await Notification.findOneAndDelete({
            _id: id,
            userId: userId
        });
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or already deleted'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
});

export default router;
