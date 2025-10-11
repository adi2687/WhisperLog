import React, { useState, useEffect } from 'react';
import { FiX, FiUpload, FiUsers, FiCheck } from 'react-icons/fi';
import './CreateGroup.css';
import axios from 'axios';

export default function CreateGroup({ isOpen, onClose, onGroupCreated, friends }) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupIcon, setGroupIcon] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      setGroupIcon(null);
      setIconPreview(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setGroupIcon(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const toggleMember = (friendId) => {
    setSelectedMembers(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (selectedMembers.length === 0) {
      alert('Please select at least one member');
      return;
    }

    setIsCreating(true);

    try {
      const formData = new FormData();
      formData.append('name', groupName.trim());
      formData.append('description', description.trim());
      formData.append('members', JSON.stringify(selectedMembers));
      
      if (groupIcon) {
        formData.append('groupIcon', groupIcon);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/group/create`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        onGroupCreated(response.data.group);
        onClose();
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert(error.response?.data?.error || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredFriends = Array.isArray(friends) 
    ? friends.filter(friend =>
        friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (!isOpen) return null;

  return (
    <div className="create-group-modal" onClick={onClose}>
      <div className="create-group-content" onClick={(e) => e.stopPropagation()}>
        <div className="create-group-header">
          <h2>Create New Group</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="create-group-form">
          {/* Group Icon */}
          <div className="form-section">
            <label className="icon-upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleIconChange}
                className="icon-input"
              />
              <div className="icon-preview-container">
                {iconPreview ? (
                  <img src={iconPreview} alt="Group icon" className="icon-preview" />
                ) : (
                  <div className="icon-placeholder">
                    <FiUpload size={32} />
                    <span>Upload Group Icon</span>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Group Name */}
          <div className="form-section">
            <label htmlFor="groupName">Group Name *</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              maxLength={100}
              required
              className="form-input"
            />
          </div>

          {/* Description */}
          <div className="form-section">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              maxLength={500}
              rows={3}
              className="form-textarea"
            />
          </div>

          {/* Members Selection */}
          <div className="form-section">
            <label>
              <FiUsers size={18} />
              Select Members ({selectedMembers.length} selected)
            </label>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="form-input search-input"
            />

            <div className="members-list">
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className={`member-item ${selectedMembers.includes(friend._id) ? 'selected' : ''}`}
                    onClick={() => toggleMember(friend._id)}
                  >
                    <img
                      src={friend.profilePicture || '/default-avatar.svg'}
                      alt={friend.username}
                      className="member-avatar"
                    />
                    <div className="member-info">
                      <span className="member-name">{friend.username}</span>
                      <span className="member-email">{friend.email}</span>
                    </div>
                    {selectedMembers.includes(friend._id) && (
                      <FiCheck className="check-icon" size={20} />
                    )}
                  </div>
                ))
              ) : (
                <div className="no-friends">
                  {searchQuery ? 'No friends found' : 'No friends available'}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-btn"
              disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
            >
              {isCreating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
