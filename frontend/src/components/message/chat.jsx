import { useParams, useLocation } from 'react-router-dom';
import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { Paper, TextField, Button, Typography, List, ListItem, ListItemText, Box, Avatar, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Backend address

const backendUrl = import.meta.env.VITE_BACKEND_URL;

function Chat({ chatId }) {
  const location = useLocation();
  const { profile } = useProfileCurrentUser();
  const [message, setMessage] = useState('');
  const [receiver, setReceiver] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setReceiver(location.state?.receiver);
}, [location.state?.receiver]);

useEffect(() => {
    console.log("Updated receiver:", receiver);
}, [receiver]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket connection and event listeners


  // Fetch messages when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchMessages();
    }
  }, [chatId]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${backendUrl}/message/${chatId}`);
      console.log(response.data)
      setMessages(response.data.messages || []);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const sendMessage = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${backendUrl}/message`, { message, chatId, senderId: profile._id, receiverId: receiver });
      fetchMessages()
      // setMessages(response.data.messages || []);
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };
  

  
  if (isLoading) return <Typography>Loading chat...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show loading state if we're still loading or don't have profile data
  if (isLoading || !profile) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
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
      {receiver ? (
        <p>Chat{receiver}</p>
      ) : (
        <p>No chat selected</p>
      )
      }
      {/* Chat header */}
      <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={receiver?.avatar} alt={receiver?.username} />
        <Box>
          <Typography variant="h6">
            {receiver?.username || 'Chat'}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {isConnected ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      </Paper>

      {/* Messages area */}
      <div>
        {messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="textSecondary">No messages yet. Start the conversation!</Typography>
          </Box>
        ) : (
          messages.map((message, index) => (
            <div key={index}>
              <p>{message.message}</p>
            </div>
          ))
        )}
      </div>
      {/* Message input */}
      <input type="text" onChange={(e) => setMessage(e.target.value)} /> 
      <button onClick={sendMessage}>Send</button>
    </Box>
  );
}

export default Chat;
