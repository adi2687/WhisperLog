import { useLocation } from 'react-router-dom';
import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Box, Avatar, CircularProgress, TextField, Button } from '@mui/material';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); 
const backendUrl = import.meta.env.VITE_BACKEND_URL;

function Chat({ chatId }) {
  const location = useLocation();
  const { profile } = useProfileCurrentUser();
  const [message, setMessage] = useState('');
  const [receiver, setReceiver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setReceiver(location.state?.receiver || null);
  }, [location.state]);
useEffect(()=>{
  socket.emit('join_room',chatId)
},[chatId])
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${backendUrl}/message/${chatId}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  // Handle incoming socket messages
  useEffect(() => {
    if (!chatId) return;

    const handleNewMessage = (data) => {
      try {
        // Validate incoming message data
        if (!data || !data.message || typeof data.message !== 'object' || data.roomId !== chatId) {
          return; // Silently ignore invalid or unrelated messages
        }

        const { message } = data;
        
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const hasId = message._id || (message.tempId && typeof message.tempId === 'string');
          const messageExists = hasId && prev.some(m => 
            (m._id && m._id === message._id) || 
            (m.tempId && m.tempId === message.tempId)
          );
          
          return messageExists ? prev : [...prev, message];
        });
      } catch (error) {
        console.error('Error handling new message:', error, 'Data:', data);
      }
    };

    // Join the room when chatId changes
    if (chatId) {
      socket.emit('join_room', { 
        roomId: chatId,
        userId: profile?._id || 'anonymous'
      });
    }

    // Set up event listeners
    socket.on('receive_message', handleNewMessage);
    
    // Handle user join/leave notifications if needed
    socket.on('user_joined', (data) => {
      console.log('User joined:', data);
      // You can show a notification or update UI if needed
    });

    // Clean up event listeners
    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('user_joined');
    };
  }, [chatId, profile?._id]);


  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !chatId) return;

    const messageData = {
      content: message.trim(),
      senderId: profile?._id,
      senderName: profile?.username || 'Anonymous',
      timestamp: new Date().toISOString(),
      tempId: `temp-${Date.now()}` // Temporary ID for optimistic updates
    };

    // Optimistically add the message to the UI
    setMessages(prev => [...prev, messageData]);
    setMessage('');

    // Send the message via socket
    socket.emit('send_message', {
      roomId: chatId,
      message: messageData
    });

    // Optional: Handle message delivery status
    const handleDeliveryStatus = (status) => {
      if (status.success && status.tempId === messageData.tempId) {
        // Update the message with the server-generated ID
        setMessages(prev => 
          prev.map(m => 
            m.tempId === messageData.tempId 
              ? { ...m, _id: status.messageId, tempId: undefined } 
              : m
          )
        );
        // Clean up the listener
        socket.off('message_delivered', handleDeliveryStatus);
      }
    };

    socket.on('message_delivered', handleDeliveryStatus);
  };

  if (isLoading || !profile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh', justifyContent: 'center', gap: 2 }}>
        <CircularProgress />
        <Typography>Loading chat...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, color: 'error.main' }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          src={receiver?.avatar} 
          alt={receiver?.username}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        >
          {receiver?.username?.charAt(0)?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h6">{receiver?.username || 'Chat'}</Typography>
          <Typography variant="caption" color="textSecondary">
            {isConnected ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {messages.length === 0 ? (
          <Typography color="textSecondary" align="center">No messages yet. Start the conversation!</Typography>
        ) : (
          messages.map((msg, idx) => (
            <Box key={idx} sx={{ my: 1, textAlign: msg.senderId === profile._id ? 'right' : 'left' }}>
              <Typography variant="body2" sx={{ display: 'inline-block', bgcolor: '#f1f1f1', p: 1, borderRadius: 2 }}>
                {msg.text || msg.message}
              </Typography>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button variant="contained" onClick={sendMessage}>Send</Button>
      </Box>
    </Box>
  );
}

export default Chat;
