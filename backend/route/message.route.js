import express from 'express'
import MessageModel from '../models/message.model.js'
import ChatModel from '../models/chat.model.js'
const router = express.Router()
function makeRandomId() {
    const p1 = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    const s1 = () => Math.random();
    const s2 = (t) => Math.floor(t);
    const s3 = (v) => v.toString(16);
    const s4 = (a, b) => a === 'x' ? b : (b & 0x3 | 0x8);

    const final = p1.replace(/[xy]/g, function (char) {
        const r1 = s2(s1() * 16);
        const r2 = s4(char, r1);
        return s3(r2);
    });

    return final;
}

// Configure Cloudinary
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for chat images
const chatImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'whisperlog/chat-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  },
});

// Configure multer for file uploads
const upload = multer({
  storage: chatImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'));
    }
  },
});

// Endpoint to handle image uploads
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Get the Cloudinary URL from the uploaded file
    const imageUrl = req.file.path;
    
    res.status(200).json({ 
      url: imageUrl,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum 5MB allowed.' });
    } else if (error.message.includes('file type')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ 
      message: 'Error uploading image', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post("/", async (req, res) => {
    const { senderId, receiverId, message, chatId, imageUrl } = req.body;
    
    // Validate that either message or imageUrl is provided
    if ((!message || message.trim() === '') && !imageUrl) {
        return res.status(400).json({ 
            message: "Either message text or image is required",
            received: Object.keys(req.body)
        });
    }
    
    // Validate required fields
    if (!senderId || !receiverId || !chatId) {
        return res.status(400).json({ 
            message: "Missing required fields",
            required: ["senderId", "receiverId", "chatId"],
            received: Object.keys(req.body)
        });
    }

    try {
        const newMessage = new MessageModel({
            senderId,
            receiverId,
            message: message || '', // Make message optional if image is present
            timestamp: Date.now(),
            isRead: false,
            chatId,
            imageUrl: imageUrl || null
        });
        
        const savedMessage = await newMessage.save();
        
        // Emit socket event for real-time update
        if (req.app.get('io')) {
            const io = req.app.get('io');
            // Emit to the specific chat room
            io.to(chatId).emit('message', savedMessage);
            // Also emit to the sender and receiver for real-time updates in their chat lists
            io.to(senderId).emit('message', savedMessage);
            io.to(receiverId).emit('message', savedMessage);
        }
        
        res.status(200).json({ 
            message: "Message sent successfully",
            data: savedMessage
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Internal server error",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
})

// Get all messages for a specific chat
router.get("/:chatId", async (req, res) => {    
    try {
        const { chatId } = req.params;
        const messages = await MessageModel.find({ chatId })
            .sort({ timestamp: 1 });
            res.status(200).json({ messages });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
});

router.post("/findid", async (req, res) => {
    try {
        const { senderId, receiverId } = req.body
        const existchatbetweenusers = await ChatModel.findOne({
            $or: [
                { senderId: receiverId, receiverId: senderId },
                { senderId: senderId, receiverId: receiverId }
            ]
        })

        if (!existchatbetweenusers) {
            const chatId = makeRandomId()
            const newChat = new ChatModel({
                senderId,
                receiverId,
                timestamp: Date.now(),
                chatId: chatId
            })
            await newChat.save()
            res.status(200).json({ chatId: chatId })
        }
        else {
            res.status(200).json({ chatId: existchatbetweenusers.chatId })
        }

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
})
export default router