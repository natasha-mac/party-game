import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './index.css';

const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/');

function getPlayerId() {
  let id = localStorage.getItem('deceptionPlayerId');
  if (!id) {
    id = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('deceptionPlayerId', id);
  }
  return id;
}
const PLAYER_ID = getPlayerId();

function App() {
  const [gameState, setGameState] = useState(null);
  const [name, setName] = useState(() => localStorage.getItem('deceptionName') || '');
  const [roomCode, setRoomCode] = useState('');
  const [rounds, setRounds] = useState(5);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [vote, setVote] = useState('');
  const [showRole, setShowRole] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const prevStateRef = useRef(null);

  useEffect(() => {
    socket.on('room_update', (data) => {
      if (data.state === 'question' && prevStateRef.current !== 'question') {
        setShowRole(true);
        setTimeout(() => setShowRole(false), 3000);
        setAnswer('');
        setVote('');
      }
      prevStateRef.current = data.state;
      localStorage.setItem('deceptionRoom', data.roomId);
      setReconnecting(false);
      setGameState(data);
    });

    socket.on('error', (msg) => {
      setError(msg);
      setTimeout(() => setError(''), 3000);
    });

    socket.on('reconnect_failed', () => {
      localStorage.removeItem('deceptionRoom');
      setReconnecting(false);
    });

    const tryReconnect = () => {
      const savedRoom = localStorage.getItem('deceptionRoom');
      if (savedRoom) {
        setReconnecting(true);
        socket.emit('reconnect_player', { persistentId: PLAYER_ID, roomCode: savedRoom });
      }
    };

    if (socket.connected) tryReconnect();
    else socket.once('connect', tryReconnect);

    return () => {
      socket.off('room_update');
      socket.off('error');
      socket.off('reconnect_failed');
    };
  }, []);

  const createRoom = () => {
    if (!name.trim()) return setError('Please enter your name');
    localStorage.setItem('deceptionName', name);
    socket.emit('create_room', { name, rounds: Number(rounds), persistentId: PLAYER_ID });
  };

  const joinRoom = () => {
    if (!name.trim()) return setError('Please enter your name');
    if (!roomCode.trim()) return setError('Please enter a room code');
    localStorage.setItem('deceptionName', name);
    socket.emit('join_room', { name, code: roomCode, persistentId: PLAYER_ID });
  };

  const leaveGame = () => {
    socket.emit('leave_room', gameState.roomId);
    localStorage.removeItem('deceptionRoom');
    setGameState(null);
  };

  const startGame = () => socket.emit('start_game', gameState.roomId);
  const nextPhase = () => socket.emit('next_phase', gameState.roomId);
  const submitAnswer = () => {
    if (!answer.trim()) return setError('Please enter an answer');
    socket.emit('submit_answer', { code: gameState.roomId, answer });
  };
  const submitVote = (id) => {
    setVote(id);
    socket.emit('submit_vote', { code: gameState.roomId, voteForId: id });
  };

  const renderPlayerName = (p) => (
    <span style={{ color: p.disconnected ? 'var(--text-muted)' : 'inherit', fontStyle: p.disconnected ? 'italic' : 'normal' }}>
      {p.name}{p.disconnected ? ' (away)' : ''}
    </span>
  );

  if (reconnecting) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center' }}>
        <h3>Reconnecting...</h3>
        <div className="spinner"></div>
      </div>
    );
  }

  const renderHome = () => (
    <div className="glass-panel">
      <h1>Deception Game</h1>
      {error && <div style={{color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}
      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
        <label style={{color: 'var(--text-muted)', whiteSpace: 'nowrap'}}>Rounds</label>
        <input
          type="number"
          min={1}
          max={20}
          value={rounds}
          onChange={(e) => setRounds(Math.min(20, Math.max(1, Number(e.target.value))))}
          style={{marginBottom: 0, textAlign: 'center'}}
        />
      </div>
      <button onClick={createRoom}>Create New Game</button>

      <div style={{textAlign: 'center', margin: '1rem 0', color: 'var(--text-muted)'}}>OR</div>

      <input
        type="text"
        placeholder="Room Code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        maxLength={4}
      />
      <button className="secondary" onClick={joinRoom}>Join Game</button>
    </div>
  );

  const renderLobby = () => (
    <div className="glass-panel">
      <h2>Room Code: <span style={{color: 'var(--primary)', letterSpacing: '2px'}}>{gameState.roomId}</span></h2>
      <h3>Players ({gameState.players.length})</h3>
      <div className="player-list">
        {gameState.players.map(p => (
          <div key={p.id} className="player-item">
            {renderPlayerName(p)}
            <div style={{display: 'flex', gap: '0.5rem'}}>
              {p.isHost && <span className="badge host">Host</span>}
            </div>
          </div>
        ))}
      </div>
      {gameState.me.isHost ? (
        <button onClick={startGame} disabled={gameState.players.filter(p => !p.disconnected).length < 3}>
          {gameState.players.filter(p => !p.disconnected).length < 3 ? 'Need 3+ Players' : 'Start Game'}
        </button>
      ) : (
        <div style={{textAlign: 'center', color: 'var(--text-muted)'}}>
          Waiting for host to start...
        </div>
      )}
    </div>
  );

  const renderQuestion = () => {
    if (showRole) {
      return (
        <div className="glass-panel role-reveal">
          <h3>You are...</h3>
          {gameState.me.role === 'imposter' ? (
            <div className="role-reveal imposter">
              <h2>THE IMPOSTER</h2>
              <p>Blend in! Try not to get caught.</p>
            </div>
          ) : (
            <div className="role-reveal normal">
              <h2>NORMAL</h2>
              <p>Find the imposter among you.</p>
            </div>
          )}
        </div>
      );
    }

    const me = gameState.players.find(p => p.id === gameState.me.id);
    if (me?.hasAnswered) {
      return (
        <div className="glass-panel">
          <h3>Waiting for others...</h3>
          <div className="spinner"></div>
        </div>
      );
    }

    return (
      <div className="glass-panel">
        <div style={{textAlign: 'right', color: 'var(--text-muted)', marginBottom: '1rem'}}>
          Round {gameState.currentRound} / {gameState.maxRounds}
        </div>
        <h2 style={{color: 'var(--secondary)'}}>Question</h2>
        <p className="question-text">{gameState.myQuestion}</p>
        <input
          type="text"
          placeholder="Type your answer here..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
        />
        <button onClick={submitAnswer}>Submit Answer</button>
      </div>
    );
  };

  const renderReveal = () => (
    <div className="glass-panel">
      <div style={{textAlign: 'right', color: 'var(--text-muted)', marginBottom: '1rem'}}>
        Round {gameState.currentRound} / {gameState.maxRounds}
      </div>
      <h2>Answers Revealed</h2>
      <p className="question-text" style={{fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-muted)'}}>
        "{gameState.normalQuestion}"
      </p>
      <div style={{marginBottom: '2rem'}}>
        {gameState.answers.map(a => (
          <div key={a.id} className="answer-card">
            <div className="answer-author">{a.name}</div>
            <p>{a.answer}</p>
          </div>
        ))}
      </div>
      {gameState.me.isHost ? (
        <button onClick={nextPhase}>Start Voting</button>
      ) : (
        <div style={{textAlign: 'center', color: 'var(--text-muted)'}}>
          Discuss! Host will start voting soon.
        </div>
      )}
    </div>
  );

  const renderVoting = () => {
    const me = gameState.players.find(p => p.id === gameState.me.id);
    if (me?.hasVoted) {
      return (
        <div className="glass-panel">
          <h3>Waiting for others to vote...</h3>
          <div className="spinner"></div>
        </div>
      );
    }

    return (
      <div className="glass-panel">
        <div style={{textAlign: 'right', color: 'var(--text-muted)', marginBottom: '1rem'}}>
          Round {gameState.currentRound} / {gameState.maxRounds}
        </div>
        <h2>Who is the Imposter?</h2>
        <p className="question-text" style={{fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-muted)'}}>
          "{gameState.normalQuestion}"
        </p>
        <p style={{textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-muted)'}}>
          The imposter will only be caught if a majority votes for them.
        </p>
        <div className="player-list">
          {gameState.players.filter(p => p.id !== gameState.me.id).map(p => (
            <button
              key={p.id}
              className="secondary"
              onClick={() => submitVote(p.id)}
            >
              Vote for {p.name}{p.disconnected ? ' (away)' : ''}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const imposter = gameState.players.find(p => p.id === gameState.imposterId);
    return (
      <div className="glass-panel">
        <h2 style={{fontSize: '2rem'}}>Round Over!</h2>
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <p style={{fontSize: '1.2rem', color: 'var(--text-muted)'}}>The Imposter was...</p>
          <h3 style={{fontSize: '2.5rem', color: 'var(--danger)', margin: '0.5rem 0'}}>{imposter?.name}</h3>
          <p style={{color: gameState.imposterCaught ? 'var(--success)' : 'var(--danger)'}}>
            {gameState.imposterCaught ? 'Caught! Everyone else gets +5 pts, imposter loses 5 pts.' : 'Survived! Imposter gets +10 pts.'}
          </p>
          <div style={{marginTop: '1.5rem', textAlign: 'left'}}>
            <div className="answer-card">
              <div className="answer-author">Everyone was asked</div>
              <p>"{gameState.normalQuestion}"</p>
            </div>
            <div className="answer-card" style={{borderColor: 'rgba(239,68,68,0.4)'}}>
              <div className="answer-author" style={{color: 'var(--danger)'}}>Imposter was secretly asked</div>
              <p>"{gameState.imposterQuestion}"</p>
            </div>
          </div>
        </div>

        <div className="scoreboard">
          <h3>Current Scores</h3>
          {[...gameState.players].sort((a, b) => b.score - a.score).map(p => (
            <div key={p.id} className="scoreboard-item">
              <span>
                {renderPlayerName(p)}
                {p.id === gameState.imposterId && <span style={{color: 'var(--danger)', fontSize: '0.8rem'}}> (Imposter)</span>}
              </span>
              <span className="score">{p.score} pts</span>
            </div>
          ))}
        </div>

        {gameState.me.isHost && (
          gameState.currentRound >= gameState.maxRounds
            ? <button style={{marginTop: '2rem'}} onClick={nextPhase}>View Final Results</button>
            : <button style={{marginTop: '2rem'}} onClick={startGame}>Next Round</button>
        )}
      </div>
    );
  };

  const renderGameOver = () => {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    return (
      <div className="glass-panel">
        <h2 style={{fontSize: '2.5rem', background: 'linear-gradient(to right, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Game Over!</h2>
        <div style={{textAlign: 'center', margin: '2rem 0'}}>
          <p style={{fontSize: '1.2rem', color: 'var(--text-muted)'}}>The Ultimate Winner is...</p>
          <h3 style={{fontSize: '3rem', margin: '1rem 0'}}>{winner?.name} 👑</h3>
          <p>with {winner?.score} points!</p>
        </div>
        <div className="scoreboard">
          <h3>Final Standings</h3>
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className="scoreboard-item">
              <span>{i === 0 ? '🏆 ' : ''}{renderPlayerName(p)}</span>
              <span className="score">{p.score} pts</span>
            </div>
          ))}
        </div>
        {gameState.me.isHost && (
          <button style={{marginTop: '2rem'}} onClick={startGame}>Play Again</button>
        )}
      </div>
    );
  };

  if (!gameState) return renderHome();

  let screen;
  switch (gameState.state) {
    case 'lobby': screen = renderLobby(); break;
    case 'question': screen = renderQuestion(); break;
    case 'reveal': screen = renderReveal(); break;
    case 'voting': screen = renderVoting(); break;
    case 'results': screen = renderResults(); break;
    case 'game_over': screen = renderGameOver(); break;
    default: return renderHome();
  }

  return (
    <>
      {screen}
      <div style={{textAlign: 'center', marginTop: '1rem'}}>
        <button
          className="secondary"
          style={{width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.9rem', opacity: 0.6}}
          onClick={leaveGame}
        >
          Leave Game
        </button>
      </div>
    </>
  );
}

export default App;
