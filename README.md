# 🔐 WhisperLog

**Encrypted by Default. Invisible by Design.**

WhisperLog is a modern, secure real-time messaging application with end-to-end encryption, built using the MERN stack. It offers a seamless chat experience with advanced features like IPFS integration, video calling, and rich media sharing.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![React](https://img.shields.io/badge/react-19.1.0-61dafb)

---

## ✨ Features

### 🔒 Security & Privacy
- **End-to-End Encryption**: AES-256-CBC encryption for all messages
- **Secure Authentication**: JWT-based auth with bcrypt password hashing
- **Privacy First**: Messages encrypted before storage
- **Session Management**: Secure cookie-based sessions

### 💬 Messaging
- **Real-Time Chat**: Instant messaging with Socket.IO
- **Typing Indicators**: See when someone is typing
- **Message Status**: Sent, delivered, read receipts
- **Rich Media Support**:
  - Images (JPG, PNG, GIF, WebP)
  - Videos (MP4, WebM, MOV, etc.)
  - Files (PDF, DOC, XLS, ZIP, etc.)
  - GIF Picker with search
  - Voice Messages

### 👥 Social Features
- **Friend System**: Send and accept friend requests
- **User Profiles**: Customizable profiles with bio, hobbies, preferences
- **Online Status**: Real-time presence tracking
- **Last Seen**: Timestamp of last activity
- **Search Users**: Find and connect with new friends

### 📞 Communication
- **Video Calling**: WebRTC-based video calls
- **Voice Messages**: Record and send audio
- **Group Features**: Ready for group chat implementation

### 🌐 Storage Options
- **Cloudinary Integration**: Fast CDN-based media storage
- **IPFS Support**: Decentralized, permanent file storage
- **Dual Mode**: Users can choose between Cloudinary and IPFS

### 🎨 User Experience
- **Modern UI**: Beautiful, responsive design
- **Dark/Light Themes**: Theme switching support
- **Animations**: Smooth transitions with Framer Motion & GSAP
- **Mobile Responsive**: Optimized for all screen sizes
- **Real-Time Notifications**: Instant push notifications

---

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js (ES6 Modules)
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose
- **Real-Time**: Socket.IO 4.8.1
- **Authentication**: JWT, bcryptjs
- **File Storage**: Cloudinary, IPFS
- **Encryption**: crypto (AES-256-CBC), tweetnacl

### Frontend
- **Framework**: React 19.1.0
- **Build Tool**: Vite 6.3.5
- **Routing**: React Router DOM 7.6.2
- **State Management**: Context API
- **UI Libraries**: Material-UI, Lucide React, React Icons
- **Animations**: Framer Motion, GSAP
- **Styling**: CSS Modules, Styled Components, Emotion
- **HTTP Client**: Axios

---

## 📦 Installation

### Prerequisites
- Node.js >= 16.0.0
- MongoDB (local or Atlas)
- Cloudinary Account (optional)
- IPFS Daemon (optional, for IPFS features)

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/WhisperLog.git
cd WhisperLog/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the backend directory:
```env
# Server
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/whisperlog

# Authentication
SECRET_KEY=your-super-secret-jwt-key-here
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# Cloudinary (Optional)
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

4. **Start the server**
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ../frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the frontend directory:
```env
VITE_BACKEND_URL=http://localhost:5000
```

4. **Start the development server**
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### IPFS Setup (Optional)

For IPFS features, install and run IPFS daemon:

**Windows:**
```bash
choco install ipfs
ipfs init
ipfs daemon
```

**macOS:**
```bash
brew install ipfs
ipfs init
ipfs daemon
```

**Linux:**
```bash
wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz
tar -xvzf kubo_v0.24.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh
ipfs init
ipfs daemon
```

---

## 📖 Usage

### Creating an Account
1. Navigate to `/auth`
2. Click "Sign Up"
3. Enter username, email, and password
4. Complete the intro tutorial

### Sending Messages
1. Go to `/chat`
2. Click on a contact or add a new friend
3. Type your message and press Enter or click Send
4. Attach media using the attachment buttons

### Adding Friends
1. Click "Add Contact" in the chat sidebar
2. Search for users by username
3. Send a friend request
4. Wait for acceptance

### Video Calling
1. Open a chat with a friend
2. Click the video call icon
3. Wait for the other person to join
4. Enjoy your call!

### Using IPFS
1. In a chat, click the IPFS toggle button
2. Upload media as usual
3. Files will be stored on IPFS instead of Cloudinary
4. Share decentralized, permanent links

---

## 🏗️ Project Structure

```
WhisperLog/
├── backend/
│   ├── api/
│   │   └── app.js              # Main Express app
│   ├── config/
│   │   └── cloudinary.js       # Cloudinary config
│   ├── db/
│   │   └── connection.js       # MongoDB connection
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT verification
│   │   └── upload.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── message.model.js
│   │   ├── chat.model.js
│   │   ├── friendreq.model.js
│   │   └── notification.model.js
│   ├── route/
│   │   ├── user.register.js
│   │   ├── user.login.js
│   │   ├── message.route.js
│   │   ├── message.ipfs.js
│   │   ├── friendrequest.route.js
│   │   └── profile.routes.js
│   ├── notificationlive.js     # Socket.IO handlers
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Homepage/
│   │   │   ├── message/
│   │   │   │   ├── chat.jsx
│   │   │   │   ├── contacts.jsx
│   │   │   │   ├── GifPicker.css
│   │   │   │   └── video/
│   │   │   ├── profile/
│   │   │   ├── Navbar/
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ProfileContext.jsx
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── features.pdf
├── IPFS_SETUP.md
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /logout` - Logout user

### Profile
- `GET /api/profile/me` - Get current user profile
- `PUT /api/profile/update` - Update profile details
- `PUT /api/profile/picture` - Update profile picture
- `GET /api/profile/friends` - Get friends list

### Messages
- `POST /message` - Send message
- `GET /message/:chatId` - Get chat messages
- `POST /message/findid` - Find or create chat
- `POST /message/upload-image` - Upload image
- `POST /message/upload-file` - Upload file
- `POST /message/upload-video` - Upload video
- `POST /message/ipfs/media` - Upload to IPFS

### Friends
- `POST /friends/request` - Send friend request
- `PATCH /friends/request/accept` - Accept friend request
- `GET /friends/notifications` - Get notifications
- `GET /friends/notifications/unread-count` - Unread count
- `PATCH /friends/notifications/:id/read` - Mark as read
- `DELETE /friends/notifications/:id` - Delete notification

---

## 🎯 What Can Be Added

### 🚀 High Priority Features

#### 1. **Group Chats**
- Create and manage group conversations
- Group admins with permissions
- Add/remove members
- Group profile pictures and descriptions
- Group notifications settings

#### 2. **Message Features**
- **Reply to Messages**: Quote and reply to specific messages
- **Edit Messages**: Edit sent messages within time limit
- **Delete Messages**: Delete for self or everyone
- **Forward Messages**: Forward to other chats
- **Message Reactions**: Emoji reactions to messages
- **Pin Messages**: Pin important messages in chat
- **Search in Chat**: Search messages within conversation
- **Message Scheduling**: Schedule messages for later

#### 3. **Enhanced Security**
- **Two-Factor Authentication (2FA)**: SMS or authenticator app
- **Biometric Authentication**: Fingerprint/Face ID
- **Self-Destructing Messages**: Auto-delete after time
- **Screenshot Detection**: Notify when screenshot taken
- **Encrypted Backups**: Secure cloud backups
- **Session Management**: View and revoke active sessions

#### 4. **Voice & Video**
- **Voice Calls**: One-on-one voice calling
- **Group Video Calls**: Multi-party video conferencing
- **Screen Sharing**: Share screen during calls
- **Call Recording**: Record calls with permission
- **Virtual Backgrounds**: Background blur/replacement
- **Call History**: Log of past calls

#### 5. **Stories/Status**
- **24-hour Stories**: Share photos/videos that disappear
- **Status Updates**: Text status with emojis
- **Story Reactions**: React to friends' stories
- **Story Privacy**: Control who sees your stories

### 🎨 UI/UX Enhancements

#### 6. **Customization**
- **Custom Themes**: User-created color schemes
- **Chat Wallpapers**: Custom backgrounds per chat
- **Font Size Options**: Accessibility settings
- **Bubble Styles**: Different message bubble designs
- **Notification Sounds**: Custom notification tones

#### 7. **Rich Content**
- **Sticker Packs**: Animated and static stickers
- **Custom Emojis**: Upload custom emojis
- **Polls**: Create polls in chats
- **Location Sharing**: Share live or static location
- **Contact Sharing**: Share contact cards
- **File Preview**: Preview documents in-app

### 📱 Mobile & Desktop

#### 8. **Native Apps**
- **React Native App**: iOS and Android apps
- **Electron Desktop App**: Windows, Mac, Linux
- **Progressive Web App (PWA)**: Installable web app
- **Push Notifications**: Native mobile notifications

### 🤖 AI & Automation

#### 9. **AI Features**
- **Smart Reply**: AI-suggested quick replies
- **Message Translation**: Auto-translate messages
- **Spam Detection**: AI-powered spam filtering
- **Chatbots**: Automated bot responses
- **Voice-to-Text**: Transcribe voice messages
- **Image Recognition**: Auto-tag images

#### 10. **Message Enhancement**
- **Grammar Check**: Auto-correct grammar
- **Tone Analysis**: Suggest tone improvements
- **Smart Compose**: Auto-complete sentences
- **Message Summarization**: Summarize long chats

### 🔗 Integrations

#### 11. **Third-Party Integrations**
- **Calendar Integration**: Schedule meetings
- **Task Management**: Create tasks from messages
- **Cloud Storage**: Google Drive, Dropbox integration
- **Payment Integration**: Send/request money
- **Social Media**: Share to other platforms
- **Email Integration**: Email notifications

### 📊 Analytics & Insights

#### 12. **User Analytics**
- **Chat Statistics**: Message count, media shared
- **Activity Heatmap**: When you're most active
- **Storage Usage**: Track storage consumption
- **Response Time**: Average response metrics
- **Most Contacted**: Frequently messaged friends

### 🛡️ Moderation & Safety

#### 13. **Safety Features**
- **Block Users**: Block and report users
- **Mute Chats**: Silence notifications
- **Archive Chats**: Hide old conversations
- **Report System**: Report inappropriate content
- **Content Filtering**: Filter offensive content
- **Parental Controls**: Restrict features for minors

### 🌐 Advanced Features

#### 14. **Blockchain Integration**
- **NFT Profile Pictures**: Use NFTs as avatars
- **Crypto Payments**: Send cryptocurrency
- **Decentralized Identity**: Web3 authentication
- **Token Rewards**: Reward active users

#### 15. **Collaboration Tools**
- **Shared Documents**: Collaborative editing
- **Whiteboard**: Draw and sketch together
- **Code Sharing**: Syntax-highlighted code blocks
- **Task Lists**: Shared to-do lists
- **Calendar Events**: Shared event planning

#### 16. **Accessibility**
- **Screen Reader Support**: Full accessibility
- **High Contrast Mode**: Better visibility
- **Keyboard Shortcuts**: Power user features
- **Voice Commands**: Control with voice
- **Dyslexia-Friendly Font**: Reading assistance

### 🔧 Developer Features

#### 17. **API & Webhooks**
- **Public API**: Allow third-party integrations
- **Webhooks**: Event-driven notifications
- **Bot API**: Create custom bots
- **Plugin System**: Extend functionality
- **Developer Dashboard**: Manage integrations

#### 18. **Testing & Quality**
- **Unit Tests**: Jest/Mocha test suites
- **E2E Tests**: Cypress/Playwright tests
- **Load Testing**: Performance benchmarks
- **CI/CD Pipeline**: Automated deployment
- **Error Tracking**: Sentry integration

### 📈 Business Features

#### 19. **Monetization**
- **Premium Subscription**: Ad-free, extra features
- **Business Accounts**: Enhanced features for businesses
- **Custom Branding**: White-label solution
- **Analytics Dashboard**: Business insights
- **Team Management**: Organization features

#### 20. **Marketing & Growth**
- **Referral Program**: Invite friends rewards
- **Social Sharing**: Share app on social media
- **Email Campaigns**: Newsletter integration
- **In-App Announcements**: Feature updates
- **User Onboarding**: Interactive tutorials

---

## 🐛 Known Issues

- IPFS requires manual daemon start
- OAuth implementation incomplete
- Some console.logs in production code
- Message compression not fully integrated
- No automated test suite

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Use ES6+ syntax
- Follow existing code style
- Add comments for complex logic
- Write meaningful commit messages
- Test your changes thoroughly

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- Cloudinary for media storage
- IPFS for decentralized storage
- Material-UI for beautiful components
- React community for amazing tools

---

## 📧 Contact

For questions or support, reach out:
- Email: support@whisperlog.com
- Twitter: [@WhisperLog](https://twitter.com/whisperlog)
- Discord: [Join our server](https://discord.gg/whisperlog)

---

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐

---

**Made with ❤️ by the WhisperLog Team**
