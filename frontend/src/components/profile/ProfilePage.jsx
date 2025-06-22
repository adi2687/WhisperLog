// ProfilePage.js
import { useParams, useNavigate } from 'react-router-dom';
import { ProfileProvider } from '../../contexts/ProfileContext';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './profile.css';
import { useProfile } from '../../contexts/ProfileContext';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ProfileContent = () => {
  const { profile, loading, error: profileError } = useProfile();
  const navigate = useNavigate();
  const [isFriend, setIsFriend] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [friendError, setFriendError] = useState('');

  // Fetch friends list
  useEffect(() => {
    if (profile?.friends) {
      // In a real app, you would fetch the actual friends list from your API
      setFriends(profile.friends);
    }
  }, [profile]);



  const handleMessage = () => {
    // Navigate to chat with this user
    navigate(`/chat?user=${profile.username}`);
  };

  const handleAddFriend = async () => {
    if (!profile?._id) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }
      
      const response = await axios.post(
        `${backendUrl}/api/friends/request`,
        { userId: profile._id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setIsRequestSent(true);
      }
    } catch (err) {
      setFriendError(err.response?.data?.message || 'Failed to send friend request');
      console.error('Error sending friend request:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (profileError) return <div className="error-message">{profileError}</div>;
  if (!profile) return <div className="not-found">Profile not found</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-picture-container">
            <div className="profile-picture">
              {profile.profilePicture ? (
                <img 
                  src={profile.profilePicture} 
                  alt={profile.username}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="default-avatar">
                {profile.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
          <h1 className="username">{profile.username}</h1>
          
          {!isFriend && (
            <div className="profile-actions">
              <button 
                className={`action-button ${isRequestSent ? 'requested' : ''}`}
                onClick={handleAddFriend}
                disabled={isLoading || isRequestSent}
              >
                {isLoading ? 'Sending...' : isRequestSent ? 'Request Sent' : 'Add Friend'}
              </button>
              {friendError && <div className="error-message">{friendError}</div>}
            </div>
          )}
          
          
        </div>

        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        <div className="profile-stats">
          <div className="stat">
            <span className="stat-value">{friends.length}</span>
            <span className="stat-label">Friends</span>
          </div>
          <div className="stat">
            <span className="stat-value">{profile.posts?.length || 0}</span>
            <span className="stat-label">Posts</span>
          </div>
        </div>

        <div className="friends-section">
          <div className="section-header">
            <h2>Friends</h2>
            {friends.length > 0 && (
              <button className="see-all" onClick={() => navigate(`/friends/${profile.username}`)}>
                See All
              </button>
            )}
          </div>
          
          {friends.length > 0 ? (
            <div className="friends-grid">
              {friends.slice(0, 6).map((friend) => (
                <div 
                  key={friend.id} 
                  className="friend-card"
                  onClick={() => navigate(`/profile/${friend.username}`)}
                >
                  <img src={friend.avatar} alt={friend.name} className="friend-avatar" />
                  <span className="friend-name">{friend.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-friends">No friends yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { username } = useParams();
  return (
    <ProfileProvider username={username}>
      <ProfileContent />
    </ProfileProvider>
  );
};

export default ProfilePage;
