document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const landingPage = document.getElementById('landing-page');
    const lobbyPage = document.getElementById('lobby-page');

    // Landing page elements
    const playerNameInput = document.getElementById('playerNameInput');
    const hostGameButton = document.getElementById('hostGameButton');
    const gameCodeInput = document.getElementById('gameCodeInput');
    const joinGameButton = document.getElementById('joinGameButton');

    // Lobby page elements
    const gameCodeDisplay = document.getElementById('gameCodeDisplay');
    const shareLinkDisplay = document.getElementById('shareLinkDisplay');
    const playerListUl = document.getElementById('playerList');
    const playerCountDisplay = document.getElementById('playerCountDisplay');
    const deckStatusIndicator = document.getElementById('deckStatusIndicator');

    const zipUploadInput = document.getElementById('zipUploadInput');
    const batchImageUploadInput = document.getElementById('batchImageUploadInput');
    const dropZone = document.getElementById('dropZone');
    const deckUploadControls = document.getElementById('deckUploadArea');

    const deckPreviewArea = document.getElementById('deckPreviewArea');
    const cardCountDisplay = document.getElementById('cardCountDisplay');
    const confirmDeckButton = document.getElementById('confirmDeckButton');
    const clearDeckButton = document.getElementById('clearDeckButton');
    const startGameButton = document.getElementById('startGameButton');

    const gameBoardPage = document.getElementById('game-board-page');
    const boardGameCodeDisplay = document.getElementById('boardGameCodeDisplay');
    const gameTable = document.getElementById('game-table');
    const leaveGameButton = document.getElementById('leaveGameButton');

    const cardZoomModal = document.getElementById('cardZoomModal');
    const zoomedCardImage = document.getElementById('zoomedCardImage');
    const closeModalButton = document.querySelector('.close-modal-button');

    let playerDecksState = {};
    let playerHandsState = {};
    let playerDiscardsState = {};
    let playerPlayZonesState = {};
    let globalTokenCounter = 0;

    const DRAGGING_CLASS = 'dragging';

    // Ensure labels trigger file input clicks
    const zipUploadLabel = document.querySelector('label[for="zipUploadInput"]');
    if (zipUploadLabel) zipUploadLabel.addEventListener('click', () => zipUploadInput.click());
    const batchImageUploadLabel = document.querySelector('label[for="batchImageUploadInput"]');
    if (batchImageUploadLabel) batchImageUploadLabel.addEventListener('click', () => batchImageUploadInput.click());


    let currentPlayer = {
        id: null,
        name: '',
        isHost: false,
        deck: [],
        deckConfirmed: false,
        life: 22 // Default starting life
    };

    let gameSession = {
        code: null,
        players: [],
        maxPlayers: 4, // Example max players
        gameStarted: false
    };

    // Background cycling functionality
    const backgroundImages = [
        'bg/bg1.jpg',
        'bg/bg2.jpg',
        'bg/bg3.jpg',
        'bg/bg4.jpg',
        'bg/bg5.jpg',
        'bg/bg6.jpg',
        'bg/bg7.jpg',
        'bg/bg8.jpg',
        'bg/bg9.jpg',
        'bg/bg10.jpg',
        'bg/bg11.jpg',
        'bg/bg12.jpg',
        'bg/bg13.jpg',
        'bg/bg14.jpg',
        'bg/bg15.jpg',
        'bg/bg16.jpg',
        'bg/bg17.jpg',
        'bg/bg18.jpg',
        'bg/bg19.jpg',
        'bg/bg20.jpg',
        'bg/bg21.jpg',
        'bg/bg22.jpg',
        'bg/bg23.jpg'
    ];

    let currentBgIndex = 0;

    function updateBackground(direction) {
        if (direction === 'next') {
            currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
        } else {
            currentBgIndex = (currentBgIndex - 1 + backgroundImages.length) % backgroundImages.length;
        }
        document.body.style.backgroundImage = `url('${backgroundImages[currentBgIndex]}')`;
    }

    // Add event listeners for all background control buttons
    document.getElementById('prev-bg').addEventListener('click', () => updateBackground('prev'));
    document.getElementById('next-bg').addEventListener('click', () => updateBackground('next'));

    // Add keyboard shortcuts for background cycling
    document.addEventListener('keydown', (e) => {
        if (e.altKey) {
            if (e.key === 'ArrowLeft') {
                updateBackground('prev');
            } else if (e.key === 'ArrowRight') {
                updateBackground('next');
            }
        }
    });

    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active-page'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active-page');
        } else {
            console.error(`Page with ID "${pageId}" not found.`);
        }
        window.scrollTo(0, 0);
    }

    function generateGameCode() {
        return Math.random().toString(36).substring(2, 7).toUpperCase();
    }

    function updateLobbyUI() {
        if (!gameSession.code || !playerListUl || !playerCountDisplay || !deckStatusIndicator || !startGameButton || !deckUploadControls || !confirmDeckButton || !clearDeckButton) {
            console.warn("Lobby UI update called but some elements are missing.");
            return;
        }

        playerListUl.innerHTML = '';
        gameSession.players.forEach(p => {
            const li = document.createElement('li');
            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name';
            nameSpan.textContent = `${p.name} ${p.isHost ? '(Host)' : ''} ${p.id === currentPlayer.id ? '(You)' : ''}`;
            li.appendChild(nameSpan);

            const statusSpan = document.createElement('span');
            statusSpan.className = 'player-status';
            if (p.deckConfirmed) {
                statusSpan.textContent = `Deck Ready (${p.deck ? p.deck.length : 0} cards)`;
                statusSpan.classList.add('status-ready');
            } else if (p.deck && p.deck.length > 0 && p.id === currentPlayer.id) {
                statusSpan.textContent = `Previewing (${p.deck.length} cards)`;
                statusSpan.classList.add('status-pending');
            } else if (p.deck && p.deck.length > 0) {
                statusSpan.textContent = `Deck Uploaded (${p.deck.length} cards)`; // For other players
                statusSpan.classList.add('status-pending');
            }
            else {
                statusSpan.textContent = `Awaiting Deck`;
                statusSpan.classList.add('status-pending');
            }
            li.appendChild(statusSpan);
            playerListUl.appendChild(li);
        });
        playerCountDisplay.textContent = gameSession.players.length;

        if (currentPlayer.deckConfirmed) {
            deckStatusIndicator.textContent = `(Deck Confirmed: ${currentPlayer.deck.length} cards)`;
            deckStatusIndicator.className = 'status-ready';
        } else if (currentPlayer.deck.length > 0) {
            deckStatusIndicator.textContent = `(Previewing: ${currentPlayer.deck.length} cards)`;
            deckStatusIndicator.className = 'status-pending';
        } else {
            deckStatusIndicator.textContent = `(Awaiting Upload)`;
            deckStatusIndicator.className = 'status-pending';
        }

        if (currentPlayer.isHost) {
            startGameButton.style.display = 'inline-block';
            const allPlayersReady = gameSession.players.length > 0 && gameSession.players.every(p => p.deckConfirmed);
            const enoughPlayers = gameSession.players.length >= 1; // Min 1 player to start (e.g. solo)
            startGameButton.disabled = !(allPlayersReady && enoughPlayers);
        } else {
            startGameButton.style.display = 'none';
        }

        if (currentPlayer.deckConfirmed) {
            deckUploadControls.style.display = 'none';
            confirmDeckButton.disabled = true;
            confirmDeckButton.textContent = 'Deck Confirmed';
            clearDeckButton.style.display = 'inline-block';
        } else {
            deckUploadControls.style.display = 'block';
            confirmDeckButton.disabled = currentPlayer.deck.length === 0;
            confirmDeckButton.textContent = 'Confirm Deck';
            clearDeckButton.style.display = 'none';
        }
    }

    function addPlayerToSession(playerData) {
        if (gameSession.players.length >= gameSession.maxPlayers) {
            alert("Lobby is full.");
            return false;
        }
        // Allow same name if IDs are different (e.g. reconnect), but prevent duplicate active players with same name if ID is different
        if (gameSession.players.some(p => p.name === playerData.name && p.id !== playerData.id)) {
            // This check might be too strict if rejoining is allowed. For now, assume unique names.
            // alert("A player with that name is already in the lobby. Please choose a different name.");
            // return false;
        }

        if (typeof playerData.life === 'undefined') {
            playerData.life = 20; // Default life
        }

        const existingPlayerIndex = gameSession.players.findIndex(p => p.id === playerData.id);
        if (existingPlayerIndex > -1) {
            gameSession.players[existingPlayerIndex] = { ...gameSession.players[existingPlayerIndex], ...playerData };
        } else {
            gameSession.players.push(playerData);
        }
        return true;
    }

    function initializeLobby(isHost) {
        currentPlayer.isHost = isHost;
        currentPlayer.life = 20; // Reset/set life on lobby init

        if (isHost) {
            gameSession.code = generateGameCode();
            gameSession.players = []; // Host always starts with a fresh player list for their game
        } else {
            gameSession.code = gameCodeInput.value.trim().toUpperCase();
            // If joining, we don't clear gameSession.players here.
            // It would be populated by a "server" or host's broadcast in a real app.
            // For this sandbox, if gameSession.players is empty and we join, it'll just be us.
        }


        if (!addPlayerToSession({ ...currentPlayer, deck: currentPlayer.deck || [], deckConfirmed: currentPlayer.deckConfirmed || false })) {
            gameSession.code = null; // Failed to add current player
            return false;
        }

        if (gameCodeDisplay) gameCodeDisplay.textContent = gameSession.code;
        const shareableLink = `${window.location.origin}${window.location.pathname}?join=${gameSession.code}`;
        if (shareLinkDisplay) {
            shareLinkDisplay.value = shareableLink;
            shareLinkDisplay.onclick = () => {
                shareLinkDisplay.select();
                try {
                    document.execCommand('copy');
                    // alert('Link copied to clipboard!'); // Optional feedback
                } catch (err) {
                    console.warn('Could not copy link automatically.');
                }
            }
        }

        showPage('lobby-page');
        updateLobbyUI();
        return true;
    }

    if (hostGameButton) {
        hostGameButton.addEventListener('click', () => {
            const name = playerNameInput.value.trim();
            if (!name) {
                alert('Please enter your display name.');
                playerNameInput.focus();
                return;
            }
            currentPlayer.name = name;
            currentPlayer.id = `player_${Date.now()}`;

            if (initializeLobby(true)) {
                // Bots for local testing
                setTimeout(() => {
                    if (gameSession.players.length < gameSession.maxPlayers && currentPlayer.isHost) {
                        const botBobDeck = Array(30).fill(0).map((_, i) => ({ id: `bot_bob_card_${i}`, imageDataUrl: `https://via.placeholder.com/63x88/ADD8E6/000000?text=Bob${i + 1}`, fileName: `bob_card_${i + 1}.png` }));
                        addPlayerToSession({
                            id: `bot_bob_${Date.now()}`, name: 'Bot Bob', isHost: false, deck: botBobDeck, deckConfirmed: true, life: 20
                        });
                        updateLobbyUI();
                    }
                }, 200);
            }
        });
    }

    if (joinGameButton) {
        joinGameButton.addEventListener('click', () => {
            const name = playerNameInput.value.trim();
            const code = gameCodeInput.value.trim().toUpperCase();
            if (!name) {
                alert('Please enter your display name.');
                playerNameInput.focus();
                return;
            }
            if (!code) {
                alert('Please enter a game code.');
                gameCodeInput.focus();
                return;
            }
            currentPlayer.name = name;
            currentPlayer.id = `player_${Date.now()}`;

            // For a pure client-side sandbox, if joining a code that isn't the one currently
            // "hosted" by this client's gameSession, we effectively start a new local session context.
            // A real app would fetch game state for 'code' from a server.
            if (!gameSession.code || gameSession.code !== code) {
                gameSession.players = []; // Reset players for this new "joined" game context
                // Optionally, one could try to simulate finding other players if this were P2P,
                // but for a simple sandbox, the player joins an "empty" game by this code,
                // or a game the host (if it's this client on another tab) has set up.
            }
            initializeLobby(false); // Current player attempts to join
        });
    }

    async function processFilesForDeck(files) {
        if (!files || files.length === 0) return;
        if (currentPlayer.deck && currentPlayer.deck.length > 0) {
            currentPlayer.deck.forEach(card => {
                if (card.imageDataUrl && card.imageDataUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(card.imageDataUrl);
                }
            });
        }
        currentPlayer.deck = [];
        if (deckPreviewArea) deckPreviewArea.innerHTML = '<p class="placeholder-text">Processing cards...</p>';
        if (confirmDeckButton) confirmDeckButton.disabled = true;

        const newCardObjects = [];
        let cardIdCounter = 0; // Used to ensure unique IDs for cards processed in this batch

        for (const file of Array.from(files)) {
            if (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')) {
                try {
                    const zip = await JSZip.loadAsync(file);
                    const imagePromises = [];
                    zip.forEach((relativePath, zipEntry) => {
                        if (!zipEntry.dir && /\.(jpe?g|png|webp|gif|svg|bmp|tiff|ico|heic|heif|avif)$/i.test(zipEntry.name)) {
                            imagePromises.push(
                                zipEntry.async('blob').then(blob => ({ blob, fileName: zipEntry.name }))
                            );
                        }
                    });
                    const imageBlobs = await Promise.all(imagePromises);
                    imageBlobs.forEach(({ blob, fileName }) => {
                        const cardId = `card_${currentPlayer.id}_${Date.now()}_${cardIdCounter++}`;
                        newCardObjects.push({ id: cardId, imageDataUrl: URL.createObjectURL(blob), fileName });
                    });
                } catch (error) {
                    console.error("Error processing ZIP:", error);
                    alert('Failed to process ZIP file. It might be corrupted or in an unsupported format.');
                }
            } else if (file.type.startsWith('image/')) {
                const cardId = `card_${currentPlayer.id}_${Date.now()}_${cardIdCounter++}`;
                newCardObjects.push({ id: cardId, imageDataUrl: URL.createObjectURL(file), fileName: file.name });
            }
        }
        currentPlayer.deck = newCardObjects;
        renderDeckPreview();

        const playerInSession = gameSession.players.find(p => p.id === currentPlayer.id);
        if (playerInSession) {
            playerInSession.deck = currentPlayer.deck; // Update deck in gameSession
            playerInSession.deckConfirmed = false; // New deck means it needs re-confirmation
        }
        currentPlayer.deckConfirmed = false; // Reset confirmation status
        updateLobbyUI();
    }

    function renderDeckPreview() {
        if (!deckPreviewArea || !cardCountDisplay || !confirmDeckButton) return;
        deckPreviewArea.innerHTML = '';
        if (currentPlayer.deck.length === 0) {
            deckPreviewArea.innerHTML = '<p class="placeholder-text">No cards uploaded yet. Drag & drop images or a ZIP file, or use the buttons.</p>';
            cardCountDisplay.textContent = '0';
            confirmDeckButton.disabled = true;
            return;
        }
        currentPlayer.deck.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card-thumbnail-container';
            const img = document.createElement('img');
            img.src = card.imageDataUrl;
            //img.alt = card.fileName;
            //img.title = card.fileName;
            cardDiv.appendChild(img);
            deckPreviewArea.appendChild(cardDiv);
        });
        cardCountDisplay.textContent = currentPlayer.deck.length;
        confirmDeckButton.disabled = currentPlayer.deck.length === 0;
    }

    if (zipUploadInput) zipUploadInput.addEventListener('change', (event) => processFilesForDeck(event.target.files));
    if (batchImageUploadInput) batchImageUploadInput.addEventListener('change', (event) => processFilesForDeck(event.target.files));

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        dropZone.addEventListener('dragenter', () => dropZone.classList.add('dragover'), false);
        dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'), false); // Keep class while over
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'), false);
        dropZone.addEventListener('drop', (event) => {
            dropZone.classList.remove('dragover');
            processFilesForDeck(event.dataTransfer.files);
        }, false);
    }
    // Prevent body defaults for drag/drop to ensure dropZone gets priority
    ['dragenter', 'dragover', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    document.body.addEventListener('dragleave', (e) => {
        // Only prevent if not related to an actual drop zone
        if (e.target === document.body || !e.relatedTarget || !e.relatedTarget.closest('#dropZone')) {
            // No action or specific logic needed here for body dragleave unless you want body-wide visual feedback
        }
    }, false);


    if (confirmDeckButton) {
        confirmDeckButton.addEventListener('click', () => {
            if (currentPlayer.deck.length === 0) { alert('Please upload some cards to your deck first.'); return; }
            currentPlayer.deckConfirmed = true;
            const playerInSession = gameSession.players.find(p => p.id === currentPlayer.id);
            if (playerInSession) {
                playerInSession.deckConfirmed = true;
                playerInSession.deck = currentPlayer.deck; // Ensure session has the confirmed deck
            }
            updateLobbyUI();
        });
    }

    if (clearDeckButton) {
        clearDeckButton.addEventListener('click', () => {
            if (currentPlayer.deck && currentPlayer.deck.length > 0) {
                currentPlayer.deck.forEach(card => {
                    if (card.imageDataUrl && card.imageDataUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(card.imageDataUrl);
                    }
                });
            }
            currentPlayer.deck = [];
            currentPlayer.deckConfirmed = false;
            const playerInSession = gameSession.players.find(p => p.id === currentPlayer.id);
            if (playerInSession) {
                playerInSession.deckConfirmed = false;
                playerInSession.deck = [];
            }
            if (zipUploadInput) zipUploadInput.value = ''; // Reset file input
            if (batchImageUploadInput) batchImageUploadInput.value = ''; // Reset file input
            renderDeckPreview();
            updateLobbyUI();
        });
    }

    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            if (!currentPlayer.isHost) {
                alert("Only the host can start the game.");
                return;
            }
            const allPlayersReady = gameSession.players.length > 0 && gameSession.players.every(p => p.deckConfirmed);
            const enoughPlayers = gameSession.players.length >= 1; // Min 1 player

            if (!enoughPlayers) {
                alert("Not enough players to start. Minimum is 1.");
                return;
            }
            if (!allPlayersReady) {
                alert('Waiting for all players to confirm their decks.');
                return;
            }
            gameSession.gameStarted = true;
            console.log('Game starting with session:', JSON.parse(JSON.stringify(gameSession)));
            initializeGameBoard(gameSession);
        });
    }

    if (leaveGameButton) {
        leaveGameButton.addEventListener('click', () => {
            if (confirm("Are you sure you want to leave the game? This will end the current session for you.")) {
                if (currentPlayer.deck && currentPlayer.deck.length > 0) {
                    currentPlayer.deck.forEach(card => {
                        if (card.imageDataUrl && card.imageDataUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(card.imageDataUrl);
                        }
                    });
                }
                
                [playerDecksState, playerHandsState, playerDiscardsState, playerPlayZonesState].forEach(stateObject => {
                    Object.values(stateObject).forEach(cardArray => {
                        if (Array.isArray(cardArray)) {
                            cardArray.forEach(card => {
                                if (card && card.imageDataUrl && card.imageDataUrl.startsWith('blob:')) {
                                    URL.revokeObjectURL(card.imageDataUrl);
                                }
                            });
                        }
                    });
                });

                currentPlayer.deck = [];
                currentPlayer.deckConfirmed = false;
                currentPlayer.isHost = false; 
                // currentPlayer.name and .id can persist for re-entry

                // Reset game session state (client-side perspective)
                gameSession.gameStarted = false;
                gameSession.code = null;
                gameSession.players = [];

                // Reset game state variables
                playerDecksState = {};
                playerHandsState = {};
                playerDiscardsState = {};
                playerPlayZonesState = {};
                globalTokenCounter = 0;

                // Update UI
                if (gameCodeDisplay) gameCodeDisplay.textContent = "---";
                if (shareLinkDisplay) shareLinkDisplay.value = "---";
                if (playerListUl) playerListUl.innerHTML = '';
                if (deckPreviewArea) deckPreviewArea.innerHTML = '<p class="placeholder-text">No cards uploaded yet. Drag & drop images or a ZIP file, or use the buttons.</p>';
                if (cardCountDisplay) cardCountDisplay.textContent = '0';
                if (confirmDeckButton) confirmDeckButton.disabled = true;
                if (gameTable) gameTable.innerHTML = ''; // Clear game board

                showPage('landing-page');
                updateLobbyUI();
            }
        });
    }

    window.addEventListener('beforeunload', (event) => {
        // This is a best-effort cleanup.
        if (gameSession.gameStarted || (currentPlayer.deck && currentPlayer.deck.length > 0)) {
            // Optionally, provide a confirmation dialog
            // event.preventDefault(); // Standard for 'beforeunload'
            // event.returnValue = 'Changes you made may not be saved.'; // For older browsers
        }

        // Revoke URLs to prevent memory leaks from unclosed game sessions
        if (currentPlayer.deck) {
            currentPlayer.deck.forEach(card => {
                if (card.imageDataUrl && card.imageDataUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(card.imageDataUrl);
                }
            });
        }
        [playerDecksState, playerHandsState, playerDiscardsState, playerPlayZonesState].forEach(stateObject => {
            Object.values(stateObject).forEach(cardArray => {
                if (Array.isArray(cardArray)) {
                    cardArray.forEach(card => {
                        if (card && card.imageDataUrl && card.imageDataUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(card.imageDataUrl);
                        }
                    });
                }
            });
        });
    });

    // --- Game Board Functions ---
    function createCardElement(cardData, isFaceDown = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-on-board';

        if (!cardData || typeof cardData.id === 'undefined') {
            console.error('createCardElement - ERROR: cardData or cardData.id is undefined!', cardData);
            cardDiv.textContent = 'Error: Card Data Missing';
            cardDiv.style.backgroundColor = 'red';
            cardDiv.style.color = 'white';
            cardDiv.style.padding = '5px';
            cardDiv.dataset.cardId = `error_${Date.now()}`;
            return cardDiv;
        }

        cardDiv.dataset.cardId = cardData.id;
        cardDiv.dataset.fileName = cardData.fileName || 'Unknown Card';
        cardDiv.dataset.isTapped = cardData.isTapped ? cardData.isTapped.toString() : 'false';
        cardDiv.dataset.isFacedown = (cardData.isFacedown !== undefined) ? cardData.isFacedown.toString() : isFaceDown.toString();
        cardDiv.dataset.rotation = cardData.rotation || '0';
        cardDiv.dataset.counters = cardData.counters || '[]';
        cardDiv.draggable = true;

        // Add dragstart event listener to set up data transfer
        cardDiv.addEventListener('dragstart', (event) => {
            cardDiv.classList.add(DRAGGING_CLASS);
            const sourcePlayerId = cardDiv.closest('.player-area')?.dataset.playerId;
            const sourceZoneType = cardDiv.closest('.zone')?.dataset.zoneType;
            
            if (!sourcePlayerId || !sourceZoneType) {
                console.error("Could not determine source player or zone for drag:", cardDiv);
                event.preventDefault();
                return;
            }

            // Create a clone of the card for the drag image
            const dragImage = cardDiv.cloneNode(true);
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            dragImage.style.width = '189px';
            dragImage.style.height = '264px';
            dragImage.style.transform = 'none';
            dragImage.style.opacity = '0.8';
            document.body.appendChild(dragImage);

            // Set the drag image to be centered on the cursor
            const rect = cardDiv.getBoundingClientRect();
            event.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);

            // Remove the temporary element after drag starts
            setTimeout(() => {
                document.body.removeChild(dragImage);
            }, 0);

            const transferData = {
                cardId: cardData.id,
                sourcePlayerId: sourcePlayerId,
                sourceZoneType: sourceZoneType,
                isTapped: cardDiv.dataset.isTapped,
                isFacedown: cardDiv.dataset.isFacedown,
                rotation: cardDiv.dataset.rotation,
                counters: cardDiv.dataset.counters
            };

            event.dataTransfer.setData('application/json', JSON.stringify(transferData));
            event.dataTransfer.effectAllowed = 'move';
        });

        cardDiv.addEventListener('dragend', () => {
            cardDiv.classList.remove(DRAGGING_CLASS);
        });

        const img = document.createElement('img');
        img.src = cardData.imageDataUrl;
        img.alt = cardData.fileName || 'Card Image';
        //img.title = cardData.fileName || 'Card Image';
        img.draggable = false;

        // Create zoom preview element
        const zoomPreview = document.createElement('img');
        zoomPreview.className = 'zoom-preview';
        zoomPreview.src = cardData.imageDataUrl;
        zoomPreview.alt = `${cardData.fileName} (Zoomed)`;
        cardDiv.appendChild(zoomPreview);

        if (cardDiv.dataset.isFacedown === 'true') {
            cardDiv.classList.add('facedown');
            zoomPreview.style.display = 'none';
        }
        if (cardDiv.dataset.isTapped === 'true') cardDiv.classList.add('tapped');
        if (cardDiv.dataset.rotation === '180') cardDiv.classList.add('rotated-180');

        cardDiv.appendChild(img);
        updateCardCountersDisplay(cardDiv);

        // Add hover event listeners for zoom preview positioning
        cardDiv.addEventListener('mousemove', (event) => {
            if (cardDiv.dataset.isFacedown === 'true') return;
            
            const zoomPreview = cardDiv.querySelector('.zoom-preview');
            if (!zoomPreview) return;

            const rect = cardDiv.getBoundingClientRect();
            const mouseX = event.clientX;
            const mouseY = event.clientY;

        });

        const isInDiscardZone = () => {
            const zone = cardDiv.closest('.zone');
            return zone && zone.dataset.zoneType === 'discard';
        };

        // LEFT CLICK: Tap/Untap
        cardDiv.addEventListener('click', (event) => {
            console.log(`Card ${cardDiv.dataset.cardId} left-clicked`);
            if (cardDiv.classList.contains(DRAGGING_CLASS) || event.button !== 0) return; 
            const isTapped = cardDiv.dataset.isTapped === 'true';
            const newTappedState = !isTapped;
            cardDiv.classList.toggle('tapped', newTappedState);
            cardDiv.dataset.isTapped = newTappedState.toString();

            if (newTappedState) {
                cardDiv.dataset.rotation = '90';
            } else {
                if (cardDiv.classList.contains('rotated-180')) {
                    cardDiv.dataset.rotation = '180';
                } else {
                    cardDiv.dataset.rotation = '0';
                }
            }
            console.log(`Card ${cardDiv.dataset.cardId} tapped: ${newTappedState}, rotation: ${cardDiv.dataset.rotation}`);
        });

        // DOUBLE CLICK: Rotate 180 degrees
        cardDiv.addEventListener('dblclick', (event) => {
            console.log(`Card ${cardDiv.dataset.cardId} double-clicked`);
            const isRotated180 = cardDiv.classList.contains('rotated-180');
            const newRotated180State = !isRotated180;
            cardDiv.classList.toggle('rotated-180', newRotated180State);
            if (newRotated180State) {
                cardDiv.dataset.rotation = '180';
            } else {
                cardDiv.dataset.rotation = cardDiv.dataset.isTapped === 'true' ? '90' : '0';
            }
            console.log(`Card ${cardDiv.dataset.cardId} 180-rotated: ${newRotated180State}, rotation: ${cardDiv.dataset.rotation}`);
        });

        // RIGHT CLICK: Context menu
        cardDiv.addEventListener('contextmenu', (event) => {
            console.log(`Card ${cardDiv.dataset.cardId} right-clicked`);
            const actions = [
                { 
                    text: 'Flip Card',
                    action: () => {
                        const isFacedown = cardDiv.dataset.isFacedown === 'true';
                        const newFacedownState = !isFacedown;
                        cardDiv.classList.toggle('facedown', newFacedownState);
                        cardDiv.dataset.isFacedown = newFacedownState.toString();
                        console.log(`Card ${cardDiv.dataset.cardId} flipped: ${newFacedownState}`);
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

                        try {
                            let counters = JSON.parse(cardDiv.dataset.counters || '[]');
                            const existingCounterIndex = counters.findIndex(c => c.type === type);
                            if (existingCounterIndex > -1) {
                                counters[existingCounterIndex].value += value;
                                if (counters[existingCounterIndex].value === 0 && confirm(`Counter '${type}' is now 0. Remove this counter type?`)) {
                                    counters.splice(existingCounterIndex, 1);
                                } else if (counters[existingCounterIndex].value < 0 && confirm(`Counter '${type}' is now negative (${counters[existingCounterIndex].value}). Remove type? (Cancel to keep negative)`)) {
                                    counters.splice(existingCounterIndex, 1);
                                }
                            } else if (value !== 0) {
                                counters.push({ type, value });
                            }
                            cardDiv.dataset.counters = JSON.stringify(counters);
                            updateCardCountersDisplay(cardDiv);
                        } catch (e) { console.error("Error updating counters:", e); alert("Error processing counters."); }
                    }
                },
                { 
                    text: 'Remove Counter Type',
                    action: () => {
                        const countersCurrent = JSON.parse(cardDiv.dataset.counters || '[]');
                        if (countersCurrent.length === 0) { alert("No counters to remove."); return; }
                        const typeToRemove = prompt(`Enter counter type to remove from [${countersCurrent.map(c => c.type).join(', ')}]:`)?.trim();
                        if (!typeToRemove) return;
                        try {
                            let counters = JSON.parse(cardDiv.dataset.counters || '[]');
                            counters = counters.filter(c => c.type !== typeToRemove);
                            cardDiv.dataset.counters = JSON.stringify(counters);
                            updateCardCountersDisplay(cardDiv);
                        } catch (e) { console.error("Error removing counters:", e); }
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
                            const playerId = cardDiv.closest('.player-area')?.dataset.playerId;
                            const zoneType = cardDiv.closest('.zone')?.dataset.zoneType;
                            
                            if (playerId && zoneType) {
                                // Remove from state
                                const stateArray = playerPlayZonesState[playerId];
                                if (stateArray) {
                                    const index = stateArray.findIndex(card => card.id === cardData.id);
                                    if (index > -1) {
                                        stateArray.splice(index, 1);
                                    }
                                }

                                // Remove from DOM
                                cardDiv.remove();

                                // Update zone count
                                const playerArea = document.getElementById(`player-area-${playerId}`);
                                if (playerArea) {
                                    updateZoneCardCount(playerArea, 'play');
                                }
                            }
                        }
                    }
                });
            }
            
            showContextMenu(event, actions);
        });

        return cardDiv;
    }

    function updateCardCountersDisplay(cardDiv) {
        if (!cardDiv) return;
        let countersContainer = cardDiv.querySelector('.counters-container');
        if (!countersContainer) {
            countersContainer = document.createElement('div');
            countersContainer.className = 'counters-container';
            cardDiv.appendChild(countersContainer);
        }
        countersContainer.innerHTML = '';

        try {
            const counters = JSON.parse(cardDiv.dataset.counters || '[]');
            counters.forEach(counter => {
                if (counter.value === 0) return;
                const badge = document.createElement('div');
                badge.className = 'counter-badge';
                badge.textContent = `${counter.type}: ${counter.value}`;
                badge.title = `${counter.value} ${counter.type} counters`;
                countersContainer.appendChild(badge);
            });
        } catch (e) {
            console.error("Error parsing counters data for display:", e, cardDiv.dataset.counters);
        }
    }

    function updateZoneCardCount(playerAreaElement, zoneType) {
        if (!playerAreaElement) { console.warn("updateZoneCardCount: playerAreaElement is null"); return; }
        const playerId = playerAreaElement.dataset.playerId;
        if (!playerId) { console.warn("Player ID not found on playerAreaElement for zone count update:", playerAreaElement); return; }

        let count = 0;
        const countElement = playerAreaElement.querySelector(`.${zoneType}-zone .card-count`);

        if (zoneType === 'deck') {
            count = playerDecksState[playerId]?.length || 0;
            if (countElement) countElement.textContent = count;
        } else if (zoneType === 'hand') {
            count = playerHandsState[playerId]?.length || 0;
            const handZoneContainer = playerAreaElement.querySelector(`#hand-zone-${playerId} .cards-in-zone-container`);
            if (handZoneContainer) {
                const currentCardElements = handZoneContainer.querySelectorAll('.card-on-board');
                const placeholder = handZoneContainer.querySelector('.placeholder-text');
                if (currentCardElements.length === 0 && !placeholder) {
                    const pText = document.createElement('span');
                    pText.className = 'placeholder-text';
                    pText.textContent = 'Hand';
                    handZoneContainer.appendChild(pText);
                } else if (currentCardElements.length > 0 && placeholder) {
                    placeholder.remove();
                }
            }
        } else if (zoneType === 'discard') {
            count = playerDiscardsState[playerId]?.length || 0;
            if (countElement) countElement.textContent = count;
            const discardCardsContainer = playerAreaElement.querySelector(`#discard-zone-${playerId} .cards-in-zone-container`);
            if (discardCardsContainer) {
                const currentCardElements = discardCardsContainer.querySelectorAll('.card-on-board');
                const placeholder = discardCardsContainer.querySelector('.placeholder-text');
                if (currentCardElements.length === 0 && !placeholder) {
                } else if (currentCardElements.length > 0 && placeholder) {
                    placeholder.remove();
                }
            }

        } else if (zoneType === 'play') {
            count = playerPlayZonesState[playerId]?.length || 0; 

            const playZoneElem = playerAreaElement.querySelector(`#play-zone-${playerId}`); 
            if (playZoneElem) {
                const row1Container = playZoneElem.querySelector(`#play-zone-${playerId}-row1`);
                const row2Container = playZoneElem.querySelector(`#play-zone-${playerId}-row2`);

                [row1Container, row2Container].forEach((container, index) => {
                    if (container) {
                        const currentCardElementsInRow = container.querySelectorAll('.card-on-board');
                        const placeholderInRow = container.querySelector('.placeholder-text');
                        const rowName = index === 0 ? "Manifest Row" : "Aether Row";

                        if (currentCardElementsInRow.length === 0 && !placeholderInRow) {
                            const pText = document.createElement('span');
                            pText.className = 'placeholder-text';
                            pText.textContent = rowName;
                            container.appendChild(pText);
                        } else if (currentCardElementsInRow.length > 0 && placeholderInRow) {
                            placeholderInRow.remove();
                        }
                    }
                });
            }
        }

        const statsBar = playerAreaElement.querySelector('.player-stats');
        if (statsBar) {
            const handCount = playerHandsState[playerId]?.length || 0;
            const deckCount = playerDecksState[playerId]?.length || 0;
            const discardCount = playerDiscardsState[playerId]?.length || 0;
            const playCountTotal = playerPlayZonesState[playerId]?.length || 0;
            statsBar.textContent = `Hand: ${handCount} | Deck: ${deckCount} | Discard: ${discardCount} | Play: ${playCountTotal}`;
        }
    }
    function drawCard(playerId) {
        if (!playerDecksState[playerId] || playerDecksState[playerId].length === 0) {
            console.log(`Player ${playerId} has no cards left to draw.`);
            return;
        }
        const cardData = playerDecksState[playerId].shift(); 
        if (!cardData) {
            console.error("Tried to draw a card, but cardData was undefined."); return;
        }
        console.log(`drawCard - Player: ${playerId}, cardData being drawn:`, JSON.parse(JSON.stringify(cardData)));

        if (!playerHandsState[playerId]) playerHandsState[playerId] = [];
        playerHandsState[playerId].push(cardData);

        const playerAreaElement = document.getElementById(`player-area-${playerId}`);
        if (playerAreaElement) {
            const handZone = playerAreaElement.querySelector('.hand-zone');
            const handZoneContainer = handZone?.querySelector('.cards-in-zone-container');
            if (handZoneContainer) {
                const placeholder = handZoneContainer.querySelector('.placeholder-text');
                if (placeholder && playerHandsState[playerId].length >= 1) placeholder.remove(); 
                const cardElement = createCardElement(cardData, false);
                handZoneContainer.appendChild(cardElement);
            }
            updateZoneCardCount(playerAreaElement, 'deck');
            updateZoneCardCount(playerAreaElement, 'hand');
        } else {
            console.error(`Player area for ${playerId} not found to draw card into.`);
        }
    }

    function initializeGameBoard(sessionData) {
        playerDecksState = {};
        playerHandsState = {};
        playerDiscardsState = {};
        playerPlayZonesState = {};

        gameTable.innerHTML = '';
        gameTable.style.display = 'flex';

        showPage('game-board-page');

        boardGameCodeDisplay.textContent = sessionData.code;

        const localPlayer = sessionData.players.find(p => p.id === currentPlayer.id);
        const otherPlayers = sessionData.players.filter(p => p.id !== currentPlayer.id);
        const orderedPlayers = localPlayer ? [...otherPlayers, localPlayer] : [...otherPlayers];

        orderedPlayers.forEach(player => {
            playerDecksState[player.id] = [...player.deck]; 
            playerHandsState[player.id] = [];
            playerDiscardsState[player.id] = [];
            playerPlayZonesState[player.id] = [];

            shuffleDeck(player.id);

            const playerArea = document.createElement('div');
            playerArea.className = 'player-area';
            playerArea.id = `player-area-${player.id}`;
            playerArea.dataset.playerId = player.id;
            playerArea.classList.toggle('current-player-area', player.id === currentPlayer.id);
            playerArea.classList.toggle('opponent-player-area', player.id !== currentPlayer.id);

            // Player Info Bar (Name, Stats, Life Counter, Create Token Button)
            const infoBar = document.createElement('div');
            infoBar.className = 'player-info-bar';

            const nameDisplay = document.createElement('span');
            nameDisplay.className = 'player-name-display';
            nameDisplay.textContent = `${player.name} ${player.id === currentPlayer.id ? '(You)' : ''}`;
            infoBar.appendChild(nameDisplay);

            const statsDisplay = document.createElement('span');
            statsDisplay.className = 'player-stats';
            infoBar.appendChild(statsDisplay);

            const lifeCounterDiv = document.createElement('div');
            lifeCounterDiv.className = 'life-counter';
            const lifeDisplay = document.createElement('span');
            lifeDisplay.className = 'life-total';
            lifeDisplay.textContent = player.life;
            lifeDisplay.title = `${player.name}'s Life Total`;
            const decreaseLifeButton = document.createElement('button');
            decreaseLifeButton.textContent = '−';
            decreaseLifeButton.className = 'life-button';
            decreaseLifeButton.addEventListener('click', () => {
                player.life--;
                const sessionP = gameSession.players.find(p => p.id === player.id);
                if (sessionP) sessionP.life = player.life;
                lifeDisplay.textContent = player.life;
            });
            const increaseLifeButton = document.createElement('button');
            increaseLifeButton.textContent = '+';
            increaseLifeButton.className = 'life-button';
            increaseLifeButton.addEventListener('click', () => {
                player.life++;
                const sessionP = gameSession.players.find(p => p.id === player.id);
                if (sessionP) sessionP.life = player.life;
                lifeDisplay.textContent = player.life;
            });
            lifeCounterDiv.appendChild(decreaseLifeButton);
            lifeCounterDiv.appendChild(lifeDisplay);
            lifeCounterDiv.appendChild(increaseLifeButton);
            infoBar.appendChild(lifeCounterDiv);

            if (player.id === currentPlayer.id) {
                const createTokenButton = document.createElement('button');
                createTokenButton.textContent = 'Create Token';
                createTokenButton.className = 'action-button create-token-button';
                createTokenButton.addEventListener('click', () => {
                    const rowChoice = prompt("Place token in which row? (1 for Front, 2 for Back)", "1");
                    let targetRowContainer;
                    let targetRowType; 

                    if (rowChoice === "1") {
                        targetRowContainer = playerArea.querySelector(`#play-zone-${player.id}-row1`);
                        targetRowType = 'play-row1';
                    } else if (rowChoice === "2") {
                        targetRowContainer = playerArea.querySelector(`#play-zone-${player.id}-row2`);
                        targetRowType = 'play-row2';
                    } else if (rowChoice !== null) { 
                        alert("Invalid row choice. Token not created.");
                        return;
                    } else { 
                        return;
                    }

                    if (targetRowContainer) {
                        const tokenName = prompt("Enter token name/description (e.g., '1/1 Soldier', 'Treasure'):", "Token");
                        if (tokenName === null) return;

                        const tokenId = `token_${player.id}_${Date.now()}_${globalTokenCounter++}`;
                        const tokenData = {
                            id: tokenId,
                            imageDataUrl: `https://via.placeholder.com/63x88/cccccc/000000?Text=${encodeURIComponent(tokenName.substring(0, 10))}`,
                            fileName: tokenName || `Generic Token ${globalTokenCounter}`,
                            isTapped: 'false', isFacedown: 'false', rotation: '0', counters: '[]'
                        };

                        if (!playerPlayZonesState[player.id]) playerPlayZonesState[player.id] = [];
                        playerPlayZonesState[player.id].push(tokenData); 

                        const tokenElement = createCardElement(tokenData, false);
                        const placeholder = targetRowContainer.querySelector('.placeholder-text');
                        if (placeholder) placeholder.remove();
                        targetRowContainer.appendChild(tokenElement);

                        updateZoneCardCount(playerArea, 'play'); 
                        console.log(`Token ${tokenId} created for player ${player.id} in ${targetRowType}`);
                    } else {
                        console.error(`Target row container not found for player ${player.id} to create token.`);
                    }
                });
                infoBar.appendChild(createTokenButton);
            }
            playerArea.appendChild(infoBar);

            // Zones Layout
            const zonesLayout = document.createElement('div');
            zonesLayout.className = 'zones-layout';

            // Main Zones Row (Play Area + Side Zones)
            const mainZonesRow = document.createElement('div');
            mainZonesRow.className = 'main-zones-row';

            // Play Zone - MODIFIED FOR TWO ROWS
            const playZone = document.createElement('div');
            playZone.className = 'zone play-zone';
            playZone.id = `play-zone-${player.id}`; 
            playZone.dataset.zoneType = 'play'; 

           // const playZoneLabel = document.createElement('div');
           // playZoneLabel.className = 'zone-label';
            //playZoneLabel.textContent = 'Play Area';
          //  playZone.appendChild(playZoneLabel);

            const playZoneRow1 = document.createElement('div');
            playZoneRow1.className = 'play-zone-row cards-in-zone-container'; 
            playZoneRow1.id = `play-zone-${player.id}-row1`;
            playZoneRow1.dataset.zoneType = 'play-row1'; 
            playZoneRow1.dataset.ownerPlayerId = player.id; 
            playZoneRow1.innerHTML = `<span class="placeholder-text">Manifest Row</span>`;
            addDropZoneEventListeners(playZoneRow1, player.id, 'play-row1'); 
            playZone.appendChild(playZoneRow1);

            const playZoneRow2 = document.createElement('div');
            playZoneRow2.className = 'play-zone-row cards-in-zone-container';
            playZoneRow2.id = `play-zone-${player.id}-row2`;
            playZoneRow2.dataset.zoneType = 'play-row2';
            playZoneRow2.dataset.ownerPlayerId = player.id;
            playZoneRow2.innerHTML = `<span class="placeholder-text">Aether Row</span>`;
            addDropZoneEventListeners(playZoneRow2, player.id, 'play-row2'); 
            playZone.appendChild(playZoneRow2);

            mainZonesRow.appendChild(playZone);

            // Side Zones (Deck and Discard)
            const sideZones = document.createElement('div');
            sideZones.className = 'side-zones';
            const deckZone = document.createElement('div');
            deckZone.className = 'zone deck-zone';
            deckZone.id = `deck-zone-${player.id}`;
            deckZone.dataset.zoneType = 'deck';
            deckZone.title = "Click to draw a card, right-click for deck actions";
            deckZone.innerHTML = `<div class="zone-label">Deck</div>`;
            deckZone.addEventListener('click', () => drawCard(player.id));
            addDeckManipulationMenu(deckZone, player.id);
            sideZones.appendChild(deckZone);

            const discardZone = document.createElement('div');
            discardZone.className = 'zone discard-zone';
            discardZone.id = `discard-zone-${player.id}`;
            discardZone.dataset.zoneType = 'discard';
            discardZone.innerHTML = `<div class="zone-label">Discard</div><div class="cards-in-zone-container stacked-cards-display"></div>`;
            addDropZoneEventListeners(discardZone, player.id, 'discard');
            sideZones.appendChild(discardZone);
            mainZonesRow.appendChild(sideZones);

            zonesLayout.appendChild(mainZonesRow);

            // Hand Zone
            const handZone = document.createElement('div');
            handZone.className = 'zone hand-zone';
            handZone.id = `hand-zone-${player.id}`;
            handZone.dataset.zoneType = 'hand';
            handZone.innerHTML = `<div class="cards-in-zone-container"><span class="placeholder-text">Hand</span></div>`;
            addDropZoneEventListeners(handZone, player.id, 'hand');
            zonesLayout.appendChild(handZone);

            playerArea.appendChild(zonesLayout);
            gameTable.appendChild(playerArea);

            
            updateZoneCardCount(playerArea, 'deck');
            updateZoneCardCount(playerArea, 'hand');
            updateZoneCardCount(playerArea, 'discard');
            updateZoneCardCount(playerArea, 'play');
        });

        showPage('game-board-page');

        orderedPlayers.forEach(player => {
            if (!player || !player.id) return;
            const startingHandSize = 0;
            for (let i = 0; i < startingHandSize; i++) {
                if (playerDecksState[player.id]?.length > 0) {
                    drawCard(player.id);
                } else {
                    break;
                }
            }
        });
        console.log("Game board initialized with two-row play areas.");
    }

    function addCardToTargetState(cardData, targetPlayerId, targetZoneType) {
        if (!cardData) {
            console.error("addCardToTargetState Error: cardData is null/undefined.");
            return false;
        }

        let actualTargetZoneTypeForStateResolution = targetZoneType; 

        if (targetZoneType === 'play-row1' || targetZoneType === 'play-row2') {
            actualTargetZoneTypeForStateResolution = 'play';
        }

        console.log(`Before switch in addCardToTargetState: originalTargetZoneType = "${targetZoneType}", actualTargetZoneTypeForStateResolution = "${actualTargetZoneTypeForStateResolution}"`);

        let targetArray;

        switch (actualTargetZoneTypeForStateResolution) { 
            case 'hand':
                if (!playerHandsState[targetPlayerId]) {
                    playerHandsState[targetPlayerId] = [];
                }
                targetArray = playerHandsState[targetPlayerId];
                break;
            case 'play': 
                if (!playerPlayZonesState[targetPlayerId]) {
                    playerPlayZonesState[targetPlayerId] = [];
                }
                targetArray = playerPlayZonesState[targetPlayerId];
                break;
            case 'discard':
                if (!playerDiscardsState[targetPlayerId]) {
                    playerDiscardsState[targetPlayerId] = [];
                }
                targetArray = playerDiscardsState[targetPlayerId];
                break;
            default:
                console.error(
                    `addCardToTargetState Error: Unknown resolved target zone type for state. Original: "${targetZoneType}", Resolved: "${actualTargetZoneTypeForStateResolution}"`
                );
                return false;
        }

        if (!targetArray) {
            console.error(
                `addCardToTargetState Error: targetArray is undefined after switch. Original: "${targetZoneType}", Resolved: "${actualTargetZoneTypeForStateResolution}"`
            );
            return false;
        }

        targetArray.push(cardData);
        console.log(`addCardToTargetState: Card ${cardData.id} added to player ${targetPlayerId}'s state for zone ${actualTargetZoneTypeForStateResolution} (original target: ${targetZoneType})`);
        return true;
    }

    function findAndRemoveCardFromSourceState(cardId, sourcePlayerId, sourceZoneType) {
        let sourceArray;
        let actualSourceZoneTypeForState = sourceZoneType;
        if (sourceZoneType === 'play-row1' || sourceZoneType === 'play-row2') {
            actualSourceZoneTypeForState = 'play';
        }

        switch (actualSourceZoneTypeForState) {
            case 'hand':
                sourceArray = playerHandsState[sourcePlayerId];
                break;
            case 'play': 
                sourceArray = playerPlayZonesState[sourcePlayerId];
                break;
            case 'discard':
                sourceArray = playerDiscardsState[sourcePlayerId];
                break;
            case 'deck':
                sourceArray = playerDecksState[sourcePlayerId];
                break;
            default:
                console.error('Unknown source zone type for state:', sourceZoneType, '(mapped to:', actualSourceZoneTypeForState, ')');
                return null;
        }

        if (!sourceArray) {
            console.error(`Source state array not found for player ${sourcePlayerId}, effective zone ${actualSourceZoneTypeForState} (original: ${sourceZoneType})`);
            return null;
        }

        const cardIndex = sourceArray.findIndex(card => card.id === cardId);
        if (cardIndex > -1) {
            return sourceArray.splice(cardIndex, 1)[0];
        }

        console.warn(`Card ${cardId} not found in source state array for ${actualSourceZoneTypeForState} (original: ${sourceZoneType}) for player ${sourcePlayerId}`);
        return null;
    }

    function addDropZoneEventListeners(zoneElement, ownerPlayerId, zoneType) {
        zoneElement.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            zoneElement.classList.add('drop-target-highlight');
        });
        zoneElement.addEventListener('dragenter', (event) => {
            event.preventDefault();
            zoneElement.classList.add('drop-target-highlight');
        });
        zoneElement.addEventListener('dragleave', (event) => {
            if (!event.relatedTarget || !zoneElement.contains(event.relatedTarget)) {
                zoneElement.classList.remove('drop-target-highlight');
            }
        });
        zoneElement.addEventListener('drop', (event) => {
            event.preventDefault();
            zoneElement.classList.remove('drop-target-highlight');

            const dataString = event.dataTransfer.getData('application/json');
            if (!dataString) { console.error("No data transferred on drop!"); return; }

            let transferredData;
            try {
                transferredData = JSON.parse(dataString);
            } catch (e) { console.error("Failed to parse transferred data on drop:", e, dataString); return; }

            const { cardId, sourcePlayerId, sourceZoneType, ...originalCardState } = transferredData;

            if (!cardId || !sourcePlayerId || typeof sourceZoneType === 'undefined') {
                console.error("Incomplete data in drop transfer:", transferredData);
                return;
            }

            const targetPlayerId = ownerPlayerId;
            const targetZoneType = zoneType;

            const draggedCardElement = document.querySelector(`.card-on-board[data-card-id="${cardId}"]`);
            if (!draggedCardElement) { console.error("Dropped card element not found in DOM:", cardId); return; }

            if (draggedCardElement.parentElement === zoneElement && sourcePlayerId === targetPlayerId && sourceZoneType === targetZoneType) {
                console.log("Card dropped into its current exact DOM location. No change.");
                return;
            }

            const cardData = findAndRemoveCardFromSourceState(cardId, sourcePlayerId, sourceZoneType);

            if (cardData) {
                const cardToMove = {
                    ...cardData,
                    isTapped: originalCardState.isTapped || 'false',
                    isFacedown: originalCardState.isFacedown || 'false',
                    rotation: originalCardState.rotation || '0',
                    counters: originalCardState.counters || '[]'
                };

                if (addCardToTargetState(cardToMove, targetPlayerId, targetZoneType)) {
                    let targetCardsContainer;
                    if (zoneType.startsWith('play-row')) {
                        targetCardsContainer = zoneElement;
                    } else {
                        targetCardsContainer = zoneElement.querySelector('.cards-in-zone-container');
                    }

                    if (!targetCardsContainer) {
                        console.error("Critical Error: Target cards container not found in zone:", zoneElement, "for zoneType:", targetZoneType);
                        addCardToTargetState(cardData, sourcePlayerId, sourceZoneType);
                        const sourcePlayerArea = document.getElementById(`player-area-${sourcePlayerId}`);
                        if (sourcePlayerArea) {
                            const mainSourceZoneForCount = sourceZoneType.startsWith('play-row') ? 'play' : sourceZoneType;
                            updateZoneCardCount(sourcePlayerArea, mainSourceZoneForCount);
                        }
                        return;
                    }

                    const placeholder = targetCardsContainer.querySelector('.placeholder-text');
                    if (placeholder) placeholder.remove();

                    // Update card element's dataset for visual consistency before appending
                    draggedCardElement.dataset.isTapped = cardToMove.isTapped;
                    draggedCardElement.dataset.isFacedown = cardToMove.isFacedown;
                    draggedCardElement.dataset.rotation = cardToMove.rotation;
                    draggedCardElement.dataset.counters = cardToMove.counters;
                    
                    // Update classes based on the card's state
                    draggedCardElement.classList.toggle('tapped', cardToMove.isTapped === 'true');
                    draggedCardElement.classList.toggle('facedown', cardToMove.isFacedown === 'true');
                    draggedCardElement.classList.toggle('rotated-180', cardToMove.rotation === '180');

                    updateCardCountersDisplay(draggedCardElement);

                    targetCardsContainer.appendChild(draggedCardElement);

                    // Update counts for source and target player areas
                    const sourcePlayerArea = document.getElementById(`player-area-${sourcePlayerId}`);
                    if (sourcePlayerArea) {
                        const mainSourceZoneForCount = sourceZoneType.startsWith('play-row') ? 'play' : sourceZoneType;
                        updateZoneCardCount(sourcePlayerArea, mainSourceZoneForCount);
                        if (mainSourceZoneForCount === 'play') updateZoneCardCount(sourcePlayerArea, 'play');
                    }

                    const targetPlayerAreaElem = document.getElementById(`player-area-${targetPlayerId}`);
                    if (targetPlayerAreaElem) {
                        const mainTargetZoneForCount = targetZoneType.startsWith('play-row') ? 'play' : targetZoneType;
                        updateZoneCardCount(targetPlayerAreaElem, mainTargetZoneForCount);
                        if (mainTargetZoneForCount === 'play') updateZoneCardCount(targetPlayerAreaElem, 'play');
                    }

                    console.log(`Moved ${cardId} from ${sourcePlayerId}'s ${sourceZoneType} to ${targetPlayerId}'s ${targetZoneType}`);
                } else {
                    console.error("Failed to add card to target state. Reverting state change.");
                    addCardToTargetState(cardData, sourcePlayerId, sourceZoneType);
                }
            } else {
                console.error(`Card data for ${cardId} not found in source state or remove failed. Source: ${sourcePlayerId}'s ${sourceZoneType}`);
            }
        });
    }

    // Deck Manipulation Functions
    function shuffleDeck(playerId) {
        if (!playerDecksState[playerId] || playerDecksState[playerId].length === 0) {
            console.log(`Player ${playerId} has no cards to shuffle.`);
            return;
        }
        
        // Fisher-Yates shuffle algorithm
        const deck = playerDecksState[playerId];
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
            
            // Randomly assign orientation to each card
            const orientations = ['0', '180'];
            deck[i].rotation = orientations[Math.floor(Math.random() * orientations.length)];
            deck[j].rotation = orientations[Math.floor(Math.random() * orientations.length)];
        }
        
        // Update UI
        const playerAreaElement = document.getElementById(`player-area-${playerId}`);
        if (playerAreaElement) {
            updateZoneCardCount(playerAreaElement, 'deck');
        }
    }

    function addDeckManipulationMenu(deckZone, playerId) {
        deckZone.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const actions = [
                {
                    text: 'Shuffle Deck',
                    action: () => shuffleDeck(playerId)
                }
            ];
            showContextMenu(event, actions);
        });
    }

    // Add this function after the preventDefaults function
    function createContextMenu(items) {
        // Remove any existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Create new context menu
        const menu = document.createElement('div');
        menu.className = 'context-menu';

        items.forEach(item => {
            if (item === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                menu.appendChild(separator);
                return;
            }

            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            if (item.disabled) {
                menuItem.classList.add('disabled');
            }
            menuItem.textContent = item.text;
            
            if (item.shortcut) {
                const shortcut = document.createElement('span');
                shortcut.className = 'shortcut';
                shortcut.textContent = item.shortcut;
                menuItem.appendChild(shortcut);
            }

            if (!item.disabled) {
                menuItem.addEventListener('click', () => {
                    menu.remove();
                    item.action();
                });
            }

            menu.appendChild(menuItem);
        });

        document.body.appendChild(menu);
        return menu;
    }

    function showContextMenu(event, items) {
        event.preventDefault();
        const menu = createContextMenu(items);
        
        // Position the menu at the cursor
        const x = event.clientX;
        const y = event.clientY;
        
        // Ensure menu stays within viewport
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let finalX = x;
        let finalY = y;
        
        if (x + rect.width > viewportWidth) {
            finalX = viewportWidth - rect.width;
        }
        
        if (y + rect.height > viewportHeight) {
            finalY = viewportHeight - rect.height;
        }
        
        menu.style.left = `${finalX}px`;
        menu.style.top = `${finalY}px`;
        menu.classList.add('active');

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // Use setTimeout to avoid immediate trigger
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    // Fullscreen functionality
    const fullscreenButton = document.getElementById('fullscreenButton');
    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                });
                fullscreenButton.classList.add('fullscreen');
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                    fullscreenButton.classList.remove('fullscreen');
                }
            }
        });

        // Update button state when fullscreen changes
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                fullscreenButton.classList.add('fullscreen');
            } else {
                fullscreenButton.classList.remove('fullscreen');
            }
        });
    }

    // Initial page display
    showPage('landing-page');
    renderDeckPreview(); // Show initial placeholder in deck preview
    updateLobbyUI(); // Initialize lobby UI elements even if no game active

    // Handle joining via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const joinCodeFromUrl = urlParams.get('join');
    if (joinCodeFromUrl && gameCodeInput && playerNameInput) {
        gameCodeInput.value = joinCodeFromUrl.toUpperCase();
        playerNameInput.focus();
        // alert(`Attempting to join game: ${joinCodeFromUrl}. Please enter your name and click 'Join Game'.`);
        // Clear the ?join= parameter from URL to prevent re-joining on refresh
        if (window.history.replaceState) {
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        }
    }
});