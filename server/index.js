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

const questions = [
  { normal: "What is something you find genuinely attractive in a person?", imposter: "What is something you find attractive but would never admit out loud?" },
  { normal: "What is the nicest thing you have ever done for someone?", imposter: "What is the pettiest thing you have ever done to get back at someone?" },
  { normal: "What is your go-to hype song before a big event?", imposter: "What embarrassing song do you blast alone in the car and hope nobody finds out?" },
  { normal: "What is the most romantic thing someone has done for you?", imposter: "What is the most embarrassing thing you have done trying to impress someone?" },
  { normal: "What is a food combination that sounds wrong but tastes amazing?", imposter: "What disgusting thing have you eaten and secretly enjoyed?" },
  { normal: "What is your most convincing excuse to get out of plans?", imposter: "What is the most elaborate lie you have told to get out of something?" },
  { normal: "What is the best compliment you have ever received?", imposter: "What compliment do you fish for the most shamelessly?" },
  { normal: "What is something you do to treat yourself?", imposter: "What is the most embarrassing thing you do when completely alone?" },
  { normal: "What is the best piece of gossip you have ever heard?", imposter: "What is the worst piece of gossip you have ever spread?" },
  { normal: "What is a show you think everyone should watch?", imposter: "What show do you secretly binge that you would die before admitting to?" },
  { normal: "What is your best quality as a friend?", imposter: "What is a personality trait of yours that your friends probably hate?" },
  { normal: "What would you do with a million dollars?", imposter: "What is the most irresponsible thing you would spend money on guilt-free?" },
  { normal: "What skill genuinely impresses you in another person?", imposter: "What completely useless skill are you low-key proud of?" },
  { normal: "What is your ideal type of person to be around?", imposter: "What type of person makes you want to fake a phone call and disappear?" },
  { normal: "What is your ideal way to spend a night in?", imposter: "What is your most embarrassing guilty pleasure when no one is watching?" },
  { normal: "What is something about you that surprises people?", imposter: "What is something about you that would make people question everything?" },
  { normal: "What is a movie you would recommend to anyone?", imposter: "What objectively terrible movie have you watched more than once?" },
  { normal: "What is your go-to order when someone else is paying?", imposter: "What do you order when you are desperately trying to impress someone?" },
  { normal: "What is the nicest thing you have done for a stranger?", imposter: "What is the most ridiculous thing you have done just for attention?" },
  { normal: "What is your most unpopular food opinion?", imposter: "What food opinion do you hold that could genuinely end a friendship?" },
  { normal: "What are you better at than you let on?", imposter: "What are you objectively terrible at but absolutely refuse to admit?" },
  { normal: "What is the best thing about your personality?", imposter: "What is one thing about you that a therapist would have a field day with?" },
  { normal: "What is your best party trick?", imposter: "What weird thing can you do that has absolutely no practical value?" },
  { normal: "What is the most thoughtful gift you have ever given?", imposter: "What is the laziest gift you have ever given and somehow got away with?" },
  { normal: "What is something that always puts you in a good mood?", imposter: "What is something that ruins your mood that you would be ashamed to admit?" },
  { normal: "What app on your phone could you not live without?", imposter: "What app on your phone would be mortifying if someone scrolled through?" },
  { normal: "What is the best way to spend money?", imposter: "What is the most unhinged thing you have spent money on without telling anyone?" },
  { normal: "What is the best thing about your friend group?", imposter: "What is a secret you are currently keeping from your friend group?" },
  { normal: "What is a song that never gets old for you?", imposter: "What song do you know every single word to but would never admit?" },
  { normal: "What is the best way to win an argument?", imposter: "What is the most ridiculous hill you have ever died on in an argument?" },
  { normal: "What is something you find deeply satisfying?", imposter: "What is something you find weirdly satisfying that would creep people out?" },
  { normal: "What is your go-to comfort activity when you are stressed?", imposter: "What is the most chaotic thing you have done when stressed?" },
  { normal: "What is something small that instantly makes you trust someone?", imposter: "What tiny thing instantly makes you lose all respect for a person?" },
  { normal: "What is the most attractive thing someone can do on a first date?", imposter: "What is the fastest way to absolutely kill the vibe on a first date?" },
  { normal: "What is a red flag you spotted and avoided?", imposter: "What red flag do you actually find weirdly attractive?" },
  { normal: "What is the best thing about being in a relationship?", imposter: "What is the most annoying thing a partner has ever done to you?" },
  { normal: "What is your hottest take that no one agrees with?", imposter: "What opinion do you hold that would get you cancelled if said out loud?" },
  { normal: "What is your most attractive feature?", imposter: "What do you exaggerate about yourself when trying to impress someone?" },
  { normal: "What is the best way to make a good first impression?", imposter: "What is the most desperate thing you have done to make someone like you?" },
  { normal: "What is your signature move at a party?", imposter: "What is the most embarrassing thing you have ever done at a party?" },
  { normal: "What is an opinion you will always defend?", imposter: "What is a take so bad you keep it strictly locked inside your head?" },
  { normal: "What is the best thing about your job or school?", imposter: "What is something you have gotten away with at work or school that you absolutely should not have?" },
  { normal: "What is your love language?", imposter: "What do people think your love language is when it is absolutely not?" },
  { normal: "What is a memory that still makes you smile?", imposter: "What is a memory so embarrassing it wakes you up at 3am in a cold sweat?" },
  { normal: "What is the best drunk food of all time?", imposter: "What is the most embarrassing thing you have done or said while drunk?" },
  { normal: "What is the best way to shoot your shot with someone you like?", imposter: "What is the most unhinged way you have ever tried to get someone's attention?" },
  { normal: "What is something you are proud of that you rarely talk about?", imposter: "What is something you did that you are deeply ashamed of but weirdly can't stop thinking about?" },
  { normal: "What is a childhood memory that shaped who you are?", imposter: "What is a childhood memory so embarrassing you have tried to repress it?" },
  { normal: "What is the best thing about getting older?", imposter: "What is something about getting older that genuinely terrifies you?" },
  { normal: "What is the most fun you have had completely spontaneously?", imposter: "What is the most impulsive and questionable decision you have ever made?" },
  { normal: "What is something you genuinely geek out about?", imposter: "What is something you are obsessed with that you hide from most people?" },
];

