const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const CHAT_FILE = 'chat_log.txt';

// Дозволяємо приймати JSON
app.use(express.json());

// Головна сторінка — HTML з чатом
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Видалити повідомлення за текстом
app.delete('/messages', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send({ error: 'No text provided' });

  try {
    if (fs.existsSync(CHAT_FILE)) {
      const messages = fs.readFileSync(CHAT_FILE, 'utf8').split('\n');
      const filtered = messages.filter(msg => msg.trim() !== text.trim());
      fs.writeFileSync(CHAT_FILE, filtered.join('\n'), 'utf8');
      res.send({ success: true });
    } else {
      res.status(404).send({ error: 'Chat file not found' });
    }
  } catch (err) {
    console.error('Помилка при видаленні повідомлення:', err);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Socket.IO: логіка чату
io.on('connection', (socket) => {
  console.log('Користувач підключився');

  // Надсилаємо історію чату новому користувачу
  try {
    if (fs.existsSync(CHAT_FILE)) {
      const history = fs.readFileSync(CHAT_FILE, 'utf8').split('\n').filter(line => line);
      history.forEach((msg) => {
        socket.emit('chat message', msg);
      });
      console.log('Історія чату надіслана користувачу');
    }
  } catch (err) {
    console.error('Помилка при зчитуванні історії чату:', err);
  }

  // Коли хтось надсилає повідомлення
  socket.on('chat message', (msg) => {
    console.log('Отримано повідомлення:', msg);
    try {
      fs.appendFileSync(CHAT_FILE, `${msg}\n`, 'utf8'); // записуємо повідомлення
      io.emit('chat message', msg); // надсилаємо всім
    } catch (err) {
      console.error('Помилка при записі у файл:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Користувач відключився');
  });
});

// Запуск сервера на порту 3000
server.listen(3000, () => {
  console.log('Сервер запущено на http://localhost:3000');
});
