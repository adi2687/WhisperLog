# 🔐 IPFS Secure Media Upload Setup

## Overview
This application supports secure media uploads using IPFS (InterPlanetary File System) for decentralized, permanent file storage.

## 🚀 Quick Start

### 1. Install IPFS

#### Windows
```bash
# Download from official website
https://docs.ipfs.tech/install/ipfs-desktop/

# Or use Chocolatey
choco install ipfs
```

#### macOS
```bash
# Using Homebrew
brew install ipfs
```

#### Linux
```bash
# Download and install
wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz
tar -xvzf kubo_v0.24.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh
```

### 2. Initialize IPFS
```bash
ipfs init
```

### 3. Start IPFS Daemon
```bash
ipfs daemon
```

**Important**: Keep this terminal window open while using IPFS uploads!

### 4. Verify IPFS is Running
```bash
# In a new terminal
ipfs id
```

You should see your IPFS node information.

## 📦 Install Required Package

```bash
cd backend
npm install ipfs-http-client
```

## 🔧 Configuration

### Backend Configuration
The IPFS client is configured in `backend/route/ipfs.js`:

```javascript
const client = create({ url: "http://127.0.0.1:5001" });
```

Default IPFS API port is **5001**.

### Frontend Configuration
Toggle IPFS mode in the chat interface using the **IPFS/Normal** button.

## 🎯 How It Works

### Normal Upload Flow
1. User selects file
2. File uploaded to Cloudinary
3. Cloudinary URL stored in database
4. File accessible via Cloudinary CDN

### IPFS Upload Flow
1. User selects file and enables IPFS mode
2. File uploaded to local IPFS node
3. IPFS returns CID (Content Identifier)
4. File accessible via IPFS gateway: `https://ipfs.io/ipfs/{CID}`
5. CID stored in database

## 🌐 IPFS Gateways

Your files can be accessed through multiple gateways:

- **Public Gateway**: `https://ipfs.io/ipfs/{CID}`
- **Cloudflare**: `https://cloudflare-ipfs.com/ipfs/{CID}`
- **Pinata**: `https://gateway.pinata.cloud/ipfs/{CID}`
- **Local**: `http://127.0.0.1:8080/ipfs/{CID}`

## 📝 API Endpoints

### Upload to IPFS
```
POST /message/ipfs/media
Content-Type: multipart/form-data

Body:
- file: [File Buffer]
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "cid": "QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  "url": "https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  "status": true,
  "fileType": "image/jpeg",
  "fileName": "example.jpg",
  "fileSize": 125925
}
```

## 🔍 Features

### Advantages of IPFS
✅ **Decentralized** - No single point of failure
✅ **Permanent** - Content-addressed, immutable
✅ **Censorship-resistant** - Cannot be taken down
✅ **Cost-effective** - No storage fees after upload
✅ **Fast** - Distributed network for faster access
✅ **Verifiable** - CID ensures content integrity

### When to Use IPFS
- Sensitive documents
- Permanent records
- Decentralized applications
- Avoiding vendor lock-in
- Long-term archival

### When to Use Normal Upload (Cloudinary)
- Temporary files
- Files requiring transformations
- Need CDN optimization
- Simpler setup

## 🛠️ Troubleshooting

### Error: IPFS daemon is not running
**Solution:**
```bash
ipfs daemon
```
Keep the daemon running in a separate terminal.

### Error: ECONNREFUSED
**Cause**: IPFS daemon not started or wrong port.

**Solution:**
1. Check if daemon is running: `ipfs id`
2. Verify API port: `ipfs config Addresses.API`
3. Default should be: `/ip4/127.0.0.1/tcp/5001`

### Error: Cannot connect to IPFS
**Solution:**
```bash
# Reset IPFS config
ipfs config Addresses.API /ip4/127.0.0.1/tcp/5001

# Restart daemon
ipfs daemon
```

### Files not accessible via gateway
**Cause**: File not pinned or gateway slow.

**Solution:**
```bash
# Pin the file locally
ipfs pin add {CID}

# Try different gateway
https://cloudflare-ipfs.com/ipfs/{CID}
```

## 📊 File Size Limits

- **Current Limit**: 5MB per file
- **Recommended**: < 10MB for best performance
- **Maximum IPFS**: Unlimited (but larger files take longer)

To change limit, edit `backend/route/message.ipfs.js`:
```javascript
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 10 // 10MB limit
    }
});
```

## 🔐 Security Considerations

### Public vs Private
- **IPFS is public** - Anyone with CID can access
- For private files, use encryption before upload
- Consider using private IPFS networks for sensitive data

### Best Practices
1. ✅ Validate file types before upload
2. ✅ Scan for malware
3. ✅ Limit file sizes
4. ✅ Use authentication
5. ✅ Monitor upload activity

## 📈 Performance Tips

### Pinning Services
For production, use pinning services to ensure availability:

- **Pinata**: https://pinata.cloud
- **Infura**: https://infura.io
- **Web3.Storage**: https://web3.storage

### Example: Pinata Integration
```javascript
import pinataSDK from '@pinata/sdk';
const pinata = pinataSDK('API_KEY', 'SECRET_KEY');

const result = await pinata.pinFileToIPFS(fileBuffer);
console.log('Pinned CID:', result.IpfsHash);
```

## 🧪 Testing

### Test Upload
```bash
# Using curl
curl -X POST http://localhost:5000/message/ipfs/media \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/test.jpg"
```

### Verify Upload
```bash
# Check if file exists
ipfs cat {CID} > downloaded_file.jpg

# Get file info
ipfs object stat {CID}
```

## 📚 Additional Resources

- **IPFS Documentation**: https://docs.ipfs.tech
- **IPFS HTTP Client**: https://github.com/ipfs/js-ipfs/tree/master/packages/ipfs-http-client
- **IPFS Desktop**: https://docs.ipfs.tech/install/ipfs-desktop/
- **IPFS Companion**: https://docs.ipfs.tech/install/ipfs-companion/

## 🐛 Common Issues

### Issue: Slow upload
**Solution**: Check network connection and IPFS daemon status

### Issue: CID not resolving
**Solution**: Wait a few seconds for propagation, try different gateway

### Issue: Out of memory
**Solution**: Reduce file size limit or increase Node.js memory:
```bash
node --max-old-space-size=4096 server.js
```

## 🎯 Production Checklist

- [ ] IPFS daemon running as service
- [ ] Pinning service configured
- [ ] File size limits set
- [ ] Error handling implemented
- [ ] Monitoring setup
- [ ] Backup strategy defined
- [ ] Gateway fallbacks configured
- [ ] Rate limiting enabled

## 💡 Tips

1. **Use multiple gateways** for redundancy
2. **Pin important files** to prevent garbage collection
3. **Monitor IPFS node** health and storage
4. **Consider costs** of pinning services
5. **Test thoroughly** before production

---

**Version**: 1.0  
**Last Updated**: 2025-10-11  
**Maintainer**: WhisperLog Team
