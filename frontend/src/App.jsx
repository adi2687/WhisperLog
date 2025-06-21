import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, ProfileProvider, useAuth } from './contexts/ProfileContext';
import Navbar from "./components/Navbar/Navbar";
import Homepage from './components/Homepage/Homepage';
import Main from "./components/message/main";
import Showcasing from './components/SHOWCASING/Showcasing';
import Intro from './components/Intro/Intro';
import Auth from './components/Auth/Auth';
import Footer from './components/Footer/Footer';
import Notfound from './components/Notfound/notfound';
import ProfilePage from './components/profile/ProfilePage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// Public Route Component (for auth pages)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Component
const AppContent = () => {
  const { user, logout } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={logout} isLoggedIn={isLoggedIn} />
        <main>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Homepage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <Main />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/showcasing" 
              element={
                <ProtectedRoute>
                  <Showcasing />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/intro" 
              element={
                <ProtectedRoute>
                  <Intro />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/auth" 
              element={
                <PublicRoute>
                  <Auth />
                </PublicRoute>
              } 
            />
            <Route 
              path="/profile/:username" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Notfound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

// App Wrapper with Providers
function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <AppContent />
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
