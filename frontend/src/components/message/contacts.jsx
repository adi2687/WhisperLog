import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSearch, FaUserFriends, FaUser, FaCircle } from 'react-icons/fa';
import { io } from 'socket.io-client';
import './contacts.css';

export default function Contacts() {
    const { profile, loading, error: profileError } = useProfileCurrentUser();
    const { id: activeChatId } = useParams();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [onlineUsers, setOnlineUsers] = useState({});
    const socketRef = useRef(null);

    const getFriends = () => {
        fetch(`${backendUrl}/api/profile/friends`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.friends) {
                // console.log('freidn s aya',data.friends)
                setFriends(data.friends);
            }
        })
        .catch(error => console.error('Error fetching friends:', error));
    };

    useEffect(() => {
        getFriends();
        
        // Initialize socket connection
        const token = localStorage.getItem('token');
        if (token && !socketRef.current) {
            socketRef.current = io(backendUrl, {
                auth: { token },
                transports: ['websocket']
            });

            // Register user with socket server
            if (profile?._id) {
                socketRef.current.emit('register', profile._id);
            }

            // Listen for user status updates
            socketRef.current.on('user_status', (data) => {
                setOnlineUsers(prev => ({
                    ...prev,
                    [data.userId]: {
                        isOnline: data.isOnline,
                        lastSeen: data.lastSeen
                    }
                }));
            });
        }

        return () => {
            // Clean up socket connection on unmount
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [profile?._id]);

    // Function to format last seen time
    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return '';
        const date = new Date(lastSeen);
        return `Last seen ${date.toLocaleString()}`;
    };

    const filteredFriends = friends.filter(friend => 
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const findchatid=(receiverId,receiver)=>{
        fetch(`${backendUrl}/message/findid`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            },
            body:JSON.stringify({senderId:profile._id,receiverId:receiverId})
        }   )
        .then(res=>res.json())
        .then(data=>{
            // console.log(data,receiver)
            if (data.chatId){
                navigate(`/chat/${data.chatId}`, { state: { receiver: receiverId,receiverUsername:receiver } });
            }
        })
        .catch(error=>console.error('Error fetching chat id:',error))
    }
    if (loading) return (
        <div className="contacts-container">
            <div className="no-contacts">
                <div className="loader"></div>
                <p>Loading contacts...</p>
            </div>
        </div>
    );

    if (profileError) return (
        <div className="contacts-container">
            <div className="no-contacts">
                <p>Error loading contacts</p>
                <button onClick={getFriends} className="retry-button">
                    Retry
                </button>
            </div>
        </div>
    );

    
    return (
        <div className="contacts-container">
            <div className="contacts-header">
                <h2 className="contacts-title">
                    <FaUserFriends />
                    Contacts
                </h2>
            </div>
            <div className='action-buttons'>
            <button className="add-contact-button" onClick={() => navigate('/addfriend')}>
                <FaUserFriends />
                Add Contact
            </button>
            <button className="add-contact-button" onClick={() => navigate('/profile')}>
                <FaUser />
                Profile
            </button>
            </div>
            
            <div className="search-bar">
                <div className="search-input">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="contacts-list">
                {filteredFriends.length > 0 ? (
                    filteredFriends.map((friend) => (
                        <div 
                            key={friend._id} 
                            className={`contact-item ${activeChatId === friend._id ? 'active' : ''}`}
                            onClick={()=>findchatid(friend._id,friend)}
                        >
                            <img
                                src={friend.profilePicture || '/default-avatar.svg'}
                                alt={friend.username}
                                className="user-pic"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/default-avatar.svg';
                                }}
                            />
                            <div className="contact-info">
                                <div className="contact-header">
                                    <h4>{friend.username}</h4>
                                    {onlineUsers[friend._id]?.isOnline ? (
                                        <span className="online-status online">
                                            <FaCircle className="status-icon" /> Online
                                        </span>
                                    ) : (
                                        <span className="online-status offline" title={formatLastSeen(onlineUsers[friend._id]?.lastSeen)}>
                                            <FaCircle className="status-icon" /> Offline
                                        </span>
                                    )}
                                </div>
                                <p className="last-message">
                                    {friend.lastMessage ? 
                                        `${friend.lastMessage.text} • ${new Date(friend.lastMessage.timestamp).toLocaleTimeString()}` 
                                        : 'Start a new conversation'}
                                </p>
                                {!onlineUsers[friend._id]?.isOnline && onlineUsers[friend._id]?.lastSeen && (
                                    <span className="last-seen">
                                        {`Last seen ${new Date(onlineUsers[friend._id].lastSeen).toLocaleString()}`}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-contacts">
                        <FaUserFriends size={40} />
                        <p>No contacts found</p>
                        {searchQuery && <p>Try a different search term</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

