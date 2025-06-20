import React, { useState } from 'react';

const Card = ({ 
  cardData, 
  isFaceDown = false, 
  onCardClick, 
  onCardDoubleClick, 
  onCardRightClick,
  onDragStart,
  onDragEnd,
  isDragging = false
}) => {
  const [showZoomPreview, setShowZoomPreview] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  if (!cardData || typeof cardData.id === 'undefined') {
    return (
      <div 
        className="card-on-board error-card"
        style={{ backgroundColor: 'red', color: 'white', padding: '5px' }}
        data-card-id={`error_${Date.now()}`}
      >
        Error: Card Data Missing
      </div>
    );
  }

  const handleMouseMove = (event) => {
    if (cardData.isFacedown === 'true') return;

    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    setZoomPosition({ x: mouseX, y: mouseY });
  };

  const handleMouseEnter = () => {
    if (cardData.isFacedown !== 'true') {
      setShowZoomPreview(true);
    }
  };

  const handleMouseLeave = () => {
    setShowZoomPreview(false);
  };

  const handleClick = (event) => {
    if (isDragging || event.button !== 0) return;
    onCardClick?.(cardData, event);
  };

  const handleDoubleClick = (event) => {
    onCardDoubleClick?.(cardData, event);
  };

  const handleRightClick = (event) => {
    event.preventDefault();
    onCardRightClick?.(cardData, event);
  };

  const handleDragStart = (event) => {
    onDragStart?.(cardData, event);
  };

  const handleDragEnd = (event) => {
    onDragEnd?.(cardData, event);
  };

  const imageUrl = cardData.imageDataUrl || cardData.publicUrl;
  const isFacedown = cardData.isFacedown === 'true' || isFaceDown;
  const isTapped = cardData.isTapped === 'true';
  const isRotated180 = cardData.rotation === '180';

  return (
    <div
      className={`card-on-board ${isDragging ? 'dragging' : ''} ${isFacedown ? 'facedown' : ''} ${isTapped ? 'tapped' : ''} ${isRotated180 ? 'rotated-180' : ''}`}
      data-card-id={cardData.id}
      data-file-name={cardData.fileName || 'Unknown Card'}
      data-is-tapped={cardData.isTapped || 'false'}
      data-is-facedown={cardData.isFacedown !== undefined ? cardData.isFacedown : isFaceDown.toString()}
      data-rotation={cardData.rotation || '0'}
      data-counters={cardData.counters || '[]'}
      draggable={true}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!isFacedown && showZoomPreview && (
        <img
          className="zoom-preview"
          src={imageUrl}
          alt={`${cardData.fileName} (Zoomed)`}
          style={{
            position: 'fixed',
            left: zoomPosition.x + 10,
            top: zoomPosition.y - 100,
            zIndex: 1000,
            width: '200px',
            height: 'auto',
            pointerEvents: 'none'
          }}
        />
      )}

      <img
        src={imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjMiIGhlaWdodD0iODgiIHZpZXdCb3g9IjAgMCA2MyA4OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYzIiBoZWlnaHQ9Ijg4IiBmaWxsPSIjY2NjY2NjIi8+Cjx0ZXh0IHg9IjMxLjUiIHk9IjQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMDAwIj5Ccm9rZW4gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo='}
        alt={cardData.fileName || 'Card Image'}
        draggable={false}
      />

      {/* Counters Display */}
      {cardData.counters && cardData.counters.length > 0 && (
        <div className="counters-container">
          {JSON.parse(cardData.counters || '[]').map((counter, index) => (
            counter.value !== 0 && (
              <div key={index} className="counter-badge" title={`${counter.value} ${counter.type} counters`}>
                {counter.type}: {counter.value}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default Card; 