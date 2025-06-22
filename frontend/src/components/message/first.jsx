import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Backend address

function App() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [room,setroom]=useState('')

  const [user, setUser] = useState('');
const [recipient, setRecipient] = useState('');

  useEffect(() => {
    socket.on('msg', (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    return () => socket.off('msg');
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && room.trim()) {
      socket.emit('msg', {roomId:room,text:message});
      setMessage('');
      console.log('msg is ',message,room)
    }
  };
  const joinroom=()=>{
    if(room.trim()){
      socket.emit('roomJoin',room)
      console.log('room joined',room)
    }
  }

  const joinPrivateRoom = () => {
  if (user.trim() && recipient.trim()) {
    const roomId = [user, recipient].sort().join('_');
    socket.emit('roomJoin', roomId);
    setroom(roomId); // reuse your existing room logic
  }
};


  return (
    <div style={styles.container}>
      <h2>Whisperlog Chat</h2>
      <div style={styles.chatBox}>
        {chat.map((msg, index) => (
          <div key={index} style={styles.message}>{msg}</div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={styles.form}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type something..."
          style={styles.input}
        />
        
        <button type="submit" style={styles.button}>Send</button>
      </form>
      <input
  type="text"
  placeholder="Enter room code"
  value={room}
  onChange={(e) => setroom(e.target.value)}
  style={styles.input}
/>
<button onClick={joinroom} style={styles.button}>Join Room</button>


<input
  type="text"
  placeholder="Your username"
  value={user}
  onChange={(e) => setUser(e.target.value)}
  style={styles.input}
/>
<input
  type="text"
  placeholder="Recipient's username"
  value={recipient}
  onChange={(e) => setRecipient(e.target.value)}
  style={styles.input}
/>
<button onClick={joinPrivateRoom} style={styles.button}>Start Chat</button>


    </div>
  );
}

const styles = {
  container: { maxWidth: 500, margin: '50px auto', fontFamily: 'sans-serif' ,display:'flex',flexDirection:'column'},
  chatBox: {
    border: '1px solid #ccc', padding: '10px', height: 300,
    overflowY: 'auto', marginBottom: '10px'
  },
  message: { background: 'black', margin: '5px 0', padding: '5px', borderRadius: '5px' },
  form: { display: 'flex', gap: '10px' },
  input: { flex: 1, padding: '10px' },
  button: { padding: '10px 20px', background: '#333', color: '#fff', border: 'none' }
};

export default App;