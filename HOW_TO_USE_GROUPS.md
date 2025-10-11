# How to Use Group Functionality - Step by Step Guide

## 🚀 Quick Start Integration

### Step 1: Add Groups Route to Your App

Find your main routing file (usually `App.jsx` or similar) and add the groups route:

```javascript
// Import the GroupList component
import GroupList from './components/Groups/GroupList';

// Add this route to your router
<Route path="/groups" element={<GroupList />} />
```

**Example:**
```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GroupList from './components/Groups/GroupList';
import Chat from './components/message/chat';
// ... other imports

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:chatId" element={<Chat />} />
        <Route path="/groups" element={<GroupList />} />  {/* ADD THIS */}
        {/* ... other routes */}
      </Routes>
    </Router>
  );
}
```

---

### Step 2: Add Navigation Button

Add a "Groups" button to your navigation bar or sidebar:

```javascript
import { FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  
  return (
    <nav>
      {/* Your existing nav items */}
      <button onClick={() => navigate('/groups')}>
        <FiUsers size={20} />
        <span>Groups</span>
      </button>
    </nav>
  );
}
```

---

### Step 3: Update Chat Component for Group Support

Open `frontend/src/components/message/chat.jsx` and make these changes:

#### 3.1: Add Group State (at the top with other useState)

```javascript
const [isGroup, setIsGroup] = useState(false);
const [groupDetails, setGroupDetails] = useState(null);
```

#### 3.2: Handle Group State from Navigation (in useEffect)

```javascript
useEffect(() => {
  const state = location.state;
  
  // Check if this is a group chat
  if (state?.isGroup && state?.groupDetails) {
    setIsGroup(true);
    setGroupDetails(state.groupDetails);
    setReceiver(state.groupDetails.chatId); // Use chatId as receiver for groups
  } else {
    setIsGroup(false);
    setGroupDetails(null);
  }
}, [location]);
```

#### 3.3: Update handleSendMessage to Support Groups

Find the `socket.emit('message', ...)` line and update it:

```javascript
// Inside handleSendMessage function, where you emit the message:
socket.emit('message', {
  ...finalMessage,
  isGroupMessage: isGroup,           // ADD THIS
  groupId: groupDetails?._id,        // ADD THIS
  tempMessageId: tempMessageId
});
```

#### 3.4: Update Chat Header to Show Group Info

Find the chat header section and update it:

```javascript
<div className="chat-header">
  <button className="back-buttonchat" onClick={() => navigate(-1)}>
    <FiArrowLeft size={20} />
    <span>Back</span>
  </button>

  <div className="chat-header-info">
    {isGroup ? (
      // GROUP HEADER
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={groupDetails?.groupIcon || '/default-group-icon.svg'}
            alt={groupDetails?.name}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <div>
            <h3>{groupDetails?.name}</h3>
            <span className="user-status">
              {groupDetails?.members?.length || 0} members
            </span>
          </div>
        </div>
      </>
    ) : (
      // EXISTING 1-ON-1 CHAT HEADER
      <>
        {/* Your existing header code */}
      </>
    )}
  </div>
</div>
```

---

### Step 4: Ensure Friends API Exists

The CreateGroup component needs a friends list. Make sure you have this endpoint:

```javascript
// Backend: route/users.route.js or similar
router.get('/friends', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('friends', 'username email profilePicture');
    
    res.json(user.friends || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});
```

---

## 📱 How to Use Groups (User Perspective)

### Creating a Group

1. **Navigate to Groups**
   - Click the "Groups" button in your navigation

2. **Click "New Group"**
   - Click the "+ New Group" button in the top right

3. **Fill in Group Details**
   - **Upload Icon** (optional): Click the circular area to upload a group image
   - **Group Name** (required): Enter a name for your group
   - **Description** (optional): Add a description
   - **Select Members**: Click on friends to add them to the group
     - Selected members will have a green checkmark
     - Use the search box to find specific friends

4. **Create**
   - Click "Create Group" button
   - The group will appear in your groups list

### Sending Messages in a Group

1. **Open Group Chat**
   - Click on any group in the groups list
   - You'll be taken to the chat interface

2. **Send Messages**
   - Type your message in the input box
   - Click send or press Enter
   - All group members will receive the message

3. **Send Media**
   - Click the attachment button (📎)
   - Select image, video, or file
   - The media will be sent to all group members

### Managing Groups

#### As Admin:

1. **Add Members**
   ```javascript
   // This would be in a group settings component (you can create this)
   POST /group/:groupId/add-members
   Body: { members: ["userId1", "userId2"] }
   ```

2. **Remove Members**
   - Only admins can remove members
   - Cannot remove the group creator

3. **Update Group**
   - Change name, description, or icon
   - Only admins can update

