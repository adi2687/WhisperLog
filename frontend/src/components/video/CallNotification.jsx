import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPhone, FiVideo, FiX } from 'react-icons/fi';
import './CallNotification.css';

const CallNotification = ({ callData, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const navigate = useNavigate();

  useEffect(() => {
    // Start countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Play ringtone
    const audio = new Audio('/sounds/ringtone.mp3');
    audio.loop = true;
    audio.play().catch(e => console.error('Error playing ringtone:', e));

    // Cleanup
    return () => {
      clearInterval(timer);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [onClose]);

  const handleAccept = () => {
    navigate(`/video-call/${callData.roomId}`, {
      state: {
        isInitiator: false,
        callType: callData.callType,
        callerId: callData.callerId,
        callerName: callData.callerName
      }
    });
    onClose();
  };

  const handleReject = () => {
    // Notify the caller that the call was rejected
    if (callData.socket) {
      callData.socket.emit('call-rejected', {
        roomId: callData.roomId,
        recipientId: callData.callerId
      });
    }
    onClose();
  };

  if (!callData) return null;

  return (
    <div className="call-notification">
      <div className="call-notification-content">
        <div className="caller-info">
          <div className="caller-avatar">
            <span>{callData.callerName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="caller-details">
            <h4>{callData.callerName}</h4>
            <p>{callData.callType === 'video' ? 'Video Call' : 'Voice Call'}</p>
            <p className="call-timer">Calling... {timeLeft}s</p>
          </div>
        </div>
        
        <div className="call-actions">
          <button 
            className="accept-call" 
            onClick={handleAccept}
            title="Accept call"
          >
            {callData.callType === 'video' ? <FiVideo /> : <FiPhone />}
          </button>
          <button 
            className="reject-call" 
            onClick={handleReject}
            title="Reject call"
          >
            <FiX />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallNotification;
