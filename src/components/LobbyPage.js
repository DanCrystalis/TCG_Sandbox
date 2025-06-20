import React from 'react';
import DeckUpload from './DeckUpload';

const LobbyPage = ({
  gameState,
  currentPlayer,
  onDeckUpdate,
  onConfirmDeck,
  onClearDeck,
  onStartGame,
  isUploading
}) => {
  const shareableLink = `${window.location.origin}${window.location.pathname}?join=${gameState.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      // Optional: Show a toast or alert that link was copied
    }).catch(err => {
      console.warn('Could not copy link automatically:', err);
    });
  };

  const canStartGame = currentPlayer.isHost && 
    gameState.players.length > 0 && 
    gameState.players.every(p => p.deckConfirmed) &&
    gameState.players.length >= 1;

  return (
    <section className="page active-page">
      <header>
        <h1>Game Lobby</h1>
        <div id="sessionInfo">
          <p>Game Code: <strong id="gameCodeDisplay">{gameState.code}</strong></p>
          <p>
            Share this link: 
            <input
              type="text"
              id="shareLinkDisplay"
              readOnly
              value={shareableLink}
              onClick={handleCopyLink}
            />
          </p>
        </div>
      </header>
      <main className="lobby-main-content">
        <div id="playerManagementArea">
          <h2>
            Players in Lobby ({gameState.players.length}/{gameState.maxPlayers})
          </h2>
          <ul id="playerList">
            {gameState.players.map(player => (
              <li key={player.id}>
                <span className="player-name">
                  {player.name} {player.isHost ? '(Host)' : ''} {player.id === currentPlayer.id ? '(You)' : ''}
                </span>
                <span className={`player-status ${player.deckConfirmed ? 'status-ready' : 'status-pending'}`}>
                  {player.deckConfirmed 
                    ? `Deck Ready (${player.deck ? player.deck.length : 0} cards)`
                    : player.deck && player.deck.length > 0 && player.id === currentPlayer.id
                      ? `Previewing (${player.deck.length} cards)`
                      : player.deck && player.deck.length > 0
                        ? `Deck Uploaded (${player.deck.length} cards)`
                        : 'Awaiting Deck'
                  }
                </span>
              </li>
            ))}
          </ul>
        </div>

        <DeckUpload
          deck={currentPlayer.deck}
          onDeckUpdate={onDeckUpdate}
          onConfirmDeck={onConfirmDeck}
          onClearDeck={onClearDeck}
          deckConfirmed={currentPlayer.deckConfirmed}
          isUploading={isUploading}
        />

        {currentPlayer.isHost && (
          <button
            id="startGameButton"
            className="action-button"
            disabled={!canStartGame}
            onClick={onStartGame}
          >
            Start Game (Host Only)
          </button>
        )}
      </main>
      <footer></footer>
    </section>
  );
};

export default LobbyPage; 