import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import { io } from 'socket.io-client';
import { FiSend, FiPaperclip, FiImage, FiX, FiFile, FiGift, FiVideo, FiMic, FiPhone, FiCamera } from 'react-icons/fi';
import { FaMagic, FaSpinner } from 'react-icons/fa';

import { format } from 'date-fns';
import './chat.css';
import './GifPicker.css';
import ProfileCard from '../profile/profilecard/card';
import { FaUser } from 'react-icons/fa';
import axios from 'axios';
import Aurora from '../../pages/Aurora'

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function Message({ receiverDetails, onBack }) {
  // State variables and hooks
  const location = useLocation();
  const { id: chatId } = useParams();
  const { profile } = useProfileCurrentUser();
  const user = profile;
  const [view, setView] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [receiver, setReceiver] = useState(location.state?.receiver || '');
  const [receiverUsername, setReceiverUsername] = useState(location.state?.receiverUsername || '');
  const [currentReceiver, setCurrentReceiver] = useState(receiver || location.state?.receiver);
  const [currentReceiverDetails, setCurrentReceiverDetails] = useState(receiverDetails || location.state?.receiverUsername);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedGif, setSelectedGif] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeout = useRef(null);
  const recognitionRef = useRef(null);
  const lastTypingTime = useRef(0);

  const [imageshow, setimageshow] = useState("")
  // Update receiver if props or location changes
  useEffect(() => {
    if (receiver) setCurrentReceiver(receiver);
    if (receiverDetails) setCurrentReceiverDetails(receiverDetails);
  }, [receiver, receiverDetails]);

  // Fetch user status when receiver changes
  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!currentReceiver) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${currentReceiver}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsOnline(data.isOnline);
          setLastSeen(data.lastSeen);
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };

    fetchUserStatus();
  }, [currentReceiver]);

  // Handle user status updates from socket
  useEffect(() => {
    if (!socket) return;

    const handleUserStatus = (data) => {
      if (data.userId === currentReceiver) {
        setIsOnline(data.isOnline);
        setLastSeen(data.lastSeen);
      }
    };

    // Listen for status updates
    socket.on('user_status', handleUserStatus);

    // Register current user with socket server
    if (user?._id) {
      socket.emit('register', user._id);
    }

    return () => {
      socket.off('user_status', handleUserStatus);
    };
  }, [socket, currentReceiver, user?._id]);

  // Fetch user status when receiver changes
  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!currentReceiver) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${currentReceiver}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsOnline(data.isOnline);
          setLastSeen(data.lastSeen);
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };

    fetchUserStatus();
  }, [currentReceiver]);

  // Handle user status updates from socket
  useEffect(() => {
    if (!socket) return;

    const handleUserStatus = (data) => {
      if (data.userId === currentReceiver) {
        setIsOnline(data.isOnline);
        setLastSeen(data.lastSeen);
      }
    };

    // Listen for status updates
    socket.on('user_status', handleUserStatus);

    // Register current user with socket server
    if (user?._id) {
      socket.emit('register', user._id);
    }

    return () => {
      socket.off('user_status', handleUserStatus);
    };
  }, [socket, currentReceiver, user?._id]);

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Offline';
    const date = new Date(timestamp);
    return `Last seen ${date.toLocaleString()}`;
  };

  // Join the chat room and set up socket listeners
  useEffect(() => {
    if (chatId) {
      console.log('Joining chat:', chatId);
      socket.emit('join_room', { roomId: chatId, userId: user?._id });
      
      // Register user with socket server for online status
      if (user?._id) {
        socket.emit('register', user._id);
      }

      // Listen for typing events
      const handleTyping = (data) => {
        console.log('Received typing event:', data);
        if (data.userId !== user?._id) {  // Don't show typing indicator for self
          setTypingUsers(prev => ({
            ...prev,
            [data.userId]: data.username
          }));
          setIsTyping(true);
          // Clear typing indicator after 3 seconds of no typing
          if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
          }

          typingTimeout.current = setTimeout(() => {
            setTypingUsers(prev => {
              const newTyping = { ...prev };
              delete newTyping[data.userId];
              return newTyping;
            });
            setIsTyping(false)
          }, 3000);
        }
      };

      // Add the event listeners
      socket.on('typing', handleTyping);

      // Clean up event listeners
      return () => {
        socket.off('typing', handleTyping);
        if (typingTimeout.current) {
          clearTimeout(typingTimeout.current);
        }
      };
    }
  }, [chatId, user?._id]);

  // Handle image selection
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
    if (!fileType) return '';

    if (fileType.includes('pdf')) return '';
    if (fileType.includes('word') || fileType.includes('document')) return '';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '';
    if (fileType.includes('zip') || fileType.includes('compressed')) return '';
    if (fileType.includes('text/plain')) return '';
    if (fileType.includes('image/')) return '';

    return '';
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
      setSelectedVideo(null)
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

      // Create a temporary message ID for optimistic update
      const tempMessageId = `temp-${Date.now()}`;
      const tempMessage = {
        _id: tempMessageId,
        message: message.trim(),
        senderId: user._id,
        receiverId: receiver,
        chatId: chatId,
        imageUrl: selectedGif || null,
        fileUrl: null,
        fileName: null,
        fileType: null,
        fileSize: null,
        status: 'sending',
        createdAt: new Date().toISOString()
      };

      // Add the message to local state immediately
      setChat(prev => [...prev, tempMessage]);
      scrollToBottom(); // Scroll to show the new message

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
          const videoUrl = result.secure_url || result.url;
          const thumbnailUrl = result.thumbnail ||
            (result.eager && result.eager[0]?.url) ||
            (result.public_id && `https://res.cloudinary.com/${process.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload/c_thumb,w_300,h_300/${result.public_id}.jpg`);

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

      // Create the final message object
      const finalMessage = {
        ...tempMessage,
        imageUrl: imageUrl,
        ...(fileData && fileData),
        status: 'sent' // Update status
      };

      // Update the local state with the final message (including file data)
      setChat(prev =>
        prev.map(msg =>
          msg._id === tempMessageId ? finalMessage : msg
        )
      );

      // Emit the message via socket
      socket.emit('message', {
        ...finalMessage,
        tempMessageId: tempMessageId // Include temp ID for reference
      });

      // Clear the input fields
      setMessage('');
      setSelectedImage(null);
      setSelectedFile(null);
      setSelectedGif(null);
      setSelectedVideo(null);

      // Update the message status when server acknowledges
      const ackTimeout = setTimeout(() => {
        setChat(prev =>
          prev.map(msg =>
            msg._id === tempMessageId && msg.status === 'sent'
              ? { ...msg, status: 'delivered' }
              : msg
          )
        );
      }, 1000);

      // Cleanup on component unmount
      return () => clearTimeout(ackTimeout);
    } catch (error) {
      console.error('Error sending message:', error);
      // Update message status to show error
      setChat(prev =>
        prev.map(msg =>
          msg._id === tempMessageId
            ? { ...msg, status: 'error', error: error.message }
            : msg
        )
      );
      alert(error.message || 'Failed to send message');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle new incoming messages
  const handleNewMessage = useCallback((msg) => {
    setChat(prev => {
      // Create a unique identifier for the message
      const msgId = msg._id || msg.tempMessageId || `temp-${Date.now()}`;

      // Check if message already exists using multiple criteria
      const existingMsgIndex = prev.findIndex(m => {
        // Check by ID if available
        if (m._id && m._id === msg._id) return true;

        // Check by temp ID if available
        if (m.tempMessageId && msg.tempMessageId && m.tempMessageId === msg.tempMessageId) return true;

        // Check by content and timing for potential duplicates
        if (m.content && msg.content &&
          m.content === msg.content &&
          m.senderId === msg.senderId &&
          Math.abs(new Date(m.createdAt || 0) - new Date(msg.createdAt || 0)) < 1000) {
          return true;
        }

        return false;
      });

      // If message exists, update it instead of adding a duplicate
      if (existingMsgIndex !== -1) {
        const updatedMessages = [...prev];
        // Preserve existing message ID if the new one is temporary
        const existingId = updatedMessages[existingMsgIndex]._id;
        updatedMessages[existingMsgIndex] = {
          ...updatedMessages[existingMsgIndex],
          ...msg,
          _id: msg._id && !msg._id.startsWith('temp-') ? msg._id : existingId,
          status: msg.status || 'delivered'
        };
        return updatedMessages;
      }

      // Format the new message with all required fields
      const newMsg = {
        ...msg,
        _id: msgId,
        tempMessageId: msg.tempMessageId || `temp-${Date.now()}`,
        status: 'delivered',
        createdAt: msg.createdAt || new Date().toISOString(),
        fileUrl: msg.fileUrl || null,
        fileName: msg.fileName || null,
        fileType: msg.fileType || null,
        fileSize: msg.fileSize || null,
        imageUrl: msg.imageUrl || null,
        senderId: msg.senderId || null,
        receiverId: msg.receiverId || null,
      };

      return [...prev, newMsg];
    });
  }, []);

  // Load existing messages when chatId changes
  useEffect(() => {
    if (!chatId) return;

    // Join the chat room
    socket.emit('joinchat', { chatId });

    // Handle initial message load
    const handleLoadMessages = (msgs) => {
      setChat([])
      console.log('loading messages', msgs);
      const formattedMessages = Array.isArray(msgs)
        ? msgs.map(msg => ({
          ...msg,
          fileUrl: msg.fileUrl || null,
          fileName: msg.fileName || null,
          fileType: msg.fileType || null,
          fileSize: msg.fileSize || null,
          imageUrl: msg.imageUrl || null,
          createdAt: msg.createdAt || new Date().toISOString(),
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp).getTime() : msg.timestamp || Date.parse(msg.createdAt || new Date()),
          senderId: msg.senderId || null,
          receiverId: msg.receiverId || null
        }))
        : [];

      setIsTyping(false);

      // Deduplicate messages when loading
      setChat(prev => {
        const filteredPrev = prev.filter(msg => !String(msg._id).startsWith('temp-'));
        const existingIds = new Set(filteredPrev.map(m => m._id));
        const newMessages = formattedMessages.filter(m => !existingIds.has(m._id));
        return [...filteredPrev, ...newMessages];
      });
    };

    // Set up socket listeners
    socket.on('loadMessages', handleLoadMessages);
    socket.on('message', handleNewMessage);

    // Clean up socket listeners
    return () => {
      socket.off('loadMessages', handleLoadMessages);
      socket.off('message', handleNewMessage);
    };
  }, [chatId, handleNewMessage]);

  // Detect screenshot attempts
  useEffect(() => {
    const handleKeyUp = (e) => {
      // Check for Print Screen key (works for both standalone and Win+Print Screen)
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        handleScreenshotDetected();
      }
    };

    const handleKeyDown = (e) => {
      // Check for Windows+Shift+S or Cmd+Shift+3/4 on Mac
      if (
        (e.key === 's' && e.ctrlKey && e.shiftKey) || // Windows+Shift+S
        (e.key === 's' && e.metaKey && e.shiftKey) ||  // Cmd+Shift+S (Mac)
        (e.key === '3' && e.metaKey) ||                // Cmd+3 (Mac)
        (e.key === '4' && e.metaKey)                   // Cmd+4 (Mac)
      ) {
        handleScreenshotDetected();
      }
    };

    const handleScreenshotDetected = () => {
      // Send screenshot notification
      const screenshotNotification = {
        _id: `screenshot-${Date.now()}`,
        chatId,
        message: '⚠️ Screenshot detected',
        timestamp: Date.now(),
        senderId: 'system',
        isSystemMessage: true,
        status: 'delivered'
      };
      
      setChat(prev => [...prev, screenshotNotification]);
      
      // Notify other users in the chat
      if (socket && chatId) {
        socket.emit('system_message', {
          chatId,
          message: 'A screenshot was taken in this chat',
          type: 'screenshot',
          userId: user?._id,
          username: user?.username
        });
      }
    };

    // Use both keyup (for Print Screen) and keydown (for other shortcuts)
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [chatId, socket, user?._id, user?.username]);

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



  // Reset profile card visibility when chat changes
  useEffect(() => {
    setView(false);
  }, [chatId]);


  const [translations, setTranslations] = useState({});
  const [loadingTranslations, setLoadingTranslations] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = (messageId, e) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === messageId ? null : messageId);
  };

  const translateMessage = async (msg) => {
    const messageId = msg._id || msg.tempMessageId;
    console.log('Starting translation for message:', { messageId, text: msg.message });

    // If already translated, just toggle the view
    if (translations[messageId]) {
      console.log('Toggling translation view for message:', messageId);
      setTranslations(prev => ({
        ...prev,
        [messageId]: prev[messageId] ? null : true
      }));
      return;
    }

    // Set loading state
    setLoadingTranslations(prev => ({
      ...prev,
      [messageId]: true
    }));

    const backend = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('token');
    
    console.log('Sending translation request to:', `${backend}/messageImprover/translate`);
    console.log('Auth token exists:', !!token);

    try {
      const response = await fetch(`${backend}/messageImprover/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: msg.message,
        }),
      });

      console.log('Translation response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('Translation response data:', data);

      if (!data || !data.corrected_sentence) {
        throw new Error('No corrected_sentence in response');
      }

      setTranslations(prev => ({
        ...prev,
        [messageId]: data.corrected_sentence
      }));
      
    } catch (error) {
      console.error('Translation error:', error);
      // On error, show original message but log the error
      setTranslations(prev => ({
        ...prev,
        [messageId]: msg.message
      }));
      
      // Show error to user (you might want to use a toast or other UI element)
      alert(`Translation failed: ${error.message}`);
      
    } finally {
      setLoadingTranslations(prev => ({
        ...prev,
        [messageId]: false
      }));
    }
  }
  // Render message content based on type
  const renderMessageContent = (msg) => {
    // Render system messages differently
    if (msg.isSystemMessage) {
      return (
        <div className="system-message">
          <FiCamera className="system-icon" />
          <span>{msg.message}</span>
        </div>
      );
    }
    if (msg.imageUrl) {
      return (
        <div className="message-image">
          <img
            src={msg.imageUrl}
            alt="Shared content"
            className="chat-image"
            onClick={() => {
              // window.open(msg.imageUrl, '_blank')
              setimageshow(msg.imageUrl)
            }}
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
          msg.fileUrl?.startsWith('//') ? `https:${msg.fileUrl}` : msg.fileUrl;

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
            <div className="user-name">{currentReceiverDetails?.username || 'Unknown User'}</div>
            <div className={`user-status ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? 'Online' : lastSeen ? `Last seen ${new Date(lastSeen).toLocaleString()}` : 'Offline'}
            </div>
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
    const messageId = msg._id || msg.tempMessageId;
    const isTranslated = !!translations[messageId];
    const isLoading = loadingTranslations[messageId];
    const showMenu = menuOpen === messageId;

    if (!msg.message) return null;

    return (
      <div className="message-content">
        <div className="message-text">
          {isLoading ? (
            <div className="translation-loader">
              <div className="loader-dot"></div>
              <div className="loader-dot"></div>
              <div className="loader-dot"></div>
              <span>Translating...</span>
            </div>
          ) : isTranslated ? (
            <div className="message-text-content translated-text">
              {translations[messageId]}
            </div>
          ) : (
            <div className="message-text-content original-text">
              {msg.message}
            </div>
          )}
        </div>
        
        <div className="message-footer">
          <span className="message-time">
            {format(new Date(msg.createdAt || Date.now()), 'h:mm a')}
          </span>
          {msg.senderId === receiver && (
            <div className="message-actions">
            <button
              className={`menu-dot ${showMenu ? 'active' : ''}`}
              onClick={(e) => toggleMenu(messageId, e)}
              aria-label="Message actions"
              aria-expanded={showMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            {showMenu && (
              <div className="message-dropdown" ref={menuRef}>
                <button 
                  className="dropdown-item" 
                  onClick={() => { 
                    translateMessage(msg); 
                    setMenuOpen(null); 
                  }} 
                  disabled={isLoading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.87 15.07L10 12.28V12.28C9.4 11.74 8.31 11.78 7.76 12.38C7.21 12.97 7.25 14 7.86 14.63L11.3 18.07C11.69 18.46 12.32 18.46 12.71 18.07L16.15 14.63C16.74 14.04 16.8 13.02 16.27 12.38C15.74 11.74 14.65 11.75 14.09 12.32L12.86 13.56" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.5 10.19L10.38 12.07L12.26 10.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.5 8.5H8.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.5 8.5H11.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.5 8.5H14.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{isLoading ? 'Translating...' : isTranslated ? 'Show Original' : 'Translate to English'}</span>
                </button>
                <button className="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8L21 11M21 11L18 14M21 11H3M13 3C9.13401 3 6 6.13401 6 10V11M6 21H10M6 21L3 18M6 21L9 18M18 18L15 21M18 21H14M18 21L21 18M10 3C13.866 3 17 6.13401 17 10V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Forward</span>
                </button>
                <button className="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 7L18.1327 19.1125C18.0579 20.1891 17.187 21.0709 16.1108 21.1055C15.9159 21.1129 15.5 21.1129 15.5 21.1129C15.5 21.1129 14.5 21.1129 14.5 20.1129C14.5 19.1129 14.5 17.5 14.5 17.5M14.5 17.5H17.5M14.5 17.5H9.5M9.5 17.5H4.5M9.5 17.5V20.5C9.5 21.5 8.5 21.5 8.5 21.5H5.5C4.5 21.5 4.5 20.5 4.5 20.5V17.5M9.5 17.5H4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.5 10.5L15.5 5.5M15.5 5.5L10.5 0.5M15.5 5.5H1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Reply</span>
                </button>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Initialize speech recognition on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    // Initialize recognition
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    // Configure recognition
    recognition.continuous = false;  // Get single result per recognition
    recognition.interimResults = false;  // We only want final results
    recognition.lang = 'en-US';

    // Event handlers
    const handleResult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Speech recognition result:', transcript);
      setMessage(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };

    const handleError = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    const handleEnd = () => {
      console.log('Speech recognition ended');
      if (isListening) {
        try {
          recognition.start();
          console.log('Restarted speech recognition');
        } catch (error) {
          console.error('Error restarting recognition:', error);
          setIsListening(false);
        }
      }
    };

    // Add event listeners
    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('end', handleEnd);

    // Cleanup function
    return () => {
      if (recognition) {
        console.log('Cleaning up speech recognition');
        recognition.removeEventListener('result', handleResult);
        recognition.removeEventListener('error', handleError);
        recognition.removeEventListener('end', handleEnd);
        if (isListening) {
          recognition.stop();
        }
      }
    };
  }, []);  // Empty dependency array - only run once on mount

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }

    if (isListening) {
      // Stop listening
      try {
        console.log('Stopping speech recognition');
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsListening(false);
      }
    } else {
      // Start listening
      try {
        console.log('Starting speech recognition');
        setMessage(''); // Clear previous message
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        setIsListening(false);

        // Try to reinitialize if there was an error
        if (error.message.includes('already started')) {
          console.log('Attempting to reinitialize speech recognition');
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        }
      }
    }
  };

  // Handle message input change
  const handleMessageChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Clear any existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // If there's a message, emit typing event
    if (newMessage.trim()) {
      const now = Date.now();
      // Only emit typing event if it's been more than 2 seconds since the last one
      if (now - lastTypingTime.current > 2000) {
        socket.emit('typing', { chatId: chatId, userId: user?._id });
        lastTypingTime.current = now;
      }

      // Set timeout to stop typing indicator when user stops typing
      typingTimeout.current = setTimeout(() => {
        socket.emit('stop_typing', { roomId: chatId, userId: user?._id });
      }, 2000);
    } else {
      socket.emit('stop_typing', { roomId: chatId, userId: user?._id });
    }
  };

  const handleCorrectMessage = async () => {
    if (!message.trim()) {
      setMessage('Please enter a message to correct');
      setTimeout(() => setMessage(''), 1000);
      return;
    }

    setCorrecting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/messageImprover/spell_correct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentence: message }),
      });

      const data = await response.json();
      console.log('Corrected sentence:', data);

      if (data.corrected_sentence) {
        setMessage(data.corrected_sentence);
      } else {
        setMessage('');
      }
    } catch (error) {
      console.error('Error correcting message:', error);
      setMessage('Error correcting message');
    } finally {
      setCorrecting(false);
    }
  };

  return (
    <div className="chat-container" style={{ position: 'relative', overflow: 'hidden', height: '100%', width: '100%' }}>
      <div className="chat-content">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>{currentReceiverDetails?.username || 'Chat'}</h3>
          <div className={`user-status ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'Online' : lastSeen ? `Last seen ${new Date(lastSeen).toLocaleString()}` : 'Offline'}
          </div>
        </div>
      </div>
      {/* Image Preview Modal */}
      {imageshow && (
        <div className="image-preview-modal" onClick={() => setimageshow(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={(e) => {
                e.stopPropagation();
                setimageshow(false);
              }}
              aria-label="Close image"
            >
              &times;
            </button>
            <div className="image-container">
              <img 
                src={imageshow} 
                alt="Full size preview" 
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}

      <div className="chat-box">
          {chat.length > 0 ? (
            chat.map((msg, index) => (
              <div
                key={`${msg._id || 'temp'}-${msg.timestamp || Date.now()}-${index}`}

                className={`message-bubble ${msg.senderId === user?._id ? 'sent' : 'received'}`}
              >
                <div className='message-main'>
                  <div className={`message-content ${msg.imageUrl ? 'has-image' : ''}`}>
                    {renderMessageContent(msg)}

                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-messages">
              <p>Start a conversation with {receiverDetails?.name || 'this user'}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
          {Object.keys(typingUsers).length > 0 && (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>

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
                    <div className="user-name">{currentReceiverDetails?.username || 'Unknown User'}</div>
                    <div className={`user-status ${isOnline ? 'online' : 'offline'}`}>
                      {isOnline ? 'Online' : lastSeen ? `Last seen ${new Date(lastSeen).toLocaleString()}` : 'Offline'}
                    </div>
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
      </div>
      
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
          <button
            onClick={handleCorrectMessage}
            className={`correct-btn ${correcting ? 'correcting' : ''}`}
            disabled={isUploading || correcting}
            title="Improve your message with AI"
          >
            {correcting ? (
              <>
                <FaSpinner className="spinner" />
              </>
            ) : (
              <>
                <FaMagic size={20} />
              </>
            )}
          </button>
          <div className="voice-input-container">
            {isListening && (
              <div className="recording-indicator">
                <span className="pulse-dot"></span>
                <span className="recording-text">Listening...</span>
              </div>
            )}
            <button
              type="button"
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleVoiceRecognition}
              disabled={isUploading}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              <FiMic size={20} className={isListening ? 'pulse' : ''} />
            </button>
          </div>
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
};
