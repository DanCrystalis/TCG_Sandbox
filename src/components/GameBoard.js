import React, { useState, useEffect } from 'react';
import PlayerArea from './PlayerArea';
import { ACTION_TYPES } from '../types/gameState';

const GameBoard = ({
  gameState,
  currentPlayer,
  onCardMove,
  onCardAction,
  onDrawCard,
  onLifeChange,
  onEnergyChange,
  onCreateToken,
  onLeaveGame
}) => {
  const [previewZoom, setPreviewZoom] = useState(1.8);
  const [cardSize, setCardSize] = useState(1);
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Load background images
  useEffect(() => {
    const loadBackgroundImages = async () => {
      try {
        const response = await fetch('/bg');
        const files = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(files, 'text/html');
        const links = doc.getElementsByTagName('a');

        const images = Array.from(links)
          .map(link => link.href)
          .filter(href => {
            const ext = href.split('.').pop().toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
          })
          .map(href => href.split('/').pop());

        setBackgroundImages(images);
        if (images.length > 0) {
          document.body.style.backgroundImage = `url('bg/${images[0]}')`;
        }
      } catch (error) {
        console.error('Error loading background images:', error);
      }
    };

    loadBackgroundImages();
  }, []);

  // Update background
  const updateBackground = (direction) => {
    if (backgroundImages.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentBgIndex + 1) % backgroundImages.length;
    } else {
      newIndex = (currentBgIndex - 1 + backgroundImages.length) % backgroundImages.length;
    }
    
    setCurrentBgIndex(newIndex);
    document.body.style.backgroundImage = `url('bg/${backgroundImages[newIndex]}')`;
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) {
        if (e.key === 'ArrowLeft') {
          updateBackground('prev');
        } else if (e.key === 'ArrowRight') {
          updateBackground('next');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentBgIndex, backgroundImages]);

  // Update CSS variables for zoom and card size
  useEffect(() => {
    document.documentElement.style.setProperty('--preview-zoom', previewZoom.toString());
    document.documentElement.style.setProperty('--card-size', cardSize.toString());
  }, [previewZoom, cardSize]);

  // Determine player order (current player at bottom)
  const localPlayerIndex = gameState.players.findIndex(p => p.id === currentPlayer.id);
  const orderedPlayers = localPlayerIndex === -1 ? gameState.players : [
    ...gameState.players.slice(localPlayerIndex),
    ...gameState.players.slice(0, localPlayerIndex)
  ].reverse();

  const handleCardClick = (cardData, event) => {
    const zone = event.target.closest('.zone');
    if (!zone || zone.dataset.zoneType !== 'play') return;

    const playerId = zone.closest('.player-area').dataset.playerId;
    onCardAction?.(ACTION_TYPES.TOGGLE_TAP, {
      playerId: playerId,
      cardId: cardData.id
    });
  };

  const handleCardDoubleClick = (cardData, event) => {
    const playerId = event.target.closest('.player-area').dataset.playerId;
    onCardAction?.(ACTION_TYPES.TOGGLE_ROTATE_180, {
      playerId: playerId,
      cardId: cardData.id
    });
  };

  const handleCardRightClick = (cardData, event) => {
    const zone = event.target.closest('.zone');
    if (zone?.classList.contains('discard-zone')) return;

    const actions = [
      {
        text: 'Flip Card',
        action: () => {
          const playerId = event.target.closest('.player-area').dataset.playerId;
          const zoneType = zone.dataset.zoneType;
          onCardAction?.(ACTION_TYPES.FLIP_CARD, {
            playerId: playerId,
            cardId: cardData.id,
            zoneType: zoneType
          });
        }
      },
      {
        text: 'Add/Modify Counter',
        action: () => {
          const type = prompt("Enter counter type (e.g., +1/+1, DMG, LOYAL):")?.trim();
          if (!type) return;
          const valueStr = prompt(`Enter value for ${type} counter (e.g., 1, -1, 5):`, "1");
          const value = parseInt(valueStr);
          if (isNaN(value)) { alert("Invalid value."); return; }

          const playerId = event.target.closest('.player-area').dataset.playerId;
          onCardAction?.(ACTION_TYPES.MODIFY_COUNTERS, {
            playerId: playerId,
            cardId: cardData.id,
            counterType: type,
            value: value
          });
        }
      }
    ];

    // Add Remove Token option if this is a token
    if (cardData.id.startsWith('token_')) {
      actions.push('separator');
      actions.push({
        text: 'Remove Token',
        action: () => {
          if (confirm('Are you sure you want to remove this token?')) {
            const playerId = event.target.closest('.player-area')?.dataset.playerId;
            const zoneType = zone.dataset.zoneType;
            if (playerId && zoneType) {
              onCardAction?.('REMOVE_TOKEN', {
                playerId: playerId,
                cardId: cardData.id,
                zoneType: zoneType
              });
            }
          }
        }
      });
    }

    // Show context menu (you might want to create a separate context menu component)
    console.log('Context menu actions:', actions);
  };

  const handleDragStart = (cardData, event) => {
    const sourcePlayerId = event.target.closest('.player-area')?.dataset.playerId;
    let sourceZoneType = event.target.closest('.zone')?.dataset.zoneType;
    
    if (sourceZoneType === 'play' && cardData.row) {
      sourceZoneType = `play-row${cardData.row === 'row2' ? '2' : '1'}`;
    }

    const transferData = {
      cardId: cardData.id,
      sourcePlayerId: sourcePlayerId,
      sourceZoneType: sourceZoneType,
      isTapped: cardData.isTapped,
      isFacedown: cardData.isFacedown,
      rotation: cardData.rotation,
      counters: cardData.counters
    };

    event.dataTransfer.setData('application/json', JSON.stringify(transferData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    // Handle drag end if needed
  };

  const handleDrop = (transferredData, targetZoneType, event) => {
    const targetPlayerId = event.target.closest('.player-area').dataset.playerId;
    
    onCardMove?.({
      type: ACTION_TYPES.MOVE_CARD,
      payload: {
        cardId: transferredData.cardId,
        source: {
          playerId: transferredData.sourcePlayerId,
          zone: transferredData.sourceZoneType,
        },
        target: {
          playerId: targetPlayerId,
          zone: targetZoneType,
          dropX: event.clientX
        }
      }
    });
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <section className="page">
      <header>
        <h1>TCG Sandbox</h1>
        <div id="gameInfo">
          <p>Game Code: <span id="boardGameCodeDisplay">{gameState.code}</span></p>
          
          <button 
            className="bg-control-button" 
            title="Previous Background"
            onClick={() => updateBackground('prev')}
          >
            ←
          </button>
          <label className="bg-label">Background</label>
          <button 
            className="bg-control-button" 
            title="Next Background"
            onClick={() => updateBackground('next')}
          >
            →
          </button>
          
          <div className="game-controls">
            <div className="control-group">
              <label htmlFor="previewZoomSlider">Zoom:</label>
              <input
                type="range"
                id="previewZoomSlider"
                min="1"
                max="3"
                step="0.1"
                value={previewZoom}
                onChange={(e) => setPreviewZoom(parseFloat(e.target.value))}
              />
              <span id="previewZoomValue">{previewZoom}x</span>
            </div>
            
            <div className="control-group">
              <label htmlFor="cardSizeSlider">Card Size:</label>
              <input
                type="range"
                id="cardSizeSlider"
                min="0.5"
                max="1.5"
                step="0.1"
                value={cardSize}
                onChange={(e) => setCardSize(parseFloat(e.target.value))}
              />
              <span id="cardSizeValue">{Math.round(cardSize * 100)}%</span>
            </div>
            
            <button 
              className="action-button" 
              title="Toggle Fullscreen"
              onClick={handleFullscreen}
            >
              ⛶
            </button>
            
            <button 
              className="action-button secondary-button"
              onClick={onLeaveGame}
            >
              Leave Game
            </button>
          </div>
        </div>
      </header>
      
      <main id="game-table">
        {orderedPlayers.map(player => (
          <PlayerArea
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayer.id}
            gameState={gameState}
            onCardClick={handleCardClick}
            onCardDoubleClick={handleCardDoubleClick}
            onCardRightClick={handleCardRightClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onDrawCard={onDrawCard}
            onLifeChange={onLifeChange}
            onEnergyChange={onEnergyChange}
            onCreateToken={onCreateToken}
          />
        ))}
      </main>
      
      <footer>
        <p>Game in progress. All actions are manual.</p>
      </footer>
    </section>
  );
};

export default GameBoard; 