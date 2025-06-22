import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import multer from "multer";
import cloudinary from 'cloudinary';
import User from "../models/user.model.js";
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log('Initialized Cloudinary with:', {
  cloud_name: process.env.CLOUDINARY_NAME ? '✅' : '❌',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅' : '❌',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅' : '❌'
});

const router = express.Router();

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'whisperlog/profile-pictures',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 500, height: 500, gravity: 'face', crop: 'thumb' },
      { quality: 'auto:best' }
    ]
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .jpg, and .png files are allowed'));
    }
  },
});

// Get current user's profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({ user: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update profile details (bio, birthday, hobbies, etc.)
router.put("/update", verifyToken, async (req, res) => {
  try {
    const { bio, birthday, hobbies, moviePreferences, musicPreferences } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    
    // Handle birthday update
    if (birthday) {
      // Ensure the date is valid
      const birthDate = new Date(birthday);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format for birthday' });
      }
      updateData.birthday = birthDate;
    } else if (birthday === '') {
      // Allow clearing the birthday by sending an empty string
      updateData.birthday = null;
    }
    
    // Handle hobbies update
    if (hobbies !== undefined) {
      updateData.hobbies = Array.isArray(hobbies) ? hobbies : [];
    }
    
    // Handle movie preferences update
    if (moviePreferences !== undefined) {
      updateData.moviePreferences = Array.isArray(moviePreferences) ? moviePreferences : [];
    }
    
    // Handle music preferences update
    if (musicPreferences !== undefined) {
      updateData.musicPreferences = Array.isArray(musicPreferences) ? musicPreferences : [];
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format the response
    const userResponse = updatedUser.toObject();
    if (userResponse.birthday) {
      userResponse.birthday = userResponse.birthday.toISOString();
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      message: error.message || 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update profile picture
router.put("/picture", verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user._id;
    
    // Get the Cloudinary URL from the uploaded file
    const newProfilePicture = req.file.path;

    // If user had a previous Cloudinary image, delete it
    if (req.user.profilePicture) {
      try {
        const publicId = req.user.profilePicture.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`whisperlog/profile-pictures/${publicId}`);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Continue even if deletion of old image fails
      }
    }
    
    // Update user's profile picture in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: newProfilePicture },
      { new: true, select: '-password' } // Don't return password
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile picture updated successfully',
      profilePicture: updatedUser.profilePicture
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ 
      message: error.message || 'Error updating profile picture' 
    });
  }
});

export default router;
