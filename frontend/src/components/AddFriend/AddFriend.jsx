import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, UserPlus, X, Check, User } from "lucide-react";
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
  const [friendName, setFriendName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const searchInputRef = useRef(null);
  
  // Debounce the search term
  const debouncedSearchTerm = useDebounce(friendName, 500);
  
  const handleAddFriend = async (userId, username) => {
    try {
      setIsLoading(true);
      console.log('Sending friend request with:', { userId, username });
      const token = localStorage.getItem('token');
      console.log('Using token:', token ? 'Token exists' : 'No token found');
      
      const response = await axios.post(
        `${apiUrl}/friends/request`, 
        { 
          userId, 
          username 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      console.log('Friend request successful:', response.data);
      
      // Update UI to show request sent
      setSearchResults(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, requestSent: true } 
            : user
        )
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError('Failed to send friend request');
      setTimeout(() => setError(''), 3000);
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
      setError('');
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
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [apiUrl]);

  // Handle form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!friendName.trim()) return;
    setHasSearched(true);
    searchUsers(friendName);
  };

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearchTerm && hasSearched) {
      searchUsers(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, searchUsers, hasSearched]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className="add-friend-container">
      <div className="add-friend-header">
        <h1>Connect with Friends</h1>
        <p className="subtitle">Search and connect with people you know</p>
      </div>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-container">
          <div className="search-input-container">
            <Search className="search-icon" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              value={friendName}
              onChange={(e) => {
                setFriendName(e.target.value);
                setHasSearched(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
              placeholder="Search by username..."
              className="search-input"
              disabled={isSearching}
            />
            {friendName && (
              <button 
                type="button" 
                className="clear-search"
                onClick={() => {
                  setFriendName('');
                  setSearchResults([]);
                  setHasSearched(false);
                  searchInputRef.current.focus();
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching || !friendName.trim()}
            className="search-button"
          >
            {isSearching ? (
              <div className="search-button-text">
                <p>Searching...</p>
              </div>
            ) : (
              <>
                <Search size={18} />
                <span className="search-button-text">Search</span>
              </>
            )}
          </button>
        </div>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="error-message"
          >
            {error}
          </motion.div>
        )}
      </form>

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div 
            className="search-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3 className="search-results-title">
              <span>Search Results</span>
              <span className="results-count">{searchResults.length} found</span>
            </h3>
            <ul className="user-list">
              {searchResults.map((user) => (
                <motion.li 
                  key={user._id} 
                  className="user-card"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={user.username}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="user-avatar-fallback">
                        <User size={20} />
                      </div>
                    </div>
                    <div className="user-details">
                      <h4 className="user-name">{user.username}</h4>
                      <p className="user-status">Active recently</p>
                    </div>
                  </div>
                  <div className="user-actions">
                    <Link 
                      to={`/profile/${user._id}`} 
                      className="profile-link"
                      title="View Profile"
                    >
                      <span>View Profile</span>
                    </Link>
                    <button
                      onClick={() => handleAddFriend(user._id, user.username)}
                      disabled={user.requestSent || isLoading}
                      className={`action-button ${user.requestSent ? 'sent' : 'add'}`}
                      title={user.requestSent ? 'Request Sent' : 'Add Friend'}
                    >
                      {user.requestSent ? (
                        <>
                          <Check size={16} />
                          <span>Sent</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          <span>Add Friend</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
        
        {searchResults.length === 0 && hasSearched && !isSearching && friendName && !error && (
          <motion.div 
            className="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="no-results-content">
              <User size={48} className="no-results-icon" />
              <p>No users found for "{friendName}"</p>
              <small>Try a different username or check your spelling</small>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddFriend;