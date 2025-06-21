import express from 'express';
import { getProfile, updateProfile, toggleFollow } from '../controllers/profile.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// Public route - No authentication needed
router.get('/:username', getProfile);

// Protected routes - Require authentication
router.use(verifyToken);

// Update profile with file upload support
router.put(
  '/',
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverPicture', maxCount: 1 }
  ]),
  updateProfile
);

// Follow/Unfollow user
router.post('/:userId/follow', toggleFollow);

export default router;
