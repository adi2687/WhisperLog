import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { ProfileProvider } from './contexts/ProfileContext';
import Navbar from "./components/Navbar/Navbar";
import Homepage from './components/Homepage/Homepage';
import Main from "./components/message/main";
import Showcasing from './components/SHOWCASING/Showcasing';
import Intro from './components/Intro/Intro';
import Auth from './components/Auth/Auth';
import Footer from './components/Footer/Footer';
import Notfound from './components/Notfound/notfound';
import ProfilePage from './components/profile/ProfilePage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <div className="app">
        <Navbar isLoggedIn={isLoggedIn} />
        <main>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/chat" element={<Main />} />
            <Route path="/showcasing" element={<Showcasing />} />
            <Route path="/intro" element={<Intro />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="*" element={<Notfound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
