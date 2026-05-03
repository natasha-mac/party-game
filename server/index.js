const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Mock Database of Spicy/Fun Questions
const questions = [
  { normal: "What is your favorite vacation spot?", imposter: "What is the worst place to be stuck for a week?" },
  { normal: "What is a superpower you wish you had?", imposter: "What is a superpower that would actually be annoying?" },
  { normal: "Name a food you love eating.", imposter: "Name a food you absolutely hate." },
  { normal: "What is the best pet to have?", imposter: "What is the worst animal to keep in your house?" },
  { normal: "What is the most attractive trait in a person?", imposter: "What is the biggest red flag in a person?" },
  { normal: "If you could only eat one thing for the rest of your life, what would it be?", imposter: "What is the grossest thing you have ever tasted?" },
  { normal: "What is your biggest fear?", imposter: "What is something you find extremely funny that others don't?" },
  { normal: "What is a secret talent you have?", imposter: "What is something you are embarrassingly bad at?" },
  { normal: "Who is your celebrity crush?", imposter: "Which celebrity do you think is completely overrated?" },
  { normal: "What is the best way to spend a weekend?", imposter: "What is the most boring chore you have to do?" },
  { normal: "What is your favorite movie of all time?", imposter: "What is a movie you walked out of or turned off?" },
  { normal: "If you won the lottery, what is the first thing you would buy?", imposter: "What is the stupidest thing you've ever spent money on?" },
  { normal: "What is a habit you have that you are proud of?", imposter: "What is your worst, most annoying habit?" },
  { normal: "What is the best piece of advice you've ever received?", imposter: "What is the worst advice someone has ever given you?" },
  { normal: "Where is the best place to hide something?", imposter: "Where is the best place to hide a dead body?" },
  { normal: "What is a song that always makes you dance?", imposter: "What is a song that instantly ruins your mood?" },
  { normal: "What is your ideal first date?", imposter: "What would be the absolute worst first date?" },
  { normal: "What is a childhood show you loved?", imposter: "What is a kid's show that terrified you?" },
  { normal: "If you were an animal, what would you be?", imposter: "What animal perfectly describes your ex?" },
  { normal: "What is the most beautiful thing in the world?", imposter: "What is the most disgusting thing you can imagine?" }
];

