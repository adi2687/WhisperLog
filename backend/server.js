import express from 'express'
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import { Server } from 'socket.io'
const PORT=process.env.PORT
const app = express()
app.use(cors())
const server=http.createServer(app)


const io=new Server(server,{
    cors:
    {
        origin:"http://localhost:5173",
        methods:["GET","POST"]
    }
})

io.on('connection',(socket)=>{
    console.log('user connected',socket.id)
    socket.on('msg',({roomId,text})=>{
        io.to(roomId).emit('msg',text)
    })
    socket.on('diconnect',()=>{
        console.log('user disconenctd',socket.id)
    })
    socket.on('roomJoin',(roomId)=>{
        socket.join(roomId)
        console.log('user joined room',socket.id,roomId)
    })
})

app.get('/', (req, res) => {
    res.send('Main page')
})

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
