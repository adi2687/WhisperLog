import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  FiMic, FiMicOff, FiPhoneOff, FiVolume2, FiVolumeX,
  FiUser, FiClock
} from 'react-icons/fi';
import './VoiceCall.css';

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function VoiceCall() {
  const { callId } = useParams();
  const navigate = useNavigate();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ringing, active, ended
  const [callDuration, setCallDuration] = useState(0);
  const [remoteUser, setRemoteUser] = useState(null);
  
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callTimerRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    initializeCall();

    return () => {
      cleanup();
    };
  }, [callId]);

  const initializeCall = async () => {
    try {
      // Get user media (audio only)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      localStreamRef.current = stream;
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(iceServers);

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
        setCallStatus('active');
        startCallTimer();
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('voice-ice-candidate', {
            callId,
            candidate: event.candidate
          });
        }
      };

      // Setup socket listeners
      setupSocketListeners();

      setCallStatus('ringing');
    } catch (error) {
      console.error('Error initializing call:', error);
      alert('Failed to access microphone');
      endCall();
    }
  };

  const setupSocketListeners = () => {
    socket.on('call-accepted', async (data) => {
      setRemoteUser(data);
      
      // Create and send offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socket.emit('voice-offer', {
        callId,
        offer
      });
    });

    socket.on('voice-offer', async (data) => {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socket.emit('voice-answer', {
        callId,
        answer
      });
    });

    socket.on('voice-answer', async (data) => {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    });

    socket.on('voice-ice-candidate', async (data) => {
      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    socket.on('call-ended', () => {
      endCall();
    });

    socket.on('call-rejected', () => {
      alert('Call was rejected');
      endCall();
    });
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const endCall = () => {
    socket.emit('call-end', { callId });
    cleanup();
    navigate('/chat');
  };

  const cleanup = () => {
    // Stop call timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Remove socket listeners
    socket.off('call-accepted');
    socket.off('voice-offer');
    socket.off('voice-answer');
    socket.off('voice-ice-candidate');
    socket.off('call-ended');
    socket.off('call-rejected');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-call-container">
      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />

      <div className="voice-call-content">
        <div className="call-header">
          <div className="call-status-indicator">
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'active' && (
              <div className="call-duration">
                <FiClock />
                <span>{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="call-user-info">
          <div className="user-avatar-large">
            {remoteUser?.avatar ? (
              <img src={remoteUser.avatar} alt={remoteUser.name} />
            ) : (
              <FiUser size={80} />
            )}
          </div>
          <h2 className="user-name">{remoteUser?.name || 'Connecting...'}</h2>
          <p className="call-status-text">
            {callStatus === 'connecting' && 'Establishing connection...'}
            {callStatus === 'ringing' && 'Calling...'}
            {callStatus === 'active' && 'Voice call in progress'}
          </p>
        </div>

        <div className="call-controls">
          <button
            className={`control-btn ${isMuted ? 'active' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
          </button>

          <button
            className="control-btn end-call"
            onClick={endCall}
            title="End Call"
          >
            <FiPhoneOff size={24} />
          </button>

          <button
            className={`control-btn ${!isSpeakerOn ? 'active' : ''}`}
            onClick={toggleSpeaker}
            title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
          >
            {isSpeakerOn ? <FiVolume2 size={24} /> : <FiVolumeX size={24} />}
          </button>
        </div>

        <div className="call-info-footer">
          <p>End-to-end encrypted</p>
        </div>
      </div>
    </div>
  );
}
