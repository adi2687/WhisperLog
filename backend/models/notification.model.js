import mongoose from 'mongoose';

// Check if the model has already been defined
let Notification;

try {
  // Try to get the model if it exists
  Notification = mongoose.model('Notification');
} catch (e) {
  // Define the model if it doesn't exist
  const notificationSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['FRIEND_REQUEST', 'MESSAGE', 'LIKE', 'COMMENT','FRIEND_REQUEST_ACCEPTED'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    link: String,
    senderProfilePicture: String,
    relatedRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FriendRequest'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }, { timestamps: true });

  Notification = mongoose.model('Notification', notificationSchema);
}

export default Notification;
