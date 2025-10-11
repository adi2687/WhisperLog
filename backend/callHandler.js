import CallModel from './models/call.model.js';
import User from './models/user.model.js';

// Store active calls
const activeCalls = new Map();

// Generate unique call ID
const generateCallId = () => {
  return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Initialize call-related socket handlers
 * @param {Object} io - Socket.IO server instance
 */
export const initCallHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('Call handler connected:', socket.id);

    // Voice call initiation
    socket.on('voice-call-initiate', async (data) => {
      try {
        const { callerId, receiverId, callerName, callerAvatar } = data;
        const callId = generateCallId();

        // Create call record
        const newCall = new CallModel({
          callId,
          type: 'voice',
          initiator: callerId,
          receiver: receiverId,
          status: 'ringing',
          participants: [{
            userId: callerId,
            username: callerName,
            joinedAt: new Date()
          }]
        });

        await newCall.save();

        // Store in active calls
        activeCalls.set(callId, {
          callId,
          type: 'voice',
          participants: [callerId],
          initiator: callerId,
          receiver: receiverId,
          startTime: Date.now()
        });

        // Notify receiver
        io.to(receiverId).emit('incoming-voice-call', {
          callId,
          callerId,
          callerName,
          callerAvatar
        });

        console.log(`Voice call initiated: ${callId}`);
      } catch (error) {
        console.error('Error initiating voice call:', error);
        socket.emit('call-error', { message: 'Failed to initiate call' });
      }
    });

    // Video call initiation
    socket.on('video-call-initiate', async (data) => {
      try {
        const { callerId, receiverId, callerName, callerAvatar } = data;
        const callId = generateCallId();

        // Create call record
        const newCall = new CallModel({
          callId,
          type: 'video',
          initiator: callerId,
          receiver: receiverId,
          status: 'ringing',
          participants: [{
            userId: callerId,
            username: callerName,
            joinedAt: new Date()
          }]
        });

        await newCall.save();

        // Store in active calls
        activeCalls.set(callId, {
          callId,
          type: 'video',
          participants: [callerId],
          initiator: callerId,
          receiver: receiverId,
          startTime: Date.now()
        });

        // Notify receiver
        io.to(receiverId).emit('incoming-video-call', {
          callId,
          callerId,
          callerName,
          callerAvatar
        });

        console.log(`Video call initiated: ${callId}`);
      } catch (error) {
        console.error('Error initiating video call:', error);
        socket.emit('call-error', { message: 'Failed to initiate call' });
      }
    });

    // Call acceptance
    socket.on('call-accept', async (data) => {
      try {
        const { callId, userId, username } = data;

        // Update call record
        await CallModel.findOneAndUpdate(
          { callId },
          {
            status: 'active',
            $push: {
              participants: {
                userId,
                username,
                joinedAt: new Date()
              }
            }
          }
        );

        // Update active calls
        const call = activeCalls.get(callId);
        if (call) {
          call.participants.push(userId);
          call.status = 'active';
        }

        // Notify initiator
        const callData = await CallModel.findOne({ callId });
        io.to(callData.initiator.toString()).emit('call-accepted', {
          callId,
          userId,
          username
        });

        console.log(`Call accepted: ${callId}`);
      } catch (error) {
        console.error('Error accepting call:', error);
        socket.emit('call-error', { message: 'Failed to accept call' });
      }
    });

    // Call rejection
    socket.on('call-reject', async (data) => {
      try {
        const { callId, reason } = data;

        // Update call record
        await CallModel.findOneAndUpdate(
          { callId },
          {
            status: 'rejected',
            endTime: new Date()
          }
        );

        // Remove from active calls
        activeCalls.delete(callId);

        // Notify initiator
        const callData = await CallModel.findOne({ callId });
        io.to(callData.initiator.toString()).emit('call-rejected', {
          callId,
          reason: reason || 'Call declined'
        });

        console.log(`Call rejected: ${callId}`);
      } catch (error) {
        console.error('Error rejecting call:', error);
      }
    });

    // Call end
    socket.on('call-end', async (data) => {
      try {
        const { callId } = data;

        const call = activeCalls.get(callId);
        if (!call) return;

        const duration = Math.floor((Date.now() - call.startTime) / 1000);

        // Update call record
        await CallModel.findOneAndUpdate(
          { callId },
          {
            status: 'ended',
            endTime: new Date(),
            duration
          }
        );

        // Notify all participants
        call.participants.forEach(userId => {
          io.to(userId).emit('call-ended', {
            callId,
            duration
          });
        });

        // Remove from active calls
        activeCalls.delete(callId);

        console.log(`Call ended: ${callId}, duration: ${duration}s`);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    });

    // Screen share start
    socket.on('screen-share-start', async (data) => {
      try {
        const { callId, userId } = data;

        const call = activeCalls.get(callId);
        if (!call) return;

        // Notify other participants
        call.participants.forEach(participantId => {
          if (participantId !== userId) {
            io.to(participantId).emit('screen-share-started', {
              callId,
              userId
            });
          }
        });

        console.log(`Screen share started in call: ${callId}`);
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    });

    // Screen share stop
    socket.on('screen-share-stop', async (data) => {
      try {
        const { callId, userId } = data;

        const call = activeCalls.get(callId);
        if (!call) return;

        // Notify other participants
        call.participants.forEach(participantId => {
          if (participantId !== userId) {
            io.to(participantId).emit('screen-share-stopped', {
              callId,
              userId
            });
          }
        });

        console.log(`Screen share stopped in call: ${callId}`);
      } catch (error) {
        console.error('Error stopping screen share:', error);
      }
    });

    // Recording start
    socket.on('recording-start', async (data) => {
      try {
        const { callId, userId } = data;

        const call = activeCalls.get(callId);
        if (!call) return;

        call.isRecording = true;
        call.recordingStartTime = Date.now();

        // Notify all participants
        call.participants.forEach(participantId => {
          io.to(participantId).emit('recording-started', {
            callId,
            userId
          });
        });

        console.log(`Recording started in call: ${callId}`);
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    });

    // Recording stop
    socket.on('recording-stop', async (data) => {
      try {
        const { callId, recordingUrl, recordingDuration } = data;

        const call = activeCalls.get(callId);
        if (!call) return;

        call.isRecording = false;

        // Save recording URL to database
        await CallModel.findOneAndUpdate(
          { callId },
          {
            recordingUrl,
            recordingDuration,
            isRecorded: true
          }
        );

        // Notify all participants
        call.participants.forEach(participantId => {
          io.to(participantId).emit('recording-stopped', {
            callId,
            recordingUrl,
            recordingDuration
          });
        });

        console.log(`Recording stopped in call: ${callId}`);
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    });

    // Call quality update
    socket.on('call-quality-update', async (data) => {
      try {
        const { callId, quality } = data;

        await CallModel.findOneAndUpdate(
          { callId },
          { quality }
        );
      } catch (error) {
        console.error('Error updating call quality:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Call handler disconnected:', socket.id);
    });
  });
};

export { activeCalls, generateCallId };
