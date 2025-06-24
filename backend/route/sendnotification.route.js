import express from "express";
import NotificationModel from "../models/friendreq.model.js";
import { verifyToken } from "../middleware/auth.middleware.js";
const router = express.Router();

// Send notification
router.post("/", verifyToken, async (req, res) => {
    try {
        const { senderId, receiverId, notification, type = "GENERAL" } = req.body;
        const newNotification = new NotificationModel({
            senderId,
            receiverId,
            notification,
            type,
            isRead: false
        });
        await newNotification.save();
        res.status(200).json({ message: "Notification sent successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all notifications for the current user
router.get("/all", verifyToken, async (req, res) => {
    try {
        const notifications = await NotificationModel.find({
            $or: [
                { senderId: req.user.id },
                { receiverId: req.user.id }
            ]
        }).sort({ createdAt: -1 }); // Sort by newest first
        res.status(200).json(notifications);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get unread notifications count
router.get("/unread-count", verifyToken, async (req, res) => {
    try {
        const count = await NotificationModel.countDocuments({
            receiverId: req.user.id,
            isRead: false
        });
        res.status(200).json({ count });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Mark notification as read
router.patch("/:id/read", verifyToken, async (req, res) => {
    try {
        const notification = await NotificationModel.findOneAndUpdate(
            { _id: req.params.id, receiverId: req.user.id },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.status(200).json(notification);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Delete notification
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const notification = await NotificationModel.findOneAndDelete({
            _id: req.params.id,
            $or: [
                { senderId: req.user.id },
                { receiverId: req.user.id }
            ]
        });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;