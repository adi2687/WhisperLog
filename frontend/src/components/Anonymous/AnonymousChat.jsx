import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FiSend, FiX, FiUsers, FiRefreshCw } from 'react-icons/fi';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import './AnonymousChat.css';

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function AnonymousChat() {
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [anonymousId, setAnonymousId] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Generate anonymous ID
    const anonId = `anon_${Math.random().toString(36).substr(2, 9)}`;
    setAnonymousId(anonId);
    console.log('🎭 Anonymous ID generated:', anonId);

    // Check socket connection
    if (socket.connected) {
      console.log('✅ Socket connected:', socket.id);
    } else {
      console.log('❌ Socket not connected');
      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
      });
    }

    // Socket listeners
    socket.on('anonymous_matched', ({ roomId, partnerId }) => {
      console.log('🎉 Matched with partner:', partnerId, 'Room:', roomId);
      setRoomId(roomId);
      setPartnerId(partnerId);
      setIsSearching(false);
      setIsConnected(true);
      toast.success('Connected to a stranger!');
    });

    socket.on('anonymous_message', ({ message, senderId, timestamp }) => {
      setMessages(prev => [...prev, {
        message,
        senderId,
        timestamp,
        isOwn: senderId === anonymousId
      }]);
    });

    socket.on('anonymous_partner_disconnected', () => {
      toast.error('Stranger disconnected');
      handleDisconnect();
    });

    socket.on('anonymous_searching', () => {
      toast('Searching for a stranger...', { icon: '🔍' });
    });

    return () => {
      socket.off('anonymous_matched');
      socket.off('anonymous_message');
      socket.off('anonymous_partner_disconnected');
      socket.off('anonymous_searching');
      if (roomId) {
        socket.emit('leave_anonymous', { roomId, userId: anonymousId });
      }
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartChat = () => {
    setIsSearching(true);
    socket.emit('find_anonymous_partner', { userId: anonymousId });
    
    // Auto-match timeout for testing (remove in production)
    setTimeout(() => {
      if (isSearching && !isConnected) {
        console.log('Still searching after 5 seconds - check if backend is running');
        toast.error('No strangers available. Try opening another window!', {
          duration: 5000
        });
      }
    }, 5000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !isConnected) return;

    socket.emit('send_anonymous_message', {
      roomId,
      message: message.trim(),
      senderId: anonymousId,
      timestamp: new Date()
    });

    setMessages(prev => [...prev, {
      message: message.trim(),
      senderId: anonymousId,
      timestamp: new Date(),
      isOwn: true
    }]);

    setMessage('');
  };

  const handleDisconnect = () => {
    if (roomId) {
      socket.emit('leave_anonymous', { roomId, userId: anonymousId });
    }
    setIsConnected(false);
    setIsSearching(false);
    setMessages([]);
    setRoomId(null);
    setPartnerId(null);
  };

  const handleNext = () => {
    handleDisconnect();
    setTimeout(() => {
      handleStartChat();
    }, 500);
  };

  return (
    <div className="anonymous-chat-container">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="anonymous-header">
        <div className="anonymous-title">
          <FiUsers size={24} />
          <h2>Anonymous Chat</h2>
        </div>
        <div className="anonymous-status">
          {isConnected ? (
            <span className="status-connected">● Connected</span>
          ) : isSearching ? (
            <span className="status-searching">● Searching...</span>
          ) : (
            <span className="status-disconnected">● Disconnected</span>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="anonymous-chat-area">
        {!isConnected && !isSearching ? (
          <div className="anonymous-welcome">
            <div className="welcome-content">
              <FiUsers size={64} />
              <h3>Talk to Strangers Anonymously</h3>
              <p>Connect with random people around the world</p>
              <button className="start-chat-btn" onClick={handleStartChat}>
                Start Chatting
              </button>
              <div className="anonymous-info">
                <p>• Your identity is completely anonymous</p>
                <p>• Chat ends when either person leaves</p>
                <p>• Be respectful and kind</p>
              </div>
            </div>
          </div>
        ) : isSearching ? (
          <div className="anonymous-searching">
            <div className="searching-spinner"></div>
            <h3>Looking for a stranger...</h3>
            <p>This might take a moment</p>
            <button className="cancel-search-btn" onClick={handleDisconnect}>
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="anonymous-messages">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>Say hi to your new stranger friend! 👋</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`anonymous-message ${msg.isOwn ? 'own' : 'stranger'}`}
                  >
                    <div className="message-bubble">
                      <div className="message-sender">
                        {msg.isOwn ? 'You' : 'Stranger'}
                      </div>
                      <div className="message-text">{msg.message}</div>
                      <div className="message-time">
                        {format(new Date(msg.timestamp), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="anonymous-input-area">
              <div className="anonymous-actions">
                <button className="action-btn next-btn" onClick={handleNext} title="Next Stranger">
                  <FiRefreshCw size={18} />
                  Next
                </button>
                <button className="action-btn stop-btn" onClick={handleDisconnect} title="Stop Chat">
                  <FiX size={18} />
                  Stop
                </button>
              </div>
              <form onSubmit={handleSendMessage} className="message-form">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="message-input"
                />
                <button type="submit" className="send-btn" disabled={!message.trim()}>
                  <FiSend size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
