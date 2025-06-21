import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
dotenv.config()

import connect from '../db/connection.js'
import userLogin from '../route/user.login.js'
import userRoutes from '../route/users.route.js'
const PORT = process.env.PORT || 5000
const app = express()

// MongoDB connection
connect('mongodb://localhost:27017/whisperlog')

// CORS config
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}
app.use(cors(corsOptions))
app.use(express.json()) // important for parsing JSON body
app.use(cookieParser()) // for parsing cookies

// Routes
app.get('/', (req, res) => {
    res.send('Main page')
})

// Auth routes
app.use('/auth/register', userLogin)

// Comments API routes
app.use('/api/users', userRoutes)
// Socket.io setup
import { Server } from 'socket.io'
import http from 'http'
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
})

io.on('connection', (socket) => {
    console.log('user connected', socket.id)
    
    socket.on('msg', ({ roomId, text }) => {
        io.to(roomId).emit('msg', text)
    })

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id)
    })

    socket.on('roomJoin', (roomId) => {
        socket.join(roomId)
        console.log('user joined room', socket.id, roomId)
    })
})

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
