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
        life: 22, // Default starting life
        energy: 0
    };

    let gameSession = {
        code: null,
        players: [],
        maxPlayers: 4,
        gameStarted: false
    };

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
        'bg/bg23.jpg',
        'bg/bg24.jpg',
        'bg/bg25.jpg',
        'bg/bg26.jpg',
        'bg/bg27.jpg',
        'bg/bg28.jpg',
        'bg/bg29.jpg',
        'bg/bg30.jpg',
        'bg/bg31.jpg',
        'bg/bg32.jpg',
        'bg/bg33.jpg',
        'bg/bg34.jpg',
        'bg/bg35.jpg',
        'bg/bg36.jpg',
        'bg/bg37.jpg',
        'bg/bg38.jpg',
        'bg/bg39.jpg',
        'bg/bg40.jpg',
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
            playerData.life = 22;
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
        currentPlayer.life = 22;

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
                            id: `bot_bob_${Date.now()}`, name: 'Bot Bob', isHost: false, deck: botBobDeck, deckConfirmed: true, life: 22
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
                gameSession.players = [];
            }
            initializeLobby(false);
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
            playerInSession.deck = currentPlayer.deck;
            playerInSession.deckConfirmed = false;
        }
        currentPlayer.deckConfirmed = false; +
            updateLobbyUI();
    }

    function renderDeckPreview() {
        if (!deckPreviewArea || !cardCountDisplay || !confirmDeckButton) return;
        deckPreviewArea.innerHTML = '';
        if (currentPlayer.deck.length === 0) {
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
    ['dragenter', 'dragover', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    document.body.addEventListener('dragleave', (e) => {
        // Only prevent if not related to an actual drop zone
        if (e.target === document.body || !e.relatedTarget || !e.relatedTarget.closest('#dropZone')) {
        }
    }, false);


    if (confirmDeckButton) {
        confirmDeckButton.addEventListener('click', () => {
            if (currentPlayer.deck.length === 0) { alert('Please upload some cards to your deck first.'); return; }
            currentPlayer.deckConfirmed = true;
            const playerInSession = gameSession.players.find(p => p.id === currentPlayer.id);
            if (playerInSession) {
                playerInSession.deckConfirmed = true;
                playerInSession.deck = currentPlayer.deck;
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
            if (zipUploadInput) zipUploadInput.value = '';
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
            const enoughPlayers = gameSession.players.length >= 1;

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

                gameSession.gameStarted = false;
                gameSession.code = null;
                gameSession.players = [];

                playerDecksState = {};
                playerHandsState = {};
                playerDiscardsState = {};
                playerPlayZonesState = {};
                globalTokenCounter = 0;


                if (gameCodeDisplay) gameCodeDisplay.textContent = "---";
                if (shareLinkDisplay) shareLinkDisplay.value = "---";
                if (playerListUl) playerListUl.innerHTML = '';
                if (deckPreviewArea) deckPreviewArea.innerHTML = '<p class="placeholder-text">No cards uploaded yet. Drag & drop images or a ZIP file, or use the buttons.</p>';
                if (cardCountDisplay) cardCountDisplay.textContent = '0';
                if (confirmDeckButton) confirmDeckButton.disabled = true;
                if (gameTable) gameTable.innerHTML = '';

                showPage('landing-page');
                updateLobbyUI();
            }
        });
    }

    window.addEventListener('beforeunload', (event) => {
        if (gameSession.gameStarted || (currentPlayer.deck && currentPlayer.deck.length > 0)) {
        }

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
            document.body.classList.add('is-dragging');
            cardDiv.classList.add(DRAGGING_CLASS);
            const sourcePlayerId = cardDiv.closest('.player-area')?.dataset.playerId;
            const sourceZoneType = cardDiv.closest('.zone')?.dataset.zoneType;

            if (!sourcePlayerId || !sourceZoneType) {
                console.error("Could not determine source player or zone for drag:", cardDiv);
                event.preventDefault();
                return;
            }

            // Create a clone of the card for the drag image, ensuring it's upright
            const dragImage = cardDiv.cloneNode(true);
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            // Remove transform classes to get an upright image for correct dimension reading
            dragImage.classList.remove('tapped', 'rotated-180', 'dragging');
            dragImage.style.transform = 'none';
            dragImage.style.opacity = '0.8';
            document.body.appendChild(dragImage);
            dragImage.offsetHeight;

            // Get the actual dimensions of the upright clone
            const dragImageWidth = dragImage.offsetWidth;
            const dragImageHeight = dragImage.offsetHeight;

            // Set the drag image and center the cursor on it
            event.dataTransfer.setDragImage(dragImage, dragImageWidth / 2, dragImageHeight / 2);

            // Remove the temporary element after drag starts
            setTimeout(() => {
                if (dragImage.parentNode) {
                    document.body.removeChild(dragImage);
                }
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
            document.body.classList.remove('is-dragging');
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

            // Check if card is in hand zone or discard zone
            const zone = cardDiv.closest('.zone');
            if (zone && (zone.dataset.zoneType === 'hand' || zone.dataset.zoneType === 'discard')) return;

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
            // If card is in discard, do nothing and let the event bubble up to the discard zone's handler.
            if (cardDiv.closest('.discard-zone')) {
                return;
            }

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

        // Ensure card is face up when drawn
        cardData.isFacedown = 'false';
        cardData.isTapped = 'false';
        // Preserve 180 rotation if it was 180, otherwise set to 0
        cardData.rotation = (cardData.rotation === '180') ? '180' : '0';

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

            // Add Energy Counter
            const energyCounterDiv = document.createElement('div');
            energyCounterDiv.className = 'life-counter energy-counter';
            const energyDisplay = document.createElement('span');
            energyDisplay.className = 'life-total';
            energyDisplay.textContent = player.energy || 0;
            energyDisplay.title = `${player.name}'s Energy`;
            const decreaseEnergyButton = document.createElement('button');
            decreaseEnergyButton.textContent = '−';
            decreaseEnergyButton.className = 'life-button';
            decreaseEnergyButton.addEventListener('click', () => {
                if (!player.energy) player.energy = 0;
                player.energy--;
                const sessionP = gameSession.players.find(p => p.id === player.id);
                if (sessionP) sessionP.energy = player.energy;
                energyDisplay.textContent = player.energy;
            });
            const increaseEnergyButton = document.createElement('button');
            increaseEnergyButton.textContent = '+';
            increaseEnergyButton.className = 'life-button';
            increaseEnergyButton.addEventListener('click', () => {
                if (!player.energy) player.energy = 0;
                player.energy++;
                const sessionP = gameSession.players.find(p => p.id === player.id);
                if (sessionP) sessionP.energy = player.energy;
                energyDisplay.textContent = player.energy;
            });
            energyCounterDiv.appendChild(decreaseEnergyButton);
            energyCounterDiv.appendChild(energyDisplay);
            energyCounterDiv.appendChild(increaseEnergyButton);
            infoBar.appendChild(energyCounterDiv);

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

            // Play Zone
            const playZone = document.createElement('div');
            playZone.className = 'zone play-zone';
            playZone.id = `play-zone-${player.id}`;
            playZone.dataset.zoneType = 'play';

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
            deckZone.addEventListener('click', () => drawCard(player.id));
            addDeckManipulationMenu(deckZone, player.id);
            addDropZoneEventListeners(deckZone, player.id, 'deck');
            sideZones.appendChild(deckZone);

            const discardZone = document.createElement('div');
            discardZone.className = 'zone discard-zone';
            discardZone.id = `discard-zone-${player.id}`;
            discardZone.dataset.zoneType = 'discard';
            discardZone.innerHTML = `<div class="cards-in-zone-container stacked-cards-display"></div>`;
            addDropZoneEventListeners(discardZone, player.id, 'discard');
            addDiscardPileManipulationMenu(discardZone, player.id);
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

    // Helper function to insert card into DOM at a specific horizontal position
    function insertCardIntoDOMZone(draggedElement, zoneContainer, dropX) {
        let inserted = false;
        // Iterate over children of the zone container (cards)
        for (const child of zoneContainer.children) {
            if (child === draggedElement || !child.classList || !child.classList.contains('card-on-board')) continue;

            const rect = child.getBoundingClientRect();
            // If the drop point's X coordinate is to the left of the center of the current child card
            if (dropX < rect.left + rect.width / 2) {
                zoneContainer.insertBefore(draggedElement, child);
                inserted = true;
                break;
            }
        }
        // If not inserted before any child (e.g., dropped to the right of all cards or container is empty)
        if (!inserted) {
            zoneContainer.appendChild(draggedElement);
        }
    }

    // Helper function to reorder the hand state array based on current DOM order
    function reorderHandStateBasedOnDOM(playerId) {
        const playerAreaElement = document.getElementById(`player-area-${playerId}`);
        if (!playerAreaElement) return;
        const handZoneContainer = playerAreaElement.querySelector(`#hand-zone-${playerId} .cards-in-zone-container`);
        if (!handZoneContainer) return;

        const currentHandState = playerHandsState[playerId] || [];
        // Optimization: if DOM is empty and state is empty, nothing to do.
        if (currentHandState.length === 0 && Array.from(handZoneContainer.querySelectorAll('.card-on-board')).length === 0) return;

        const newOrderedHandState = [];
        const domCardElements = Array.from(handZoneContainer.querySelectorAll('.card-on-board'));

        for (const domCard of domCardElements) {
            const cardId = domCard.dataset.cardId;
            // Find the full card data object from the current state
            const cardData = currentHandState.find(c => c.id === cardId);
            if (cardData) {
                newOrderedHandState.push(cardData);
            } else {
                console.warn(`Card ID ${cardId} from DOM (hand) not found in hand state for player ${playerId} during reorder. This might happen if a card was just added from another zone.`);
                // Attempt to recover if it was newly added and not yet in currentHandState (e.g. if this is called too early)
                // This scenario should be handled by ensuring addCardToTargetState runs before reorder.
            }
        }
        playerHandsState[playerId] = newOrderedHandState;
    }

    // Helper function to reorder the play zone state array based on current DOM order of cards in rows
    function reorderPlayZoneStateBasedOnDOM(playerId) {
        const playerAreaElement = document.getElementById(`player-area-${playerId}`);
        if (!playerAreaElement) return;

        const playZoneRow1Container = playerAreaElement.querySelector(`#play-zone-${playerId}-row1`);
        const playZoneRow2Container = playerAreaElement.querySelector(`#play-zone-${playerId}-row2`);

        const currentPlayState = playerPlayZonesState[playerId] || [];
        // Optimization: if DOM is empty and state is empty, nothing to do.
        if (currentPlayState.length === 0 &&
            (!playZoneRow1Container || Array.from(playZoneRow1Container.querySelectorAll('.card-on-board')).length === 0) &&
            (!playZoneRow2Container || Array.from(playZoneRow2Container.querySelectorAll('.card-on-board')).length === 0)
        ) return;

        const newOrderedPlayState = [];
        const processedCardIds = new Set(); // To handle cases where cardData might exist in multiple temp states before full sync

        const processRow = (rowContainer) => {
            if (!rowContainer) return;
            const domCardElements = Array.from(rowContainer.querySelectorAll('.card-on-board'));
            for (const domCard of domCardElements) {
                const cardId = domCard.dataset.cardId;
                if (processedCardIds.has(cardId)) continue; // Already added

                const cardData = currentPlayState.find(c => c.id === cardId);
                if (cardData) {
                    newOrderedPlayState.push(cardData);
                    processedCardIds.add(cardId);
                } else {
                    console.warn(`Card ID ${cardId} from DOM (play zone) not found in play state for player ${playerId} during reorder.`);
                }
            }
        };

        processRow(playZoneRow1Container); // Process Manifest Row first
        processRow(playZoneRow2Container); // Then Aether Row

        playerPlayZonesState[playerId] = newOrderedPlayState;
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
            // Check if the mouse is leaving the zoneElement itself or one of its children before removing highlight
            if (!zoneElement.contains(event.relatedTarget)) {
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

            const draggedCardElement = document.querySelector(`.card-on-board[data-card-id="${cardId}"]`);
            if (!draggedCardElement) { console.error("Dropped card element not found in DOM:", cardId); return; }

            const targetPlayerId = ownerPlayerId;
            const targetZoneType = zoneType; // This is the specific drop target (e.g. 'play-row1', 'hand')

            // Determine the actual DOM container where cards are children
            let targetCardsContainer;
            if (targetZoneType.startsWith('play-row')) { // e.g. 'play-row1', 'play-row2'
                targetCardsContainer = zoneElement; // The zoneElement (row div) is the direct parent
            } else if (targetZoneType === 'hand' || targetZoneType === 'discard') {
                targetCardsContainer = zoneElement.querySelector('.cards-in-zone-container');
            }
            // For 'deck', targetCardsContainer is not used for DOM append/insert in the same way.

            if (!targetCardsContainer && (targetZoneType === 'hand' || targetZoneType === 'discard' || targetZoneType.startsWith('play-row'))) {
                console.error("Critical Error: Target cards container for cards not found in drop target zone:", zoneElement, "for zoneType:", targetZoneType);
                return;
            }

            const cardData = findAndRemoveCardFromSourceState(cardId, sourcePlayerId, sourceZoneType);

            if (cardData) {
                const cardToMove = {
                    ...cardData,
                    isTapped: draggedCardElement.dataset.isTapped || originalCardState.isTapped || 'false',
                    isFacedown: draggedCardElement.dataset.isFacedown || originalCardState.isFacedown || 'false',
                    rotation: draggedCardElement.dataset.rotation || originalCardState.rotation || '0',
                    counters: draggedCardElement.dataset.counters || originalCardState.counters || '[]'
                };

                let successfulStateUpdate = false;

                if (targetZoneType === 'deck') {
                    cardToMove.isFacedown = 'true';
                    cardToMove.isTapped = 'false';
                    cardToMove.rotation = (cardToMove.rotation === '180' || originalCardState.rotation === '180') ? '180' : '0';

                    if (!playerDecksState[targetPlayerId]) playerDecksState[targetPlayerId] = [];
                    playerDecksState[targetPlayerId].unshift(cardToMove);
                    draggedCardElement.remove();
                    successfulStateUpdate = true;
                } else if (targetZoneType === 'discard') {
                    cardToMove.isTapped = 'false';
                    cardToMove.isFacedown = 'false';
                    cardToMove.rotation = (cardToMove.rotation === '180' || originalCardState.rotation === '180') ? '180' : '0';

                    if (addCardToTargetState(cardToMove, targetPlayerId, targetZoneType)) {
                        successfulStateUpdate = true;

                        draggedCardElement.dataset.isTapped = cardToMove.isTapped;
                        draggedCardElement.dataset.isFacedown = cardToMove.isFacedown;
                        draggedCardElement.dataset.rotation = cardToMove.rotation;
                        draggedCardElement.classList.toggle('tapped', false);
                        draggedCardElement.classList.toggle('facedown', false);
                        draggedCardElement.classList.toggle('rotated-180', cardToMove.rotation === '180');
                        if (cardToMove.rotation !== '180') draggedCardElement.classList.remove('rotated-180');
                        updateCardCountersDisplay(draggedCardElement);

                        if (targetCardsContainer) {
                            targetCardsContainer.appendChild(draggedCardElement); // Simple append for discard
                        } else {
                            // Should not happen due to earlier check, but as a fallback:
                            findAndRemoveCardFromSourceState(cardToMove.id, targetPlayerId, targetZoneType);
                            addCardToTargetState(cardData, sourcePlayerId, sourceZoneType);
                            successfulStateUpdate = false;
                        }
                    }
                } else { // For hand, play-row1, play-row2
                    if (addCardToTargetState(cardToMove, targetPlayerId, targetZoneType)) {
                        successfulStateUpdate = true;

                        draggedCardElement.dataset.isTapped = cardToMove.isTapped;
                        draggedCardElement.dataset.isFacedown = cardToMove.isFacedown;
                        draggedCardElement.dataset.rotation = cardToMove.rotation;
                        draggedCardElement.classList.toggle('tapped', cardToMove.isTapped === 'true');
                        draggedCardElement.classList.toggle('facedown', cardToMove.isFacedown === 'true');
                        draggedCardElement.classList.remove('rotated-180');
                        if (cardToMove.rotation === '180') draggedCardElement.classList.add('rotated-180');
                        updateCardCountersDisplay(draggedCardElement);

                        if (targetCardsContainer) {
                            insertCardIntoDOMZone(draggedCardElement, targetCardsContainer, event.clientX);
                        } else {
                            findAndRemoveCardFromSourceState(cardToMove.id, targetPlayerId, targetZoneType);
                            addCardToTargetState(cardData, sourcePlayerId, sourceZoneType);
                            successfulStateUpdate = false;
                        }

                        // After DOM manipulation, re-sync the logical state array order
                        if (successfulStateUpdate) {
                            if (targetZoneType === 'hand') {
                                reorderHandStateBasedOnDOM(targetPlayerId);
                            } else if (targetZoneType.startsWith('play-row')) {
                                reorderPlayZoneStateBasedOnDOM(targetPlayerId); // This reorders the entire playerPlayZonesState
                            }
                        }
                    }
                }

                if (successfulStateUpdate) {
                    const sourcePlayerArea = document.getElementById(`player-area-${sourcePlayerId}`);
                    if (sourcePlayerArea) {
                        const mainSourceZoneForCount = sourceZoneType.startsWith('play-row') ? 'play' : sourceZoneType;
                        updateZoneCardCount(sourcePlayerArea, mainSourceZoneForCount);
                        if (sourceZoneType.startsWith('play-row')) updateZoneCardCount(sourcePlayerArea, 'play');
                    }

                    const targetPlayerAreaElem = document.getElementById(`player-area-${targetPlayerId}`);
                    if (targetPlayerAreaElem) {
                        const mainTargetZoneForCount = targetZoneType.startsWith('play-row') ? 'play' : targetZoneType;
                        updateZoneCardCount(targetPlayerAreaElem, mainTargetZoneForCount);
                        if (targetZoneType.startsWith('play-row')) updateZoneCardCount(targetPlayerAreaElem, 'play');
                        if (targetZoneType === 'deck') updateZoneCardCount(targetPlayerAreaElem, 'deck');
                        // For hand/discard, updateZoneCardCount will also handle placeholders if necessary
                    }
                } else {
                    console.error("Failed to update state or DOM for card move.");
                    if (cardData) { // Attempt to roll back state if cardData was validly removed
                        console.warn(`Attempting to add card ${cardData.id} back to source ${sourcePlayerId}'s ${sourceZoneType}.`);
                        // This is a simplified rollback. Original position in array might be lost.
                        if (sourceZoneType === 'deck') {
                            if (!playerDecksState[sourcePlayerId]) playerDecksState[sourcePlayerId] = [];
                            playerDecksState[sourcePlayerId].unshift(cardData); // Add back to top if from deck
                        } else {
                            addCardToTargetState(cardData, sourcePlayerId, sourceZoneType); // Add back to its original logical zone type
                            // Re-order source state if it was hand/play, as DOM hasn't changed there yet if card element wasn't re-added
                            if (sourceZoneType === 'hand') reorderHandStateBasedOnDOM(sourcePlayerId);
                            else if (sourceZoneType.startsWith('play-row')) reorderPlayZoneStateBasedOnDOM(sourcePlayerId);
                        }
                        // DOM rollback for the draggedCardElement itself is more complex and usually handled by the browser if drop fails,
                        // or would require re-appending it to its original parent.
                        // For now, primary focus is on state consistency.
                    }
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
                    text: 'Search Deck',
                    action: () => handleViewCardsFromDeck(playerId, true, true) // Pass true for full search
                },
                {
                    text: 'Shuffle Deck',
                    action: () => shuffleDeck(playerId)
                },
                {
                    text: 'View Top N Cards',
                    action: () => handleViewCardsFromDeck(playerId, true)
                },
                {
                    text: 'View Bottom N Cards',
                    action: () => handleViewCardsFromDeck(playerId, false)
                }
            ];
            showContextMenu(event, actions);
        });
    }

    function shuffleDiscardPile(playerId) {
        const discardPile = playerDiscardsState[playerId] || [];
        if (discardPile.length < 2) {
            console.log(`Player ${playerId} has fewer than 2 cards in their discard pile to shuffle.`);
            return;
        }

        // Fisher-Yates shuffle algorithm
        for (let i = discardPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [discardPile[i], discardPile[j]] = [discardPile[j], discardPile[i]];
        }

        // Update UI to reflect the new order
        const playerAreaElement = document.getElementById(`player-area-${playerId}`);
        if (playerAreaElement) {
            const discardZoneContainer = playerAreaElement.querySelector(`#discard-zone-${playerId} .cards-in-zone-container`);
            if (discardZoneContainer) {
                // Clear existing card elements from the DOM
                discardZoneContainer.innerHTML = '';
                // Re-add them in the new shuffled order
                discardPile.forEach(cardData => {
                    const cardElement = createCardElement(cardData, false);
                    discardZoneContainer.appendChild(cardElement);
                });
            }
        }
        console.log(`Player ${playerId}'s discard pile has been shuffled.`);
    }

    function addDiscardPileManipulationMenu(discardZone, playerId) {
        discardZone.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const discardPile = playerDiscardsState[playerId] || [];
            if (discardPile.length === 0) {
                return;
            }
            const actions = [
                {
                    text: 'Search Discard Pile',
                    action: () => handleViewCardsFromDiscard(playerId)
                },
                {
                    text: 'Shuffle Discard Pile',
                    action: () => shuffleDiscardPile(playerId)
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
    renderDeckPreview();
    updateLobbyUI();

    // Handle joining via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const joinCodeFromUrl = urlParams.get('join');
    if (joinCodeFromUrl && gameCodeInput && playerNameInput) {
        gameCodeInput.value = joinCodeFromUrl.toUpperCase();
        playerNameInput.focus();

        if (window.history.replaceState) {
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        }
    }

    // Modal for viewing cards from deck
    let viewCardsModal, viewCardsModalTitle, viewCardsModalBody, viewCardsModalFooter, viewCardsModalCloseButton;

    function ensureViewCardsModalElements() {
        if (document.getElementById('viewCardsModal')) {
            viewCardsModal = document.getElementById('viewCardsModal');
            viewCardsModalTitle = document.getElementById('viewCardsModalTitle');
            viewCardsModalBody = document.getElementById('viewCardsModalBody');
            viewCardsModalFooter = document.getElementById('viewCardsModalFooter');
            viewCardsModalCloseButton = document.getElementById('viewCardsModalCloseButton');
            return;
        }

        viewCardsModal = document.createElement('div');
        viewCardsModal.id = 'viewCardsModal';
        viewCardsModal.className = 'modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content-large';

        viewCardsModalCloseButton = document.createElement('span');
        viewCardsModalCloseButton.id = 'viewCardsModalCloseButton';
        viewCardsModalCloseButton.className = 'close-modal-button';
        viewCardsModalCloseButton.innerHTML = '×';
        viewCardsModalCloseButton.onclick = () => hideViewCardsModal();

        viewCardsModalTitle = document.createElement('h2');
        viewCardsModalTitle.id = 'viewCardsModalTitle';

        viewCardsModalBody = document.createElement('div');
        viewCardsModalBody.id = 'viewCardsModalBody';
        viewCardsModalBody.className = 'modal-card-grid'; // Changed from deck-preview-grid to modal-card-grid

        viewCardsModalFooter = document.createElement('div');
        viewCardsModalFooter.id = 'viewCardsModalFooter';
        viewCardsModalFooter.className = 'modal-footer';

        modalContent.appendChild(viewCardsModalCloseButton);
        modalContent.appendChild(viewCardsModalTitle);
        modalContent.appendChild(viewCardsModalBody);
        modalContent.appendChild(viewCardsModalFooter);
        viewCardsModal.appendChild(modalContent);
        document.body.appendChild(viewCardsModal);
    }

    function hideViewCardsModal() {
        if (viewCardsModal) {
            viewCardsModal.classList.remove('active');
            viewCardsModalBody.innerHTML = '';
            viewCardsModalFooter.innerHTML = '';
        }
    }

    function moveCardAndUpdateBoard(cardId, sourcePlayerId, sourceZoneType, targetPlayerId, targetZoneType, positionInTarget = 'end') {
        const cardData = findAndRemoveCardFromSourceState(cardId, sourcePlayerId, sourceZoneType);
        if (!cardData) {
            console.error(`Failed to find/remove card ${cardId} from ${sourcePlayerId}'s ${sourceZoneType}`);
            return null;
        }

        // Apply transformations based on target zone
        if (targetZoneType === 'hand' || targetZoneType === 'discard') {
            cardData.isFacedown = 'false';
            cardData.isTapped = 'false';
            cardData.rotation = (cardData.rotation === '180') ? '180' : '0';
        } else if (targetZoneType === 'deck') {
            cardData.isFacedown = 'true';
            cardData.isTapped = 'false';
            cardData.rotation = (cardData.rotation === '180') ? '180' : '0';
        }

        let success = false;
        if (targetZoneType === 'deck') {
            if (!playerDecksState[targetPlayerId]) playerDecksState[targetPlayerId] = [];
            if (positionInTarget === 'top') {
                playerDecksState[targetPlayerId].unshift(cardData);
            } else {
                playerDecksState[targetPlayerId].push(cardData);
            }
            success = true;
        } else {
            success = addCardToTargetState(cardData, targetPlayerId, targetZoneType);
        }

        if (success) {
            const sourcePlayerArea = document.getElementById(`player-area-${sourcePlayerId}`);
            if (sourcePlayerArea) updateZoneCardCount(sourcePlayerArea, sourceZoneType.startsWith('play-row') ? 'play' : sourceZoneType);

            const targetPlayerArea = document.getElementById(`player-area-${targetPlayerId}`);
            if (targetPlayerArea) {
                updateZoneCardCount(targetPlayerArea, targetZoneType.startsWith('play-row') ? 'play' : targetZoneType);
                if (targetZoneType === 'hand') {
                    const handZoneContainer = targetPlayerArea.querySelector(`#hand-zone-${targetPlayerId} .cards-in-zone-container`);
                    if (handZoneContainer) {
                        const newCardElement = createCardElement(cardData, false);
                        handZoneContainer.appendChild(newCardElement);
                    }
                } else if (targetZoneType === 'discard') {
                    const discardZoneContainer = targetPlayerArea.querySelector(`#discard-zone-${targetPlayerId} .cards-in-zone-container`);
                    if (discardZoneContainer) {
                        const existingEl = discardZoneContainer.querySelector(`.card-on-board[data-card-id="${cardData.id}"]`);
                        if (existingEl) existingEl.remove();
                        const newCardElement = createCardElement(cardData, false);
                        discardZoneContainer.appendChild(newCardElement);
                    }
                }
            }
            return cardData;
        } else {
            console.error(`Failed to move card ${cardId} to ${targetPlayerId}'s ${targetZoneType}. Attempting rollback.`);
            addCardToTargetState(cardData, sourcePlayerId, sourceZoneType);
            return null;
        }
    }

        function handleViewCardsFromDeck(playerId, viewFromTop, isFullSearch = false) {
        ensureViewCardsModalElements();
        const deck = playerDecksState[playerId] || [];
        if (deck.length === 0) {
            alert("The deck is empty.");
            return;
        }

        let N;
        let modalTitleText;

        if (isFullSearch) {
            N = deck.length;
            modalTitleText = `Searching Deck (${N} cards)`;
        } else {
            const numStr = prompt(`How many cards to view from the ${viewFromTop ? 'top' : 'bottom'}? (1-${deck.length})`, "1");
            if (numStr === null) return;

            const parsedN = parseInt(numStr);
            if (isNaN(parsedN) || parsedN <= 0 || parsedN > deck.length) {
                alert(`Please enter a valid number between 1 and ${deck.length}.`);
                return;
            }
            N = parsedN;
            modalTitleText = `Viewing ${N} Card${N > 1 ? 's' : ''} from ${viewFromTop ? 'Top' : 'Bottom'} of Deck`;
        }

        const cardsToViewSource = isFullSearch ? deck : (viewFromTop ? deck.slice(0, N) : deck.slice(-N));
        let currentModalCards = JSON.parse(JSON.stringify(cardsToViewSource));

        viewCardsModalTitle.textContent = modalTitleText;
        viewCardsModalBody.innerHTML = '';

        currentModalCards.forEach(card => {
            const cardItemContainer = document.createElement('div');
            cardItemContainer.className = 'card-in-modal-item';
            cardItemContainer.dataset.cardId = card.id;
            cardItemContainer.draggable = true; // Make it draggable

            // Add drag and drop listeners for reordering
            cardItemContainer.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.id);
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => cardItemContainer.classList.add('dragging-modal-card'), 0);
            });

            cardItemContainer.addEventListener('dragend', () => {
                cardItemContainer.classList.remove('dragging-modal-card');
                viewCardsModalBody.querySelectorAll('.modal-drag-over').forEach(el => el.classList.remove('modal-drag-over'));
            });

            cardItemContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (!cardItemContainer.classList.contains('dragging-modal-card')) {
                    cardItemContainer.classList.add('modal-drag-over');
                }
            });

            cardItemContainer.addEventListener('dragleave', (e) => {
                if (!cardItemContainer.contains(e.relatedTarget)) {
                    cardItemContainer.classList.remove('modal-drag-over');
                }
            });

            cardItemContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                cardItemContainer.classList.remove('modal-drag-over');
                const draggedCardId = e.dataTransfer.getData('text/plain');

                if (draggedCardId === card.id) return;

                const draggedItem = viewCardsModalBody.querySelector(`.card-in-modal-item[data-card-id="${draggedCardId}"]`);
                const targetItem = cardItemContainer;

                if (draggedItem && targetItem) {
                    // Reorder in DOM
                    viewCardsModalBody.insertBefore(draggedItem, targetItem);

                    // Reorder the state array `currentModalCards` to match the new DOM order
                    const newOrderedState = [];
                    const itemsInModal = viewCardsModalBody.querySelectorAll('.card-in-modal-item');
                    itemsInModal.forEach(item => {
                        const cardId = item.dataset.cardId;
                        const cardData = currentModalCards.find(c => c.id === cardId);
                        if (cardData) newOrderedState.push(cardData);
                    });
                    currentModalCards = newOrderedState;
                }
            });

            const cardThumb = createCardElement({ ...card, isFacedown: 'false' }, false);
            cardThumb.classList.add('modal-card-thumb');
            cardThumb.draggable = false;
            const cardThumbClone = cardThumb.cloneNode(true);
            cardItemContainer.appendChild(cardThumbClone);

                        // Add a right-click context menu for card actions
            cardItemContainer.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                const cardId = card.id;

                const actions = [
                    {
                        text: 'To Hand',
                        action: () => {
                            if (moveCardAndUpdateBoard(cardId, playerId, 'deck', playerId, 'hand')) {
                                cardItemContainer.remove();
                                currentModalCards = currentModalCards.filter(c => c.id !== cardId);
                            }
                        }
                    },
                    {
                        text: 'To Top of Deck',
                        action: () => {
                            const actualCard = findAndRemoveCardFromSourceState(cardId, playerId, 'deck');
                            if (actualCard) {
                                playerDecksState[playerId].unshift(actualCard);
                                cardItemContainer.remove();
                                currentModalCards = currentModalCards.filter(c => c.id !== cardId);
                                updateZoneCardCount(document.getElementById(`player-area-${playerId}`), 'deck');
                            }
                        }
                    },
                    {
                        text: 'To Bottom of Deck',
                        action: () => {
                            const actualCard = findAndRemoveCardFromSourceState(cardId, playerId, 'deck');
                            if (actualCard) {
                                playerDecksState[playerId].push(actualCard);
                                cardItemContainer.remove();
                                currentModalCards = currentModalCards.filter(c => c.id !== cardId);
                                updateZoneCardCount(document.getElementById(`player-area-${playerId}`), 'deck');
                            }
                        }
                    },
                    {
                        text: 'To Discard',
                        action: () => {
                            if (moveCardAndUpdateBoard(cardId, playerId, 'deck', playerId, 'discard')) {
                                cardItemContainer.remove();
                                currentModalCards = currentModalCards.filter(c => c.id !== cardId);
                            }
                        }
                    }
                ];

                showContextMenu(event, actions);
            });
            viewCardsModalBody.appendChild(cardItemContainer);
        });

        viewCardsModalFooter.innerHTML = '';

        const createFooterButton = (text, actionFn) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.className = 'action-button';
            btn.onclick = () => {
                actionFn();
                hideViewCardsModal();
            };
            return btn;
        };

        const playerAreaElement = document.getElementById(`player-area-${playerId}`);

        viewCardsModalFooter.appendChild(createFooterButton('Return Remaining to Top (Order Shown)', () => {
            if (currentModalCards.length > 0) {
                const remainingCardIds = currentModalCards.map(c => c.id);
                playerDecksState[playerId] = playerDecksState[playerId].filter(c => !remainingCardIds.includes(c.id));
                const cardsToReturn = currentModalCards.map(modalCard => {
                    modalCard.isFacedown = 'true';
                    modalCard.isTapped = 'false';
                    modalCard.rotation = (modalCard.rotation === '180') ? '180' : '0';
                    return modalCard;
                });
                playerDecksState[playerId].unshift(...cardsToReturn);
                if (playerAreaElement) updateZoneCardCount(playerAreaElement, 'deck');
            }
        }));

        viewCardsModalFooter.appendChild(createFooterButton('Return Remaining to Bottom (Order Shown)', () => {
            if (currentModalCards.length > 0) {
                const remainingCardIds = currentModalCards.map(c => c.id);
                playerDecksState[playerId] = playerDecksState[playerId].filter(c => !remainingCardIds.includes(c.id));
                const cardsToReturn = currentModalCards.map(modalCard => {
                    modalCard.isFacedown = 'true';
                    modalCard.isTapped = 'false';
                    modalCard.rotation = (modalCard.rotation === '180') ? '180' : '0';
                    return modalCard;
                });
                playerDecksState[playerId].push(...cardsToReturn);
                if (playerAreaElement) updateZoneCardCount(playerAreaElement, 'deck');
            }
        }));

        const justCloseButton = document.createElement('button');
        justCloseButton.textContent = 'Close (Keep Unmoved in Deck)';
        justCloseButton.className = 'action-button secondary-button';
        justCloseButton.onclick = () => {
            hideViewCardsModal();
        };
        viewCardsModalFooter.appendChild(justCloseButton);

        viewCardsModal.classList.add('active');
    }

    function handleViewCardsFromDiscard(playerId) {
        ensureViewCardsModalElements();
        const discardPile = playerDiscardsState[playerId] || [];
        if (discardPile.length === 0) {
            alert("The discard pile is empty.");
            return;
        }

        const cardsToView = [...discardPile];

        viewCardsModalTitle.textContent = `Viewing Discard Pile (${cardsToView.length} cards)`;
        viewCardsModalBody.innerHTML = '';

        cardsToView.forEach(card => {
            const cardItemContainer = document.createElement('div');
            cardItemContainer.className = 'card-in-modal-item';
            cardItemContainer.dataset.cardId = card.id;
            cardItemContainer.draggable = true;

            // Add drag and drop listeners for reordering
            cardItemContainer.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.id);
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => cardItemContainer.classList.add('dragging-modal-card'), 0);
            });

            cardItemContainer.addEventListener('dragend', () => {
                cardItemContainer.classList.remove('dragging-modal-card');
                viewCardsModalBody.querySelectorAll('.modal-drag-over').forEach(el => el.classList.remove('modal-drag-over'));
            });

            cardItemContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (!cardItemContainer.classList.contains('dragging-modal-card')) {
                    cardItemContainer.classList.add('modal-drag-over');
                }
            });

            cardItemContainer.addEventListener('dragleave', (e) => {
                if (!cardItemContainer.contains(e.relatedTarget)) {
                    cardItemContainer.classList.remove('modal-drag-over');
                }
            });

            cardItemContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                cardItemContainer.classList.remove('modal-drag-over');
                const draggedCardId = e.dataTransfer.getData('text/plain');

                if (draggedCardId === card.id) return;

                const draggedItem = viewCardsModalBody.querySelector(`.card-in-modal-item[data-card-id="${draggedCardId}"]`);
                const targetItem = cardItemContainer;

                if (draggedItem && targetItem) {
                    // Reorder in DOM
                    viewCardsModalBody.insertBefore(draggedItem, targetItem);

                    // Reorder the state array `cardsToView` to match the new DOM order
                    const newOrderedState = [];
                    const itemsInModal = viewCardsModalBody.querySelectorAll('.card-in-modal-item');
                    itemsInModal.forEach(item => {
                        const cardId = item.dataset.cardId;
                        const cardData = cardsToView.find(c => c.id === cardId);
                        if (cardData) newOrderedState.push(cardData);
                    });
                    cardsToView = newOrderedState;
                }
            });

            const cardThumb = createCardElement({ ...card, isFacedown: 'false' }, false);
            cardThumb.classList.add('modal-card-thumb');
            cardThumb.draggable = false;

            const zoomPreview = cardThumb.querySelector('.zoom-preview');
            if (zoomPreview) zoomPreview.remove();

            cardItemContainer.appendChild(cardThumb);

                        // Add a right-click context menu for card actions
            cardItemContainer.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                const cardId = card.id;

                const handleMoveAction = (targetZone, deckPosition = 'end') => {
                    const movedCard = moveCardAndUpdateBoard(cardId, playerId, 'discard', playerId, targetZone, deckPosition);
                    if (movedCard) {
                        cardItemContainer.remove();
                        const discardZoneContainer = document.querySelector(`#discard-zone-${playerId} .cards-in-zone-container`);
                        const cardElementInDiscard = discardZoneContainer?.querySelector(`.card-on-board[data-card-id="${cardId}"]`);
                        if (cardElementInDiscard) {
                            cardElementInDiscard.remove();
                        }
                    }
                };

                const actions = [
                    { text: 'To Hand', action: () => handleMoveAction('hand') },
                    { text: 'To Top of Deck', action: () => handleMoveAction('deck', 'top') },
                    { text: 'To Bottom of Deck', action: () => handleMoveAction('deck', 'end') },
                ];

                showContextMenu(event, actions);
            });
            viewCardsModalBody.appendChild(cardItemContainer);
        });

        viewCardsModalFooter.innerHTML = '';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.className = 'action-button secondary-button';
        closeButton.onclick = () => hideViewCardsModal();
        viewCardsModalFooter.appendChild(closeButton);

        viewCardsModal.classList.add('active');
    }

    // Ensure modal elements are available on DOMContentLoaded
    ensureViewCardsModalElements();

    // Add slider controls
    const previewZoomSlider = document.getElementById('previewZoomSlider');
    const previewZoomValue = document.getElementById('previewZoomValue');
    const cardSizeSlider = document.getElementById('cardSizeSlider');
    const cardSizeValue = document.getElementById('cardSizeValue');

    // Initialize CSS variables
    document.documentElement.style.setProperty('--preview-zoom', previewZoomSlider.value);
    document.documentElement.style.setProperty('--card-size', cardSizeSlider.value);

    // Handle preview zoom slider
    previewZoomSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        document.documentElement.style.setProperty('--preview-zoom', value);
        previewZoomValue.textContent = `${value}x`;
    });

    // Handle card size slider
    cardSizeSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        document.documentElement.style.setProperty('--card-size', value);
        cardSizeValue.textContent = `${Math.round(value * 100)}%`;
    });
});