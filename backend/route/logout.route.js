import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
const router = express.Router();


import UserModel from '../models/user.model.js';

router.post('', verifyToken, async (req, res) => {
  try {
    console.log('in logout')
    // Clear the authentication token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: true, 
      sameSite: 'Strict', 
      path: '/', 
    });

    // Update user status to offline
    const userId = req.user._id;
    try {
      // First find the user to ensure they exist
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update the user status and last seen time
      user.status = 'offline';
      user.lastSeen = new Date();
      
      // Save the user
      const updatedUser = await user.save();
      
      console.log(`User ${userId} status updated to offline`);
      
      // Also clear any active sessions
      await UserModel.updateOne(
        { _id: userId },
        { $unset: { session: 1 } }
      );

      return res.status(200).json({
        success: true,
        message: 'User logged out successfully',
        status: 'offline'
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }

    console.log(`User ${userId} logged out successfully`);
    
    res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    
    if (error.code === 11000) {
      // Duplicate key error (shouldn't happen here, but just in case)
      return res.status(400).json({
        success: false,
        message: 'User already logged out'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
