import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import CallModel from '../models/call.model.js';
import User from '../models/user.model.js';

const router = express.Router();

// Get call history for current user
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, skip = 0 } = req.query;

    const calls = await CallModel.find({
      $or: [
        { initiator: userId },
        { receiver: userId }
      ]
    })
    .populate('initiator', 'username profilePicture')
    .populate('receiver', 'username profilePicture')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    res.status(200).json({
      success: true,
      calls,
      count: calls.length
    });
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call history',
      error: error.message
    });
  }
});

// Get specific call details
router.get('/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const call = await CallModel.findOne({ callId })
      .populate('initiator', 'username profilePicture')
      .populate('receiver', 'username profilePicture');

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Check if user is part of the call
    if (call.initiator._id.toString() !== userId.toString() && 
        call.receiver._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    res.status(200).json({
      success: true,
      call
    });
  } catch (error) {
    console.error('Error fetching call details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call details',
      error: error.message
    });
  }
});

// Create new call record
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { callId, type, receiverId } = req.body;
    const initiatorId = req.user._id;

    if (!callId || !type || !receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const newCall = new CallModel({
      callId,
      type,
      initiator: initiatorId,
      receiver: receiverId,
      status: 'initiated',
      participants: [{
        userId: initiatorId,
        username: req.user.username,
        joinedAt: new Date()
      }]
    });

    await newCall.save();

    res.status(201).json({
      success: true,
      call: newCall
    });
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create call',
      error: error.message
    });
  }
});

// Update call status
router.patch('/:callId/status', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, endTime, duration } = req.body;

    const updateData = { status };
    if (endTime) updateData.endTime = endTime;
    if (duration) updateData.duration = duration;

    const call = await CallModel.findOneAndUpdate(
      { callId },
      updateData,
      { new: true }
    );

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    res.status(200).json({
      success: true,
      call
    });
  } catch (error) {
    console.error('Error updating call status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call status',
      error: error.message
    });
  }
});

// Save call recording URL
router.patch('/:callId/recording', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const { recordingUrl, recordingDuration } = req.body;

    const call = await CallModel.findOneAndUpdate(
      { callId },
      {
        recordingUrl,
        recordingDuration,
        isRecorded: true
      },
      { new: true }
    );

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    res.status(200).json({
      success: true,
      call
    });
  } catch (error) {
    console.error('Error saving recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save recording',
      error: error.message
    });
  }
});

// Delete call record
router.delete('/:callId', verifyToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const call = await CallModel.findOne({ callId });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Only initiator or receiver can delete
    if (call.initiator.toString() !== userId.toString() && 
        call.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    await CallModel.deleteOne({ callId });

    res.status(200).json({
      success: true,
      message: 'Call deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete call',
      error: error.message
    });
  }
});

export default router;
