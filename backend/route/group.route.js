import express from 'express';
import GroupModel from '../models/group.model.js';
import MessageModel from '../models/message.model.js';
import UserModel from '../models/user.model.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Import io - will be set by app.js
let io = null;
export const setIO = (socketIO) => {
  io = socketIO;
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || "dcheezp2x",
  api_key: process.env.CLOUDINARY_API_KEY || "991655215547186",
  api_secret: process.env.CLOUDINARY_API_SECRET || "TZ2iFcFqSM3IiYs0-RNWje35YUQ"
});

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create a new group
router.post('/create', authMiddleware, upload.single('groupIcon'), async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const userId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Parse members if it's a string
    let membersList = [];
    if (members) {
      membersList = typeof members === 'string' ? JSON.parse(members) : members;
    }

    // Generate unique chatId
    const chatId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Upload group icon if provided
    let groupIconUrl = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'group_icons', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      groupIconUrl = result.secure_url;
    }

    // Create members array with admin
    const groupMembers = [
      {
        userId: userId,
        role: 'admin',
        joinedAt: new Date()
      }
    ];

    // Add other members
    if (membersList && membersList.length > 0) {
      for (const memberId of membersList) {
        if (memberId !== userId.toString()) {
          groupMembers.push({
            userId: memberId,
            role: 'member',
            joinedAt: new Date()
          });
        }
      }
    }

    // Create group
    const group = new GroupModel({
      name: name.trim(),
      description: description?.trim() || '',
      groupIcon: groupIconUrl,
      admin: userId,
      members: groupMembers,
      chatId: chatId,
      lastMessageTime: new Date()
    });

    await group.save();

    // Populate member details
    await group.populate('members.userId', 'username profilePicture email');
    await group.populate('admin', 'username profilePicture email');

    res.status(201).json({
      success: true,
      group: group
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group', details: error.message });
  }
});

// Get all groups for a user
router.get('/my-groups', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await GroupModel.find({
      'members.userId': userId
    })
      .populate('members.userId', 'username profilePicture email')
      .populate('admin', 'username profilePicture email')
      .populate('lastMessage')
      .sort({ lastMessageTime: -1 });

    res.json({
      success: true,
      groups: groups
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups', details: error.message });
  }
});

// Get group details
router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await GroupModel.findById(groupId)
      .populate('members.userId', 'username profilePicture email')
      .populate('admin', 'username profilePicture email')
      .populate('lastMessage');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is a member
    if (!group.isMember(userId)) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    res.json({
      success: true,
      group: group
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group', details: error.message });
  }
});

// Add members to group
router.post('/:groupId/add-members', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body;
    const userId = req.user._id;

    const group = await GroupModel.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user has permission to add members
    const canAdd = group.isAdmin(userId) || group.settings.allowMembersToAddOthers;
    if (!canAdd) {
      return res.status(403).json({ error: 'You do not have permission to add members' });
    }

    // Add new members
    const membersList = Array.isArray(members) ? members : [members];
    const addedMembers = [];
    
    for (const memberId of membersList) {
      // Check if already a member
      if (!group.isMember(memberId)) {
        group.members.push({
          userId: memberId,
          role: 'member',
          joinedAt: new Date()
        });
        addedMembers.push(memberId);
      }
    }

    await group.save();
    await group.populate('members.userId', 'username profilePicture email');

    // Create system message for added members
    if (addedMembers.length > 0) {
      const addedUsernames = await Promise.all(
        addedMembers.map(async (id) => {
          const user = await UserModel.findById(id).select('username');
          return user?.username || 'User';
        })
      );
      
      const systemMessage = new MessageModel({
        chatId: group.chatId,
        senderId: userId,
        message: `${addedUsernames.join(', ')} joined the group`,
        isGroupMessage: true,
        groupId: group._id,
        isSystemMessage: true,
        timestamp: new Date()
      });
      await systemMessage.save();

      // Broadcast system message to all group members
      if (io) {
        io.to(group.chatId).emit('message', {
          ...systemMessage.toObject(),
          _id: systemMessage._id,
          createdAt: systemMessage.createdAt,
          updatedAt: systemMessage.updatedAt
        });
      }
    }

    // Broadcast group update to all members
    if (io) {
      io.to(group.chatId).emit('group_updated', {
        groupId: group._id,
        group: group
      });
    }

    res.json({
      success: true,
      group: group
    });
  } catch (error) {
    console.error('Error adding members:', error);
    res.status(500).json({ error: 'Failed to add members', details: error.message });
  }
});

