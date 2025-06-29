import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinRoom = () => {
  const [room, setRoom] = useState('');
  const navigate = useNavigate();

  const joinRoom = () => {
    const trimmedRoom = room.trim();
    if (trimmedRoom) {
      navigate(`/video?room=${encodeURIComponent(trimmedRoom)}`);
    } else {
      alert('Please enter a room name.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Join a Video Call Room</h2>
      <input
        type="text"
        placeholder="Enter room name..."
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        style={styles.input}
      />
      <button onClick={joinRoom} style={styles.button}>Join</button>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '100px',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    margin: '5px',
  },
  button: {
    padding: '10px',
    fontSize: '16px',
    margin: '5px',
    cursor: 'pointer',
  },
};

export default JoinRoom;
