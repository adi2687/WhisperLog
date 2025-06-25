import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import { io } from 'socket.io-client';
import { FiSend, FiPaperclip, FiSmile, FiImage, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import './chat.css';
import ProfileCard from '../profile/profilecard/card';
import { FaUser } from 'react-icons/fa';
import axios from 'axios';
const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function Chat({ chatId }) {
  const location = useLocation();
  const [receiver, setReceiver] = useState(location.state?.receiver);
  const [receiverdetails, setReceiverdetails] = useState(location.state?.receiverUsername);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const user = useProfileCurrentUser().profile;
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  // Update receiver if location changes
  useEffect(() => {
    setReceiver(location.state?.receiver);
    setReceiverdetails(location.state?.receiverUsername);
  }, [location.state?.receiver]);

  // Join the chat room
  useEffect(() => {
    if (chatId) {
      console.log('Joining chat:', chatId);
      socket.emit('joinchat', { chatId }); // ✅ Wrap in object
    }
  }, [chatId]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, GIF, and WebP images are allowed');
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    setSelectedImage(file);
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image to backend using FormData
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/message/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          withCredentials: true
        }
      );
      return response.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Send message
  const sendMessage = async () => {
    if ((!message.trim() && !selectedImage) || isUploading) return;

    setIsUploading(true);
    let imageUrl = null;
    
    try {
      // Upload image if selected
      if (selectedImage) {
        try {
          imageUrl = await uploadImage(selectedImage);
        } catch (error) {
          console.error('Failed to upload image:', error);
          alert('Failed to upload image. Please try again.');
          return;
        }
      }

      // Send message with or without image
      const messageData = { 
        chatId, 
        message: message.trim(), 
        senderId: user._id, 
        receiverId: receiver
      };

      // Only add imageUrl if it exists
      if (imageUrl) {
        messageData.imageUrl = imageUrl;
      }

      // Send the message through the socket
      socket.emit('message', messageData);
      
      // Also send to the backend API for persistence
      try {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/message`,
          messageData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      } catch (error) {
        console.error('Error saving message to database:', error);
        // Don't show error to user as the message was still sent via socket
      }
      
      // Reset states
      setMessage('');
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Listen for incoming messages
  // Load existing messages
  useEffect(() => {
    if (chatId) {
      socket.emit('joinchat', { chatId });
    }

    socket.on('loadMessages', (msgs) => {
      setChat(msgs);
    });

    return () => {
      socket.off('loadMessages');
    };
  }, [chatId]);

  // Listen for new messages
  useEffect(() => {
    socket.on('message', (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('message');
    };
  }, []);


  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const [view, setviewcard] = useState(false)

  useEffect(() => {
    setviewcard(false)
  }, [chatId])
  return (
    <div className="chat-container">
      {receiverdetails && (
        <div className="chat-header">
          <div className="user-info">
            <div className="avatar">
              <img src={receiverdetails.profilePicture || '/default-avatar.svg'} alt="" />
            </div>
            <div className='userdetails'>
              <div>
              <div className="user-name">{receiverdetails.username || 'Unknown User'}</div>
              {/* <div className='bio'>{receiverdetails?.bio || 'No bio'}</div> */}
              <div className="user-status">Online</div> 
              </div>
              <button onClick={() => setviewcard(!view)} className='view-profile-btn'>
                {view ? (
                  <>
                  <FaUser/>
                  <p>Hover over card</p>
                  </>
                ) : (
                  <>
                  <FaUser/>
                  <p>View Profile Card</p>
                  </>
                )}
                </button>
              <div className="profile-card-main">
                {view ? 
                <div> 
                (<ProfileCard receiverdetails={receiverdetails} setviewcard={setviewcard} />)
                </div>
                : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="chat-box">
        {chat.length > 0 ? (
          chat.map((msg, index) => (
            <div
              key={index}
              className={`message-bubble ${msg.senderId === user?._id ? 'sent' : 'received'}`}
            >
              <div className={`message-content ${msg.imageUrl ? 'has-image' : ''}`}>
                {msg.imageUrl && (
                  <div className="message-image">
                    <img 
                      src={msg.imageUrl} 
                      alt="Shared content" 
                      className="chat-image"
                      onClick={() => window.open(msg.imageUrl, '_blank')}
                      onLoad={(e) => {
                        // Add loaded class when image is loaded
                        e.target.classList.add('image-loaded');
                      }}
                      onError={(e) => {
                        // Handle image loading errors
                        e.target.src = '/image-error.png';
                        e.target.classList.add('image-error');
                      }}
                    />
                    {msg.message && (
                      <div className="image-caption">
                        {msg.message}
                      </div>
                    )}
                  </div>
                )}
                {!msg.imageUrl && msg.message && <p>{msg.message}</p>}
                <span className="message-time">
                  {format(new Date(msg.createdAt || Date.now()), 'h:mm a')}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-messages">
            <p>Start a conversation with {receiver?.name || 'this user'}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>

      {/* Image preview */}
      {selectedImage && (
        <div className="image-preview-container">
          <div className="image-preview">
            <img 
              src={URL.createObjectURL(selectedImage)} 
              alt="Preview" 
              className="preview-image"
            />
            <button className="remove-image-btn" onClick={removeImage}>
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="chat-input-container">
        <div className="file-input-wrapper">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button 
            className="attachment-btn" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <FiImage size={20} />
          </button>
        </div>
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? 'Add a caption...' : 'Type a message...'}
            className="chat-input"
            disabled={isUploading}
          />
          <button className="emoji-btn" disabled={isUploading}>
            <FiSmile size={20} />
          </button>
        </div>
        <button
          onClick={sendMessage}
          className="send-btn"
          disabled={(!message.trim() && !selectedImage) || isUploading}
        >
          {isUploading ? (
            <div className="spinner"></div>
          ) : (
            <FiSend size={20} />
          )}
        </button>
      </div>
    </div>
  );
}
