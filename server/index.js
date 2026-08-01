const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

app.get('/test', (req, res) => {
  res.sendFile(__dirname + '/test.html');
});

// Attach Socket.io to the HTTP server
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://realtime-chat-app-two-tau.vercel.app'],
    methods: ['GET', 'POST'],
  },
});
connectDB();

app.use(cors({
  origin: ['http://localhost:5173', 'https://realtime-chat-app-two-tau.vercel.app'],
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Chat server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Register socket events
socketHandler(io);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});