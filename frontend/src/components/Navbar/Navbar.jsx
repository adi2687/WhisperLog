import PillNav from "./new";
import Logo from '/logo_main.png';
import './Navbar.css';
import { useEffect, useState } from 'react';
import NotificationBell from '../Notifications/NotificationBell';
import ThemeToggle from '../message/ThemeToggle';
import { useLocation } from 'react-router-dom';
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const checking = localStorage.getItem("token")
  const [login, setlogin] = useState(false)
  
  useEffect(() => {
    if (checking) {
      setlogin(true)
    }
  }, [])

  // Hide navbar on /chat route
  if (location.pathname.includes("/chat")) {
    return null; // completely skip rendering
  }
  return (
    <div className="navbar">
      <PillNav
        logo={Logo}
        logoAlt="WhisperLog Logo"
        items={[
          { href: "/", label: "Home" },
          { href: "/profile", label: "Profile" },
          { href: "/chat", label: "Chat" },
          { href: "/addfriend", label: "Add Friend" },
          { href: "/anonymouschat", label: "Anonymous Chat" },
          { href:  login ? "/Profile": "/Login/SignUp" , label: `${login ? "Profile" : "Login/SignUp"}` }
        ]}
        activeHref="/"  
        ease="power3.easeOut"
        baseColor="#fff"
        pillColor="#060010"
        hoveredPillTextColor="#060010"
        pillTextColor="#fff"
        // onMobileMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        initialLoadAnimation={true}
        rightContent={
          <>
            <ThemeToggle />
            <NotificationBell />
          </>
        }
      />
    </div>
  );
};

export default Navbar;
