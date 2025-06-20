import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from './hooks/useSupabase';
import { GAME_PAGES, ACTION_TYPES } from './types/gameState';
import LandingPage from './components/LandingPage';
import LobbyPage from './components/LobbyPage';
import GameBoard from './components/GameBoard';

const App = () => {
  const [currentPage, setCurrentPage] = useState(GAME_PAGES.LANDING);
  const [currentPlayer, setCurrentPlayer] = useState({
    id: null,
    name: '',
    isHost: false,
    deck: [],
    deckConfirmed: false,
    life: 22,
    energy: 0
  });
  const [gameState, setGameState] = useState({
    code: null,
    players: [],
    maxPlayers: 4,
    gameStarted: false,
    playerDecks: {},
    playerHands: {},
    playerDiscards: {},
    playerPlayZones: {}
  });
  const [isUploading, setIsUploading] = useState(false);

  const {
    hostGame,
    syncGameStateToServer,
    connectToGameChannel,
    disconnectFromGameChannel,
    uploadCardImages
  } = useSupabase();

  // Load saved player info from session storage
  useEffect(() => {
    const savedPlayerInfo = sessionStorage.getItem('tcg-player-info');
    if (savedPlayerInfo) {
      try {
        const parsedInfo = JSON.parse(savedPlayerInfo);
        if (parsedInfo.id && parsedInfo.name) {
          setCurrentPlayer(prev => ({
            ...prev,
            id: parsedInfo.id,
            name: parsedInfo.name
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved player info', e);
        sessionStorage.removeItem('tcg-player-info');
      }
    }
  }, []);

  // Handle URL parameters for joining games
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCodeFromUrl = urlParams.get('join');
    if (joinCodeFromUrl) {
      // Pre-fill the join code in the landing page
      // This will be handled by the LandingPage component
    }
  }, []);

  const handleHostGame = useCallback(async (playerName) => {
    try {
      const playerData = {
        ...currentPlayer,
        name: playerName,
        id: `player_${Date.now()}`,
        isHost: true,
        deck: [],
        deckConfirmed: false,
        life: 22,
        energy: 0
      };

      setCurrentPlayer(playerData);
      sessionStorage.setItem('tcg-player-info', JSON.stringify({ 
        id: playerData.id, 
        name: playerData.name 
      }));

      const { gameCode, gameState: initialGameState } = await hostGame(playerData);
      
      setGameState({
        ...initialGameState,
        code: gameCode
      });

      // Connect to game channel
      connectToGameChannel(gameCode, (newGameState) => {
        setGameState(newGameState);
        
        // Update current player from new state
        const me = newGameState.players.find(p => p.id === playerData.id);
        if (me) {
          setCurrentPlayer(prev => ({
            ...prev,
            deckConfirmed: me.deckConfirmed,
            deck: me.deck,
            isHost: me.isHost,
            life: me.life,
            energy: me.energy
          }));
        }
      });

      setCurrentPage(GAME_PAGES.LOBBY);
    } catch (error) {
      console.error('Error hosting game:', error);
      alert(`Could not create the game: ${error.message}`);
    }
  }, [currentPlayer, hostGame, connectToGameChannel]);

  const handleJoinGame = useCallback(async (playerName, gameCode) => {
    try {
      const playerData = {
        ...currentPlayer,
        name: playerName,
        id: `player_${Date.now()}`,
        isHost: false,
        deck: [],
        deckConfirmed: false,
        life: 22,
        energy: 0
      };

      setCurrentPlayer(playerData);
      sessionStorage.setItem('tcg-player-info', JSON.stringify({ 
        id: playerData.id, 
        name: playerData.name 
      }));

      setGameState(prev => ({ ...prev, code: gameCode }));

      // Connect to game channel first
      connectToGameChannel(gameCode, (newGameState) => {
        setGameState(newGameState);
        
        // Update current player from new state
        const me = newGameState.players.find(p => p.id === playerData.id);
        if (me) {
          setCurrentPlayer(prev => ({
            ...prev,
            deckConfirmed: me.deckConfirmed,
            deck: me.deck,
            isHost: me.isHost,
            life: me.life,
            energy: me.energy
          }));
        }
      });

      // Send join action
      await syncGameStateToServer({
        gameCode,
        type: ACTION_TYPES.JOIN_GAME,
        payload: { newPlayer: playerData }
      });

      setCurrentPage(GAME_PAGES.LOBBY);
    } catch (error) {
      console.error('Error joining game:', error);
      alert(`Could not join the game: ${error.message}`);
    }
  }, [currentPlayer, syncGameStateToServer, connectToGameChannel]);

  const handleDeckUpdate = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      const uploadedCards = await uploadCardImages(files, currentPlayer.id);
      setCurrentPlayer(prev => ({
        ...prev,
        deck: uploadedCards,
        deckConfirmed: false
      }));
    } catch (error) {
      console.error('Error uploading cards:', error);
      alert('Failed to upload cards. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [currentPlayer.id, uploadCardImages]);

  const handleConfirmDeck = useCallback(async () => {
    if (currentPlayer.deck.length === 0) {
      alert('Please upload some cards to your deck first.');
      return;
    }

    try {
      await syncGameStateToServer({
        gameCode: gameState.code,
        type: ACTION_TYPES.CONFIRM_DECK,
        payload: {
          playerId: currentPlayer.id,
          deck: currentPlayer.deck
        }
      });
    } catch (error) {
      console.error('Error confirming deck:', error);
      alert(`Failed to confirm deck: ${error.message}`);
    }
  }, [currentPlayer, gameState.code, syncGameStateToServer]);

  const handleClearDeck = useCallback(async () => {
    try {
      await syncGameStateToServer({
        gameCode: gameState.code,
        type: ACTION_TYPES.CLEAR_DECK,
        payload: {
          playerId: currentPlayer.id
        }
      });
    } catch (error) {
      console.error('Error clearing deck:', error);
      alert(`Failed to clear deck: ${error.message}`);
    }
  }, [currentPlayer.id, gameState.code, syncGameStateToServer]);

  const handleStartGame = useCallback(async () => {
    if (!currentPlayer.isHost) {
      alert("Only the host can start the game.");
      return;
    }

    const allPlayersReady = gameState.players.length > 0 && 
      gameState.players.every(p => p.deckConfirmed);
    const enoughPlayers = gameState.players.length >= 1;
    
    if (!allPlayersReady || !enoughPlayers) {
      alert('Waiting for all players to confirm their decks, or not enough players.');
      return;
    }

    try {
      await syncGameStateToServer({
        gameCode: gameState.code,
        type: ACTION_TYPES.START_GAME
      });
    } catch (error) {
      console.error('Error starting game:', error);
      alert(`Failed to start game: ${error.message}`);
    }
  }, [currentPlayer.isHost, gameState, syncGameStateToServer]);

  const handleLeaveGame = useCallback(async () => {
    if (confirm("Are you sure you want to leave the game? This will end the current session for you.")) {
      try {
        if (gameState.code) {
          await syncGameStateToServer({
            gameCode: gameState.code,
            type: ACTION_TYPES.LEAVE_GAME,
            payload: { playerId: currentPlayer.id }
          });
        }
      } catch (error) {
        console.error('Error leaving game:', error);
      } finally {
        // Clean up
        disconnectFromGameChannel();
        sessionStorage.removeItem('tcg-player-info');
        
        setCurrentPlayer({
          id: null,
          name: '',
          isHost: false,
          deck: [],
          deckConfirmed: false,
          life: 22,
          energy: 0
        });
        
        setGameState({
          code: null,
          players: [],
          maxPlayers: 4,
          gameStarted: false,
          playerDecks: {},
          playerHands: {},
          playerDiscards: {},
          playerPlayZones: {}
        });
        
        setCurrentPage(GAME_PAGES.LANDING);
      }
    }
  }, [gameState.code, currentPlayer.id, syncGameStateToServer, disconnectFromGameChannel]);

  // Handle game state updates
  useEffect(() => {
    if (gameState.gameStarted) {
      setCurrentPage(GAME_PAGES.GAME_BOARD);
    } else if (gameState.code && !gameState.gameStarted) {
      setCurrentPage(GAME_PAGES.LOBBY);
    }
  }, [gameState.gameStarted, gameState.code]);

  const handleCardMove = useCallback(async (action) => {
    try {
      await syncGameStateToServer({
        gameCode: gameState.code,
        ...action
      });
    } catch (error) {
      console.error('Error moving card:', error);
      alert(`Failed to move card: ${error.message}`);
    }
  }, [gameState.code, syncGameStateToServer]);

  const handleCardAction = useCallback(async (actionType, payload) => {
    try {
      await syncGameStateToServer({
        gameCode: gameState.code,
        type: actionType,
        payload
      });
    } catch (error) {
      console.error('Error performing card action:', error);
      alert(`Failed to perform action: ${error.message}`);
    }
  }, [gameState.code, syncGameStateToServer]);

  const handleDrawCard = useCallback(async (playerId) => {
    try {
      await syncGameStateToServer({
        gameCode: gameState.code,
        type: ACTION_TYPES.DRAW_CARD,
        payload: { playerId }
      });
    } catch (error) {
      console.error('Error drawing card:', error);
      alert(`Failed to draw card: ${error.message}`);
    }
  }, [gameState.code, syncGameStateToServer]);

  const handleLifeChange = useCallback(async (playerId, newLife) => {
    // This could be optimized to batch updates
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === playerId ? { ...p, life: newLife } : p
      )
    }));
  }, []);

  const handleEnergyChange = useCallback(async (playerId, newEnergy) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === playerId ? { ...p, energy: newEnergy } : p
      )
    }));
  }, []);

  const handleCreateToken = useCallback((playerId) => {
    const rowChoice = prompt("Place token in which row? (1 for Front, 2 for Back)", "1");
    if (!rowChoice) return;

    const tokenName = prompt("Enter token name/description (e.g., '1/1 Soldier', 'Treasure'):", "Token");
    if (!tokenName) return;

    const tokenId = `token_${playerId}_${Date.now()}_${Math.random()}`;
    const tokenData = {
      id: tokenId,
      imageDataUrl: `https://via.placeholder.com/63x88/cccccc/000000?Text=${encodeURIComponent(tokenName.substring(0, 10))}`,
      fileName: tokenName,
      isTapped: 'false',
      isFacedown: 'false',
      rotation: '0',
      counters: '[]',
      row: rowChoice === '2' ? 'row2' : 'row1'
    };

    // Add token to play zone
    setGameState(prev => ({
      ...prev,
      playerPlayZones: {
        ...prev.playerPlayZones,
        [playerId]: [...(prev.playerPlayZones[playerId] || []), tokenData]
      }
    }));
  }, []);

  return (
    <div id="app-container">
      {currentPage === GAME_PAGES.LANDING && (
        <LandingPage
          onHostGame={handleHostGame}
          onJoinGame={handleJoinGame}
        />
      )}
      
      {currentPage === GAME_PAGES.LOBBY && (
        <LobbyPage
          gameState={gameState}
          currentPlayer={currentPlayer}
          onDeckUpdate={handleDeckUpdate}
          onConfirmDeck={handleConfirmDeck}
          onClearDeck={handleClearDeck}
          onStartGame={handleStartGame}
          isUploading={isUploading}
        />
      )}
      
      {currentPage === GAME_PAGES.GAME_BOARD && (
        <GameBoard
          gameState={gameState}
          currentPlayer={currentPlayer}
          onCardMove={handleCardMove}
          onCardAction={handleCardAction}
          onDrawCard={handleDrawCard}
          onLifeChange={handleLifeChange}
          onEnergyChange={handleEnergyChange}
          onCreateToken={handleCreateToken}
          onLeaveGame={handleLeaveGame}
        />
      )}
    </div>
  );
};

export default App; 