import express from "express";
import multer from "multer";
import uploadFile from "./ipfs.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    }
});

router.post("/media", upload.single("file"), async (req, res) => {
    console.log('Received file upload request');
    console.log('File details:', req.file ? {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
    } : 'No file');

    try {
        if (!req.file) {
            return res.status(400).json({ 
                message: "No file uploaded",
                status: false 
            });
        }

        console.log('Uploading to IPFS...');
        const cid = await uploadFile(req.file.buffer);
        
        console.log('✅ File uploaded to IPFS successfully');
        console.log('CID:', cid);

        res.json({
            message: "File uploaded successfully",
            cid,
            url: `https://ipfs.io/ipfs/${cid}`,
            status: true,
            fileType: req.file.mimetype,
            fileName: req.file.originalname,
            fileSize: req.file.size
        });
    } catch (err) {
        console.error('❌ Error uploading file to IPFS:', err);
        res.status(500).json({ 
            message: "Error uploading file to IPFS",
            error: err.message,
            status: false 
        });
    }
});

export default router;