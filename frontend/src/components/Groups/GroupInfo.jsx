import React, { useState } from 'react';
import { FiX, FiUserPlus, FiUserMinus, FiEdit2, FiTrash2, FiLogOut, FiSettings, FiShield, FiUsers, FiCamera } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import './GroupInfo.css';

function GroupInfo({ group, isOpen, onClose, onUpdate, currentUserId }) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(group?.name || '');
  const [groupDescription, setGroupDescription] = useState(group?.description || '');
  const [loading, setLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const iconInputRef = React.useRef(null);

  // Update local state when group prop changes
  React.useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setGroupDescription(group.description || '');
    }
  }, [group]);

  // Fetch friends when add member modal opens
  React.useEffect(() => {
    if (showAddMember) {
      fetchFriends();
    }
  }, [showAddMember]);

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
        // Filter out users already in the group
        const existingMemberIds = group.members.map(m => m.userId._id);
        const availableFriends = response.data.friends.filter(
          f => !existingMemberIds.includes(f._id)
        );
        setFriends(availableFriends);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  if (!isOpen || !group) return null;

  const isAdmin = group.admin?._id === currentUserId || 
                  group.members?.some(m => m.userId._id === currentUserId && m.role === 'admin');
  const isCreator = group.admin?._id === currentUserId;

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/group/${group._id}/remove-member`,
        { memberId },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        onUpdate(response.data.group);
        toast.success('Member removed successfully');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.response?.data?.error || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) {
      toast.error('Please select at least one friend to add');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/group/${group._id}/add-members`,
        { members: selectedFriends },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        onUpdate(response.data.group);
        setShowAddMember(false);
        setSelectedFriends([]);
        setSearchQuery('');
        toast.success(`Added ${selectedFriends.length} member(s) successfully`);
      }
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error(error.response?.data?.error || 'Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleMakeAdmin = async (memberId) => {
    if (!window.confirm('Make this member an admin?')) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/group/${group._id}/make-admin`,
        { memberId },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        onUpdate(response.data.group);
        toast.success('Member promoted to admin');
      }
    } catch (error) {
      console.error('Error making admin:', error);
      toast.error(error.response?.data?.error || 'Failed to make admin');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/group/${group._id}/leave`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Left group successfully');
        onClose();
        window.location.href = '/chat';
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error(error.response?.data?.error || 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

    try {
      setLoading(true);
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/group/${group._id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Group deleted successfully');
        onClose();
        window.location.href = '/chat';
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(error.response?.data?.error || 'Failed to delete group');
    } finally {
      setLoading(false);
    }
  };

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedIcon(file);
      handleUpdateGroupIcon(file);
    }
  };

  const handleUpdateGroupIcon = async (iconFile) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('groupIcon', iconFile);
      formData.append('name', groupName);
      formData.append('description', groupDescription);

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/group/${group._id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        onUpdate(response.data.group);
        toast.success('Group icon updated successfully');
        setSelectedIcon(null);
      }
    } catch (error) {
      console.error('Error updating group icon:', error);
      toast.error(error.response?.data?.error || 'Failed to update group icon');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/group/${group._id}`,
        {
          name: groupName,
          description: groupDescription
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        onUpdate(response.data.group);
        setIsEditing(false);
        toast.success('Group updated successfully');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error(error.response?.data?.error || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group-info-overlay" onClick={onClose}>
      <div className="group-info-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="group-info-header">
          <h2>Group Info</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        {/* Group Details */}
        <div className="group-info-content">
          {/* Group Icon and Name */}
          <div className="group-details-section">
            <div className="group-icon-large">
              <img 
                src={group.groupIcon || '/default-group-icon.svg'} 
                alt={group.name}
              />
              {isAdmin && (
                <>
                  <input
                    type="file"
                    ref={iconInputRef}
                    onChange={handleIconChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="change-icon-btn" 
                    title="Change group icon"
                    onClick={() => iconInputRef.current?.click()}
                    disabled={loading}
                  >
                    <FiCamera size={16} />
                  </button>
                </>
              )}
            </div>

            {isEditing ? (
              <div className="edit-group-form">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  className="edit-input"
                />
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Group description"
                  className="edit-textarea"
                  rows={3}
                />
                <div className="edit-actions">
                  <button onClick={() => setIsEditing(false)} className="cancel-btn">
                    Cancel
                  </button>
                  <button onClick={handleUpdateGroup} className="save-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="group-name-section">
                  <h3>{group.name}</h3>
                  {isAdmin && (
                    <button onClick={() => setIsEditing(true)} className="edit-btn">
                      <FiEdit2 size={16} />
                    </button>
                  )}
                </div>
                {group.description && (
                  <p className="group-description">{group.description}</p>
                )}
                <p className="group-created">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </>
            )}
          </div>

          {/* Members Section */}
          <div className="members-section">
            <div className="section-header">
              <h4>
                <FiUsers size={18} />
                Members ({group.members?.length || 0})
              </h4>
              {isAdmin && (
                <button className="add-member-btn" onClick={() => setShowAddMember(true)}>
                  <FiUserPlus size={16} />
                  Add
                </button>
              )}
            </div>

            <div className="members-list">
              {group.members?.map((member) => (
                <div key={member.userId._id} className="member-item">
                  <img 
                    src={member.userId.profilePicture || '/default-avatar.svg'} 
                    alt={member.userId.username}
                    className="member-avatar"
                  />
                  <div className="member-info">
                    <span className="member-name">{member.userId.username}</span>
                    <span className="member-email">{member.userId.email}</span>
                  </div>
                  <div className="member-actions">
                    {member.role === 'admin' && (
                      <span className="admin-badge">
                        <FiShield size={12} /> Admin
                      </span>
                    )}
                    {isAdmin && member.userId._id !== currentUserId && member.role !== 'admin' && (
                      <>
                        <button 
                          className="action-btn promote-btn"
                          onClick={() => handleMakeAdmin(member.userId._id)}
                          title="Make admin"
                        >
                          <FiShield size={14} />
                        </button>
                        <button 
                          className="action-btn remove-btn"
                          onClick={() => handleRemoveMember(member.userId._id)}
                          title="Remove member"
                        >
                          <FiUserMinus size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Section */}
          <div className="actions-section">
            {!isCreator && (
              <button className="action-button leave-btn" onClick={handleLeaveGroup} disabled={loading}>
                <FiLogOut size={18} />
                Leave Group
              </button>
            )}
            {isCreator && (
              <button className="action-button delete-btn" onClick={handleDeleteGroup} disabled={loading}>
                <FiTrash2 size={18} />
                Delete Group
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Members Modal */}
      {showAddMember && (
        <div className="add-member-modal" onClick={() => setShowAddMember(false)}>
          <div className="add-member-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-member-header">
              <h3>Add Members</h3>
              <button className="close-btn" onClick={() => setShowAddMember(false)}>
                <FiX size={20} />
              </button>
            </div>

            <div className="add-member-search">
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="friends-list">
              {friends
                .filter(f => f.username.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(friend => (
                  <div
                    key={friend._id}
                    className={`friend-item ${selectedFriends.includes(friend._id) ? 'selected' : ''}`}
                    onClick={() => toggleFriendSelection(friend._id)}
                  >
                    <img
                      src={friend.profilePicture || '/default-avatar.svg'}
                      alt={friend.username}
                      className="friend-avatar"
                    />
                    <span className="friend-name">{friend.username}</span>
                    {selectedFriends.includes(friend._id) && (
                      <span className="checkmark">✓</span>
                    )}
                  </div>
                ))}
              {friends.length === 0 && (
                <div className="no-friends">
                  <p>No friends available to add</p>
                </div>
              )}
            </div>

            <div className="add-member-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowAddMember(false);
                  setSelectedFriends([]);
                }}
              >
                Cancel
              </button>
              <button
                className="add-btn"
                onClick={handleAddMembers}
                disabled={selectedFriends.length === 0 || loading}
              >
                {loading ? 'Adding...' : `Add ${selectedFriends.length || ''} Member${selectedFriends.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupInfo;
