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

router.post("/", async (req, res) => {
    console.log('Received message data:', req.body);
    const { senderId, receiverId, message, chatId } = req.body;
    
    // Validate required fields
    if (!senderId || !receiverId || !message || !chatId) {
        console.error('Missing required fields:', { senderId, receiverId, message, chatId });
        return res.status(400).json({ 
            message: "Missing required fields",
            required: ["senderId", "receiverId", "message", "chatId"],
            received: Object.keys(req.body)
        });
    }

    try {
        const newMessage = new MessageModel({
            senderId,
            receiverId,
            message,
            timestamp: Date.now(),
            isRead: false,
            chatId
        });
        
        const savedMessage = await newMessage.save();
        console.log('Message saved successfully:', savedMessage);
        
        // Emit socket event for real-time update
        if (req.app.get('io')) {
            req.app.get('io').to(chatId).emit('new_message', savedMessage);
        }
        
        res.status(200).json({ 
            message: "Message sent successfully",
            data: savedMessage
        });
    } catch (error) {
        console.error('Error saving message:', error);
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
        console.log('in the chat')
        const { chatId } = req.params;
        const messages = await MessageModel.find({ chatId })
            .sort({ timestamp: 1 });
        console.log(messages)
        res.status(200).json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
});

router.post("/findid", async (req, res) => {
    try {
        const { senderId, receiverId } = req.body
        console.log(senderId, receiverId)
        const existchatbetweenusers = await ChatModel.findOne({
            $or: [
                { senderId: receiverId, receiverId: senderId },
                { senderId: senderId, receiverId: receiverId }
            ]
        })

        if (!existchatbetweenusers) {
            const chatId = makeRandomId()
            // console.log(chatId)
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
        console.log(error)
        res.status(500).json({ message: "Internal server error" })
    }
})
export default router