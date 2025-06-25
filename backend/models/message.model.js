import mongoose from "mongoose"; 

const messageSchema=new mongoose.Schema({
    senderId:{
        type:String,
        required:true
    },
    receiverId:{
        type:String, 
        required:true
    },
    message:{
        type: String,
        required: function() {
            // Message is required only if there's no image
            return !this.imageUrl && !this.fileUrl;
        },
        default: ''
    },
    timestamp:{
        type:Date,
        default:Date.now
    },
    isRead:{
        type:Boolean,
        default:false
    },
    chatId:{
        type:String, 
        required:true
    },
    imageUrl: {
        type: String,
        default: null
    },
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    fileType: {
        type: String,
        default: null
    },
    fileSize: {
        type: Number,
        default: null
    }
},{timestamps:true})

const MessageModel=mongoose.model("Message",messageSchema)

export default MessageModel