const rooms = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
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
      disconnected: !!p.disconnected,
      ...((room.state === 'results' || room.state === 'game_over') && { role: p.role, answer: p.answer, vote: p.vote })
    }))
  };

  Object.entries(room.players).forEach(([socketId, player]) => {
    if (player.disconnected) return;

    let playerSpecificData = {};

    if (room.state === 'question' || room.state === 'reveal' || room.state === 'voting') {
      playerSpecificData.myQuestion = player.role === 'imposter' ? room.questionPair.imposter : room.questionPair.normal;
    }

    if (room.state === 'reveal' || room.state === 'voting') {
      playerSpecificData.normalQuestion = room.questionPair.normal;
      playerSpecificData.answers = Object.entries(room.players).map(([id, p]) => ({
        id,
        name: p.name,
        answer: p.answer
      }));
    }

    if (room.state === 'results' || room.state === 'game_over') {
      playerSpecificData.imposterId = room.imposterId;
      playerSpecificData.imposterCaught = room.imposterCaught;
      playerSpecificData.normalQuestion = room.questionPair.normal;
      playerSpecificData.imposterQuestion = room.questionPair.imposter;
    }

    io.to(socketId).emit('room_update', {
      ...baseState,
      ...playerSpecificData,
      me: { id: socketId, role: player.role, isHost: player.isHost }
    });
  });
}

function removePlayer(code, socketId) {
  const room = rooms[code];
  if (!room) return;
  delete room.players[socketId];
  if (Object.keys(room.players).length === 0) {
    delete rooms[code];
  } else {
    if (!Object.values(room.players).some(p => p.isHost)) {
      const firstConnected = Object.entries(room.players).find(([, p]) => !p.disconnected);
      if (firstConnected) firstConnected[1].isHost = true;
      else Object.values(room.players)[0].isHost = true;
    }
    emitRoomUpdate(code);
  }
}

