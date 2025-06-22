// ProfileProvider.js
import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const CurrentUserProfileContext = createContext();


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


export const CurrentUserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${backendUrl}/api/profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      
      setProfile(response.data.user);
      setError(null);
    } catch (err) {
      console.error('Error fetching current user profile:', err);
      // Clear invalid token if present
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
      }
      setError('Please log in to view your profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <CurrentUserProfileContext.Provider value={{ profile, loading, error, fetchProfile }}>
      {children}
    </CurrentUserProfileContext.Provider>
  );
};
export const useProfileCurrentUser = () => {
  const context = useContext(CurrentUserProfileContext);
  if (!context) {
    throw new Error('useProfileCurrentUser must be used within a CurrentUserProfileProvider');
  }
  return context;
};


export default ProfileContext;
