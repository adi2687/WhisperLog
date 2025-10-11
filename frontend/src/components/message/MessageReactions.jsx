import React, { useState } from 'react';
import './MessageReactions.css';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

export default function MessageReactions({ message, onReact, currentUserId }) {
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowPicker(false);
  };

  const reactions = message.reactions || [];
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.userId);
    return acc;
  }, {});

  const userReacted = reactions.find(r => r.userId === currentUserId);

  return (
    <div className="message-reactions-container">
      {/* Existing Reactions */}
      {Object.keys(groupedReactions).length > 0 && (
        <div className="reactions-display">
          {Object.entries(groupedReactions).map(([emoji, users]) => (
            <button
              key={emoji}
              className={`reaction-badge ${users.includes(currentUserId) ? 'user-reacted' : ''}`}
              onClick={() => handleReact(emoji)}
              title={`${users.length} reaction${users.length > 1 ? 's' : ''}`}
            >
              <span className="reaction-emoji">{emoji}</span>
              <span className="reaction-count">{users.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add Reaction Button */}
      <div className="reaction-picker-wrapper">
        <button
          className="add-reaction-btn"
          onClick={() => setShowPicker(!showPicker)}
          title="Add reaction"
        >
          ➕
        </button>

        {showPicker && (
          <div className="reaction-picker">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                className="reaction-option"
                onClick={() => handleReact(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
