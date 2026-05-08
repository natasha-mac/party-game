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
  // GK
  { normal: "Name an animal that looks adorable but is surprisingly deadly.", imposter: "Name an animal that looks terrifying but is actually completely harmless." },
  { normal: "Name a food that is technically a fruit.", imposter: "Name a food everyone calls a vegetable that is technically not one." },
  { normal: "Name a sport that is way harder than it looks.", imposter: "Name an activity you think deserves to be an Olympic sport but isn't." },
  { normal: "Name something invented much earlier than most people think.", imposter: "Name something people think is ancient but was actually invented recently." },
  { normal: "Name a world capital city most people cannot find on a map.", imposter: "Name a city you would never guess is a country's capital." },
  { normal: "Name a famous person who died tragically young.", imposter: "Name a famous person most people assume is dead but is actually still alive." },
  { normal: "Name something in our solar system that most people don't know exists.", imposter: "Name something in space that sounds completely made up but is actually real." },
  { normal: "Name an element from the periodic table.", imposter: "Name a fictional material or element from a movie or show." },
  { normal: "Name a language spoken by over 100 million people.", imposter: "Name a language on the verge of extinction with almost no speakers left." },
  { normal: "Name a mammal that cannot jump.", imposter: "Name a mammal with a completely unexpected and bizarre ability." },
  { normal: "Name something that is illegal in at least one country.", imposter: "Name something that should probably be illegal everywhere but somehow isn't." },
  { normal: "Name a famous scientist and what they are known for.", imposter: "Name a famous scientist who actually stole the credit from someone else." },
  { normal: "Name a historical 'fact' that everyone gets completely wrong.", imposter: "Name a conspiracy theory that turned out to be actually true." },
  { normal: "Name something that exists on Earth that sounds like science fiction.", imposter: "Name a technology from a sci-fi movie that we actually have in real life now." },
  { normal: "Name a world record that is genuinely impressive.", imposter: "Name a world record so absurd you can't believe someone holds it." },
  { normal: "Name a fun fact about the human body most people don't know.", imposter: "Name a supposed fact about the human body that is completely false." },
  { normal: "Name a country most people don't realise exists.", imposter: "Name a place that sounds made up but is actually a real country." },
  { normal: "Name an Olympic sport most people forget is in the Olympics.", imposter: "Name a sport that used to be in the Olympics but got removed for being too weird." },
  { normal: "Name something humans and animals both do for the same reason.", imposter: "Name a bizarre habit that is completely unique to humans and no other animal does." },
  { normal: "Name a phobia that has an official scientific name.", imposter: "Name a fear so oddly specific it probably should have a name but doesn't." },
  // Funny / Witty
  { normal: "What is something everyone pretends to enjoy but secretly doesn't?", imposter: "What is something you genuinely enjoy that most people would quietly judge you for?" },
  { normal: "What is the most useless thing you know a ridiculous amount about?", imposter: "What is a skill you have that has absolutely zero real-world value?" },
  { normal: "What is the most irrational fear you secretly have?", imposter: "What is a completely normal everyday thing that gives you an inexplicable feeling of dread?" },
  { normal: "What would you do if you were invisible for one day?", imposter: "What would you do if you woke up and everyone could suddenly read your thoughts?" },
  { normal: "What is a red flag about yourself that you are fully aware of but refuse to fix?", imposter: "What is something about you that a therapist would have an absolute field day with?" },
  { normal: "What is your go-to excuse when you want to cancel plans?", imposter: "What is the most elaborate lie you have told to get out of something?" },
  { normal: "What is a TV show character you have an unhealthy attachment to?", imposter: "What is a fictional character you have had a full argument with in your own head?" },
  { normal: "What is the most embarrassing thing currently in your search history?", imposter: "What is something you have googled that immediately made you feel judged by the internet?" },
  { normal: "What is a lie you have told so many times you started believing it yourself?", imposter: "What is a version of yourself you have convinced others you are but definitely are not?" },
  { normal: "What is the most creative way you have ever procrastinated?", imposter: "What is the most chaotic thing you have done to avoid doing something important?" },
  { normal: "What is something that sounds completely illegal but is totally fine?", imposter: "What is something that sounds completely fine but is actually illegal?" },
  { normal: "What is your most controversial food opinion?", imposter: "What food opinion do you hold that you know could genuinely end a friendship?" },
  { normal: "What is the worst advice you have ever given someone with full confidence?", imposter: "What is advice someone gave you that you nodded at and then completely ignored?" },
  { normal: "What is the most awkward situation you have walked into and had no idea how to leave?", imposter: "What is the most socially chaotic thing you have done entirely by accident?" },
  { normal: "What is something you have strong feelings about that is completely trivial?", imposter: "What genuinely important thing are you surprisingly and shamefully indifferent about?" },
  { normal: "What is a habit you have that would horrify your younger self?", imposter: "What is something your younger self believed that you are now lowkey ashamed of?" },
  { normal: "What is the most dramatic thing you have done over something completely minor?", imposter: "What is something genuinely serious that you handled with zero urgency?" },
  { normal: "What is the best lie you have ever told with complete confidence?", imposter: "What is a lie you told that completely spiralled out of your control?" },
  { normal: "What is something you are weirdly and unnecessarily competitive about?", imposter: "What is something most people are competitive about that you genuinely could not care less about?" },
  { normal: "What is something from your childhood you now realise was actually quite strange?", imposter: "What is something you did as a kid that adults around you should have been way more concerned about?" },
  { normal: "What is the most creative excuse you have given for being late?", imposter: "What is the most ridiculous but true reason you were late that nobody believed?" },
  { normal: "What is something you own that you have never used but absolutely refuse to throw away?", imposter: "What is something you threw away and immediately deeply regretted?" },
  { normal: "What is a movie or show everyone loves that you genuinely cannot stand?", imposter: "What is something you pretend to like because explaining why you don't is too exhausting?" },
  { normal: "What is the most unhinged thing you convinced yourself was a good idea?", imposter: "What is the most impulsive decision you have ever made that you have zero regrets about?" },
  { normal: "What is a compliment that somehow makes you feel slightly worse?", imposter: "What is the most backhanded compliment you have given someone while keeping a completely straight face?" },
  { normal: "What is something you are weirdly proud of that most people would not understand?", imposter: "What is something you did that you are oddly ashamed of but can't stop thinking about?" },
  { normal: "What is the most embarrassing thing you have done at a party?", imposter: "What is the most chaotic party story you have that involves someone else but was definitely your fault?" },
  { normal: "What is your hottest take that nobody around you agrees with?", imposter: "What opinion do you hold that you know would get you cancelled if you said it out loud?" },
  { normal: "What small thing instantly makes you trust a person?", imposter: "What tiny thing instantly makes you lose all respect for someone?" },
  { normal: "What is the most impulsive purchase you have ever made?", imposter: "What is the most ridiculous thing you have spent money on that you told no one about?" },
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