// Remove member from group
router.post('/:groupId/remove-member', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.user._id;

    const group = await GroupModel.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Only admin can remove members
    if (!group.isAdmin(userId)) {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    // Cannot remove the main admin
    if (memberId === group.admin.toString()) {
      return res.status(400).json({ error: 'Cannot remove the group creator' });
    }

    // Get username before removing
    const removedUser = await UserModel.findById(memberId).select('username');

    // Remove member
    group.members = group.members.filter(m => m.userId.toString() !== memberId);
    await group.save();
    await group.populate('members.userId', 'username profilePicture email');

    // Create system message for removal
    const systemMessage = new MessageModel({
      chatId: group.chatId,
      senderId: userId,
      message: `${removedUser?.username || 'User'} was removed from the group`,
      isGroupMessage: true,
      groupId: group._id,
      isSystemMessage: true,
      timestamp: new Date()
    });
    await systemMessage.save();

    // Broadcast system message
    if (io) {
      io.to(group.chatId).emit('message', {
        ...systemMessage.toObject(),
        _id: systemMessage._id,
        createdAt: systemMessage.createdAt,
        updatedAt: systemMessage.updatedAt
      });
    }

    // Broadcast group update to all members
    if (io) {
      io.to(group.chatId).emit('group_updated', {
        groupId: group._id,
        group: group
      });
    }

    res.json({
      success: true,
      group: group
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member', details: error.message });
  }
});

// Leave group
router.post('/:groupId/leave', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await GroupModel.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Admin cannot leave, must transfer ownership first
    if (group.admin.toString() === userId.toString()) {
      return res.status(400).json({ 
        error: 'Admin cannot leave the group. Please transfer ownership or delete the group.' 
      });
    }

    // Get username before removing
    const leavingUser = await UserModel.findById(userId).select('username');
    
    // Remove user from members
    group.members = group.members.filter(m => m.userId.toString() !== userId.toString());
    await group.save();

    // Create system message for leaving
    const systemMessage = new MessageModel({
      chatId: group.chatId,
      senderId: userId,
      message: `${leavingUser?.username || 'User'} left the group`,
      isGroupMessage: true,
      groupId: group._id,
      isSystemMessage: true,
      timestamp: new Date()
    });
    await systemMessage.save();

    // Broadcast system message
    if (io) {
      io.to(group.chatId).emit('message', {
        ...systemMessage.toObject(),
        _id: systemMessage._id,
        createdAt: systemMessage.createdAt,
        updatedAt: systemMessage.updatedAt
      });
      
      // Broadcast group update to remaining members
      io.to(group.chatId).emit('group_updated', {
        groupId: group._id,
        group: group
      });
    }

    res.json({
      success: true,
      message: 'Left group successfully'
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ error: 'Failed to leave group', details: error.message });
  }
});

// Update group details
router.put('/:groupId', authMiddleware, upload.single('groupIcon'), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;
    const userId = req.user._id;

    const group = await GroupModel.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Only admin can update group
    if (!group.isAdmin(userId)) {
      return res.status(403).json({ error: 'Only admins can update group details' });
    }

    // Update fields
    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();

    // Upload new group icon if provided
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'group_icons', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      group.groupIcon = result.secure_url;
    }

    await group.save();
    await group.populate('members.userId', 'username profilePicture email');
    await group.populate('admin', 'username profilePicture email');

    res.json({
      success: true,
      group: group
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group', details: error.message });
  }
});

// Delete group
router.delete('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await GroupModel.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Only the main admin can delete the group
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the group creator can delete the group' });
    }

    // Delete all messages in the group
    await MessageModel.deleteMany({ chatId: group.chatId });

    // Delete the group
    await GroupModel.findByIdAndDelete(groupId);

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group', details: error.message });
  }
});

// Make member admin
router.post('/:groupId/make-admin', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.user._id;

    const group = await GroupModel.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Only admin can make others admin
    if (!group.isAdmin(userId)) {
      return res.status(403).json({ error: 'Only admins can promote members' });
    }

    // Find and update member role
    const member = group.members.find(m => m.userId.toString() === memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found in group' });
    }

    member.role = 'admin';
    await group.save();
    await group.populate('members.userId', 'username profilePicture email');
    await group.populate('admin', 'username profilePicture email');

    // Broadcast group update to all members
    if (io) {
      io.to(group.chatId).emit('group_updated', {
        groupId: group._id,
        group: group
      });
    }

    res.json({
      success: true,
      group: group
    });
  } catch (error) {
    console.error('Error making admin:', error);
    res.status(500).json({ error: 'Failed to make admin', details: error.message });
  }
});

export default router;
