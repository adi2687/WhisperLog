import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import { io } from 'socket.io-client';
import { FiSend, FiPaperclip, FiImage, FiX, FiFile, FiGift, FiVideo } from 'react-icons/fi';
import { format } from 'date-fns';
import './chat.css';
import './GifPicker.css';
import ProfileCard from '../profile/profilecard/card';
import { FaUser } from 'react-icons/fa';
import axios from 'axios';
import Aurora from '../../pages/Aurora';

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function Chat({ chatId, receiver, receiverDetails, onBack }) {
  const location = useLocation();
  const [currentReceiver, setCurrentReceiver] = useState(receiver || location.state?.receiver);
  const [currentReceiverDetails, setCurrentReceiverDetails] = useState(receiverDetails || location.state?.receiverUsername);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeout = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedGif, setSelectedGif] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [view, setView] = useState(false);
  const messagesEndRef = useRef(null);
  const user = useProfileCurrentUser().profile;
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastTypingTime = useRef(0);
  const typingDebounce = useRef(null);

  // ... (keep all the existing functions and effects as they are)

  return (
    <div className="chat-container" style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
      {/* Aurora Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        opacity: 0.2,
        pointerEvents: 'none'
      }}>
        <Aurora colorStops={["#3A29FF", "#FF94B4", "#FF3232"]} blend={0.5} />
      </div>
      
      {/* Main Chat Content */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
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
                <button onClick={() => setView(!view)} className='view-profile-btn'>
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
                <div className='change-background'>
                  <button>Change background</button>
                </div>
                <div className="profile-card-main">
                  {view && (
                    <ProfileCard receiverdetails={currentReceiverDetails} setviewcard={setView} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="chat-box">
          {chat.length > 0 ? (
            chat.map((msg, index) => (
              <div
                key={index}
                className={`message-bubble ${msg.senderId === user?._id ? 'sent' : 'received'}`}
              >
                <div className='message-main'>
                  <div className={`message-content ${msg.imageUrl ? 'has-image' : ''}`}>
                    {msg.imageUrl && <img src={msg.imageUrl} alt="Shared content" className="message-image" />}
                    {msg.message && <div className="message-text">{msg.message}</div>}
                    <span className="message-time">
                      {format(new Date(msg.createdAt || Date.now()), 'h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-messages">
              <p>Start a conversation with {currentReceiverDetails?.username || 'this user'}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
          
          {/* Typing Indicator */}
          {Object.keys(typingUsers).length > 0 && (
            <div className="typing-indicator">
              <span>typing</span>
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
        </div>

        {/* Message Input Area */}
        <div className="chat-input-container">
          <div className={`input-icons ${isMenuExpanded ? 'expanded' : ''}`}>
            <button 
              className="menu-toggle" 
              onClick={() => setIsMenuExpanded(!isMenuExpanded)}
              title="More options"
            >
              <FiPaperclip size={20} />
            </button>
            
            <div className="menu-options">
              {/* File upload options */}
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
                className="attachment-btn"
                onClick={() => setShowGifPicker(!showGifPicker)}
                disabled={isUploading || selectedFile || selectedImage}
                title="Send GIF"
              >
                <FiGift size={20} />
              </button>
              
              {/* GIF Picker */}
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
            </div>
          </div>
          
          {/* Message Input */}
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder={selectedImage || selectedFile ? 'Add a caption...' : 'Type a message...'}
              className="chat-input"
              disabled={isUploading}
            />
          </div>
          
          {/* Send Button */}
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
        
        {/* File Preview */}
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
                onClick={selectedVideo ? removeSelectedVideo : (selectedImage ? removeSelectedImage : removeSelectedFile)}
                className="remove-file-btn"
                title={selectedVideo ? 'Remove video' : (selectedImage ? 'Remove image' : 'Remove file')}
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
