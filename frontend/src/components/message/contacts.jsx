import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSearch, FaUserFriends, FaUser, FaCircle, FaUsers, FaPlus } from 'react-icons/fa';
import { io } from 'socket.io-client';
import axios from 'axios';
import './contacts.css';

export default function Contacts() {
    const { profile, loading, error: profileError } = useProfileCurrentUser();
    const { id: activeChatId } = useParams();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'groups'
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

    const getGroups = async () => {
        try {
            const response = await axios.get(`${backendUrl}/group/my-groups`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.data.success) {
                setGroups(response.data.groups);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    useEffect(() => {
        getFriends();
        getGroups();

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

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleGroupClick = (group) => {
        navigate(`/chat/${group.chatId}`, {
            state: {
                isGroup: true,
                groupDetails: group
            }
        });
    };

    const findchatid = (receiverId, receiver) => {
        fetch(`${backendUrl}/message/findid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ senderId: profile._id, receiverId: receiverId })
        })
            .then(res => res.json())
            .then(data => {
                // console.log(data,receiver)
                if (data.chatId) {
                    navigate(`/chat/${data.chatId}`, { state: { receiver: receiverId, receiverUsername: receiver } });
                }
            })
            .catch(error => console.error('Error fetching chat id:', error))
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
                    Messages
                </h2>
            </div>

            {/* Tabs */}
            <div className="contacts-tabs">
                <button 
                    className={`tab-button ${activeTab === 'chats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chats')}
                >
                    <FaUserFriends />
                    Chats
                </button>
                <button 
                    className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('groups')}
                >
                    <FaUsers />
                    Groups
                </button>
            </div>

            <div className='action-buttons'>
                {activeTab === 'chats' ? (
                    <button className="add-contact-button" onClick={() => navigate('/addfriend')}>
                        <FaUserFriends />
                        Add Contact
                    </button>
                ) : (
                    <button className="add-contact-button" onClick={() => navigate('/groups')}>
                        <FaPlus />
                        New Group
                    </button>
                )}
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
                        placeholder={activeTab === 'chats' ? 'Search contacts...' : 'Search groups...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="contacts-list">
                {activeTab === 'chats' ? (
                    // CHATS TAB
                    filteredFriends.length > 0 ? (
                        filteredFriends.map((friend) => (
                            <div
                                key={friend._id}
                                className={`contact-item ${activeChatId === friend._id ? 'active' : ''}`}
                                onClick={() => findchatid(friend._id, friend)}
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
                    )
                ) : (
                    // GROUPS TAB
                    filteredGroups.length > 0 ? (
                        filteredGroups.map((group) => (
                            <div
                                key={group._id}
                                className={`contact-item ${activeChatId === group.chatId ? 'active' : ''}`}
                                onClick={() => handleGroupClick(group)}
                            >
                                <img
                                    src={group.groupIcon || '/default-group-icon.svg'}
                                    alt={group.name}
                                    className="user-pic"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/default-group-icon.svg';
                                    }}
                                />
                                <div className="contact-info">
                                    <div className="contact-header">
                                        <h4>{group.name}</h4>
                                        <span className="group-members-count">
                                            <FaUsers size={12} /> {group.members?.length || 0}
                                        </span>
                                    </div>
                                    <p className="last-message">
                                        {group.lastMessage?.message || 'No messages yet'}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-contacts">
                            <FaUsers size={40} />
                            <p>No groups found</p>
                            {searchQuery ? (
                                <p>Try a different search term</p>
                            ) : (
                                <button 
                                    className="create-group-btn"
                                    onClick={() => navigate('/groups')}
                                >
                                    <FaPlus /> Create Your First Group
                                </button>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

