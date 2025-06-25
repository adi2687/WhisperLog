import express from 'express'
import path from 'path'
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
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'mp4', 'webm', 'mov', 'avi', 'wmv', 'flv', 'mkv'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  },
});

// Configure Cloudinary storage specifically for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'whisperlog/chat-videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'webm', 'mov', 'avi', 'wmv', 'flv', 'mkv', '3gp', 'mpeg', 'mpg', 'm4v', 'ogv'],
    chunk_size: 6000000, // 6MB chunks for large files
    eager: [
      { width: 300, height: 300, crop: "pad", audio_codec: "none" }, 
      { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" } 
    ],
    eager_async: true,
    eager_notification_url: "http://your-site.com/notify_endpoint"
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
    console.log('Processing file upload:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/rtf',
      'application/json',
      
      // Archives
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/x-gzip',
      
      // Images (though they should go through upload-image)
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      
      // Videos (though they should go through upload-video)
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/3gpp',
      'video/3gpp2',
      'video/mpeg',
      'video/x-flv',
      'video/x-m4v',
      'video/x-matroska',
      'video/x-ms-asf',
      'application/octet-stream' // Fallback for some file types
    ];
    
    // Get file extension
    const fileExt = file.originalname.split('.').pop().toLowerCase();
    const allowedExtensions = [
      // Documents
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'json',
      // Archives
      'zip', 'rar', '7z', 'tar', 'gz',
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff',
      // Videos
      'mp4', 'webm', 'ogv', 'mov', 'avi', 'wmv', '3gp', '3g2', 'mpeg', 'mpg', 'flv', 'm4v', 'mkv'
    ];
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      console.log('File type allowed:', {
        mimetype: file.mimetype,
        extension: fileExt,
        originalname: file.originalname
      });
      cb(null, true);
    } else {
      console.log('Unsupported file type:', {
        mimetype: file.mimetype,
        extension: fileExt,
        originalname: file.originalname,
        allowedTypes,
        allowedExtensions
      });
      cb(new Error(`Unsupported file type. Allowed types: ${allowedExtensions.join(', ')}`));
    }
  },
});

// Configure multer for video uploads
const uploadVideo = multer({
  storage: videoStorage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
    files: 1,
    fields: 10, // Maximum number of non-file fields
    parts: 20 // Maximum number of parts (fields + files)
  },
  fileFilter: (req, file, cb) => {
    // Log all available file properties for debugging
    const fileInfo = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      destination: file.destination,
      filename: file.filename,
      path: file.path,
      buffer: file.buffer ? `Buffer(${file.buffer.length} bytes)` : undefined,
      stream: file.stream ? 'Stream available' : 'No stream',
      allProperties: Object.getOwnPropertyNames(file)
    };
    
    console.log('Processing file upload:', JSON.stringify(fileInfo, null, 2));

    // Skip size check for now since it's coming in as undefined
    // We'll handle size validation after the file is fully uploaded
    
    // Check file type based on MIME type and extension
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime',
      'video/x-msvideo', 'video/x-ms-wmv', 'video/3gpp',
      'video/3gpp2', 'video/mpeg', 'video/mp2t',
      'video/x-flv', 'video/x-m4v', 'video/x-matroska',
      'video/x-ms-asf', 'video/ogg', 'application/octet-stream'
    ];

    // Get file extension
    const fileExt = file.originalname ? path.extname(file.originalname).toLowerCase() : '';
    const allowedExtensions = ['.mp4', '.webm', '.mov', '.avi', '.wmv', '.3gp', '.3g2', '.mpeg', '.mpg', '.m4v', '.mkv', '.flv', '.ogv'];

    // Check MIME type if available
    if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
      console.error('Unsupported MIME type:', file.mimetype);
      return cb(new Error(`Unsupported video format: ${file.mimetype}. Supported formats: MP4, WebM, MOV, AVI, WMV, 3GP, MPEG, MKV, FLV`));
    }

    // Check file extension if MIME type is not reliable
    if (fileExt && !allowedExtensions.includes(fileExt)) {
      console.error('Unsupported file extension:', fileExt);
      return cb(new Error(`Unsupported file extension: ${fileExt}. Supported extensions: ${allowedExtensions.join(', ')}`));
    }

    // If we get here, the file is either valid or we can't determine it's invalid
    console.log('Accepting file for upload:', {
      name: file.originalname,
      type: file.mimetype,
      size: file.size
    });
    
    cb(null, true);
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

// Endpoint to handle video uploads
router.post('/upload-video', (req, res, next) => {
  // First handle the file upload
  uploadVideo.single('video')(req, res, async (err) => {
    try {
      console.log('Video upload request received:', {
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          fieldname: req.file.fieldname,
          encoding: req.file.encoding,
          destination: req.file.destination,
          filename: req.file.filename
        } : 'No file received',
        fields: req.body,
        headers: req.headers,
        error: err ? err.message : 'No error'
      });

      // Handle multer errors
      if (err) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum 50MB allowed for videos.'
          });
        }
        throw err; // This will be caught by the catch block
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No video file provided or file upload failed',
          receivedFile: false
        });
      }

      // Get video details
      const videoUrl = req.file.path;
      const fileName = req.file.originalname;
      const fileType = req.file.mimetype;
      const fileSize = req.file.size;
      
      // For videos, we'll use the first frame as thumbnail if available
      const thumbnail = req.file.thumbnail || null;
      
      const responseData = { 
        success: true,
        url: videoUrl,
        fileName,
        fileType,
        fileSize,
        thumbnail,
        duration: req.file.duration || null,
        publicId: req.file.filename,
        type: 'video'
      };

      console.log('Video upload successful:', responseData);
      return res.status(200).json(responseData);
      
    } catch (error) {
      console.error('Error in video upload endpoint:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      
      // Pass the error to the Express error handler
      next(error);
    }
  });
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