// In-memory state
const rooms = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for(let i=0; i<4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function emitRoomUpdate(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  
  const baseState = {
    roomId,
    state: room.state,
    currentRound: room.currentRound,
    maxRounds: room.maxRounds,
    players: Object.entries(room.players).map(([id, p]) => ({
      id,
      name: p.name,
      score: p.score,
      isHost: p.isHost,
      hasAnswered: !!p.answer,
      hasVoted: !!p.vote,
      ...( (room.state === 'results' || room.state === 'game_over') && { role: p.role, answer: p.answer, vote: p.vote })
    }))
  };

  Object.keys(room.players).forEach(socketId => {
    const player = room.players[socketId];
    let playerSpecificData = {};
    
    if (room.state === 'question' || room.state === 'reveal' || room.state === 'voting') {
      playerSpecificData.myQuestion = player.role === 'imposter' ? room.questionPair.imposter : room.questionPair.normal;
    }

    if (room.state === 'reveal' || room.state === 'voting') {
      playerSpecificData.answers = Object.entries(room.players).map(([id, p]) => ({
        id,
        name: p.name,
        answer: p.answer
      }));
    }

    if (room.state === 'results' || room.state === 'game_over') {
       playerSpecificData.imposterId = room.imposterId;
       playerSpecificData.imposterCaught = room.imposterCaught;
    }

    io.to(socketId).emit('room_update', {
      ...baseState,
      ...playerSpecificData,
      me: { id: socketId, role: player.role, isHost: player.isHost }
    });
  });
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_room', (name) => {
    const code = generateRoomCode();
    rooms[code] = {
      state: 'lobby',
      currentRound: 0,
      maxRounds: 5,
      usedQuestions: [],
      players: {
        [socket.id]: { name, score: 0, isHost: true, role: 'normal', answer: '', vote: '' }
      },
      imposterId: null,
      imposterCaught: false,
      questionPair: null
    };
    socket.join(code);
    emitRoomUpdate(code);
  });

  socket.on('join_room', ({ name, code }) => {
    const roomCode = code.toUpperCase();
    if (!rooms[roomCode]) {
      socket.emit('error', 'Room not found');
      return;
    }
    if (rooms[roomCode].state !== 'lobby' && rooms[roomCode].state !== 'game_over') {
      socket.emit('error', 'Game already in progress');
      return;
    }
    
    const isFirst = Object.keys(rooms[roomCode].players).length === 0;
    
    rooms[roomCode].players[socket.id] = {
      name,
      score: 0,
      isHost: isFirst,
      role: 'normal',
      answer: '',
      vote: ''
    };
    socket.join(roomCode);
    emitRoomUpdate(roomCode);
  });

  socket.on('start_game', (code) => {
    const room = rooms[code];
    if (!room || !room.players[socket.id] || !room.players[socket.id].isHost) return;

    const playerIds = Object.keys(room.players);
    if (playerIds.length < 3) {
      socket.emit('error', 'Need at least 3 players');
      return;
    }

    // If coming from game_over, reset scores and round
    if (room.state === 'lobby' || room.state === 'game_over') {
      room.currentRound = 0;
      room.usedQuestions = [];
      playerIds.forEach(id => {
        room.players[id].score = 0;
      });
    }

    room.currentRound += 1;

    // Reset game state for new round
    playerIds.forEach(id => {
      room.players[id].answer = '';
      room.players[id].vote = '';
      room.players[id].role = 'normal';
    });

    // Assign Imposter
    const imposterIndex = Math.floor(Math.random() * playerIds.length);
    room.imposterId = playerIds[imposterIndex];
    room.players[room.imposterId].role = 'imposter';

    // Assign Question avoiding duplicates
    let availableQuestions = questions.filter((_, i) => !room.usedQuestions.includes(i));
    if (availableQuestions.length === 0) {
      // If we somehow run out, reset
      room.usedQuestions = [];
      availableQuestions = questions;
    }
    
    // Pick a random index from the original array that is available
    const availableIndices = questions.map((_, i) => i).filter(i => !room.usedQuestions.includes(i));
    const randomIdx = Math.floor(Math.random() * availableIndices.length);
    const qIndex = availableIndices[randomIdx];
    
    room.usedQuestions.push(qIndex);
    room.questionPair = questions[qIndex];

    room.state = 'question';
    emitRoomUpdate(code);
  });

  socket.on('submit_answer', ({ code, answer }) => {
    const room = rooms[code];
    if (!room || room.state !== 'question') return;
    
    if (room.players[socket.id]) {
      room.players[socket.id].answer = answer;
    }

    const allAnswered = Object.values(room.players).every(p => p.answer.trim() !== '');
    if (allAnswered) {
      room.state = 'reveal';
    }
    emitRoomUpdate(code);
  });

  socket.on('next_phase', (code) => {
    const room = rooms[code];
    if (!room || !room.players[socket.id] || !room.players[socket.id].isHost) return;

    if (room.state === 'reveal') {
      room.state = 'voting';
      emitRoomUpdate(code);
    }
  });

  socket.on('submit_vote', ({ code, voteForId }) => {
    const room = rooms[code];
    if (!room || room.state !== 'voting') return;

    if (room.players[socket.id]) {
      room.players[socket.id].vote = voteForId;
    }

    const allVoted = Object.values(room.players).every(p => p.vote !== '');
    if (allVoted) {
      // Calculate scores
      const totalPlayers = Object.keys(room.players).length;
      const votesForImposter = Object.values(room.players).filter(p => p.vote === room.imposterId).length;
      
      // Majority voting: Imposter is caught ONLY if majority votes are against him
      const isMajority = votesForImposter > (totalPlayers / 2);
      room.imposterCaught = isMajority;

      if (isMajority) {
        // Imposter caught! Normal players who voted correctly get 5 points.
        Object.keys(room.players).forEach(id => {
          const p = room.players[id];
          if (p.role === 'normal' && p.vote === room.imposterId) {
            p.score += 5;
          }
        });
      } else {
        // Imposter survived! Imposter gets 10 points.
        room.players[room.imposterId].score += 10;
      }

      if (room.currentRound >= room.maxRounds) {
        room.state = 'game_over';
      } else {
        room.state = 'results';
      }

      emitRoomUpdate(code);
    } else {
      emitRoomUpdate(code);
    }
  });

  socket.on('disconnect', () => {
    for (const code in rooms) {
      if (rooms[code].players[socket.id]) {
        delete rooms[code].players[socket.id];
        if (Object.keys(rooms[code].players).length === 0) {
          delete rooms[code];
        } else {
          const remainingIds = Object.keys(rooms[code].players);
          if (remainingIds.length > 0 && !Object.values(rooms[code].players).some(p => p.isHost)) {
            rooms[code].players[remainingIds[0]].isHost = true;
          }
          emitRoomUpdate(code);
        }
      }
    }
  });
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
