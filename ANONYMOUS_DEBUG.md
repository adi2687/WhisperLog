# 🔍 Anonymous Chat - Debugging Guide

## Common Issues & Fixes:

### ❌ **Issue 1: Page Not Loading**

**Symptoms:** Blank page or 404 error

**Fix:**
1. Make sure you navigate to `/anonymouschat` (not `/anonymous`)
2. Check browser console for errors (F12)
3. Verify the route in App.jsx (line 62)

---

### ❌ **Issue 2: Socket Connection Error**

**Symptoms:** "Connection failed" or no matching happening

**Fix:**

1. **Check backend is running:**
```bash
cd backend
npm start
```

2. **Check VITE_BACKEND_URL in frontend/.env:**
```
VITE_BACKEND_URL=http://localhost:5000
```

3. **Restart backend after changes:**
```bash
# Press Ctrl+C
npm start
```

---

### ❌ **Issue 3: Matching Not Working**

**Symptoms:** Stuck on "Searching..."

**Fix:**

1. **Open TWO browser windows/tabs**
   - Both go to `/anonymouschat`
   - Click "Start Chatting" in BOTH
   - They should match!

2. **Check backend console:**
   - Should see: "User looking for partner"
   - Should see: "Matched user1 with user2"

---

### ❌ **Issue 4: Messages Not Sending**

**Symptoms:** Can't send messages or messages not received

**Fix:**

1. **Check browser console (F12)**
   - Look for socket errors
   - Look for "Message sent" logs

2. **Check backend console**
   - Should see: "Anonymous message: ..."

---

## 🧪 Quick Test:

### **Step 1: Check Backend**
```bash
cd backend
npm start
```

Look for:
```
✓ Server running on port 5000
✓ MongoDB connected
✓ Socket.IO initialized
```

### **Step 2: Open Browser Console (F12)**

Navigate to `/anonymouschat` and check for:
```
✓ Socket connected
✓ Anonymous ID generated
✓ No errors
```

### **Step 3: Test Matching**

1. Open TWO browser windows
2. Go to `/anonymouschat` in BOTH
3. Click "Start Chatting" in BOTH
4. Should see "Connected to a stranger!"

### **Step 4: Test Messaging**

1. Type message in window 1
2. Press Send
3. Should appear in window 2!

---

## 🔧 Manual Fixes:

### **If socket.io not connecting:**

Check `frontend/src/components/Anonymous/AnonymousChat.jsx` line 8:
```javascript
const socket = io(import.meta.env.VITE_BACKEND_URL);
```

Should connect to: `http://localhost:5000`

### **If backend not receiving events:**

Check `backend/api/app.js` line 234:
```javascript
handleAnonymousSocket(socket);
```

Should be inside `io.on('connection', ...)` block.

---

## 📋 Checklist:

- [ ] Backend is running (`npm start` in backend folder)
- [ ] Frontend is running (`npm run dev` in frontend folder)
- [ ] `.env` file has `VITE_BACKEND_URL=http://localhost:5000`
- [ ] Route exists in App.jsx: `/anonymouschat`
- [ ] AnonymousChat.jsx file exists in `frontend/src/components/Anonymous/`
- [ ] AnonymousChat.css file exists in `frontend/src/components/Anonymous/`
- [ ] anonymous.route.js exists in `backend/route/`
- [ ] app.js imports and uses `handleAnonymousSocket`

---

## 🐛 Debug Commands:

### **Check if files exist:**
```bash
# Frontend
ls frontend/src/components/Anonymous/

# Backend
ls backend/route/anonymous.route.js
```

### **Check backend logs:**
```bash
cd backend
npm start

# Should see:
# "Anonymous socket connected: ..."
# "User looking for partner: ..."
# "Matched ... with ..."
```

### **Check frontend console:**
```
F12 → Console tab

# Should see:
# "Matched with partner: ..."
# "REACTION CLICKED!" (from other features)
```

---

## 🚀 Fresh Start:

If nothing works, try this:

1. **Stop everything:**
```bash
# Press Ctrl+C in both terminals
```

2. **Restart backend:**
```bash
cd backend
npm start
```

3. **Restart frontend:**
```bash
cd frontend
npm run dev
```

4. **Clear browser cache:**
```
Ctrl+Shift+Delete → Clear cache
```

5. **Open TWO browser windows:**
   - Window 1: `http://localhost:5173/anonymouschat`
   - Window 2: `http://localhost:5173/anonymouschat`

6. **Click "Start Chatting" in BOTH**

7. **Should match and chat!**

---

## 📞 Still Not Working?

**Tell me:**
1. What error message do you see?
2. What's in the browser console (F12)?
3. What's in the backend terminal?
4. At which step does it fail?

I'll help you fix it! 🔧
