import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import { io } from 'socket.io-client';
import './chat.css'
const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function Chat({ chatId }) {
  const location = useLocation();
  const [receiver, setReceiver] = useState(location.state?.receiver);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const user = useProfileCurrentUser().profile;

  // Update receiver if location changes
  useEffect(() => {
    setReceiver(location.state?.receiver);
  }, [location.state?.receiver]);

  // Join the chat room
  useEffect(() => {
    if (chatId) {
      console.log('Joining chat:', chatId);
      socket.emit('joinchat', { chatId }); // ✅ Wrap in object
    }
  }, [chatId]);

  // Send message
  const sendMessage = () => {
    // console.log(chatId,user._id,receiver._id,message)
    if (message.trim()) {
      socket.emit('message', { chatId, message,senderId:user._id,receiverId:receiver });
      setMessage('');
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


  return (
    <div className="chat-container">
      <h1 className="chat-title">Chat App</h1>

      <div className="chat-box">
        {chat.length > 0 ? (
          chat.map((msg, index) => (
            <div key={index} className="chat-message">
              <p>{msg.message}</p>
            </div>
          ))
        ) : (
          <p className="no-messages">No messages</p>
        )}
      </div>

      <div className="chat-input-area">
      <input
  type="text"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') sendMessage();
  }}
  placeholder="Type a message"
  className="chat-input"
/>
        <button onClick={sendMessage} className="chat-send-btn">Send</button>
      </div>
    </div>
  );
}
