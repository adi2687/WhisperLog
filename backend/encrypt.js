import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

const {
  encodeBase64,
  decodeBase64,
  encodeUTF8,
  decodeUTF8
} = naclUtil;

// Generate key pairs for two users
const sender = nacl.box.keyPair();
const receiver = nacl.box.keyPair();
console.log(sender,receiver)
// Encrypt a message
const message = "Secret Chat Message";
const nonce = nacl.randomBytes(nacl.box.nonceLength); // Must be unique per message
console.log(nonce)
const encrypted = nacl.box(
  decodeUTF8(message),               // message as Uint8Array
  nonce,
  receiver.publicKey,                // recipient's public key
  sender.secretKey                   // sender's private key
);

// Decrypt the message
const decrypted = nacl.box.open(
  encrypted,
  nonce,
  sender.publicKey,                  // sender's public key
  receiver.secretKey                 // recipient's private key
);
console.log(decrypted,encrypted)
// Handle case where decryption fails
const decryptedMessage = decrypted ? encodeUTF8(decrypted) : '[Decryption failed]';

console.log("Original:", message);
console.log("Encrypted:", encodeBase64(encrypted));
console.log("Decrypted:", decryptedMessage);
