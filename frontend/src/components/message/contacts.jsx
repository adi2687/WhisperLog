import { useProfileCurrentUser } from '../../contexts/ProfileContext';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSearch, FaUserFriends, FaUser } from 'react-icons/fa';
import './contacts.css';

export default function Contacts() {
    const { profile, loading, error: profileError } = useProfileCurrentUser();
    const { id: activeChatId } = useParams();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

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
                console.log('freidn s aya',data.friends)
                setFriends(data.friends);
            }
        })
        .catch(error => console.error('Error fetching friends:', error));
    };

    useEffect(() => {
        getFriends();
    }, []);

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
            console.log(data,receiver)
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
                                    <span className="contact-username">{friend.username}</span>
                                    {/* <span className="contact-time">12:30 PM</span> */}
                                </div>
                                <div className="contact-status">
                                    <span className={`status-indicator ${friend.isOnline ? 'online' : ''}`}></span>
                                    <span className="last-message">
                                        {friend.lastMessage || 'Start a new conversation'}
                                    </span>
                                </div>
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

