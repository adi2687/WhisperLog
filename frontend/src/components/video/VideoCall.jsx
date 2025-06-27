import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhoneOff, FiUser } from 'react-icons/fi';
import { useCall } from '../../contexts/CallContext';
import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import './VideoCall.css';

// ... (keep the existing imports)

const VideoCall = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, isConnected } = useCall();
  const user = useProfileCurrentUser()?.profile;
  const { isInitiator = false, callType = 'video', receiverId, receiverName } = location.state || {};

  // Refs
  const localVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const peerConnections = useRef({});

  // State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toggle video on/off
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle audio on/off
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  }, [localStream]);

  // End the call
  const endCall = useCallback(() => {
    if (socket?.connected) {
      socket.emit('end-call', { roomId });
    }
    
    // Stop all media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Close all peer connections
    Object.keys(peerConnections.current).forEach(userId => {
      const pc = peerConnections.current[userId];
      if (pc) {
        pc.close();
        delete peerConnections.current[userId];
      }
    });
    
    // Clear remote streams
    setRemoteStreams({});
    
    // Navigate back
    navigate(-1);
  }, [socket, roomId, localStream, navigate]);

  // Create peer connection
  const createPeerConnection = useCallback(async (userId) => {
    if (peerConnections.current[userId] || !socket) return null;

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnections.current[userId] = pc;

      // Add local stream to connection if available
      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle remote stream
      const remoteStream = new MediaStream();
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: remoteStream
      }));

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          if (!remoteStream.getTracks().some(t => t.id === track.id)) {
            remoteStream.addTrack(track);
          }
        });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            to: userId,
            roomId
          });
        }
      };

      // If we're the initiator, create an offer
      if (isInitiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', {
            offer: pc.localDescription,
            to: userId,
            roomId
          });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      }

      return pc;
    } catch (err) {
      console.error('Error creating peer connection:', err);
      return null;
    }
  }, [socket, localStream, isInitiator, roomId]);

  // Set up socket listeners
  const setupSocketListeners = useCallback(() => {
    if (!socket) return () => {};

    const handleExistingUsers = (userIds) => {
      userIds.forEach(userId => createPeerConnection(userId));
    };

    const handleUserConnected = ({ userId }) => {
      createPeerConnection(userId);
    };

    const handleCallEnded = () => {
      setError('The other participant has ended the call');
      setTimeout(() => {
        endCall();
      }, 2000);
    };

    const handleCallRejected = () => {
      setError('Call was rejected');
      setTimeout(() => {
        endCall();
      }, 2000);
    };

    const handleCallError = (error) => {
      setError(error.message || 'An error occurred during the call');
      console.error('Call error:', error);
    };
    
    const handleUserDisconnected = ({ userId }) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[userId];
        return newStreams;
      });
    };
    
    const handleOffer = async ({ offer, from }) => {
      try {
        const pc = await createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { answer, to: from, roomId });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    const handleAnswer = async ({ answer }) => {
      const pc = peerConnections.current[answer.senderId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = ({ candidate, from }) => {
      const pc = peerConnections.current[from];
      if (pc && candidate) {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    // Set up event listeners
    socket.on('existing-users', handleExistingUsers);
    socket.on('user-connected', handleUserConnected);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-error', handleCallError);
    socket.on('user-disconnected', handleUserDisconnected);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    
    // Cleanup function
    return () => {
      socket.off('existing-users', handleExistingUsers);
      socket.off('user-connected', handleUserConnected);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-error', handleCallError);
      socket.off('user-disconnected', handleUserDisconnected);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [socket, endCall, roomId, createPeerConnection]);

  // Initialize call
  useEffect(() => {
    const init = async () => {
      try {
        if (!socket || !isConnected) {
          setError('Connection error. Please refresh and try again.');
          setIsLoading(false);
          return;
        }

        // Get user media based on call type
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // If initiator, notify the other user
        if (isInitiator && receiverId) {
          socket.emit('call-user', {
            recipientId: receiverId,
            roomId,
            callerId: user?._id,
            callerName: user?.username,
            callType
          });
        }

        socket.emit('join-room', roomId, user?._id);

        const cleanup = setupSocketListeners();
        return () => {
          cleanup?.();
          endCall();
        };
      } catch (err) {
        console.error('Error initializing video call:', err);
        setError('Failed to access camera/microphone. Please check your permissions.');
        setIsLoading(false);

        if (isInitiator && receiverId) {
          socket.emit('call-error', {
            recipientId: receiverId,
            roomId,
            error: 'Failed to initialize call'
          });
        }
      }
    };

    init();
  }, [roomId, socket, isConnected, isInitiator, receiverId, callType, user, setupSocketListeners, endCall]);

  // Scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <div className="video-call-loading">
        <div className="spinner"></div>
        <p>Connecting to call...</p>
      </div>
    );
  }

  return (
    <div className="video-call-container">
      {error && (
        <div className="call-error-message">
          {error}
        </div>
      )}
      <div className="video-grid">
        {/* Local video */}
        <div className={`video-container local-video ${!isVideoOn ? 'video-off' : ''}`}>
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="video-element"
          />
          {!isVideoOn && (
            <div className="video-placeholder">
              <FiUser className="user-icon" />
              <span>Camera is off</span>
            </div>
          )}
          <div className="video-overlay">
            <span>You</span>
          </div>
        </div>

        {/* Remote videos */}
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <div key={userId} className="video-container remote-video">
            <video
              autoPlay
              playsInline
              className="video-element"
              ref={video => {
                if (video) video.srcObject = stream;
              }}
            />
            <div className="video-overlay">
              <span>{receiverName || 'Participant'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Call controls */}
      <div className="call-controls">
        <button
          onClick={toggleVideo}
          className={`control-button ${!isVideoOn ? 'active' : ''}`}
          title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoOn ? <FiVideo /> : <FiVideoOff />}
        </button>
        <button
          onClick={toggleAudio}
          className={`control-button ${!isAudioOn ? 'active' : ''}`}
          title={isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isAudioOn ? <FiMic /> : <FiMicOff />}
        </button>
        <button
          onClick={endCall}
          className="control-button end-call"
          title="End call"
        >
          <FiPhoneOff />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;