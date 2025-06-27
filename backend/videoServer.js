const messageMap = new Map();

messageMap.set('a0cdbf32-5c64-465a-9d4d-aa8281755d8f', [
    {
      _id: undefined,
      chatId: 'a0cdbf32-5c64-465a-9d4d-aa8281755d8f',
      message: 'hey',
      timestamp: 1751000965225,
      senderId: '685d526edb73cd51f41cb25f',
      receiverId: '685d5274db73cd51f41cb262',
      isRead: false,
      imageUrl: null,
      fileUrl: null,
      fileName: null,
      fileType: null,
      fileSize: null,
      status: 'delivered'
    },
    {
      _id: undefined,
      chatId: 'a0cdbf32-5c64-465a-9d4d-aa8281755d8f',
      message: 'meopw',
      timestamp: 1751000971115,
      senderId: '685d526edb73cd51f41cb25f',
      receiverId: '685d5274db73cd51f41cb262',
      isRead: false,
      imageUrl: null,
      fileUrl: null,
      fileName: null,
      fileType: null,
      fileSize: null,
      status: 'delivered'
    },
    {
      _id: undefined,
      chatId: 'a0cdbf32-5c64-465a-9d4d-aa8281755d8f',
      message: 'mepw',
      timestamp: 1751000971749,
      senderId: '685d526edb73cd51f41cb25f',
      receiverId: '685d5274db73cd51f41cb262',
      isRead: false,
      imageUrl: null,
      fileUrl: null,
      fileName: null,
      fileType: null,
      fileSize: null,
      status: 'delivered'
    },
    {
      _id: undefined,
      chatId: 'a0cdbf32-5c64-465a-9d4d-aa8281755d8f',
      message: 'meow',
      timestamp: 1751000972373,
      senderId: '685d526edb73cd51f41cb25f',
      receiverId: '685d5274db73cd51f41cb262',
      isRead: false,
      imageUrl: null,
      fileUrl: null,
      fileName: null,
      fileType: null,
      fileSize: null,
      status: 'delivered'
    },
    {
      _id: undefined,
      chatId: 'a0cdbf32-5c64-465a-9d4d-aa8281755d8f',
      message: 'mewow',
      timestamp: 1751000973067,
      senderId: '685d526edb73cd51f41cb25f',
      receiverId: '685d5274db73cd51f41cb262',
      isRead: false,
      imageUrl: null,
      fileUrl: null,
      fileName: null,
      fileType: null,
      fileSize: null,
      status: 'delivered'
    }
  ]
);
let totalMessages = 0;

for (const [roomId, messages] of messageMap) {
  console.log(`${roomId}: ${messages.length} messages`);
  for (let j=0 ; j<messages.length ; j++) {
    console.log(messages[j].message);
  }
  // totalMessages += messages.length;
}

// console.log(`Total messages: ${totalMessages}`); 
// console.log(messageMap)
