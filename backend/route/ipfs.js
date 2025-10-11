import { create } from "ipfs-http-client";

// Connect to local IPFS node (make sure IPFS daemon is running)
const client = create({ url: "http://127.0.0.1:5001" });

/**
 * Upload a file to IPFS
 * @param {Buffer} fileBuffer - File buffer from multer
 * @returns {Promise<string>} - IPFS CID (Content Identifier)
 */
async function uploadFile(fileBuffer) {
  try {
    // Validate input
    if (!Buffer.isBuffer(fileBuffer)) {
      throw new Error('Invalid input: Expected a Buffer');
    }

    console.log('📤 Uploading file to IPFS...');
    console.log('File size:', fileBuffer.length, 'bytes');

    // Upload to IPFS
    const result = await client.add(fileBuffer);
    const cid = result.cid.toString();

    console.log("✅ File uploaded successfully to IPFS!");
    console.log("CID:", cid);
    console.log("Gateway URL: https://ipfs.io/ipfs/" + cid);
    
    return cid;
  } catch (err) {
    console.error("❌ Error uploading file to IPFS:", err.message);
    
    // Provide helpful error messages
    if (err.code === 'ECONNREFUSED') {
      throw new Error('IPFS daemon is not running. Please start IPFS daemon with: ipfs daemon');
    }
    
    throw new Error(`IPFS upload failed: ${err.message}`);
  }
}

export default uploadFile;
