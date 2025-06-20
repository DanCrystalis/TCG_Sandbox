import React from 'react';
import Card from './Card';
import { ZONE_TYPES } from '../types/gameState';

const PlayerArea = ({
  player,
  isCurrentPlayer,
  gameState,
  onCardClick,
  onCardDoubleClick,
  onCardRightClick,
  onDragStart,
  onDragEnd,
  onDrop,
  onDrawCard,
  onLifeChange,
  onEnergyChange,
  onCreateToken
}) => {
  const handCards = gameState.playerHands[player.id] || [];
  const deckCards = gameState.playerDecks[player.id] || [];
  const discardCards = gameState.playerDiscards[player.id] || [];
  const playCards = gameState.playerPlayZones[player.id] || [];

  const row1Cards = playCards.filter(card => card.row === 'row1');
  const row2Cards = playCards.filter(card => card.row === 'row2');

  const handleDrop = (zoneType, event) => {
    event.preventDefault();
    const dataString = event.dataTransfer.getData('application/json');
    if (!dataString) return;

    try {
      const transferredData = JSON.parse(dataString);
      onDrop?.(transferredData, zoneType, event);
    } catch (e) {
      console.error("Failed to parse transferred data on drop:", e);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
  };

  const handleLifeChange = (delta) => {
    onLifeChange?.(player.id, player.life + delta);
  };

  const handleEnergyChange = (delta) => {
    onEnergyChange?.(player.id, (player.energy || 0) + delta);
  };

  return (
    <div 
      className={`player-area ${isCurrentPlayer ? 'current-player-area' : 'opponent-player-area'}`}
      id={`player-area-${player.id}`}
      data-player-id={player.id}
    >
      {/* Player Info Bar */}
      <div className="player-info-bar">
        <span className="player-name-display">
          {player.name} {isCurrentPlayer ? '(You)' : ''}
        </span>
        
        <span className="player-stats">
          Hand: {handCards.length} | Deck: {deckCards.length} | Discard: {discardCards.length} | Play: {playCards.length}
        </span>

        {/* Life Counter */}
        <div className="life-counter">
          <button 
            className="life-button" 
            onClick={() => handleLifeChange(-1)}
          >
            −
          </button>
          <span className="life-total" title={`${player.name}'s Life Total`}>
            {player.life}
          </span>
          <button 
            className="life-button" 
            onClick={() => handleLifeChange(1)}
          >
            +
          </button>
        </div>

        {/* Energy Counter */}
        <div className="life-counter energy-counter">
          <button 
            className="life-button" 
            onClick={() => handleEnergyChange(-1)}
          >
            −
          </button>
          <span className="life-total" title={`${player.name}'s Energy`}>
            {player.energy || 0}
          </span>
          <button 
            className="life-button" 
            onClick={() => handleEnergyChange(1)}
          >
            +
          </button>
        </div>

        {/* Create Token Button (only for current player) */}
        {isCurrentPlayer && (
          <button 
            className="action-button create-token-button"
            onClick={() => onCreateToken?.(player.id)}
          >
            Create Token
          </button>
        )}
      </div>

      {/* Zones Layout */}
      <div className="zones-layout">
        {/* Main Zones Row */}
        <div className="main-zones-row">
          {/* Play Zone */}
          <div className="zone play-zone" id={`play-zone-${player.id}`} data-zone-type={ZONE_TYPES.PLAY}>
            {/* Manifest Row */}
            <div 
              className="play-zone-row cards-in-zone-container"
              id={`play-zone-${player.id}-row1`}
              data-zone-type={ZONE_TYPES.PLAY_ROW1}
              data-owner-player-id={player.id}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(ZONE_TYPES.PLAY_ROW1, e)}
            >
              {row1Cards.length === 0 ? (
                <span className="placeholder-text">Manifest Row</span>
              ) : (
                row1Cards.map(card => (
                  <Card
                    key={card.id}
                    cardData={card}
                    onCardClick={onCardClick}
                    onCardDoubleClick={onCardDoubleClick}
                    onCardRightClick={onCardRightClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))
              )}
            </div>

            {/* Aether Row */}
            <div 
              className="play-zone-row cards-in-zone-container"
              id={`play-zone-${player.id}-row2`}
              data-zone-type={ZONE_TYPES.PLAY_ROW2}
              data-owner-player-id={player.id}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(ZONE_TYPES.PLAY_ROW2, e)}
            >
              {row2Cards.length === 0 ? (
                <span className="placeholder-text">Aether Row</span>
              ) : (
                row2Cards.map(card => (
                  <Card
                    key={card.id}
                    cardData={card}
                    onCardClick={onCardClick}
                    onCardDoubleClick={onCardDoubleClick}
                    onCardRightClick={onCardRightClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))
              )}
            </div>
          </div>

          {/* Side Zones */}
          <div className="side-zones">
            {/* Deck Zone */}
            <div 
              className="zone deck-zone"
              id={`deck-zone-${player.id}`}
              data-zone-type={ZONE_TYPES.DECK}
              title="Click to draw a card, right-click for deck actions"
              onClick={() => onDrawCard?.(player.id)}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(ZONE_TYPES.DECK, e)}
            >
              <div className="cards-in-zone-container stacked-cards-display">
                {deckCards.length > 0 && (
                  <div className="card-count">{deckCards.length}</div>
                )}
              </div>
            </div>

            {/* Discard Zone */}
            <div 
              className="zone discard-zone"
              id={`discard-zone-${player.id}`}
              data-zone-type={ZONE_TYPES.DISCARD}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(ZONE_TYPES.DISCARD, e)}
            >
              <div className="cards-in-zone-container stacked-cards-display">
                {discardCards.length === 0 ? (
                  <span className="placeholder-text">Discard</span>
                ) : (
                  <>
                    <div className="card-count">{discardCards.length}</div>
                    {discardCards.slice(-1).map(card => (
                      <Card
                        key={card.id}
                        cardData={card}
                        onCardClick={onCardClick}
                        onCardDoubleClick={onCardDoubleClick}
                        onCardRightClick={onCardRightClick}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hand Zone */}
        <div 
          className="zone hand-zone"
          id={`hand-zone-${player.id}`}
          data-zone-type={ZONE_TYPES.HAND}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(ZONE_TYPES.HAND, e)}
        >
          <div className="cards-in-zone-container">
            {handCards.length === 0 ? (
              <span className="placeholder-text">Hand</span>
            ) : (
              handCards.map(card => (
                <Card
                  key={card.id}
                  cardData={card}
                  onCardClick={onCardClick}
                  onCardDoubleClick={onCardDoubleClick}
                  onCardRightClick={onCardRightClick}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerArea; 