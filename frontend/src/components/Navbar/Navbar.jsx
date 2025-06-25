import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "/logo_main.png";
import "./Navbar.css";
import "./NavDropdown.css";
import NotificationBell from "../Notifications/NotificationBell";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [check, setCheck] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status
  const location = useLocation();
  const apiUrl = import.meta.env.VITE_BACKEND_URL
  // console.log(apiUrl)
  const islogged=localStorage.getItem("token")
  // console.log(islogged) 
  useEffect(()=>{
    if (islogged){
      setIsLoggedIn(true)
    }
  },[islogged])
  if (location.pathname.startsWith("/chat")){
    return null
  }
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <img src={Logo} alt="Outfit AI" className="logo-image" />
          </Link>
        </div>  

        <div className={`navbar-menu ${isOpen ? "active" : ""}`}>
          <Link to="/chat" className="nav-link" onClick={() => setIsOpen(false)}>Chat</Link>

          <Link to="/addFriend" className="nav-link" onClick={() => setIsOpen(false)}>Add Friend</Link>
          <Link to="/anonymouschat" className="nav-link" onClick={() => setIsOpen(false)}>Anonymous Chat</Link>
        </div>
        <div className="navbar-icons">
          <NotificationBell />
          {isLoggedIn ? (
            <Link to="/profile" className="icon">Profile</Link>
          ) : (
            <Link to="/auth" className="icon">Login / SignUp</Link>
          )}
          <button onClick={() => setIsOpen(!isOpen)} className="navbar-toggle">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar-mobile-menu ${isOpen ? "open" : ""}`}>
        <Link to="/chat" className="mobile-link" onClick={() => setIsOpen(false)}>Chat</Link>
        <Link to="/addFriend" className="mobile-link" onClick={() => setIsOpen(false)}>Add Friend</Link>
        <Link to="/anonymouschat" className="mobile-link" onClick={() => setIsOpen(false)}>Anonymous Chat</Link>
        
      </div>
    </nav>
  );
};

export default Navbar;
