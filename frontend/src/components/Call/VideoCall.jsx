import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff,
  FiMonitor, FiCircle, FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import './VideoCall.css';

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function VideoCall() {
  const { callId } = useParams();
  const navigate = useNavigate();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [remoteUser, setRemoteUser] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      peerConnectionRef.current = new RTCPeerConnection(iceServers);

      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      peerConnectionRef.current.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setCallStatus('active');
        startCallTimer();
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('video-ice-candidate', {
            callId,
            candidate: event.candidate
          });
        }
      };

      setupSocketListeners();
      setCallStatus('ringing');
    } catch (error) {
      console.error('Error initializing call:', error);
      alert('Failed to access camera/microphone');
      endCall();
    }
  };

  const setupSocketListeners = () => {
    socket.on('call-accepted', async (data) => {
      setRemoteUser(data);
      
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socket.emit('video-offer', {
        callId,
        offer
      });
    });

    socket.on('video-offer', async (data) => {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socket.emit('video-answer', {
        callId,
        answer
      });
    });

    socket.on('video-answer', async (data) => {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    });

    socket.on('video-ice-candidate', async (data) => {
      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    socket.on('screen-share-started', () => {
      // Handle remote screen share
    });

    socket.on('screen-share-stopped', () => {
      // Handle remote screen share stop
    });

    socket.on('call-ended', () => {
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

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Switch back to camera
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
      
      socket.emit('screen-share-stop', { callId });
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: false
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        
        const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        // Handle screen share stop (user clicks browser stop button)
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        socket.emit('screen-share-start', { callId });
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error starting screen share:', error);
        alert('Failed to start screen sharing');
      }
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = remoteVideoRef.current.srcObject;
        
        const options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm;codecs=vp8';
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm';
          }
        }

        mediaRecorderRef.current = new MediaRecorder(stream, options);
        recordedChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, {
            type: 'video/webm'
          });
          
          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `call-recording-${Date.now()}.webm`;
          a.click();
          
          // Emit recording stopped
          socket.emit('recording-stop', {
            callId,
            recordingDuration: callDuration
          });
        };

        mediaRecorderRef.current.start();
        socket.emit('recording-start', { callId });
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to start recording');
      }
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const endCall = () => {
    if (isRecording) {
      toggleRecording();
    }
    socket.emit('call-end', { callId });
    cleanup();
    navigate('/chat');
  };

  const cleanup = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    socket.off('call-accepted');
    socket.off('video-offer');
    socket.off('video-answer');
    socket.off('video-ice-candidate');
    socket.off('screen-share-started');
    socket.off('screen-share-stopped');
    socket.off('call-ended');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-call-container" ref={containerRef}>
      <div className="video-streams">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="remote-video"
        />
        
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="local-video"
        />
      </div>

      <div className="video-call-overlay">
        <div className="call-header">
          <div className="call-info">
            <span className="remote-user-name">{remoteUser?.name || 'Connecting...'}</span>
            {callStatus === 'active' && (
              <span className="call-duration">{formatDuration(callDuration)}</span>
            )}
          </div>
          <button
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <FiMinimize2 size={20} /> : <FiMaximize2 size={20} />}
          </button>
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
            className={`control-btn ${isVideoOff ? 'active' : ''}`}
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
          >
            {isVideoOff ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
          </button>

          <button
            className="control-btn end-call"
            onClick={endCall}
            title="End Call"
          >
            <FiPhoneOff size={24} />
          </button>

          <button
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            <FiMonitor size={24} />
          </button>

          <button
            className={`control-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            <FiCircle size={24} />
          </button>
        </div>
      </div>

      {callStatus === 'ringing' && (
        <div className="call-status-overlay">
          <p>Calling...</p>
        </div>
      )}

      {isRecording && (
        <div className="recording-indicator">
          <FiCircle className="recording-dot" />
          <span>Recording</span>
        </div>
      )}
    </div>
  );
}
