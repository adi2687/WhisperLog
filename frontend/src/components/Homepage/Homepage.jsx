import { Link } from 'react-router-dom';
import { Lock, Zap, Palette, MessageSquare, Shield, Bell, Users, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Features from '../features/features';
import HomeLast from '../Homelast/Homelast';
import Showcasing from '../SHOWCASING/Showcasing';
import './Homepage.css';

const Homepage = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hey! How's it going?", 
      isTyping: false, 
      isEncrypted: false, 
      isVisible: false, 
      isSent: true, // All messages are sent from one side (received)
      isFromUser: false // False for received, true for sent (if we add user messages later)
    },
    { 
      id: 2, 
      text: "Great! Just finished setting up our secure chat.", 
      isTyping: false, 
      isEncrypted: false, 
      isVisible: false, 
      isSent: false,
      isFromUser: true // This is a sent message (from user)
    },
    { 
      id: 3, 
      text: "That's awesome! Love the privacy features.", 
      isTyping: false, 
      isEncrypted: false, 
      isVisible: false, 
      isSent: true,
      isFromUser: false // Received message
    }
  ]);

  useEffect(() => {
    let timeouts = [];
    
    const startSequence = () => {
      // Clear any existing timeouts
      timeouts.forEach(clearTimeout);
      timeouts = [];
      
      // Start first message
      timeouts.push(setTimeout(() => {
        setMessages(prev => [
          { 
            ...prev[0], 
            isTyping: true, 
            isVisible: true, 
            isEncrypted: false 
          },
          prev[1],
          prev[2]
        ]);
        
        // After typing, mark as sent and start encryption
        timeouts.push(setTimeout(() => {
          setMessages(prev => [
            { 
              ...prev[0], 
              isTyping: false, 
              isEncrypted: false 
            },
            prev[1],
            prev[2]
          ]);
          
          // Show encryption after a delay
          timeouts.push(setTimeout(() => {
            setMessages(prev => [
              { ...prev[0], isEncrypted: true },
              prev[1],
              prev[2]
            ]);
            
            // Start second message
            timeouts.push(setTimeout(() => {
              setMessages(prev => [
                prev[0],
                { ...prev[1], isTyping: true, isVisible: true },
                prev[2]
              ]);
              
              // After typing, mark as sent and start encryption
              timeouts.push(setTimeout(() => {
                setMessages(prev => [
                  prev[0],
                  { ...prev[1], isTyping: false, isSent: true },
                  prev[2]
                ]);
                
                // Show encryption after a delay
                timeouts.push(setTimeout(() => {
                  setMessages(prev => [
                    prev[0],
                    { ...prev[1], isEncrypted: true },
                    prev[2]
                  ]);
                  
                  // Start third message
                  timeouts.push(setTimeout(() => {
                    setMessages(prev => [
                      prev[0],
                      prev[1],
                      { ...prev[2], isTyping: true, isVisible: true }
                    ]);
                    
                    // After typing, mark as sent and start encryption
                    timeouts.push(setTimeout(() => {
                      setMessages(prev => [
                        prev[0],
                        prev[1],
                        { ...prev[2], isTyping: false, isSent: true }
                      ]);
                      
                      // Show encryption after a delay
                      timeouts.push(setTimeout(() => {
                        setMessages(prev => [
                          prev[0],
                          prev[1],
                          { ...prev[2], isEncrypted: true }
                        ]);
                        
                        // Reset and restart sequence
                        timeouts.push(setTimeout(() => {
                          setMessages(prev => prev.map(msg => ({
                            ...msg,
                            isTyping: false,
                            isEncrypted: false,
                            isVisible: false,
                            isSent: false
                          })));
                          
                          timeouts.push(setTimeout(() => {
                            startSequence();
                          }, 1000));
                        }, 2000));
                      }, 1000));
                    }, 2000));
                  }, 1000));
                }, 1000));
              }, 2000));
            }, 1000));
          }, 1000));
        }, 2000));
      }, 1000));
    };
    
    startSequence();
    
    return () => {
      // Cleanup timeouts on unmount
      timeouts.forEach(clearTimeout);
    };
  }, []);
  
  const generateRandomCypher = (length) => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  const renderMessage = (message) => {
    if (!message.isVisible) return null;
    
    // Use isFromUser to determine message alignment, not isSent
    const messageClass = `message ${message.isFromUser ? 'sent' : 'received'} ${message.isEncrypted ? 'encrypted' : ''}`;
    
    return (
      <div key={message.id} className={messageClass}>
        <div className="message-encryption">
          <Lock size={12} className="encryption-icon" />
          <span>End-to-end encrypted</span>
          <span className={`encryption-status ${message.isEncrypted ? 'encrypted' : ''}`}>
            {message.isEncrypted ? 'Secured' : 'Sending...'}
          </span>
        </div>
        <div className="message-content">
          <div className={`message-cypher ${message.isEncrypted ? 'encrypted' : ''}`}>
            {message.isTyping ? (
              <TypingEffect 
                text={message.text} 
                speed={30} 
                visible={true}
              />
            ) : message.isEncrypted ? (
              <div className="cypher-overlay">
                {generateRandomCypher(message.text.length * 1.5)}
              </div>
            ) : (
              message.text
            )}
          </div>
        </div>
        <div className="message-time">
          {message.id === 1 ? '10:30 AM' : message.id === 2 ? '10:31 AM' : '10:32 AM'}
        </div>
      </div>
    );
  };
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to <span className="gradient-text">WhisperLog</span></h1>
          <p className="hero-subtitle">Secure, private messaging with end-to-end encryption for your most confidential conversations.</p>
          <div className="cta-buttons">
            <Link to="/auth" className="btn btn-primary">
              Get WhisperLog
            </Link>
            <Link to="/download" className="btn btn-secondary">
              Download App
            </Link>
          </div>
          
        </div>
        <div className="hero-image">
          <div className="chat-preview">
            <div className="chat-header">
              <div className="chat-avatar">
                <img src="/female.jpeg" alt="" />
              </div>
              <div className="chat-info">
                <div className="chat-name-main">Maya Johnson</div>
                <div className="chat-status">End-to-end encrypted</div>
              </div>
              <div className="chat-actions">
                <button className="icon-button">
                  <MessageSquare size={18} />
                </button>
                <button className="icon-button">
                  <Bell size={18} />
                </button>
              </div>
            </div>
            <div className="chat-messages">
              {messages.map(message => renderMessage(message))}
            </div>
            {/* <div className="chat-input">
              <input type="text" placeholder="Type a message..." />
              <button className="send-button" onClick={()=>navigate('/auth')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div> */}
          </div>
        </div>
      </section>

      <Showcasing />

      <Features />


      <HomeLast />  

    </div>
  );
};

// Typing effect component
const TypingEffect = ({ text, speed = 30, visible = true, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!visible) {
      setDisplayedText('');
      setCurrentIndex(0);
      setIsTyping(false);
      return;
    }

    if (currentIndex < text.length) {
      setIsTyping(true);
      const timeout = setTimeout(() => {
        const newText = text.substring(0, currentIndex + 1);
        setDisplayedText(newText);
        setCurrentIndex(prev => prev + 1);
        
        if (currentIndex === text.length - 1 && onComplete) {
          onComplete();
        }
      }, speed);
      
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [text, currentIndex, speed, visible]);

  return (
    <span className="typing-text">
      {displayedText}
      {isTyping && <span className="typing-cursor">|</span>}
    </span>
  );
};

export default Homepage;
