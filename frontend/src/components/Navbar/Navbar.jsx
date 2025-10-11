import PillNav from "./new";
import Logo from '/logo_main.png';
import './Navbar.css';
import { useEffect, useState } from 'react';
import NotificationBell from '../Notifications/NotificationBell';
import ThemeToggle from '../message/ThemeToggle';
import { useLocation } from 'react-router-dom';
const Navbar = () => {
  const location = useLocation();
  const checking = localStorage.getItem("token")
  const [login, setlogin] = useState(false)
  
  useEffect(() => {
    console.log(checking,login)
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
          { href: "/chat", label: "Chat" },
          {href:"Groups",label:"Group"},
          { href: "/addfriend", label: "Add Friend" },
          { href: "/anonymouschat", label: "Anonymous Chat" },
          { href:  login ? "/Profile": "/auth" , label: `${login ? "Profile" : "Login/SIgnUp"}` }
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
