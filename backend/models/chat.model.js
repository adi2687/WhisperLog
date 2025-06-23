import mongoose from "mongoose";

const chatSchema=new mongoose.Schema({
    senderId:{
        type:String,
        required:true
    },
    receiverId:{
        type:String,
        required:true
    },
    timestamp:{
        type:Date,
        default:Date.now
    },  
    chatId:{
        type:String,
        required:true
    }
},{timestamps:true})

const ChatModel=mongoose.model("Chat",chatSchema)

export default ChatModel
