import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['voice', 'video', 'screen-share'],
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    joinedAt: Date,
    leftAt: Date,
    duration: Number
  }],
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'active', 'ended', 'missed', 'rejected', 'busy'],
    default: 'initiated'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: Number, // in seconds
  recordingUrl: String,
  recordingDuration: Number,
  isRecorded: {
    type: Boolean,
    default: false
  },
  quality: {
    avgBitrate: Number,
    packetsLost: Number,
    jitter: Number
  }
}, { timestamps: true });

// Index for faster queries
callSchema.index({ initiator: 1, createdAt: -1 });
callSchema.index({ receiver: 1, createdAt: -1 });
callSchema.index({ callId: 1 });

const CallModel = mongoose.model('Call', callSchema);

export default CallModel;
