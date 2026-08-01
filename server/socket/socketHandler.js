const Message = require('../models/Message');

const roomUsers = {}; // tracks users per room - v2

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    socket.on('message_seen', (data) => {
  socket.to(data.roomId).emit('message_seen', { username: data.username });
});
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', async (data) => {
        console.log('join_room received:', data);
      const { roomId, username } = data;

      socket.join(roomId);
      socket.currentRoom = roomId;
      socket.username = username;

      // Add user to room
      if (!roomUsers[roomId]) roomUsers[roomId] = [];
      roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
      roomUsers[roomId].push({ socketId: socket.id, username });

      // Broadcast updated user list to everyone in room
      io.to(roomId).emit('room_users', roomUsers[roomId].map(u => u.username));

      console.log(`${username} joined room: ${roomId}`);

      try {
        const messages = await Message.find({ roomId })
          .sort({ createdAt: 1 })
          .limit(50);
        socket.emit('message_history', messages);
      } catch (err) {
        console.error('Error loading messages:', err.message);
      }
    });

    socket.on('send_message', async (data) => {
      try {
        const saved = await Message.create({
          roomId: data.roomId,
          sender: data.sender,
          message: data.message,
          time: data.time,
        });
        io.to(data.roomId).emit('receive_message', {
          roomId: saved.roomId,
          sender: saved.sender,
          message: saved.message,
          time: saved.time,
        });
      } catch (err) {
        console.error('Error saving message:', err.message);
      }
    });

    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('user_typing', { username: data.username });
    });

    socket.on('stop_typing', (data) => {
      socket.to(data.roomId).emit('user_stop_typing', { username: data.username });
    });

    socket.on('disconnect', () => {
      const roomId = socket.currentRoom;
      if (roomId && roomUsers[roomId]) {
        roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
        io.to(roomId).emit('room_users', roomUsers[roomId].map(u => u.username));
      }
      console.log(`${socket.username} disconnected`);
    });
  });

  
};


module.exports = socketHandler;