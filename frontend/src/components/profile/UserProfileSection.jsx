import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import axios from 'axios';
import './profile.css';
import { format } from 'date-fns';
import AnimatedList from '../List/AnimatedList';

const UserProfileSection = () => {
  const { profile, loading, error, fetchProfile } = useProfileCurrentUser();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [birthday, setBirthday] = useState('');
  const [isEditingHobbies, setIsEditingHobbies] = useState(false);
  const [isEditingMovies, setIsEditingMovies] = useState(false);
  const [isEditingMusic, setIsEditingMusic] = useState(false);
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalHobbies, setOriginalHobbies] = useState([]);
  const [originalMovies, setOriginalMovies] = useState([]);
  const [originalMusic, setOriginalMusic] = useState([]);
  const fileInputRef = useRef(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  const availableHobbies = [
    'sports', 'reading', 'gaming', 'travel', 'photography', 
    'cooking', 'anime', 'comics', 'dancing', 'fitness', 
    'foodie', 'hiking', 'painting', 'podcasts', 'technology', 'yoga'
  ];
  
  const availableMovies = [
    'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi',
    'Thriller', 'Romance', 'Documentary', 'Animation',
    'Fantasy', 'Adventure', 'Crime', 'Mystery', 'Western'
  ];
  
  const availableMusic = [
    'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic',
    'Jazz', 'Classical', 'Country', 'Metal',
    'Indie', 'Folk', 'Reggae', 'Blues', 'K-Pop'
  ];
  
  const toggleHobby = (hobby) => {
    setSelectedHobbies(prev => 
      prev.includes(hobby)
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    );
  };
  
  const toggleMovie = (movie) => {
    setSelectedMovies(prev => 
      prev.includes(movie)
        ? prev.filter(m => m !== movie)
        : [...prev, movie]
    );
  };
  
  const toggleMusic = (music) => {
    setSelectedMusic(prev => 
      prev.includes(music)
        ? prev.filter(m => m !== music)
        : [...prev, music]
    );
  };
  
  // Common save function for all sections
  const handleSaveAll = async () => {
    try {
      const updates = {};
      
      // Only include changed sections in the update
      if (JSON.stringify(selectedHobbies) !== JSON.stringify(originalHobbies)) {
        updates.hobbies = selectedHobbies;
      }
      if (JSON.stringify(selectedMovies) !== JSON.stringify(originalMovies)) {
        updates.moviePreferences = selectedMovies;
      }
      if (JSON.stringify(selectedMusic) !== JSON.stringify(originalMusic)) {
        updates.musicPreferences = selectedMusic;
      }
      
      if (Object.keys(updates).length > 0) {
        await axios.put(
          `${backendUrl}/api/profile/update`,
          updates,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            withCredentials: true
          }
        );
        
        // Update original values to match current selections
        setOriginalHobbies([...selectedHobbies]);
        setOriginalMovies([...selectedMovies]);
        setOriginalMusic([...selectedMusic]);
        
        // Exit edit modes
        setIsEditingHobbies(false);
        setIsEditingMovies(false);
        setIsEditingMusic(false);
        
        // Refresh profile data
        await fetchProfile();
        
        setUploadError('');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setUploadError('Failed to update profile. Please try again.');
    }
  };
  
  // Reset all edits
  const handleCancelAll = () => {
    setSelectedHobbies([...originalHobbies]);
    setSelectedMovies([...originalMovies]);
    setSelectedMusic([...originalMusic]);
    setIsEditingHobbies(false);
    setIsEditingMovies(false);
    setIsEditingMusic(false);
    setUploadError('');
  };
  
  const handleSaveHobbies = async () => {
    try {
      await axios.put(
        `${backendUrl}/api/profile/update`,
        { hobbies: selectedHobbies },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          withCredentials: true
        }
      );
      await fetchProfile();
      setIsEditingHobbies(false);
    } catch (err) {
      console.error('Error updating hobbies:', err);
      setUploadError('Failed to update hobbies');
    }
  };

  const handleSaveMovies = async () => {
    try {
      await axios.put(
        `${backendUrl}/api/profile/update`,
        { moviePreferences: selectedMovies },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          withCredentials: true
        }
      );
      await fetchProfile();
      setIsEditingMovies(false);
    } catch (err) {
      console.error('Error updating movie preferences:', err);
      setUploadError('Failed to update movie preferences. Please try again.');
    }
  };
  
  const handleSaveMusic = async () => {
    try {
      await axios.put(
        `${backendUrl}/api/profile/update`,
        { musicPreferences: selectedMusic },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          withCredentials: true
        }
      );
      await fetchProfile();
      setIsEditingMusic(false);
    } catch (err) {
      console.error('Error updating music preferences:', err);
      setUploadError('Failed to update music preferences. Please try again.');
    }
  };

  // Check for changes in any section
  const checkForChanges = useCallback(() => {
    const hobbiesChanged = JSON.stringify(selectedHobbies) !== JSON.stringify(originalHobbies);
    const moviesChanged = JSON.stringify(selectedMovies) !== JSON.stringify(originalMovies);
    const musicChanged = JSON.stringify(selectedMusic) !== JSON.stringify(originalMusic);
    
    setHasUnsavedChanges(hobbiesChanged || moviesChanged || musicChanged);
  }, [selectedHobbies, selectedMovies, selectedMusic, originalHobbies, originalMovies, originalMusic]);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setBioText(profile.bio || '');
      // Format the date for the input field (YYYY-MM-DD)
      if (profile.birthday) {
        const date = new Date(profile.birthday);
        const formattedDate = date.toISOString().split('T')[0];
        setBirthday(formattedDate);
      } else {
        setBirthday('');
      }
      const hobbies = profile.hobbies || [];
      const movies = profile.moviePreferences || [];
      const music = profile.musicPreferences || [];
      
      setSelectedHobbies(hobbies);
      setSelectedMovies(movies);
      setSelectedMusic(music);
      
      // Save original values
      setOriginalHobbies([...hobbies]);
      setOriginalMovies([...movies]);
      setOriginalMusic([...music]);
    }
  }, [profile]);
  
  // Check for changes when any selection changes
  useEffect(() => {
    checkForChanges();
  }, [checkForChanges]);

  const handleBioSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert the birthday to a proper date string in ISO format
      const birthdayToSend = birthday ? new Date(birthday).toISOString() : null;
      
      await axios.put(
        `${backendUrl}/api/profile/update`,
        { 
          bio: bioText, 
          birthday: birthdayToSend 
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          withCredentials: true
        }
      );
      await fetchProfile();
      setIsEditingBio(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setUploadError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      setUploading(true);
      setUploadError('');
      
      const response = await axios.put(
        `${backendUrl}/api/profile/picture`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          withCredentials: true
        }
      );

      // Refresh the profile data
      await fetchProfile();
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setUploadError('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!profile) return <div className="not-found">Profile not found</div>;
  return (
    <div className="profile-section">
      {/* Common Save Button - Sticky at Bottom */}
      {hasUnsavedChanges && (
        <div className="common-save-container">
          <div className="common-save-actions">
            <button 
              onClick={handleSaveAll}
              className="save-all-btn"
            >
              <i className="fas fa-save"></i> Save All Changes
            </button>
            <button 
              onClick={handleCancelAll}
              className="cancel-all-btn"
            >
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="profile-header">
        <div className="profile-picture-container">
          <div className="profile-picture" onClick={handleProfilePictureClick} style={{ cursor: 'pointer' }}>
            {uploading ? (
              <div className="uploading-overlay">
                <div className="spinner small" />
              </div>
            ) : null}
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
            <div className="change-photo-text">
              <i className="fas fa-camera"></i> Change Photo
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
        </div>
        
        <h1 className="username">@{profile.username}</h1>
        <span className="stat-value">{profile.friends?.length || 0} Friends</span>
        
        {/* Bio Section */}
        <div className="bio-section">
          {isEditingBio ? (
            <form onSubmit={handleBioSubmit} className="bio-edit-form">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Tell us about yourself..."
                maxLength="200"
                className="bio-textarea"
              />
              <div className="form-group">
                <label>Birthday:</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="birthday-input"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" onClick={() => setIsEditingBio(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="bio-display">
              {profile.bio ? (
                <p className="profile-bio">{profile.bio}</p>
              ) : (
                <p className="no-bio">No bio yet. Click edit to add one!</p>
              )}
              <button 
                onClick={() => setIsEditingBio(true)}
                className="edit-bio-btn"
              >
                <i className="fas fa-edit"></i> Edit Profile
              </button>
            </div>
          )}
        </div>
        <div className="user-details">
          {profile.birthday && (
            <div className="detail-item">
              <i className="fas fa-birthday-cake"></i>
              <span>{calculateAge(profile.birthday)} years old</span>
              <span className="detail-separator">•</span>
              <span>{new Date(profile.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
            </div>
          )}
          <div className="detail-item">
            <i className="fas fa-calendar-alt"></i>
            <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
          {profile.location && (
            <div className="detail-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>{profile.location}</span>
            </div>
          )}
        </div>
        
        <div className="profile-sections-container">
          {/* Hobbies Section */}
          <div className="hobbies-section">
            <div className="section-header">
            <h3>Interests</h3>
            {!isEditingHobbies ? (
              <button 
                onClick={() => setIsEditingHobbies(true)}
                className="edit-icon-btn"
                aria-label="Edit hobbies"
              >
                <i className="fas fa-edit"></i> Edit
              </button>
            ) : null}
          </div>
          
          {isEditingHobbies ? (
            <div className="hobbies-edit-mode">
              <div className="hobbies-options">
                <AnimatedList
                  items={availableHobbies.map(hobby => ({
                    id: hobby,
                    text: hobby.charAt(0).toUpperCase() + hobby.slice(1)
                  }))}
                  onItemSelect={(item) => toggleHobby(item.id)}
                  showGradients={true}
                  enableArrowNavigation={true}
                  displayScrollbar={true}
                  showCheckboxes={true}
                  selectedItems={selectedHobbies}
                  onCheckboxChange={(item, isChecked) => toggleHobby(item.id)}
                  itemStyle={{
                    padding: '0.6rem 1rem',
                    margin: '0.25rem',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                  selectedItemStyle={{
                    background: 'var(--accent)',
                    color: 'white',
                    borderColor: 'var(--accent)'
                  }}
                  containerStyle={{
                    maxHeight: '300px',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '0.75rem',
                    '&:hover': {
                      background: 'rgba(124, 77, 255, 0.1)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                />
              </div>
              <p className="save-hint">Changes will be saved when you click "Save All Changes" at the bottom of the page</p>
            </div>
          ) : (
            <div className="hobbies-list">
              {profile.hobbies && profile.hobbies.length > 0 ? (
                profile.hobbies.map((hobby, index) => (
                  <span key={index} className="hobby-tag">
                    {hobby.charAt(0).toUpperCase() + hobby.slice(1)}
                  </span>
                ))
              ) : (
                <p className="no-hobbies">No interests added yet</p>
              )}
            </div>
          )}
        </div>
        
        {/* Movies Section */}
        <div className="hobbies-section">
          <div className="section-header">
            <h3>Favorite Movie Genres</h3>
            {!isEditingMovies ? (
              <button 
                onClick={() => setIsEditingMovies(true)}
                className="edit-icon-btn"
                aria-label="Edit movie preferences"
              >
                <i className="fas fa-edit"></i> Edit
              </button>
            ) : null}
          </div>
          
          {isEditingMovies ? (
            <div className="hobbies-edit-mode">
              <div className="hobbies-options">
                <AnimatedList
                  items={availableMovies.map(movie => ({
                    id: movie,
                    text: movie
                  }))}
                  onItemSelect={(item) => toggleMovie(item.id)}
                  showGradients={true}
                  enableArrowNavigation={true}
                  displayScrollbar={true}
                  showCheckboxes={true}
                  selectedItems={selectedMovies}
                  onCheckboxChange={(item, isChecked) => toggleMovie(item.id)}
                  itemStyle={{
                    padding: '0.6rem 1rem',
                    margin: '0.25rem',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                  selectedItemStyle={{
                    background: 'var(--accent)',
                    color: 'white',
                    borderColor: 'var(--accent)'
                  }}
                  containerStyle={{
                    maxHeight: '300px',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '0.75rem',
                    '&:hover': {
                      background: 'rgba(124, 77, 255, 0.1)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                />
              </div>
              
            </div>
          ) : (
            <div className="hobbies-list">
              {profile.moviePreferences && profile.moviePreferences.length > 0 ? (
                profile.moviePreferences.map((movie, index) => (
                  <span key={index} className="hobby-tag">
                    {movie}
                  </span>
                ))
              ) : (
                <p className="no-hobbies">No movie preferences added yet</p>
              )}
            </div>
          )}
        </div>
        
        {/* Music Section */}
        <div className="hobbies-section">
          <div className="section-header">
            <h3>Favorite Music Genres</h3>
            {!isEditingMusic ? (
              <button 
                onClick={() => setIsEditingMusic(true)}
                className="edit-icon-btn"
                aria-label="Edit music preferences"
              >
                <i className="fas fa-edit"></i> Edit
              </button>
            ) : null}
          </div>
          
          {isEditingMusic ? (
            <div className="hobbies-edit-mode">
              <div className="hobbies-options">
                <AnimatedList
                  items={availableMusic.map(music => ({
                    id: music,
                    text: music
                  }))}
                  onItemSelect={(item) => toggleMusic(item.id)}
                  showGradients={true}
                  enableArrowNavigation={true}
                  displayScrollbar={true}
                  showCheckboxes={true}
                  selectedItems={selectedMusic}
                  onCheckboxChange={(item, isChecked) => toggleMusic(item.id)}
                  itemStyle={{
                    padding: '0.6rem 1rem',
                    margin: '0.25rem',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                  selectedItemStyle={{
                    background: 'var(--accent)',
                    color: 'white',
                    borderColor: 'var(--accent)'
                  }}
                  containerStyle={{
                    maxHeight: '300px',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '0.75rem',
                    '&:hover': {
                      background: 'rgba(124, 77, 255, 0.1)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                />
              </div>
              
            </div>
          ) : (
            <div className="hobbies-list">
              {profile.musicPreferences && profile.musicPreferences.length > 0 ? (
                profile.musicPreferences.map((music, index) => (
                  <span key={index} className="hobby-tag">
                    {music}
                  </span>
                ))
              ) : (
                <p className="no-hobbies">No music preferences added yet</p>
              )}
            </div>
          )}
          </div>
          
          {/* Movies Section */}
          

          
          {/* Music Section */}
          </div>
        
        {/* User Details */}
        
        
        
      </div>
      {uploadError && <div className="error-message" style={{ marginTop: '10px' }}>{uploadError}</div>}
    </div>
  );
};

export default UserProfileSection;
