import React from 'react';
import './GroupTypingIndicator.css';

export default function GroupTypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0].username}, ${typingUsers[1].username} and ${typingUsers[2].username} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  return (
    <div className="group-typing-indicator">
      <div className="typing-avatars">
        {typingUsers.slice(0, 3).map((user, index) => (
          <img
            key={user.userId}
            src={user.profilePicture || '/default-avatar.svg'}
            alt={user.username}
            className="typing-avatar"
            style={{ zIndex: 3 - index }}
          />
        ))}
      </div>
      <div className="typing-text">
        <span>{getTypingText()}</span>
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}
