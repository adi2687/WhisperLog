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
        type:String,
        required:true
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
    }
},{timestamps:true})

const MessageModel=mongoose.model("Message",messageSchema)

export default MessageModel