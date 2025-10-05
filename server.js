const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Головна сторінка — просто HTML з чатом
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Логіка чату
io.on('connection', (socket) => {
  console.log('Користувач підключився');

  // Надсилаємо історію чату новому користувачу
  try {
    if (fs.existsSync('chat_log.txt')) {
      const history = fs.readFileSync('chat_log.txt', 'utf8').split('\n').filter(line => line);
      history.forEach((msg) => {
        socket.emit('chat message', msg);
      });
      console.log('Історія чату надіслана користувачу');
    } else {
      console.log('Файл chat_log.txt ще не існує');
    }
  } catch (err) {
    console.error('Помилка при зчитуванні історії чату:', err);
  }

  // Коли хтось надсилає повідомлення
  socket.on('chat message', (msg) => {
    console.log('Отримано повідомлення:', msg);
    try {
      fs.appendFileSync('chat_log.txt', `${new Date().toISOString()}: ${msg}\n`, 'utf8');
      console.log('Повідомлення збережено у chat_log.txt');
      io.emit('chat message', msg);
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