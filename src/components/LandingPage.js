import React, { useState } from 'react';

const LandingPage = ({ onHostGame, onJoinGame }) => {
  const [playerName, setPlayerName] = useState('Player X');
  const [gameCode, setGameCode] = useState('');

  const handleHostGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name before hosting a game.');
      return;
    }
    onHostGame(playerName.trim());
  };

  const handleJoinGame = () => {
    if (!playerName.trim() || !gameCode.trim()) {
      alert('Please enter your name and a game code.');
      return;
    }
    onJoinGame(playerName.trim(), gameCode.trim().toUpperCase());
  };

  return (
    <section className="page active-page">
      <header>
        <h1>TCG Sandbox</h1>
      </header>
      <footer>
        <p className="instructions">
          Welcome! <br />
          <br />
          Enter your name, then host a new game or join an existing one.<br />
          No game rules are enforced. Manage everything manually with your friends.<br />
          <br />
          May fate be in your hands!
        </p>
      </footer>
      <main>
        <div className="input-group">
          <label htmlFor="playerNameInput">Enter Your Display Name:</label>
          <input
            type="text"
            id="playerNameInput"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>
        <button onClick={handleHostGame}>Host New Game</button>
        <div className="join-game-form">
          <h3>Join Existing Game</h3>
          <div className="input-group">
            <label htmlFor="gameCodeInput">Enter Game Code:</label>
            <input
              type="text"
              id="gameCodeInput"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
            />
          </div>
          <button onClick={handleJoinGame}>Join Game</button>
        </div>
      </main>
      <footer></footer>
    </section>
  );
};

export default LandingPage; 