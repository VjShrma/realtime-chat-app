const Message = require('../models/Message');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room and send message history
    socket.on('join_room', async (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);

      try {
        // Load last 50 messages for this room
        const messages = await Message.find({ roomId })
          .sort({ createdAt: 1 })
          .limit(50);

        // Send history only to the user who just joined
        socket.emit('message_history', messages);
      } catch (err) {
        console.error('Error loading messages:', err.message);
      }
    });

    // Save message and broadcast to room
    socket.on('send_message', async (data) => {
      try {
        // Save to MongoDB
        const saved = await Message.create({
          roomId: data.roomId,
          sender: data.sender,
          message: data.message,
          time: data.time,
        });

        console.log(`Message saved and sent to room ${data.roomId}`);

        // Broadcast to everyone in the room
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

    //Typing indicators
      socket.on('typing', (data) => {
        socket.to(data.roomId).emit('user_typing', { username: data.username });
      });

      socket.on('stop_typing', (data) => {
        socket.to(data.roomId).emit('user_stop_typing', { username: data.username});
      });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;