io.on('connection', (socket) => {
  socket.on('create_room', ({ name, rounds, persistentId }) => {
    const code = generateRoomCode();
    const maxRounds = Number.isInteger(rounds) && rounds >= 1 && rounds <= 20 ? rounds : 5;
    rooms[code] = {
      state: 'lobby',
      currentRound: 0,
      maxRounds,
      usedQuestions: [],
      players: {
        [socket.id]: { name, persistentId, score: 0, isHost: true, role: 'normal', answer: '', vote: '', disconnected: false }
      },
      imposterId: null,
      lastImposterId: null,
      imposterCaught: false,
      questionPair: null
    };
    socket.join(code);
    emitRoomUpdate(code);
  });

  socket.on('join_room', ({ name, code, persistentId }) => {
    const roomCode = code.toUpperCase();
    if (!rooms[roomCode]) { socket.emit('error', 'Room not found'); return; }
    if (rooms[roomCode].state !== 'lobby' && rooms[roomCode].state !== 'game_over') {
      socket.emit('error', 'Game already in progress');
      return;
    }
    const isFirst = Object.keys(rooms[roomCode].players).length === 0;
    rooms[roomCode].players[socket.id] = {
      name, persistentId, score: 0, isHost: isFirst, role: 'normal', answer: '', vote: '', disconnected: false
    };
    socket.join(roomCode);
    emitRoomUpdate(roomCode);
  });

  socket.on('leave_room', (code) => {
    const room = rooms[code];
    if (!room || !room.players[socket.id]) return;
    clearTimeout(room.players[socket.id].disconnectTimer);
    socket.leave(code);
    removePlayer(code, socket.id);
  });

  socket.on('reconnect_player', ({ persistentId, roomCode }) => {
    const room = rooms[roomCode];
    if (!room) { socket.emit('reconnect_failed'); return; }

    const entry = Object.entries(room.players).find(([, p]) => p.persistentId === persistentId);
    if (!entry) { socket.emit('reconnect_failed'); return; }

    const [oldSocketId, player] = entry;

    clearTimeout(player.disconnectTimer);
    room.players[socket.id] = { ...player, disconnected: false, disconnectTimer: null };
    delete room.players[oldSocketId];

    socket.join(roomCode);
    emitRoomUpdate(roomCode);
  });

  socket.on('start_game', (code) => {
    const room = rooms[code];
    if (!room || !room.players[socket.id] || !room.players[socket.id].isHost) return;

    // Remove disconnected players when starting fresh
    if (room.state === 'lobby' || room.state === 'game_over') {
      Object.entries(room.players).forEach(([id, p]) => {
        if (p.disconnected) {
          clearTimeout(p.disconnectTimer);
          delete room.players[id];
        }
      });
      room.currentRound = 0;
      room.usedQuestions = [];
      room.lastImposterId = null;
      Object.values(room.players).forEach(p => { p.score = 0; });
    }

    const playerIds = Object.keys(room.players);
    if (playerIds.length < 3) { socket.emit('error', 'Need at least 3 players'); return; }

    room.currentRound += 1;

    playerIds.forEach(id => {
      room.players[id].answer = '';
      room.players[id].vote = '';
      room.players[id].role = 'normal';
    });

    const imposterPool = playerIds.filter(id => id !== room.lastImposterId);
    const pool = imposterPool.length > 0 ? imposterPool : playerIds;
    room.imposterId = pool[Math.floor(Math.random() * pool.length)];
    room.lastImposterId = room.imposterId;
    room.players[room.imposterId].role = 'imposter';

    const availableIndices = questions.map((_, i) => i).filter(i => !room.usedQuestions.includes(i));
    if (availableIndices.length === 0) room.usedQuestions = [];
    const finalIndices = availableIndices.length > 0 ? availableIndices : questions.map((_, i) => i);
    const qIndex = finalIndices[Math.floor(Math.random() * finalIndices.length)];
    room.usedQuestions.push(qIndex);
    room.questionPair = questions[qIndex];

    room.state = 'question';
    emitRoomUpdate(code);
  });

  socket.on('submit_answer', ({ code, answer }) => {
    const room = rooms[code];
    if (!room || room.state !== 'question') return;
    if (room.players[socket.id]) room.players[socket.id].answer = answer;

    const allAnswered = Object.values(room.players).every(p => p.disconnected || p.answer.trim() !== '');
    if (allAnswered) room.state = 'reveal';
    emitRoomUpdate(code);
  });

  socket.on('next_phase', (code) => {
    const room = rooms[code];
    if (!room || !room.players[socket.id] || !room.players[socket.id].isHost) return;
    if (room.state === 'reveal') {
      room.state = 'voting';
      emitRoomUpdate(code);
    } else if (room.state === 'results') {
      room.state = 'game_over';
      emitRoomUpdate(code);
    }
  });

  socket.on('submit_vote', ({ code, voteForId }) => {
    const room = rooms[code];
    if (!room || room.state !== 'voting') return;
    if (room.players[socket.id]) room.players[socket.id].vote = voteForId;

    const allVoted = Object.values(room.players).every(p => p.disconnected || p.vote !== '');
    if (allVoted) {
      const activePlayers = Object.entries(room.players).filter(([, p]) => !p.disconnected);
      const totalActive = activePlayers.length;
      const votesForImposter = activePlayers.filter(([, p]) => p.vote === room.imposterId).length;
      const isMajority = votesForImposter > totalActive / 2;
      room.imposterCaught = isMajority;

      if (isMajority) {
        Object.keys(room.players).forEach(id => {
          if (id !== room.imposterId) room.players[id].score += 5;
        });
        room.players[room.imposterId].score -= 5;
      } else {
        room.players[room.imposterId].score += 10;
      }

      room.state = 'results';
      emitRoomUpdate(code);
    } else {
      emitRoomUpdate(code);
    }
  });

  socket.on('disconnect', () => {
    for (const code in rooms) {
      const room = rooms[code];
      if (!room.players[socket.id]) continue;

      const player = room.players[socket.id];
      player.disconnected = true;

      // Immediately hand off host so game doesn't get stuck
      if (player.isHost) {
        const nextHost = Object.entries(room.players).find(([id, p]) => id !== socket.id && !p.disconnected);
        if (nextHost) {
          player.isHost = false;
          nextHost[1].isHost = true;
        }
      }

      emitRoomUpdate(code);

      // Remove after 45s if they don't reconnect
      player.disconnectTimer = setTimeout(() => removePlayer(code, socket.id), 45000);
      break;
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
