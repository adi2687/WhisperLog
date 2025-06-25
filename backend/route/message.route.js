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

// Configure Cloudinary storage for chat files
const chatFileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'whisperlog/chat-files',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  },
});

// Configure multer for image uploads
const uploadImage = multer({
  storage: chatFileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'));
    }
  },
});

// Configure multer for file uploads (non-images)
const uploadFile = multer({
  storage: chatFileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for other files
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      console.log('File type allowed:', file.mimetype);
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

// Endpoint to handle image uploads
router.post('/upload-image', uploadImage.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Get the Cloudinary URL from the uploaded file
    const imageUrl = req.file.path;
    
    res.status(200).json({ 
      url: imageUrl,
      publicId: req.file.filename,
      type: 'image'
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum 5MB allowed for images.' });
    } else if (error.message.includes('file type')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ 
      message: 'Error uploading image', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Endpoint to handle file uploads
router.post('/upload-file', uploadFile.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Get file details
    const fileUrl = req.file.path;
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;
    const fileSize = req.file.size;
    
    res.status(200).json({ 
      url: fileUrl,
      fileName,
      fileType,
      fileSize,
      publicId: req.file.filename,
      type: 'file'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum 10MB allowed for files.' });
    } else if (error.message.includes('file type')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ 
      message: 'Error uploading file', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post("/", async (req, res) => {
    const { senderId, receiverId, message, chatId, imageUrl, fileUrl, fileName, fileType, fileSize } = req.body;
    
    // Validate that either message, imageUrl, or fileUrl is provided
    if ((!message || message.trim() === '') && !imageUrl && !fileUrl) {
        return res.status(400).json({ 
            message: "Either message text, image, or file is required",
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
            message: message || '', // Make message optional if file/image is present
            timestamp: Date.now(),
            isRead: false,
            chatId,
            imageUrl: imageUrl || null,
            fileUrl: fileUrl || null,
            fileName: fileName || null,
            fileType: fileType || null,
            fileSize: fileSize || null
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