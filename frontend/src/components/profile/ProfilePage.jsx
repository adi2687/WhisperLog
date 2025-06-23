// ProfilePage.js
import { useParams, useNavigate } from 'react-router-dom';
import { ProfileProvider } from '../../contexts/ProfileContext';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './main.css';
import { useProfile } from '../../contexts/ProfileContext';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ProfileContent = () => {
  const { profile, loading, error: profileError } = useProfile();
  const navigate = useNavigate();
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [friendError, setFriendError] = useState('');
  const [activeTab, setActiveTab] = useState('about');
  const [error, setError] = useState('');
  const [isFriend, setIsFriend] = useState(false);
  // Check if this is the current user's profile
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isCurrentUser = currentUser && currentUser._id === profile?._id;
  
  // Check if the current user is already a friend
  useEffect(() => {
    if (currentUser && profile?.friends) {
      const isFriendCheck = profile.friends.some(
        friend => friend._id === currentUser._id || friend === currentUser._id
      );
      setIsFriend(isFriendCheck);
    }
  }, [currentUser, profile]);
// console.log('currentUser',currentUser)
// console.log()
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
        `${backendUrl}/friends/request`,
        { userId: profile._id ,username:profile.username},
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
  
  // Personal details to display
  const personalDetails = [
    { label: 'Full Name', value: profile.username },
    { label: 'Email', value: isCurrentUser ? profile.email : 'Private' },
    { label: 'Location', value: profile.location || 'Not specified' },
    { label: 'Birthday', value: profile.birthday ? profile.birthday.slice(0, 10) : 'Not specified' },
    { label: 'Gender', value: profile.gender || 'Not specified' },
    {label:'Hobbies',value:profile.hobbies.join(', ')||'Not specified'},
    {label:'Interests',value:profile.moviePreferences.join(', ')||'Not specified'},
    {label:'Music',value:profile.musicPreferences.join(', ')||'Not specified'}
    
  ];
  
  // Hobbies and interests
  const hobbies = profile.hobbies || [];
  const interests = profile.interests || [];
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
          
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          
          <div className="profile-actions">
            {isFriend && !isCurrentUser && (
              <button 
                className="action-button"
                onClick={handleMessage}
                style={{ marginRight: '10px' }}
              >
                Message
              </button>
            )}
            
            {!isFriend && !isCurrentUser && (
              <button 
                className={`action-button ${isRequestSent ? 'requested' : ''}`}
                onClick={handleAddFriend}
                disabled={isLoading || isRequestSent}
              >
                {isLoading ? 'Sending...' : isRequestSent ? 'Request Sent' : 'Add Friend'}
              </button>
            )}
            
            {friendError && <div className="error-message">{friendError}</div>}
          </div>
          
          
        </div>



        <div className="profile-stats">
          <div className="stat">
            <span className="stat-value">{friends.length}</span>
            <span className="stat-label">Friends</span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'about' && (
            <div className="about-section">
              <h3>About {profile.username}</h3>
              <div className="personal-details">
                {personalDetails.map((detail, index) => (
                  <div key={index} className="detail-item">
                    <span className="detail-label">{detail.label}:</span>
                    <span className="detail-value">{detail.value}</span>
                  </div>
                ))}
              </div>
              
              <div className="bio-section">
                <h4>Bio</h4>
                <p>{profile.bio || 'No bio available'}</p>
              </div>
            </div>
          )}
          
          {activeTab === 'friends' && (
            <div className="friends-section">
              <div className="section-header">
                <h3>Friends</h3>
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
          )}
          
          {activeTab === 'hobbies' && (
            <div className="hobbies-interests-music-section">
              <div className="section-card">
                <h3>🎯 Hobbies</h3>
                {hobbies.length > 0 ? (
                  <div className="tags-container">
                    {hobbies.map((hobby, index) => (
                      <span key={`hobby-${index}`} className="tag">
                        {hobby}
                        {isCurrentUser && (
                          <button className="remove-tag" onClick={(e) => {
                            e.stopPropagation();
                            // Handle remove hobby
                          }}>×</button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No hobbies added yet</p>
                )}
                {isCurrentUser && (
                  <button className="add-button" onClick={() => {
                    // Handle add new hobby
                    const newHobby = prompt('Add a new hobby:');
                    if (newHobby) {
                      // Update profile with new hobby
                    }
                  }}>
                    + Add Hobby
                  </button>
                )}
              </div>
              
              <div className="section-card">
                <h3>🌟 Interests</h3>
                {interests.length > 0 ? (
                  <div className="tags-container">
                    {interests.map((interest, index) => (
                      <span key={`interest-${index}`} className="tag">
                        {interest}
                        {isCurrentUser && (
                          <button className="remove-tag" onClick={(e) => {
                            e.stopPropagation();
                            // Handle remove interest
                          }}>×</button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No interests added yet</p>
                )}
                {isCurrentUser && (
                  <button className="add-button" onClick={() => {
                    const newInterest = prompt('Add a new interest:');
                    if (newInterest) {
                      // Update profile with new interest
                    }
                  }}>
                    + Add Interest
                  </button>
                )}
              </div>

              <div className="section-card">
                <h3>🎵 Music & Artists</h3>
                
                <div className="music-section">
                  <h4>Favorite Artists</h4>
                  {favArtists.length > 0 ? (
                    <div className="tags-container">
                      {favArtists.map((artist, index) => (
                        <span key={`artist-${index}`} className="tag">
                          {artist}
                          {isCurrentUser && (
                            <button className="remove-tag" onClick={(e) => {
                              e.stopPropagation();
                              // Handle remove artist
                            }}>×</button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">No favorite artists added</p>
                  )}
                  {isCurrentUser && (
                    <button className="add-button" onClick={() => {
                      const newArtist = prompt('Add a favorite artist:');
                      if (newArtist) {
                        // Update profile with new artist
                      }
                    }}>
                      + Add Artist
                    </button>
                  )}
                </div>

                <div className="music-section">
                  <h4>Favorite Genres</h4>
                  {favGenres.length > 0 ? (
                    <div className="tags-container">
                      {favGenres.map((genre, index) => (
                        <span key={`genre-${index}`} className="tag">
                          {genre}
                          {isCurrentUser && (
                            <button className="remove-tag" onClick={(e) => {
                              e.stopPropagation();
                              // Handle remove genre
                            }}>×</button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">No favorite genres added</p>
                  )}
                  {isCurrentUser && (
                    <button className="add-button" onClick={() => {
                      const newGenre = prompt('Add a favorite genre:');
                      if (newGenre) {
                        // Update profile with new genre
                      }
                    }}>
                      + Add Genre
                    </button>
                  )}
                </div>

                <div className="music-section">
                  <h4>Currently Listening</h4>
                  {music.length > 0 ? (
                    <div className="music-list">
                      {music.map((track, index) => (
                        <div key={`track-${index}`} className="music-item">
                          <span className="track-name">{track.name}</span>
                          <span className="track-artist">{track.artist}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">Not currently listening to anything</p>
                  )}
                  {isCurrentUser && (
                    <button className="add-button" onClick={() => {
                      const trackName = prompt('What are you listening to?');
                      const artistName = prompt('Who is the artist?');
                      if (trackName && artistName) {
                        // Update currently listening
                      }
                    }}>
                      + Add Current Track
                    </button>
                  )}
                </div>
              </div>
            </div>
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
