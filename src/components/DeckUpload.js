import React, { useState, useRef } from 'react';

const DeckUpload = ({ 
  deck, 
  onDeckUpdate, 
  onConfirmDeck, 
  onClearDeck, 
  deckConfirmed, 
  isUploading 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const zipInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    // This would be handled by the parent component through onDeckUpdate
    onDeckUpdate(files);
  };

  const handleZipUpload = (event) => {
    handleFileUpload(event.target.files);
  };

  const handleImageUpload = (event) => {
    handleFileUpload(event.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleConfirmDeck = () => {
    if (deck.length === 0) {
      alert('Please upload some cards to your deck first.');
      return;
    }
    onConfirmDeck();
  };

  const handleClearDeck = () => {
    onClearDeck();
    // Reset file inputs
    if (zipInputRef.current) zipInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <div id="deckUploadSection">
      <h2>
        Your Deck{' '}
        <span id="deckStatusIndicator" className={deckConfirmed ? 'status-ready' : 'status-pending'}>
          {deckConfirmed 
            ? `(Deck Confirmed: ${deck.length} cards)` 
            : deck.length > 0 
              ? `(Previewing: ${deck.length} cards)` 
              : '(Awaiting Upload)'
          }
        </span>
      </h2>
      
      <div id="deckUploadArea" className="deck-upload-controls" style={{ display: deckConfirmed ? 'none' : 'block' }}>
        <p>Upload your deck (all images should be card faces):</p>
        <div className="deck-upload-options">
          <div className="upload-method">
            <label htmlFor="zipUploadInput" className="upload-button-label">
              Upload .ZIP File
            </label>
            <input
              ref={zipInputRef}
              type="file"
              id="zipUploadInput"
              accept=".zip"
              onChange={handleZipUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div className="upload-method">
            <label htmlFor="batchImageUploadInput" className="upload-button-label">
              Upload Batch Images
            </label>
            <input
              ref={imageInputRef}
              type="file"
              id="batchImageUploadInput"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml, image/bmp, image/tiff, image/ico, image/heic, image/heif, image/avif"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <div
          ref={dropZoneRef}
          id="dropZone"
          className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p>Or Drag & Drop .ZIP or Image Files Here</p>
        </div>
      </div>

      <div id="deckPreviewContainer">
        <h3>Deck Preview ({deck.length} cards)</h3>
        <div id="deckPreviewArea" className="deck-preview-grid">
          {deck.length === 0 ? (
            <p className="placeholder-text">
              No cards uploaded yet. Uploaded card thumbnails will appear here.
            </p>
          ) : isUploading ? (
            <p className="placeholder-text">Uploading and processing cards...</p>
          ) : (
            deck.map((card, index) => (
              <div key={card.id || index} className="card-thumbnail-container">
                <img src={card.publicUrl} alt={card.fileName} />
              </div>
            ))
          )}
        </div>
      </div>
      
      <button
        id="confirmDeckButton"
        className="action-button"
        disabled={deck.length === 0 || isUploading}
        onClick={handleConfirmDeck}
      >
        {deckConfirmed ? 'Deck Confirmed' : 'Confirm Deck'}
      </button>
      
      {deckConfirmed && (
        <button
          id="clearDeckButton"
          className="action-button secondary-button"
          onClick={handleClearDeck}
        >
          Upload Different Deck
        </button>
      )}
    </div>
  );
};

export default DeckUpload; 