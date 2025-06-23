import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, UserPlus, X, Check, User, UserCheck, UserX } from "lucide-react";
import "./AddFriend.css";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../Loader/Loader";

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const AddFriend = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [activeTab, setActiveTab] = useState('suggestions');
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const searchInputRef = useRef(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const handleAddFriend = async (userId, username) => {
    if (sentRequests.has(userId)) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${apiUrl}/friends/request`, 
        { userId, username },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      setSentRequests(prev => new Set([...prev, userId]));
      
      setSearchResults(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, requestSent: true } 
            : user
        )
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await axios.post(
        `${apiUrl}/search/newfriends`, 
        { username: searchTerm },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchUsers(debouncedSearchTerm);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, searchUsers]);

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="add-friend-container">
      <div className="add-friend-header">
        <h1>Add Friend</h1>
        <p className="subtitle">Search for friends to connect with</p>
      </div>

      <div className="search-container">
        <div className="search-input-container">
          <Search className="search-icon" size={20} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username"
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={handleClearSearch}
              className="clear-search-button"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
        </button>
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Users
        </button>
      </div>

      <div className="search-results">
        {isSearching ? (
          <div className="loading-container">
            <Loader size={40} />
          </div>
        ) : searchResults.length > 0 ? (
          <AnimatePresence>
            <motion.ul className="user-list">
              {searchResults.map((user) => (
                <motion.li 
                  key={user._id}
                  className="user-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="user-info">
                    <div className="avatar">
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={user.username} 
                          className="avatar-image"
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div className="user-details">
                      <h3 className="username">{user.username}</h3>
                      <p className="user-email">{user.email || 'No email provided'}</p>
                    </div>
                  </div>
                  
                  <div className="user-actions">
                    <Link 
                      to={`/profile/${user._id}`} 
                      className="view-profile-button"
                    >
                      <span>View Profile</span>
                    </Link>
                    {user.isFriend ? (
                      <div className="friend-status">
                        <UserCheck size={16} className="friend-check" />
                        <span>Friends</span>
                      </div>
                    ) : user.requestSent || sentRequests.has(user._id) ? (
                      <div className="friend-status requested">
                        <UserPlus size={16} className="friend-check" />
                        <span>Requested</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(user._id, user.username)}
                        disabled={isLoading}
                        className="add-friend-button"
                      >
                        <UserPlus size={16} />
                        <span>Add Friend</span>
                      </button>
                    )}
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
        ) : searchTerm ? (
          <div className="no-results">
            <p>No users found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="no-search">
            <Search size={48} className="search-icon-large" />
            <p>Search for friends by username</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFriend;
