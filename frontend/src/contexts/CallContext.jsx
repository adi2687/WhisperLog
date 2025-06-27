import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import CallNotification from '../components/video/CallNotification';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const [callData, setCallData] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('Connecting to socket server at:', serverUrl);
    
    const newSocket = io(serverUrl, {
      path: '/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to call server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from call server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle incoming calls
  const handleIncomingCall = useCallback((data) => {
    console.log('Incoming call:', data);
    setCallData({
      ...data,
      socket,
      timestamp: Date.now()
    });
  }, [socket]);

  // Listen for incoming calls
  useEffect(() => {
    if (!socket) return;

    socket.on('incoming-call', handleIncomingCall);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
    };
  }, [socket, handleIncomingCall]);

  // Handle call timeout
  useEffect(() => {
    if (!callData) return;

    const timer = setTimeout(() => {
      setCallData(null);
    }, 30000); // 30 seconds timeout

    return () => clearTimeout(timer);
  }, [callData]);

  // Initiate a call
  const initiateCall = useCallback(({ recipientId, callType, roomId, callerName }) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected');
      return false;
    }

    socket.emit('initiate-call', {
      recipientId,
      callType,
      roomId,
      callerName,
      timestamp: Date.now()
    });

    return true;
  }, [socket, isConnected]);

  // Dismiss the call notification
  const dismissCall = useCallback(() => {
    setCallData(null);
  }, []);

  return (
    <CallContext.Provider value={{ 
      socket, 
      isConnected, 
      initiateCall,
      currentCall: callData 
    }}>
      {children}
      {callData && (
        <CallNotification 
          callData={callData} 
          onClose={dismissCall} 
        />
      )}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export default CallContext;
