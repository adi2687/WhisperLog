import LZString from 'lz-string';
import largemsg from './msg.js';
// Original message
const msg="abcdef"

const originalMessage = msg;

// Compress it
const compressedMessage = LZString.compressToBase64(originalMessage);

// Calculate sizes
const getByteSize = str => new TextEncoder().encode(str).length;
let s=largemsg
let arr=[]
for (let i=0;i<s.length;i++){
    let originalMessage=s.substring(0,i)
    let compressedMessage=LZString.compressToBase64(originalMessage)
    console.log(i)
    console.log("Original size (bytes):", getByteSize(originalMessage));
    console.log("Compressed size (bytes):", getByteSize(compressedMessage));
    console.log('\n')
    arr.push([getByteSize(originalMessage),getByteSize(compressedMessage)])
}
console.log(arr)
// Decompress to verify correctness
const decompressedMessage = LZString.decompressFromBase64(compressedMessage);
// console.log("Decompressed message:", decompressedMessage);
