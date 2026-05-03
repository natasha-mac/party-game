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
  { normal: "What is the best vacation spot you've ever been to?", imposter: "What is the most overrated tourist destination?" },
  { normal: "What superpower would you love to have?", imposter: "What superpower would actually be a curse to have?" },
  { normal: "Name a food you could eat every single day.", imposter: "Name a food you find genuinely disgusting." },
  { normal: "What is the best pet to own?", imposter: "What is the worst possible animal to have as a pet?" },
  { normal: "What is the most attractive quality in a partner?", imposter: "What is the biggest dealbreaker in a relationship?" },
  { normal: "If you won the lottery, what's the first thing you'd buy?", imposter: "What is the dumbest way someone could blow their lottery winnings?" },
  { normal: "What is your favorite movie of all time?", imposter: "What movie do you think is completely overrated?" },
  { normal: "What is a secret talent you have?", imposter: "What is something you are hilariously bad at?" },
  { normal: "Who is your celebrity crush?", imposter: "Which celebrity do you find the most annoying?" },
  { normal: "What is the best way to spend a Sunday?", imposter: "What is the most soul-crushing way to spend a Sunday?" },
  { normal: "What is your go-to karaoke song?", imposter: "What song makes you immediately want to leave the room?" },
  { normal: "What is the best compliment you've ever received?", imposter: "What is the most backhanded compliment someone gave you?" },
  { normal: "What is a childhood memory you cherish?", imposter: "What is something you were terrified of as a kid?" },
  { normal: "What is the best piece of advice you've ever received?", imposter: "What is the worst advice someone has ever given you?" },
  { normal: "What is your dream job?", imposter: "What job sounds like your personal hell?" },
  { normal: "What is your most embarrassing habit?", imposter: "What habit of yours would drive a roommate crazy?" },
  { normal: "What is the best gift you've ever received?", imposter: "What is the worst gift someone has ever given you?" },
  { normal: "What is your ultimate comfort food?", imposter: "What food do people love that you think is disgusting?" },
  { normal: "What is your ideal first date?", imposter: "What would be the most awkward first date scenario?" },
  { normal: "What is the funniest thing that has ever happened to you?", imposter: "What is the most embarrassing thing that has happened to you in public?" },
  { normal: "What is a show you can rewatch endlessly?", imposter: "What popular show do you think is genuinely terrible?" },
  { normal: "What is your favorite season and why?", imposter: "What season makes you absolutely miserable?" },
  { normal: "What would you do with a free weekend and no responsibilities?", imposter: "What daily task do you wish you never had to do again?" },
  { normal: "Name a skill you wish you had.", imposter: "Name a skill that is completely useless in real life." },
  { normal: "What is the best holiday tradition?", imposter: "What holiday tradition do you secretly hate?" },
  { normal: "What is your go-to pump-up song?", imposter: "What song do you think is terrible but everyone loves?" },
  { normal: "What is something you are genuinely proud of?", imposter: "What is something you did that you are low-key ashamed of?" },
  { normal: "What is the best type of weather?", imposter: "What type of weather makes you want to stay in bed all day?" },
  { normal: "What is the best app on your phone?", imposter: "What app do you think is a complete waste of time?" },
  { normal: "What animal would you be if you could choose?", imposter: "What animal do you think is overrated or kind of creepy?" },
  { normal: "What is your favorite thing about yourself?", imposter: "What is something you would change about yourself?" },
  { normal: "What is a book that changed your life?", imposter: "What book do you think is massively overhyped?" },
  { normal: "What is the best cuisine in the world?", imposter: "What cuisine do you think is the most overrated?" },
  { normal: "What is one thing you could not live without?", imposter: "What do people treat as a necessity that you think is pointless?" },
  { normal: "What is the best social media platform?", imposter: "What social media platform do you think is the most toxic?" },
  { normal: "What is a place you dream of visiting?", imposter: "What travel destination do you have zero interest in?" },
  { normal: "What is the best way to exercise?", imposter: "What form of exercise sounds like absolute torture?" },
  { normal: "What is something that always makes you laugh?", imposter: "What do people find funny that you genuinely don't get?" },
  { normal: "What is your go-to order at a restaurant?", imposter: "What is a dish you would never order at a restaurant?" },
  { normal: "What is the most romantic gesture?", imposter: "What romantic gesture would actually make you cringe?" },
  { normal: "What would you do with an extra hour every day?", imposter: "What daily task do you wish someone else would do for you?" },
  { normal: "What is the best thing about your hometown?", imposter: "What is the most boring thing about your hometown?" },
  { normal: "What is a movie that genuinely made you cry?", imposter: "What movie do people cry at that you found ridiculous?" },
  { normal: "What is your favorite thing to do at a party?", imposter: "What is the most annoying thing people do at parties?" },
  { normal: "What is the best genre of music?", imposter: "What music genre could you absolutely not stand?" },
  { normal: "What is the best way to start your morning?", imposter: "What makes a morning feel completely ruined?" },
  { normal: "What is the nicest thing a stranger has done for you?", imposter: "What is something strangers do that annoys you?" },
  { normal: "What is a life goal you are working toward?", imposter: "What is a goal society expects you to have that you don't care about?" },
  { normal: "What is the best invention of the last 50 years?", imposter: "What modern invention do you think has made life worse?" },
  { normal: "What is your favorite thing about your best friend?", imposter: "What is something a friend did that you never fully forgave?" },
  { normal: "What is the most fun you've had with no money?", imposter: "What experience was way too expensive and not worth it?" },
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
        Object.keys(room.players).forEach(id => {
          if (id !== room.imposterId) room.players[id].score += 5;
        });
      } else {
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
