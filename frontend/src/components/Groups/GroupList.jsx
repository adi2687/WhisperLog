import React, { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateGroup from './CreateGroup';
import './GroupList.css';

export default function GroupList() {
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
    fetchFriends();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/group/my-groups`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setGroups(response.data.groups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/profile/friends`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data && response.data.friends) {
        setFriends(response.data.friends);
      } else if (Array.isArray(response.data)) {
        setFriends(response.data);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [newGroup, ...prev]);
  };

  const handleGroupClick = (group) => {
    navigate(`/chat/${group.chatId}`, {
      state: {
        isGroup: true,
        groupDetails: group
      }
    });
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="group-list-container">
        <div className="loading-spinner">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="group-list-container">
      <div className="group-list-header">
        <div className="header-title">
          <FiUsers size={24} />
          <h2>Groups</h2>
        </div>
        <button
          className="create-group-btn"
          onClick={() => setShowCreateModal(true)}
          title="Create new group"
        >
          <FiPlus size={20} />
          <span>New Group</span>
        </button>
      </div>

      <div className="search-container">
        <FiSearch className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="groups-list">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <div
              key={group._id}
              className="group-item"
              onClick={() => handleGroupClick(group)}
            >
              <div className="group-icon">
                {group.groupIcon ? (
                  <img src={group.groupIcon} alt={group.name} />
                ) : (
                  <div className="default-icon">
                    <FiUsers size={24} />
                  </div>
                )}
              </div>

              <div className="group-info">
                <div className="group-header-info">
                  <h3 className="group-name">{group.name}</h3>
                  <span className="group-time">
                    {formatLastMessageTime(group.lastMessageTime)}
                  </span>
                </div>
                <div className="group-details">
                  <span className="member-count">
                    {group.members?.length || 0} members
                  </span>
                  {group.lastMessage && (
                    <span className="last-message">
                      {group.lastMessage.message || 'Media'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-groups">
            <FiUsers size={48} />
            <h3>No groups found</h3>
            <p>
              {searchQuery
                ? 'Try a different search term'
                : 'Create a new group to get started'}
            </p>
            {!searchQuery && (
              <button
                className="create-first-group-btn"
                onClick={() => setShowCreateModal(true)}
              >
                <FiPlus size={18} />
                Create Your First Group
              </button>
            )}
          </div>
        )}
      </div>

      <CreateGroup
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={handleGroupCreated}
        friends={friends}
      />
    </div>
  );
}
