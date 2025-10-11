import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true
    },
    receiverId: {
      type: String,
      required: function() {
        // receiverId is not required for group messages
        return !this.isGroupMessage;
      }
    },
    isGroupMessage: {
      type: Boolean,
      default: false
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null
    },
    message: {
      type: String,
      required: function() {
        // Message is required only if there's no image or file
        return !this.imageUrl && !this.fileUrl;
      },
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    },
    chatId: {
      type: String,
      required: true
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
    },
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read', 'error'],
      default: 'sent'
    },
    tempMessageId: {
      type: String,
      default: null
    },
    // Reactions for messages
    reactions: [{
      userId: { type: String, required: true },
      emoji: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }],
    // System message flag (for join/leave notifications)
    isSystemMessage: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Add indexes for better query performance
messageSchema.index({ chatId: 1, timestamp: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ tempMessageId: 1 }, { sparse: true });

const MessageModel = mongoose.model("Message", messageSchema);

export default MessageModel;