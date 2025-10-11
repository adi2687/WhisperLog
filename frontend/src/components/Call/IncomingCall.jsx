import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FiPhone, FiPhoneOff, FiVideo, FiUser } from 'react-icons/fi';
import './IncomingCall.css';

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function IncomingCall() {
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);
  const [ringtone] = useState(new Audio('/ringtone.mp3'));

  useEffect(() => {
    // Listen for incoming voice calls
    socket.on('incoming-voice-call', (data) => {
      setIncomingCall({ ...data, type: 'voice' });
      playRingtone();
    });

    // Listen for incoming video calls
    socket.on('incoming-video-call', (data) => {
      setIncomingCall({ ...data, type: 'video' });
      playRingtone();
    });

    // Call rejected by caller
    socket.on('call-cancelled', () => {
      stopRingtone();
      setIncomingCall(null);
    });

    return () => {
      socket.off('incoming-voice-call');
      socket.off('incoming-video-call');
      socket.off('call-cancelled');
      stopRingtone();
    };
  }, []);

  const playRingtone = () => {
    ringtone.loop = true;
    ringtone.play().catch(err => console.error('Error playing ringtone:', err));
  };

  const stopRingtone = () => {
    ringtone.pause();
    ringtone.currentTime = 0;
  };

  const acceptCall = () => {
    stopRingtone();
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    socket.emit('call-accept', {
      callId: incomingCall.callId,
      userId: currentUser._id,
      username: currentUser.username
    });

    // Navigate to appropriate call page
    if (incomingCall.type === 'voice') {
      navigate(`/voice-call/${incomingCall.callId}`);
    } else {
      navigate(`/video-call/${incomingCall.callId}`);
    }

    setIncomingCall(null);
  };

  const rejectCall = () => {
    stopRingtone();
    
    socket.emit('call-reject', {
      callId: incomingCall.callId,
      reason: 'Call declined'
    });

    setIncomingCall(null);
  };

  if (!incomingCall) {
    return null;
  }

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-modal">
        <div className="call-type-indicator">
          {incomingCall.type === 'voice' ? (
            <FiPhone className="call-icon" size={30} />
          ) : (
            <FiVideo className="call-icon" size={30} />
          )}
        </div>

        <div className="caller-info">
          <div className="caller-avatar">
            {incomingCall.callerAvatar ? (
              <img src={incomingCall.callerAvatar} alt={incomingCall.callerName} />
            ) : (
              <FiUser size={50} />
            )}
          </div>
          <h2 className="caller-name">{incomingCall.callerName}</h2>
          <p className="call-type-text">
            Incoming {incomingCall.type === 'voice' ? 'voice' : 'video'} call
          </p>
        </div>

        <div className="call-actions">
          <button
            className="call-action-btn reject"
            onClick={rejectCall}
            title="Decline"
          >
            <FiPhoneOff size={28} />
          </button>

          <button
            className="call-action-btn accept"
            onClick={acceptCall}
            title="Accept"
          >
            {incomingCall.type === 'voice' ? (
              <FiPhone size={28} />
            ) : (
              <FiVideo size={28} />
            )}
          </button>
        </div>

        <div className="call-info-text">
          <p>End-to-end encrypted</p>
        </div>
      </div>
    </div>
  );
}
