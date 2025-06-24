import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, UserPlus, MessageSquare, ThumbsUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const pageSize = 10;

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    const fetchNotifications = async () => {
      if (isOpen) {
        try {
          setIsLoading(true);
          const token = localStorage.getItem('token');
          const response = await axios.get(`${apiUrl}/notification/all`, {
            params: { page: 1, limit: pageSize },
            headers: { 'Authorization': `Bearer ${token}` }
          });
          // The API returns an array of notifications directly
          const notifications = Array.isArray(response.data) ? response.data : [];
          setNotifications(notifications);
          setHasMore(notifications.length === pageSize);
          setPage(1);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchNotifications();
  }, [isOpen, apiUrl]);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${apiUrl}/notification/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUnreadCount(response.data?.count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle infinite scroll
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement || !hasMore || isLoading) return;

    const handleScroll = () => {
      if (listElement.scrollTop + listElement.clientHeight >= listElement.scrollHeight - 10) {
        loadMoreNotifications();
      }
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading]);

  const loadMoreNotifications = async () => {
    if (isLoading || !hasMore) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const nextPage = page + 1;
      const response = await axios.get(`${apiUrl}/notification/all`, {
        params: { page: nextPage, limit: pageSize },
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const newNotifications = response.data.notifications || [];
      setNotifications(prev => [...prev, ...newNotifications]);
      setHasMore(newNotifications.length === pageSize);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiUrl}/notification/${notificationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
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
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
      
      if (unreadIds.length === 0) return;
      
      await axios.patch(
        `${apiUrl}/notification/mark-all-read`,
        { notificationIds: unreadIds },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setNotifications(prev => 
        prev.map(n => n.isRead ? n : { ...n, isRead: true })
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleAcceptFriendRequest = async (requestId, senderId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/friends/request/accept`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId, senderId })
      });
      const data = await response.json();
      console.log(data);
      setNotifications(prev => prev.filter(n => n._id !== requestId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const markAsRead = async (notification) => {
    if (notification.isRead) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${apiUrl}/notification/${notification._id}/read`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setNotifications(prev => 
        prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (notification) => {
    // For friend requests, show UserPlus icon, otherwise show Bell
    return notification.status === 'pending' ? 
      <UserPlus size={16} /> : 
      <Bell size={16} />;
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

            <div className="notifications-list" ref={listRef}>
              {isLoading && notifications.length === 0 ? (
                <div className="loading">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="no-notifications">No new notifications</div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification)}
                      {notification.senderProfilePicture && (
                        <img 
                          src={notification.senderProfilePicture} 
                          alt="Sender"
                          className="notification-sender-avatar"
                        />
                      )}
                    </div>
                    <div className="notification-content">
                      <p className="notification-message">{notification.notification}</p>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {new Date(notification.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <span className="notification-date">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="notification-actions">
                      {notification.status === 'pending' && (
                        <button
                          className="accept-request-btn"
                          onClick={(e) => handleAcceptFriendRequest(notification._id, notification.senderId, e)}
                          title="Accept friend request"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      {!notification.isRead && notification.status !== 'pending' && (
                        <button 
                          className="mark-read-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification);
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
                          clearNotification(notification._id);
                        }}
                        title="Dismiss"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
              {isLoading && notifications.length > 0 && (
                <div className="loading-more">Loading more...</div>
              )}
              {!hasMore && notifications.length > 0 && (
                <div className="no-more-notifications">No more notifications</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;