const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const MONGO_URI = 'mongodb://collabhub_app_user:CollabHub%40123Strong@64.227.135.33:17017/collabhub_app_db?authSource=collabhub_app_db';

console.log(MONGO_URI)
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('DB connection error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/messages', require('./routes/messages'));

io.on('connection', (socket) => {
  console.log('user connected:', socket.id);

  socket.on('joinChannel', (channelId) => {
    console.log(`User wants to join channel ${channelId}`);
    socket.join(channelId);
  });

  socket.on('sendMessage', (data) => {
    if (!data?.channelId) return;
    io.to(data.channelId).emit('newMessage', data);
  });

  socket.on('taskUpdated', (data) => {
    io.emit('taskUpdate', data);
  });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