4. **Delete Group**
   - Only the creator can delete
   - Deletes all messages in the group

#### As Member:

1. **Leave Group**
   - Members can leave anytime
   - Admins must transfer ownership before leaving

---

## 🔧 Advanced Integration (Optional)

### Add Group Settings Modal

Create a component to manage group settings:

```javascript
// frontend/src/components/Groups/GroupSettings.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function GroupSettings({ group, onClose, onUpdate }) {
  const [members, setMembers] = useState(group.members);
  
  const handleRemoveMember = async (memberId) => {
    try {
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
      }
    } catch (error) {
      alert('Failed to remove member');
    }
  };
  
  return (
    <div className="group-settings-modal">
      <h2>{group.name} Settings</h2>
      
      <div className="members-section">
        <h3>Members ({members.length})</h3>
        {members.map(member => (
          <div key={member.userId._id} className="member-item">
            <img src={member.userId.profilePicture} alt={member.userId.username} />
            <span>{member.userId.username}</span>
            <span className="role-badge">{member.role}</span>
            {member.role !== 'admin' && (
              <button onClick={() => handleRemoveMember(member.userId._id)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Add Group Info in Chat Header

Add a button to view group members:

```javascript
{isGroup && (
  <button 
    className="group-info-btn"
    onClick={() => setShowGroupInfo(true)}
  >
    <FiInfo size={20} />
    Group Info
  </button>
)}
```

---

## 🎯 Testing Checklist

- [ ] Navigate to /groups page
- [ ] Click "New Group" button
- [ ] Upload a group icon
- [ ] Enter group name and description
- [ ] Select at least 2 members
- [ ] Create the group
- [ ] Group appears in the list
- [ ] Click on the group to open chat
- [ ] Send a text message
- [ ] Send an image
- [ ] Send a video
- [ ] Send a file
- [ ] Verify other members receive messages
- [ ] Search for groups
- [ ] Leave a group (as member)
- [ ] Delete a group (as creator)

---

## 🐛 Common Issues & Solutions

### Issue: "No friends available" when creating group
**Solution**: Ensure you have friends added and the `/users/friends` endpoint is working

### Issue: Group messages not appearing
**Solution**: 
- Check socket.io connection
- Verify `isGroupMessage` and `groupId` are being sent
- Check backend logs for errors

### Issue: Can't upload group icon
**Solution**:
- Verify Cloudinary is configured
- Check file size (max 5MB)
- Ensure multer middleware is working

### Issue: Navigation not working
**Solution**: 
- Verify route is added to your router
- Check import paths are correct
- Ensure React Router is set up

---

## 📊 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/group/create` | Create new group | ✅ |
| GET | `/group/my-groups` | Get all user's groups | ✅ |
| GET | `/group/:groupId` | Get group details | ✅ |
| POST | `/group/:groupId/add-members` | Add members | ✅ (Admin) |
| POST | `/group/:groupId/remove-member` | Remove member | ✅ (Admin) |
| POST | `/group/:groupId/leave` | Leave group | ✅ |
| PUT | `/group/:groupId` | Update group | ✅ (Admin) |
| DELETE | `/group/:groupId` | Delete group | ✅ (Creator) |
| POST | `/group/:groupId/make-admin` | Promote to admin | ✅ (Admin) |

---

## 💡 Pro Tips

1. **Default Group Icon**: Create a default group icon SVG/PNG and place it in your public folder
2. **Member Limit**: Consider adding a max member limit (e.g., 256 members)
3. **Notifications**: Add push notifications for new group messages
4. **Typing Indicators**: Show "User is typing..." in groups
5. **Read Receipts**: Show who has read messages in groups
6. **Mute Groups**: Allow users to mute group notifications
7. **Pin Messages**: Let admins pin important messages
8. **Group Calls**: Extend video call functionality to groups

---

## 🎨 Customization

### Change Group Icon Size
```css
/* In GroupList.css */
.group-icon {
  width: 64px;  /* Change from 56px */
  height: 64px;
}
```

### Change Color Scheme
```css
/* In CreateGroup.css */
.create-btn {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); /* Green theme */
}
```

### Add Group Badges
```javascript
// Show "New" badge for recently created groups
{group.isNew && <span className="new-badge">New</span>}
```

---

## 📝 Next Steps

1. ✅ Integrate groups into your app (Steps 1-4 above)
2. ✅ Test creating and messaging in groups
3. 🔄 Add group settings/management UI (optional)
4. 🔄 Add group notifications (optional)
5. 🔄 Add group search and filters (optional)
6. 🔄 Add group analytics (optional)

---

**Need Help?** Check the `GROUP_FUNCTIONALITY_SUMMARY.md` for technical details and troubleshooting.
