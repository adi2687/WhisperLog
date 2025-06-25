import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import { io } from 'socket.io-client';
import { FiSend, FiPaperclip, FiSmile, FiImage, FiX, FiFile } from 'react-icons/fi';
import { format } from 'date-fns';
import './chat.css';
import ProfileCard from '../profile/profilecard/card';
import { FaUser } from 'react-icons/fa';
import axios from 'axios';
const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function Chat({ chatId, receiver, receiverDetails, onBack }) {
  const location = useLocation();
  // Use props if available, otherwise fall back to location state
  const [currentReceiver, setCurrentReceiver] = useState(receiver || location.state?.receiver);
  const [currentReceiverDetails, setCurrentReceiverDetails] = useState(receiverDetails || location.state?.receiverUsername);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const user = useProfileCurrentUser().profile;
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  // Update receiver if props or location changes
  useEffect(() => {
    if (receiver) setCurrentReceiver(receiver);
    if (receiverDetails) setCurrentReceiverDetails(receiverDetails);
  }, [receiver, receiverDetails]);

  // Join the chat room
  useEffect(() => {
    if (chatId) {
      console.log('Joining chat:', chatId);
      socket.emit('joinchat', { chatId }); // Wrap in object
    }
  }, [chatId]);

  // Handle file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, GIF, and WebP images are allowed');
        return;
      }
      // Check file size (5MB limit for images)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setSelectedFile(null); // Clear file if image is selected
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setSelectedImage(null); // Clear image if file is selected
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📑';
    if (fileType.includes('zip') || fileType.includes('compressed')) return '🗜️';
    if (fileType.includes('text/plain')) return '📄';
    if (fileType.includes('image/')) return '🖼️';
    
    return '📎';
  };

  const handleFileUpload = async (file, isImage = false) => {
    try {
      const formData = new FormData();
      const endpoint = isImage ? 'upload-image' : 'upload-file';
      formData.append(isImage ? 'image' : 'file', file);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/message/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to upload ${isImage ? 'image' : 'file'}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error uploading ${isImage ? 'image' : 'file'}:`, error);
      throw error;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage && !selectedFile) || isUploading) return;

    try {
      setIsUploading(true);
      let imageUrl = null;
      let fileData = null;

      // Upload image if selected
      if (selectedImage) {
        const data = await handleFileUpload(selectedImage, true);
        imageUrl = data.url;
      }

      // Upload file if selected
      if (selectedFile) {
        const data = await handleFileUpload(selectedFile, false);
        fileData = {
          fileUrl: data.url,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize
        };
      }

      // Emit the message
      socket.emit('message', {
        chatId: chatId,
        message: message.trim(),
        senderId: user._id,
        receiverId: receiver,
        imageUrl: imageUrl,
        ...(fileData && fileData)
      });

      // Clear the input and selected files
      setMessage('');
      setSelectedImage(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message');
    } finally {
      setIsUploading(false);
    }
  };

  // Load existing messages when chatId changes
  useEffect(() => {
    if (!chatId) return;
    
    // Join the chat room
    socket.emit('joinchat', { chatId });
    
    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/message/${chatId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        // Ensure all messages have required fields
        const formattedMessages = (data.messages || []).map(msg => ({
          ...msg,
          fileUrl: msg.fileUrl || null,
          fileName: msg.fileName || null,
          fileType: msg.fileType || null,
          fileSize: msg.fileSize || null,
          imageUrl: msg.imageUrl || null,
          createdAt: msg.createdAt || new Date().toISOString(),
          senderId: msg.senderId || null,
          receiverId: msg.receiverId || null
        }));
        
        setChat(formattedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    
    fetchMessages();
    
    // Handle incoming messages from socket
    const handleLoadMessages = (msgs) => {
      const formattedMessages = Array.isArray(msgs) ? msgs.map(msg => ({
        ...msg,
        fileUrl: msg.fileUrl || null,
        fileName: msg.fileName || null,
        fileType: msg.fileType || null,
        fileSize: msg.fileSize || null,
        imageUrl: msg.imageUrl || null,
        createdAt: msg.createdAt || new Date().toISOString(),
        senderId: msg.senderId || null,
        receiverId: msg.receiverId || null
      })) : [];
      
      setChat(formattedMessages);
    };
    
    socket.on('loadMessages', handleLoadMessages);
    
    return () => {
      socket.off('loadMessages', handleLoadMessages);
    };
  }, [chatId]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (msg) => {
      // Ensure the message has all required fields
      const formattedMsg = {
        ...msg,
        fileUrl: msg.fileUrl || null,
        fileName: msg.fileName || null,
        fileType: msg.fileType || null,
        fileSize: msg.fileSize || null,
        imageUrl: msg.imageUrl || null,
        createdAt: msg.createdAt || new Date().toISOString(),
        senderId: msg.senderId || null,
        receiverId: msg.receiverId || null
      };
      
      setChat((prev) => [...prev, formattedMsg]);
    };

    socket.on('message', handleNewMessage);
    return () => {
      socket.off('message', handleNewMessage);
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
      handleSendMessage(e);
    }
  };

  const [view, setviewcard] = useState(false)

  useEffect(() => {
    setviewcard(false)
  }, [chatId])
  return (
    <div className="chat-container">
      {currentReceiverDetails && (
        <div className="chat-header">
          {onBack && (
            <button
              onClick={onBack}
              className="back-button"
              aria-label="Back to contacts"
            >
              &larr;
            </button>
          )}
          <div className="user-info">
            <div className="avatar">
              <img src={currentReceiverDetails.profilePicture || '/default-avatar.svg'} alt="" />
            </div>
            <div className='userdetails'>
              <div>
                <div className="user-name">{currentReceiverDetails.username || 'Unknown User'}</div>
                <div className="user-status">Online</div>
              </div>
              <button onClick={() => setviewcard(!view)} className='view-profile-btn'>
                {view ? (
                  <>
                    <FaUser />
                    <p>Hover over card</p>
                  </>
                ) : (
                  <>
                    <FaUser />
                    <p>View Profile Card</p>
                  </>
                )}
              </button>
              <div className="profile-card-main">
                {view && (
                  <ProfileCard receiverdetails={currentReceiverDetails} setviewcard={setviewcard} />
                )}
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
                {msg.fileUrl && (
                  <div 
                    className="message-file"
                    onClick={() => window.open(msg.fileUrl, '_blank')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="file-icon">
                      {getFileIcon(msg.fileType)}
                    </div>
                    <div className="file-info">
                      <div className="file-name">{msg.fileName || 'Download file'}</div>
                      {msg.fileSize && (
                        <div className="file-size">{formatFileSize(msg.fileSize)}</div>
                      )}
                    </div>
                  </div>
                )}
                {!msg.imageUrl && !msg.fileUrl && msg.message && <p>{msg.message}</p>}
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
      {(selectedImage || selectedFile) && (
        <div className="file-preview-container">
          <div className="file-preview">
            {selectedImage ? (
              <>
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Preview"
                  className="preview-file"
                />
                <div className="file-info">
                  <div className="file-name">{selectedImage.name}</div>
                  <div className="file-size">
                    {formatFileSize(selectedImage.size)}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="file-icon">
                  {getFileIcon(selectedFile.type)}
                </div>
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
              </>
            )}
            <button
              onClick={selectedImage ? removeSelectedImage : removeSelectedFile}
              className="remove-file-btn"
              title={selectedImage ? 'Remove image' : 'Remove file'}
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="chat-input-container">
        <div className="file-input-wrapper">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input"
            disabled={isUploading || selectedFile}
          />
          <label htmlFor="image-upload" className="attachment-btn" title="Send image">
            <FiImage size={20} />
          </label>
        </div>
        <div className="file-input-wrapper">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="file-input"
            disabled={isUploading || selectedImage}
          />
          <label htmlFor="file-upload" className="attachment-btn" title="Send file">
            <FiFile size={20} />
          </label>
        </div>
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage || selectedFile ? 'Add a caption...' : 'Type a message...'}
            className="chat-input"
            disabled={isUploading}
          />
          <button className="emoji-btn" disabled={isUploading}>
            <FiSmile size={20} />
          </button>
        </div>
        <button
          onClick={handleSendMessage}
          className="send-btn"
          disabled={(!message.trim() && !selectedImage && !selectedFile) || isUploading}
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
