import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ProfileProvider } from './contexts/ProfileContext';
import Navbar from "./components/Navbar/Navbar";
import Homepage from './components/Homepage/Homepage';
import Main from "./components/message/main";
import Showcasing from './components/SHOWCASING/Showcasing';
import Intro from './components/Intro/Intro';
import Auth from './components/Auth/Auth';
import Footer from './components/Footer/Footer';
import Notfound from './components/Notfound/notfound';
import ProfileOthersPage from './components/profile/ProfilePage';
import ProfilePage from './components/profile/UserProfileSection';
import { CurrentUserProfileProvider } from './contexts/ProfileContext';
import AnimatedList from './components/List/list';
// import GlassEffect from './components/GlassEffect/glassEffect';
import Card from './components/profile/profilecard/card';
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <ProfileProvider>
        <div className="app">
          
          <Navbar isLoggedIn={isLoggedIn} />
          <main>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/chat" element={<Main />} />
              <Route path="/showcasing" element={<Showcasing />} />
              <Route path="/intro" element={<Intro />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile/:username" element={<ProfileOthersPage />} />
              <Route path="/profile" element={
                <CurrentUserProfileProvider>
                  <ProfilePage />
                </CurrentUserProfileProvider>
              } />
              <Route path="*" element={<Notfound />} />
              <Route path="/list" element={<AnimatedList />} />
              <Route path="/liquidglass" element={<GlassEffect />} />
              <Route path="/profilecard" element={<Card />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ProfileProvider>
    </Router>
  );
}

export default App;
