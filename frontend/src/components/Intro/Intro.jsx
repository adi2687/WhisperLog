import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Intro.css';

const Intro = ({ onComplete }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [nextMessage, setNextMessage] = useState(null);
  const [fadeState, setFadeState] = useState('in'); // 'in', 'out', or 'between'
  const [complete, setComplete] = useState(false);
  const navigate = useNavigate();

  const floatingMessages = [
    { text: "Private. Fast. Real-Time." },
    { text: "Conversations That Disappear" },
    { text: "No Noise. Just Signal." },
    { img:"/logo_main.png" }
  ];


  const handleComplete = useCallback(() => {
    console.log('Completing intro');
    
    // Only use the callback, don't navigate directly
    // This prevents the infinite loop
    if (onComplete) {
      onComplete();
    }
    
    // Mark as complete
    setComplete(true);
    
    // Don't set localStorage here - let the parent component handle it
    // Don't navigate directly - let the parent component handle it
  }, [onComplete]);



  useEffect(() => {
    let fadeTimer, nextMessageTimer, completeTimer;

    if (fadeState === 'in') {
      fadeTimer = setTimeout(() => {
        setFadeState('out');
      }, 2000);
    }

    if (fadeState === 'out') {
      fadeTimer = setTimeout(() => {
        const next = (currentMessage + 1) % floatingMessages.length;

        if (next === 0 && currentMessage === floatingMessages.length - 1) {
          console.log("Intro sequence completed - navigating to profile")
          // Use window.location.href instead of navigate to ensure a full page reload
          window.location.href = "/profile";
          // No need to call navigate as well, as it will cause conflicts
          // navigate("/profile");

          setFadeState('between');
          completeTimer = setTimeout(() => {
            handleComplete();
          }, 400);
        } else {
          setNextMessage(next);
          setFadeState('between');
        }
        console.log("next")
      }, 500);
    }

    if (fadeState === 'between') {
      nextMessageTimer = setTimeout(() => {
        if (nextMessage !== null) {
          setCurrentMessage(nextMessage);
          setNextMessage(null);
          setFadeState('in');
        }
      }, 300);
    }

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(nextMessageTimer);
      clearTimeout(completeTimer);
    };
  }, [currentMessage, fadeState, nextMessage, floatingMessages.length, handleComplete]);

  return (
    <div className="intro-container">
    <div className="floating-message">
      <div className={`floating-message-text ${fadeState}`}>
        {floatingMessages[currentMessage].text}
      </div>

      {floatingMessages[currentMessage].img && (
        <img
          src={floatingMessages[currentMessage].img}
          alt="Whisperlog Logo"
          className="floating-logo"
        />
      )}
    </div>
  </div>
    
  );
};

export default Intro;
