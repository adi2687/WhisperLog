// ProfileProvider.js
import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Create context
export const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};


// Profile Provider
export const ProfileProvider = ({ children, username }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/users/${username}`, {
        withCredentials: true,
      });
      setProfile(response.data.user);
      setError(null);
    } catch (err) {
      setError('Failed to fetch profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  

  const value = {
    profile,
    loading,
    error,
    refetchProfile: fetchProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

// Combined Provider for App
export const AppProvider = ({ children }) => {
  return (
      <ProfileProvider>
        {children}
      </ProfileProvider>
    
  );
};

export default ProfileContext;
