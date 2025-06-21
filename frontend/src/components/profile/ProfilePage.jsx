// ProfilePage.js
import { useParams, useNavigate } from 'react-router-dom';
import { ProfileProvider, useProfile, useAuth } from '../../contexts/ProfileContext';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ProfilePage.css';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ProfileContent = () => {
  const { profile, loading, error } = useProfile();
  const { user: currentUser } = useAuth();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [friends, setFriends] = useState([]);
  const isCurrentUser = currentUser?.username === profile?.username;

  // Fetch friends list
  useEffect(() => {
    if (profile?.friends) {
      // In a real app, you would fetch the actual friends list from your API
      setFriends(profile.friends);
    }
  }, [profile]);

  const handleImageUpload = async (e) => {
    if (!isCurrentUser) return;
    
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      setIsUploading(true);
      const response = await axios.post(
        `${backendUrl}/api/users/upload-profile-picture`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
      
      if (response.data.profilePicture) {
        // Refresh profile data
        window.location.reload();
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddFriend = async () => {
    try {
      // In a real app, you would call your API to send a friend request
      // await axios.post(`${backendUrl}/api/friends/request`, { userId: profile._id });
      setIsFriend(true);
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  const handleMessage = () => {
    // Navigate to chat with this user
    navigate(`/chat?user=${profile.username}`);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!profile) return <div className="not-found">Profile not found</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div 
            className={`profile-picture-container ${isCurrentUser ? 'editable' : ''}`} 
            onClick={() => isCurrentUser && fileInputRef.current?.click()}
          >
            <div className="profile-picture">
              <img 
                src={profile.profilePicture || '/default-avatar.png'} 
                alt={profile.username} 
              />
              {isCurrentUser && (
                <div className="profile-picture-overlay">
                  <span>Change Photo</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
              disabled={isUploading || !isCurrentUser}
            />
          </div>
          <h1 className="username">{profile.username}</h1>
          
          {!isCurrentUser ? (
            <div className="profile-actions">
              <button 
                className={`action-button ${isFriend ? 'friend' : 'add-friend'}`}
                onClick={handleAddFriend}
                disabled={isFriend}
              >
                <i className={`fas ${isFriend ? 'fa-check' : 'fa-user-plus'}`}></i>
                {isFriend ? 'Friends' : 'Add Friend'}
              </button>
              <button 
                className="action-button message"
                onClick={handleMessage}
              >
                <i className="fas fa-envelope"></i> Message
              </button>
            </div>
          ) : (
            <button 
              className="action-button edit-profile"
              onClick={() => navigate('/settings/profile')}
            >
              <i className="fas fa-edit"></i> Edit Profile
            </button>
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
