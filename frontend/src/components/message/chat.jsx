import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import { io } from 'socket.io-client';
import { FiSend, FiPaperclip, FiSmile, FiImage, FiX, FiFile, FiGift, FiVideo } from 'react-icons/fi';
import { format } from 'date-fns';
import './chat.css';
import './GifPicker.css';
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
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedGif, setSelectedGif] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState([]);
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

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        alert('Video file is too large. Maximum size is 50MB.');
        return;
      }
      
      // Check file type
      const validTypes = [
        'video/mp4', 'video/webm', 'video/quicktime', 
        'video/x-msvideo', 'video/x-ms-wmv', 'video/3gpp', 
        'video/3gpp2', 'video/mpeg', 'video/mp2t', 'video/x-flv',
        'video/x-m4v', 'video/x-matroska', 'video/x-ms-asf'
      ];
      
      const fileType = file.type.toLowerCase();
      const isValidType = validTypes.some(type => fileType.includes(type.replace('video/', '')));
      
      if (!isValidType) {
        alert('Unsupported video format. Supported formats: MP4, WebM, QuickTime, AVI, WMV, 3GPP, MPEG, FLV, MKV, etc.');
        return;
      }
      
      setSelectedVideo(file);
      setSelectedImage(null);
      setSelectedFile(null);
      setSelectedGif(null);
      setMessage('');
      
      // Reset the file input to allow selecting the same file again
      e.target.value = null;
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
      setSelectedImage(null);
      setSelectedVideo(null);
      setSelectedGif(null);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const removeSelectedVideo = () => {
    setSelectedVideo(null);
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setSelectedGif(null);
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

  const handleFileUpload = async (file, type = 'file') => {
    try {
      const uploadFormData = new FormData();
      let endpoint = 'upload-file';
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'; // Fallback URL
      
      // Add file to form data based on type
      if (type === 'image') {
        if (typeof file === 'string') {
          return { imageUrl: file }; // Return GIF URL directly
        }
        endpoint = 'upload-image';
        uploadFormData.append('image', file);
      } else if (type === 'video') {
        endpoint = 'upload-video';
        uploadFormData.append('video', file);
        uploadFormData.append('fileName', file.name);
        uploadFormData.append('fileType', file.type);
        uploadFormData.append('fileSize', file.size);
      } else {
        uploadFormData.append('file', file);
      }

      const url = `${backendUrl}/message/${endpoint}`;
      console.log(`Uploading ${type} to:`, url);
      console.log('Request headers:', {
        'Authorization': `Bearer ${localStorage.getItem('token') ? '***' : 'No token found'}`,
        'Content-Type': 'multipart/form-data'
      });
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      // Make the request with error handling
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
            // Don't set Content-Type, let the browser set it with the boundary
          },
          body: uploadFormData
        });
      } catch (networkError) {
        console.error('Network error during upload:', networkError);
        throw new Error(`Network error: ${networkError.message}. Please check your connection.`);
      }

      // Get response as text first
      const responseText = await response.text();
      console.log(`[${response.status}] Response:`, responseText);
      
      // Try to parse as JSON
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse JSON response. Response was:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText
        });
        
        if (responseText.trim().startsWith('<!DOCTYPE')) {
          throw new Error('Server returned an HTML error page. The server might be misconfigured.');
        }
        
        throw new Error(`Invalid server response (${response.status} ${response.statusText}). Please try again.`);
      }

      // Handle non-OK responses
      if (!response.ok) {
        const errorMessage = responseData.message || 
                          responseData.error || 
                          `Server returned ${response.status} ${response.statusText}`;
        
        console.error('Upload failed:', {
          status: response.status,
          error: errorMessage,
          response: responseData
        });
        
        throw new Error(errorMessage);
      }

      console.log('Upload successful:', responseData);
      return responseData;
      
    } catch (error) {
      console.error(`Error in handleFileUpload (${type}):`, error);
      if (!error.message) {
        error.message = `An unknown error occurred while uploading ${type}`;
      }
      throw error;
    }
  };

  // Search for GIFs
  const searchGifs = async (query) => {
    try {
      // Using GIPHY API - you'll need to get an API key from https://developers.giphy.com/
      const apiKey = 'cDZR4AxCLnQKYGF2qS9K90FMDTPee2sc'; // Replace with your GIPHY API key
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=10`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error searching GIFs:', error);
    }
  };

  // Select a GIF to send
  const handleGifSelect = (gif) => {
    setSelectedGif(gif.images.original.url);
    setSelectedImage(null);
    setSelectedFile(null);
    setShowGifPicker(false);
    
    // Auto-focus the message input after selecting a GIF
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage && !selectedVideo && !selectedFile && !selectedGif) || isUploading) return;

    try {
      setIsUploading(true);
      let imageUrl = selectedGif || null;
      let fileData = null;

      // Handle media uploads
      if (selectedImage) {
        const result = await handleFileUpload(selectedImage, 'image');
        imageUrl = result.imageUrl || result.url;
      } 
      // Handle video upload if exists
      else if (selectedVideo) {
        try {
          const result = await handleFileUpload(selectedVideo, 'video');
          console.log('Video upload result:', result);
          
          // Handle Cloudinary response format
          const videoUrl = result.secure_url || result.url;
          const thumbnailUrl = result.thumbnail || 
                            (result.eager && result.eager[0]?.url) ||
                            (result.secure_url && result.secure_url.replace(/\.(mp4|webm|mov|avi|wmv|flv|mkv|3gp|mpeg|mpg|m4v|ogv)$/i, '.jpg'));
          
          fileData = { 
            fileUrl: videoUrl, 
            fileName: result.originalname || selectedVideo.name, 
            fileType: result.resource_type === 'video' ? 'video' : (result.format ? `video/${result.format}` : 'video/mp4'),
            thumbnail: thumbnailUrl,
            duration: result.duration,
            width: result.width,
            height: result.height,
            public_id: result.public_id,
            format: result.format,
            resource_type: result.resource_type,
            eager: result.eager
          };
          
          console.log('Processed video data:', fileData);
        } catch (error) {
          console.error('Error processing video upload:', error);
          throw new Error(`Failed to process video: ${error.message}`);
        }
      }
      // Handle file upload if exists
      else if (selectedFile) {
        const result = await handleFileUpload(selectedFile, 'file');
        fileData = {
          fileUrl: result.url || result.secure_url,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size
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

      // Clear the input and selected files/GIF/video
      setMessage('');
      setSelectedImage(null);
      setSelectedFile(null);
      setSelectedGif(null);
      setSelectedVideo(null);
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

  // Render message content based on type
  const renderMessageContent = (msg) => {
    if (msg.imageUrl) {
      return (
        <div className="message-image">
          <img 
            src={msg.imageUrl} 
            alt="Shared content" 
            className="chat-image" 
            onClick={() => window.open(msg.imageUrl, '_blank')}
          />
          {msg.message && <div className="image-caption">{msg.message}</div>}
        </div>
      );
    } else if (msg.fileUrl) {
      // Check if it's a video
      if ((msg.fileType && (msg.fileType.startsWith('video/') || msg.fileType === 'video')) || 
          (msg.fileUrl && msg.fileUrl.match(/\.(mp4|webm|mov|avi|wmv|flv|mkv|3gp|mpeg|mpg|m4v|ogv)($|\?)/i))) {
        
        // Ensure the URL is properly formatted
        const videoUrl = msg.fileUrl?.startsWith('http') ? msg.fileUrl : 
                         msg.fileUrl?.startsWith('//') ? `https:${msg.fileUrl}` : 
                         msg.fileUrl;
        
        // Get thumbnail if available
        const thumbnailUrl = msg.thumbnail || 
                           (msg.eager && msg.eager[0]?.url) || 
                           (msg.public_id && `https://res.cloudinary.com/${process.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload/c_thumb,w_300,h_300/${msg.public_id}.jpg`);
        
        return (
          <div className="message-video">
            <video 
              className="chat-video"
              controls
              controlsList="nodownload"
              poster={thumbnailUrl}
              preload="metadata"
              style={{ maxWidth: '100%', maxHeight: '400px' }}
              onError={(e) => {
                console.error('Error loading video:', e);
                const errorMsg = document.createElement('div');
                errorMsg.className = 'video-error';
                errorMsg.textContent = 'Error loading video. Click to open in new tab.';
                e.target.parentNode.appendChild(errorMsg);
                
                // Make the video container clickable to open the video in a new tab
                e.target.parentNode.style.cursor = 'pointer';
                e.target.parentNode.onclick = () => window.open(videoUrl, '_blank');
              }}
            >
              <source src={videoUrl} type={msg.fileType || 'video/mp4'} />
              Your browser does not support the video tag.
            </video>
            {msg.message && <div className="video-caption">{msg.message}</div>}
          </div>
        );
      }
      
      // Regular file download
      return (
        <div className="message-file" onClick={() => window.open(msg.fileUrl, '_blank')}>
          <div className="file-icon">{getFileIcon(msg.fileName || 'file')}</div>
          <div className="file-info">
            <div className="file-name" title={msg.fileName}>
              {msg.fileName || 'Download file'}
            </div>
            <div className="file-size">
              {msg.fileSize ? formatFileSize(msg.fileSize) : 'Click to view'}
            </div>
          </div>
        </div>
      );
    }
    return msg.message ? <p>{msg.message}</p> : null;
  };

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
                {renderMessageContent(msg)}
                <span className="message-time">
                  {format(new Date(msg.createdAt || Date.now()), 'h:mm a')}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-messages">
            <p>Start a conversation with {receiverDetails?.name || 'this user'}</p>
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
      {(selectedImage || selectedVideo || selectedFile || selectedGif) && (
        <div className="file-preview-container">
          <div className="file-preview">
            {selectedGif ? (
              <>
                <img
                  src={selectedGif}
                  alt="GIF Preview"
                  className="preview-file"
                  style={{ maxHeight: '100px' }}
                />
                <div className="file-info">
                  <div className="file-name">GIF</div>
                </div>
              </>
            ) : selectedVideo ? (
              <div className="video-preview">
                <video className="preview-video" controls>
                  <source src={URL.createObjectURL(selectedVideo)} type={selectedVideo.type} />
                  Your browser does not support the video tag.
                </video>
                <button
                  onClick={removeSelectedVideo}
                  className="remove-file-btn"
                  title="Remove video"
                >
                  <FiX size={16} />
                </button>
              </div>
            ) : selectedImage ? (
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
            disabled={isUploading || selectedFile || selectedGif}
          />
          <label htmlFor="image-upload" className="attachment-btn" title="Send image">
            <FiImage size={20} />
          </label>
        </div>
        
        <button 
          type="button" 
          className="gif-btn"
          onClick={() => setShowGifPicker(!showGifPicker)}
          disabled={isUploading || selectedFile || selectedImage}
          title="Send GIF"
        >
          <FiGift size={20} />
        </button>
        
        {showGifPicker && (
          <div className="gif-picker">
            <input
              type="text"
              placeholder="Search GIFs..."
              value={gifQuery}
              onChange={(e) => {
                setGifQuery(e.target.value);
                searchGifs(e.target.value);
              }}
              className="gif-search"
            />
            <div className="gif-grid">
              {gifs.map((gif) => (
                <img
                  key={gif.id}
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  className="gif-item"
                  onClick={() => handleGifSelect(gif)}
                />
              ))}
            </div>
          </div>
        )}
        <div className="file-input-wrapper">
          <input
            type="file"
            id="video-upload"
            accept="video/*"
            onChange={handleVideoChange}
            className="file-input"
            disabled={isUploading || selectedImage || selectedFile || selectedGif}
          />
          <label htmlFor="video-upload" className="attachment-btn" title="Send video">
            <FiVideo size={20} />
          </label>
        </div>
        <div className="file-input-wrapper">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="file-input"
            disabled={isUploading || selectedImage || selectedVideo || selectedGif}
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
          disabled={(!message.trim() && !selectedImage && !selectedVideo && !selectedFile && !selectedGif) || isUploading}
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
