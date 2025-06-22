import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const { user, isAuthenticated } = useAuth();

    // Connect to WebSocket when user is authenticated
    useEffect(() => {
        if (isAuthenticated() && user?._id) {
            connectSocket(user._id);
            
            return () => {
                if (socket) {
                    socket.disconnect();
                    setSocket(null);
                    setIsConnected(false);
                }
            };
        }
    }, [user?._id, isAuthenticated()]);

    const connectSocket = useCallback((userId) => {
        if (socket || !userId) return;

        // Initialize socket connection
        const newSocket = io(import.meta.env.VITE_BACKEND_URL, {
            withCredentials: true,
            transports: ['websocket'],
            autoConnect: false
        });

        // Connection events
        newSocket.on('connect', () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            if (userId) {
                newSocket.emit('register', userId);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        });

        newSocket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        // Listen for new notifications
        newSocket.on('newNotification', (notification) => {
            console.log('New notification received:', notification);
            setNotifications(prev => [notification, ...prev]);
        });

        // Connect the socket
        newSocket.connect();
        setSocket(newSocket);

        return () => {
            newSocket.off('connect');
            newSocket.off('disconnect');
            newSocket.off('error');
            newSocket.off('newNotification');
            newSocket.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [socket]);

    const disconnectSocket = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    }, [socket]);

    const sendNotification = useCallback((userId, notification) => {
        if (socket && isConnected) {
            socket.emit('sendNotification', { userId, notification });
            return true;
        }
        return false;
    }, [socket, isConnected]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [socket]);

    const value = {
        socket,
        isConnected,
        notifications,
        connectSocket,
        disconnectSocket,
        sendNotification,
        setNotifications
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export default WebSocketContext;
