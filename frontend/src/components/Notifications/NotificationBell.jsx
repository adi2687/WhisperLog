import React, { useState, useEffect, useRef, useContext } from 'react';
import { Bell, Check, UserPlus, MessageSquare, ThumbsUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const { socket, notifications: realtimeNotifications } = useWebSocket();
  const { user } = useAuth();
  
  // Combine server and real-time notifications
  useEffect(() => {
    if (realtimeNotifications.length > 0) {
      setNotifications(prev => [
        ...realtimeNotifications,
        ...prev.filter(n => !realtimeNotifications.some(rn => rn.id === n.id))
      ]);
      setUnreadCount(prev => prev + 1);
    }
  }, [realtimeNotifications]);

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Poll for new notifications
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/friends/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/friends/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const clearNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${apiUrl}/friends/notifications/${notificationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update local state to remove the notification
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update unread count if the notification was unread
      setUnreadCount(prev => {
        const notification = notifications.find(n => n._id === notificationId);
        return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
      });
      
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      // Get all unread notification IDs
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      if (unreadNotifications.length === 0) return;
      
      // Mark all as read on the server
      await Promise.all(
        unreadNotifications.map(notification => 
          axios.patch(
            `${apiUrl}/friends/notifications/${notification._id}/read`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )
        )
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({
          ...n,
          isRead: true
        }))
      );
      
      // Update unread count
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleAcceptFriendRequest = async (notificationId, senderId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${apiUrl}/friends/request/accept`,
        { notificationId: notificationId,senderid:senderId }, // Changed from requestId to notificationId
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update UI to show request was accepted
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId 
            ? { ...n, status: 'accepted', isRead: true } 
            : n
        )
      );

      // Refresh unread count
      fetchUnreadCount();
      
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${apiUrl}/friends/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return <UserPlus size={16} />;
      case 'MESSAGE':
        return <MessageSquare size={16} />;
      case 'LIKE':
      case 'COMMENT':
        return <ThumbsUp size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <div 
        className={`bell-icon ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={24} />
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="notifications-dropdown"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="notifications-header">
              <h3>Notifications</h3>
              <div className="notification-actions">
                <button 
                  className="mark-all-read"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  title="Mark all as read"
                >
                  <Check size={16} />
                </button>
                <button 
                  className="close-dropdown"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">No new notifications</div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div 
                    key={notification._id || notification.timestamp} 
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                      {notification.senderProfilePicture && (
                        <img 
                          src={notification.senderProfilePicture} 
                          alt={notification.senderName || 'User'}
                          className="notification-sender-avatar"
                        />
                      )}
                    </div>
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {new Date(notification.timestamp || notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="notification-sender">
                          {notification.senderName || 'User'}
                        </span>
                      </div>
                    </div>
                    <div className="notification-actions">
                      {notification.type === 'FRIEND_REQUEST' && notification.status !== 'accepted' && (
                        <button
                          className="accept-request-btn"
                          onClick={(e) => handleAcceptFriendRequest(notification._id, notification.senderId, e)}
                          title="Accept friend request"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      {!notification.isRead && notification.type !== 'FRIEND_REQUEST' && (
                        <button 
                          className="mark-read-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button 
                        className="clear-notification-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification._id || notification.timestamp);
                        }}
                        title="Dismiss"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
