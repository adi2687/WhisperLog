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
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [interests, setInterests] = useState([]);
  const [showInterests, setShowInterests] = useState(false);
  const [icebreaker, setIcebreaker] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const availableInterests = [
    '🎮 Gaming', '🎵 Music', '🎬 Movies', '📚 Books', '⚽ Sports',
    '🎨 Art', '💻 Tech', '🍕 Food', '✈️ Travel', '📸 Photography',
    '🎭 Theater', '🏋️ Fitness', '🧘 Yoga', '🎸 Guitar', '🎤 Singing'
  ];

  const icebreakers = [
    "What's the best thing that happened to you this week?",
    "If you could have dinner with anyone, who would it be?",
    "What's your favorite way to spend a weekend?",
    "What's the most interesting place you've ever visited?",
    "If you could learn any skill instantly, what would it be?",
    "What's your favorite movie or TV show?",
    "What's something you're passionate about?",
    "If you could travel anywhere right now, where would you go?",
    "What's the best advice you've ever received?",
    "What's your favorite hobby or pastime?"
  ];

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

    socket.on('anonymous_typing', ({ isTyping }) => {
      setPartnerTyping(isTyping);
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
    if (interests.length === 0) {
      setShowInterests(true);
      return;
    }
    
    setIsSearching(true);
    socket.emit('find_anonymous_partner', { 
      userId: anonymousId,
      interests: interests 
    });
    
    // Generate random icebreaker
    const randomIcebreaker = icebreakers[Math.floor(Math.random() * icebreakers.length)];
    setIcebreaker(randomIcebreaker);
    
    // Auto-match timeout for testing
    setTimeout(() => {
      if (isSearching && !isConnected) {
        console.log('Still searching after 5 seconds - check if backend is running');
        toast.error('No strangers available. Try opening another window!', {
          duration: 5000
        });
      }
    }, 5000);
  };

  const handleInterestSelect = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    } else {
      toast.error('Maximum 5 interests allowed');
    }
  };

  const handleStartWithInterests = () => {
    if (interests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }
    setShowInterests(false);
    handleStartChat();
  };

  const handleTyping = (value) => {
    setMessage(value);
    
    if (!isConnected) return;
    
    // Send typing indicator
    socket.emit('anonymous_typing', {
      roomId,
      senderId: anonymousId,
      isTyping: value.length > 0
    });
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('anonymous_typing', {
        roomId,
        senderId: anonymousId,
        isTyping: false
      });
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !isConnected) return;

    // Stop typing indicator
    socket.emit('anonymous_typing', {
      roomId,
      senderId: anonymousId,
      isTyping: false
    });

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

  const sendIcebreaker = () => {
    if (!icebreaker || !isConnected) return;
    
    socket.emit('send_anonymous_message', {
      roomId,
      message: icebreaker,
      senderId: anonymousId,
      timestamp: new Date()
    });

    setMessages(prev => [...prev, {
      message: icebreaker,
      senderId: anonymousId,
      timestamp: new Date(),
      isOwn: true
    }]);
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
        {showInterests ? (
          <div className="interests-selector">
            <div className="interests-content">
              <h3>Select Your Interests</h3>
              <p>Choose up to 5 interests to match with like-minded strangers</p>
              <div className="interests-grid">
                {availableInterests.map((interest) => (
                  <button
                    key={interest}
                    className={`interest-btn ${interests.includes(interest) ? 'selected' : ''}`}
                    onClick={() => handleInterestSelect(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <div className="interests-actions">
                <button className="skip-interests-btn" onClick={() => {
                  setInterests(['🎮 Gaming']); // Default interest
                  setShowInterests(false);
                  handleStartChat();
                }}>
                  Skip
                </button>
                <button 
                  className="continue-btn" 
                  onClick={handleStartWithInterests}
                  disabled={interests.length === 0}
                >
                  Continue ({interests.length}/5)
                </button>
              </div>
            </div>
          </div>
        ) : !isConnected && !isSearching ? (
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
              {/* Icebreaker Suggestion */}
              {messages.length === 0 && icebreaker && (
                <div className="icebreaker-suggestion">
                  <p className="icebreaker-label">💡 Conversation Starter:</p>
                  <p className="icebreaker-text">"{icebreaker}"</p>
                  <button className="use-icebreaker-btn" onClick={sendIcebreaker}>
                    Send This
                  </button>
                </div>
              )}
              
              {messages.length === 0 && !icebreaker ? (
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
              
              {/* Typing Indicator */}
              {partnerTyping && (
                <div className="typing-indicator-container">
                  <div className="typing-bubble">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                  <span className="typing-text">Stranger is typing...</span>
                </div>
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
                  onChange={(e) => handleTyping(e.target.value)}
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
