import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "/logo_main.png";
import "./Navbar.css";
import "./NavDropdown.css";
 
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [check, setCheck] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status
  const location = useLocation();
  const apiUrl = import.meta.env.VITE_BACKEND_URL
  console.log(apiUrl)
  

  // Only show navbar on the landing page
  if (location.pathname !== '/') {
    return null;
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
          <Link to="/Home" className="nav-link" onClick={()=>setIsOpen(false)}>Home</Link>
          <Link to='/Developers' className="nav-link" onClick={()=>setIsOpen(false)}>Developers</Link>
        </div>
 
        <div className="navbar-icons">
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
        <Link to="/Home" className="mobile-link" onClick={()=>setIsOpen(false)}>Home</Link>
        <Link to='/Developers' className="mobile-link" onClick={()=>setIsOpen(false)}>Developers</Link>
        
        
      </div>
    </nav>
  );
};

export default Navbar;
