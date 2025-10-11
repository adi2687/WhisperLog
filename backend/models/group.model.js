import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    groupIcon: {
      type: String,
      default: null
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
    chatId: {
      type: String,
      required: true,
      unique: true
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    lastMessageTime: {
      type: Date,
      default: Date.now
    },
    settings: {
      allowMembersToAddOthers: {
        type: Boolean,
        default: false
      },
      onlyAdminsCanSend: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);

// Add indexes for better query performance
groupSchema.index({ chatId: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ admin: 1 });
groupSchema.index({ lastMessageTime: -1 });

// Method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  return this.admin.toString() === userId.toString() || 
         this.members.some(m => m.userId.toString() === userId.toString() && m.role === 'admin');
};

// Method to check if user is member
groupSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.userId.toString() === userId.toString());
};

const GroupModel = mongoose.model("Group", groupSchema);

export default GroupModel;
