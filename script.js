import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
//const supabaseUrl = 'https://qwoqmanecbtypdohymzz.supabase.co';
const supabaseUrl = 'http://127.0.0.1:54321';
//const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b3FtYW5lY2J0eXBkb2h5bXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMDU5MjUsImV4cCI6MjA2NTc4MTkyNX0.yv-LNsXVAOUjAojEd_20XgteWhWwsWjX9ruOMte92aQ';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentPlayer = {
    id: null,
    name: '',
    isHost: false,
    deck: [],
    deckConfirmed: false,
    life: 22,
    energy: 0
};

document.addEventListener('DOMContentLoaded', () => {

    const savedPlayerInfo = sessionStorage.getItem('tcg-player-info');
    if (savedPlayerInfo) {
        try {
            const parsedInfo = JSON.parse(savedPlayerInfo);
            if (parsedInfo.id && parsedInfo.name) {
                currentPlayer.id = parsedInfo.id;
                currentPlayer.name = parsedInfo.name;
                console.log('Restored player session:', currentPlayer);
            }
        } catch (e) {
            console.error('Failed to parse saved player info', e);
            sessionStorage.removeItem('tcg-player-info');
        }
    }

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

    let gameState = {
        code: null,
        players: [],
        maxPlayers: 4,
        gameStarted: false,
        playerDecks: {},
        playerHands: {},
        playerDiscards: {},
        playerPlayZones: {}
    };

    let globalTokenCounter = 0;

    const DRAGGING_CLASS = 'dragging';

    let backgroundImages = [];
    let currentBgIndex = 0;

    async function loadBackgroundImages() {
        try {
            const response = await fetch('/bg');
            const files = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(files, 'text/html');
            const links = doc.getElementsByTagName('a');

            backgroundImages = Array.from(links)
                .map(link => link.href)
                .filter(href => {
                    const ext = href.split('.').pop().toLowerCase();
                    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                })
                .map(href => href.split('/').pop());

            if (backgroundImages.length > 0) {
                document.body.style.backgroundImage = `url('bg/${backgroundImages[0]}')`;
            }
        } catch (error) {
            console.error('Error loading background images:', error);
        }
    }

    function updateBackground(direction) {
        if (backgroundImages.length === 0) return;

        if (direction === 'next') {
            currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
        } else {
            currentBgIndex = (currentBgIndex - 1 + backgroundImages.length) % backgroundImages.length;
        }
        document.body.style.backgroundImage = `url('bg/${backgroundImages[currentBgIndex]}')`;
    }

    loadBackgroundImages();

    document.getElementById('prev-bg').addEventListener('click', () => updateBackground('prev'));
    document.getElementById('next-bg').addEventListener('click', () => updateBackground('next'));

    document.addEventListener('keydown', (e) => {
        if (e.altKey) {
            if (e.key === 'ArrowLeft') {
                updateBackground('prev');
            } else if (e.key === 'ArrowRight') {
                updateBackground('next');
            }
        }
    });


    async function syncGameStateToServer(action) {
        if (!gameState.code) {
            console.error("Cannot sync state: No game code.");
            return;
        }

        console.log("1. CLICKED CONFIRM. Sending action to server:", action);

        try {
            const { data, error } = await supabase.functions.invoke('update-game-state', {
                body: {
                    gameCode: gameState.code,
                    action: action
                }
            });

            if (error) {
                console.error(`Error performing action '${action.type}':`, error);
                alert(`An error occurred: ${error.message}. The game might be out of sync. Please consider refreshing.`);
                return;
            }

            console.log("2. CLIENT: Server response received:", data);
            // Workaround removed: Do not update local state or call renderFromGameState here.
            // The UI will update automatically when the realtime event is received.
        } catch (err) {
            console.error("Network or other error during sync:", err);
            alert(`Network error: ${err.message}. Please check your connection and try again.`);
        }

        // The UI will update automatically when the realtime event is received.
        // We don't need to do anything with `data` here.
    }

    function renderGameState(state) {
        console.log("RENDER: Rendering game state:", {
            gameStarted: state.gameStarted,
            playerDecks: state.playerDecks,
            playerHands: state.playerHands,
            players: state.players.map(p => ({ id: p.id, name: p.name, deckLength: p.deck?.length }))
        });
        
        // Update player stats (life, energy)
        state.players.forEach(p => {
            const playerArea = document.getElementById(`player-area-${p.id}`);
            if (!playerArea) return;

            const lifeDisplay = playerArea.querySelector('.life-total');
            if (lifeDisplay) lifeDisplay.textContent = p.life;

            const energyDisplay = playerArea.querySelector('.energy-counter .life-total');
            if (energyDisplay) energyDisplay.textContent = p.energy || 0;
        });

        // Update hands
        for (const playerId in state.playerHands) {
            const handZoneContainer = document.querySelector(`#hand-zone-${playerId} .cards-in-zone-container`);
            if (!handZoneContainer) continue;

            handZoneContainer.innerHTML = ''; // Clear the zone
            if (state.playerHands[playerId].length === 0) {
                handZoneContainer.innerHTML = '<span class="placeholder-text">Hand</span>';
            } else {
                state.playerHands[playerId].forEach(cardData => {
                    const cardElement = createCardElement(cardData);
                    console.log(`Created card element for ${cardData.id}:`, {
                        draggable: cardElement.draggable,
                        className: cardElement.className,
                        dataset: cardElement.dataset
                    });
                    handZoneContainer.appendChild(cardElement);
                });
            }
            updateZoneCardCount(document.getElementById(`player-area-${playerId}`), 'hand');
        }

        // Update play zones
        for (const playerId in state.playerPlayZones) {
            const playZone = document.getElementById(`play-zone-${playerId}`);
            if (!playZone) continue;

            const row1Container = playZone.querySelector(`#play-zone-${playerId}-row1`);
            const row2Container = playZone.querySelector(`#play-zone-${playerId}-row2`);

            // Clear both rows
            [row1Container, row2Container].forEach(container => {
                if (container) {
                    container.innerHTML = '';
                    container.innerHTML = `<span class="placeholder-text">${container.id.includes('row1') ? 'Manifest Row' : 'Aether Row'}</span>`;
                }
            });

            // Add cards to appropriate rows
            state.playerPlayZones[playerId].forEach(cardData => {
                const targetRow = cardData.row === 'row2' ? row2Container : row1Container;
                if (targetRow) {
                    const placeholder = targetRow.querySelector('.placeholder-text');
                    if (placeholder) placeholder.remove();
                    const cardElement = createCardElement(cardData);
                    targetRow.appendChild(cardElement);
                }
            });

            updateZoneCardCount(document.getElementById(`player-area-${playerId}`), 'play');
        }

        // Update discard piles
        for (const playerId in state.playerDiscards) {
            const discardZoneContainer = document.querySelector(`#discard-zone-${playerId} .cards-in-zone-container`);
            if (!discardZoneContainer) continue;

            discardZoneContainer.innerHTML = ''; // Clear the zone
            if (state.playerDiscards[playerId].length === 0) {
                discardZoneContainer.innerHTML = '<span class="placeholder-text">Discard</span>';
            } else {
                state.playerDiscards[playerId].forEach(cardData => {
                    const cardElement = createCardElement(cardData);
                    discardZoneContainer.appendChild(cardElement);
                });
            }
            updateZoneCardCount(document.getElementById(`player-area-${playerId}`), 'discard');
        }

        // Update deck counts
        for (const playerId in state.playerDecks) {
            updateZoneCardCount(document.getElementById(`player-area-${playerId}`), 'deck');
        }
    }

    let gameChannel;

    function connectToGameChannel(gameCode) {
        // If we're already subscribed to a channel, unsubscribe first
        if (gameChannel) {
            supabase.removeChannel(gameChannel);
        }

        gameChannel = supabase.channel(`game:${gameCode}`, {
            config: {
                broadcast: {
                    self: true, // Receive our own broadcasts
                },
            },
        });

        gameChannel
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'games',
                    filter: `code=eq.${gameCode}`
                },
                (payload) => {
                    console.log('3. CLIENT: Received state update from server.');
                    console.log('Authoritative game state received from server!', payload);

                    // 1. Overwrite the entire local state with the new, authoritative state
                    gameState = payload.new.game_state;
                    console.log("3a. CLIENT: Full gameState received:", JSON.parse(JSON.stringify(gameState)));
                    
                    // 2. *** NEW: Find our own player data in the new state ***
                    const selfInNewState = gameState.players.find(p => p.id === currentPlayer.id);

                    // 3. *** NEW: Synchronize the local currentPlayer object ***
                    if (selfInNewState) {
                        // Update the properties that might change, like deck status
                        console.log("3b. CLIENT: Found myself in new state. My deckConfirmed status is:", selfInNewState.deckConfirmed);
                        currentPlayer.deckConfirmed = selfInNewState.deckConfirmed;
                        currentPlayer.deck = selfInNewState.deck;
                        currentPlayer.isHost = selfInNewState.isHost;
                        currentPlayer.life = selfInNewState.life;
                        currentPlayer.energy = selfInNewState.energy;
                        // You could update everything for safety:
                        // Object.assign(currentPlayer, selfInNewState);
                    }
                    else {
                        // Add this log
                        console.log("3b. CLIENT ERROR: Could not find myself in the new state update.");
                    }
                    
                    // 4. Now, call the single, powerful render function
                    console.log("3c. CLIENT: About to call renderFromGameState()");
                    renderFromGameState();
                    console.log("3d. CLIENT: renderFromGameState() completed");
                }
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, (payload) => {
                console.log('DEBUG: Received ANY games table change:', payload);
            })
            .subscribe((status) => {
                console.log(`Realtime subscription status for game ${gameCode}:`, status);
                if (status === 'SUBSCRIBED') {
                    console.log(`Successfully subscribed to game ${gameCode}!`);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(`Failed to subscribe to game ${gameCode}!`);
                }
            });
    }

    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active-page'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active-page');
        } else {
            console.error(`Page with ID "${pageId}" not found.`);
        }
        // window.scrollTo(0, 0); // Remove this to prevent scroll reset after every action
    }

    function generateGameCode() {
        return Math.random().toString(36).substring(2, 7).toUpperCase();
    }

    function updateLobbyUI() {
        if (!gameState.code || !playerListUl || !playerCountDisplay || !deckStatusIndicator || !startGameButton || !deckUploadControls || !confirmDeckButton || !clearDeckButton) {
            console.warn("Lobby UI update called but some elements are missing.");
            return;
        }

        playerListUl.innerHTML = '';
        gameState.players.forEach(p => {
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
        playerCountDisplay.textContent = gameState.players.length;

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
            const allPlayersReady = gameState.players.length > 0 && gameState.players.every(p => p.deckConfirmed);
            const enoughPlayers = gameState.players.length >= 1; // Min 1 player to start (e.g. solo)
            console.log("4. UI UPDATE CHECK: allPlayersReady:", allPlayersReady, "enoughPlayers:", enoughPlayers);
            console.log("   - Player statuses:", gameState.players.map(p => ({ name: p.name, confirmed: p.deckConfirmed, id: p.id })));
            console.log("   - Current player deckConfirmed:", currentPlayer.deckConfirmed);
            console.log("   - Game state players:", gameState.players);
            startGameButton.disabled = !(allPlayersReady && enoughPlayers);
            console.log("   - Start game button disabled:", startGameButton.disabled);
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
        if (gameState.players.length >= gameState.maxPlayers) {
            alert("Lobby is full.");
            return false;
        }
        // Allow same name if IDs are different (e.g. reconnect), but prevent duplicate active players with same name if ID is different
        if (gameState.players.some(p => p.name === playerData.name && p.id !== playerData.id)) {
            // This check might be too strict if rejoining is allowed. For now, assume unique names.
            // alert("A player with that name is already in the lobby. Please choose a different name.");
            // return false;
        }

        if (typeof playerData.life === 'undefined') {
            playerData.life = 22;
        }

        const existingPlayerIndex = gameState.players.findIndex(p => p.id === playerData.id);
        if (existingPlayerIndex > -1) {
            gameState.players[existingPlayerIndex] = { ...gameState.players[existingPlayerIndex], ...playerData };
        } else {
            gameState.players.push(playerData);
        }
        return true;
    }

    function initializeLobby(isHost) {
        currentPlayer.isHost = isHost;
        currentPlayer.life = 22;

        if (isHost) {
            gameState.code = generateGameCode();
            gameState.players = []; // Host always starts with a fresh player list for their game
        } else {
            gameState.code = gameCodeInput.value.trim().toUpperCase();
            // If joining, we don't clear gameState.players here.
            // It would be populated by a "server" or host's broadcast in a real app.
            // For this sandbox, if gameState.players is empty and we join, it'll just be us.
        }

        if (!addPlayerToSession({ ...currentPlayer, deck: currentPlayer.deck || [], deckConfirmed: currentPlayer.deckConfirmed || false })) {
            gameState.code = null; // Failed to add current player
            return false;
        }

        if (gameCodeDisplay) gameCodeDisplay.textContent = gameState.code;
        const shareableLink = `${window.location.origin}${window.location.pathname}?join=${gameState.code}`;
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

    // Add event listeners for host and join buttons
    hostGameButton.addEventListener('click', async () => {
        const name = playerNameInput.value.trim();
        if (!name) {
            alert('Please enter your name before hosting a game.');
            return;
        }

        currentPlayer.name = name;
        currentPlayer.id = `player_${Date.now()}`;
        currentPlayer.isHost = true;
        currentPlayer.deck = [];
        currentPlayer.deckConfirmed = false;
        currentPlayer.life = 22;
        currentPlayer.energy = 0;
        sessionStorage.setItem('tcg-player-info', JSON.stringify({ id: currentPlayer.id, name: currentPlayer.name }));

        const gameCode = generateGameCode();

        // This is the initial state of our game
        const initialGameState = {
            players: [currentPlayer], // Start with just the host
            gameStarted: false,
            maxPlayers: 4
        };

        // Insert the new game into the database
        const { data, error } = await supabase
            .from('games')
            .insert({
                code: gameCode,
                host_id: currentPlayer.id,
                game_state: initialGameState
            })
            .select()
            .single();

        if (error) {
            console.error('Error hosting game:', error);
            alert('Could not create the game. The code might be taken. Please try again.');
            return;
        }

        // If successful, set the local game session and connect to it
        gameState.code = gameCode;
        gameState.players = initialGameState.players;
        gameState.gameStarted = false;

        // Connect to the game channel
        console.log("HOST: About to connect to game channel for code:", gameCode);
        connectToGameChannel(gameCode);

        // Update UI and show lobby
        showPage('lobby-page');
        if (gameCodeDisplay) gameCodeDisplay.textContent = gameState.code;
        updateLobbyUI();
    });

    joinGameButton.addEventListener('click', async () => {
        const name = playerNameInput.value.trim();
        const code = gameCodeInput.value.trim().toUpperCase();
        if (!name || !code) {
            alert('Please enter your name and a game code.');
            return;
        }

        // Prepare the new player object
        currentPlayer.name = name;
        currentPlayer.id = `player_${Date.now()}`;
        currentPlayer.isHost = false;
        currentPlayer.deck = [];
        currentPlayer.deckConfirmed = false;
        currentPlayer.life = 22;
        currentPlayer.energy = 0;
        sessionStorage.setItem('tcg-player-info', JSON.stringify({ id: currentPlayer.id, name: currentPlayer.name }));

        // Set the game code for the session
        gameState.code = code;

        // Tell the server we want to join. The server will handle adding the player safely.
        await syncGameStateToServer({
            type: 'JOIN_GAME',
            payload: { newPlayer: currentPlayer }
        });

        // After telling the server, we connect to the channel to get updates
        console.log("JOIN: About to connect to game channel for code:", code);
        connectToGameChannel(code);

        // The realtime listener will handle updating the UI and showing the lobby page
        // For a better user experience, we can preemptively show the lobby
        showPage('lobby-page');
        if (gameCodeDisplay) gameCodeDisplay.textContent = gameState.code;
        // We don't call updateLobbyUI() here, as we wait for the server's authoritative state.
    });

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

        // Show a loading indicator
        if (deckPreviewArea) deckPreviewArea.innerHTML = '<p class="placeholder-text">Uploading and processing cards...</p>';
        if (confirmDeckButton) confirmDeckButton.disabled = true;

        const newCardObjects = [];
        let cardIdCounter = 0;

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

                    for (const { blob, fileName } of imageBlobs) {
                        const cardId = `card_${currentPlayer.id}_${Date.now()}_${cardIdCounter++}`;
                        const filePath = `${currentPlayer.id}/${cardId}-${fileName}`;

                        // Upload to Supabase Storage
                        const { error: uploadError } = await supabase.storage
                            .from('card-images')
                            .upload(filePath, blob, {
                                cacheControl: '3600', // Cache for 1 hour
                                upsert: true
                            });

                        if (uploadError) {
                            console.error('Error uploading card image:', uploadError);
                            continue; // Skip this card
                        }

                        // Get the public URL
                        const { data: urlData } = supabase.storage
                            .from('card-images')
                            .getPublicUrl(filePath);

                        newCardObjects.push({ id: cardId, publicUrl: urlData.publicUrl, fileName });
                    }
                } catch (error) {
                    console.error("Error processing ZIP:", error);
                    alert('Failed to process ZIP file. It might be corrupted or in an unsupported format.');
                }
            } else if (file.type.startsWith('image/')) {
                const cardId = `card_${currentPlayer.id}_${Date.now()}_${cardIdCounter++}`;
                const filePath = `${currentPlayer.id}/${cardId}-${file.name}`;

                // Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('card-images')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Error uploading card image:', uploadError);
                    continue; // Skip this card
                }

                // Get the public URL
                const { data: urlData } = supabase.storage
                    .from('card-images')
                    .getPublicUrl(filePath);

                newCardObjects.push({ id: cardId, publicUrl: urlData.publicUrl, fileName: file.name });
            }
        }

        currentPlayer.deck = newCardObjects;
        renderDeckPreview();

        const playerInSession = gameState.players.find(p => p.id === currentPlayer.id);
        if (playerInSession) {
            playerInSession.deck = currentPlayer.deck;
            playerInSession.deckConfirmed = false;
        }
        currentPlayer.deckConfirmed = false;
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
            img.src = card.publicUrl;
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

    // Add drag event prevention for the game board
    ['dragenter', 'dragover', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });

    if (confirmDeckButton) {
        confirmDeckButton.addEventListener('click', async () => {
            if (currentPlayer.deck.length === 0) {
                alert('Please upload some cards to your deck first.');
                return;
            }

            console.log("1. CLICKED CONFIRM. Sending action to server.");

            await syncGameStateToServer({
                type: 'CONFIRM_DECK',
                payload: {
                    playerId: currentPlayer.id,
                    deck: currentPlayer.deck
                }
            });

            // The workaround in syncGameStateToServer will handle the immediate UI update
        });
    }

    if (clearDeckButton) {
        clearDeckButton.addEventListener('click', async () => {
            await syncGameStateToServer({
                type: 'CLEAR_DECK',
                payload: {
                    playerId: currentPlayer.id
                }
            });

            // Also reset the local file inputs for a better UX
            if (zipUploadInput) zipUploadInput.value = '';
            if (batchImageUploadInput) batchImageUploadInput.value = '';
        });
    }

    if (startGameButton) {
        startGameButton.addEventListener('click', async () => { // Note the 'async'
            if (!currentPlayer.isHost) {
                alert("Only the host can start the game.");
                return;
            }
            // ... (all the checks for players ready can remain)
            const allPlayersReady = gameState.players.length > 0 && gameState.players.every(p => p.deckConfirmed);
            const enoughPlayers = gameState.players.length >= 1;
            if (!allPlayersReady || !enoughPlayers) {
                alert('Waiting for all players to confirm their decks, or not enough players.');
                return;
            }

            // Tell the server to start the game.
            // The server will set gameStarted=true and broadcast it to everyone.
            await syncGameStateToServer({ type: 'START_GAME' });

            // DO NOT call initializeGameBoard here. The realtime listener will do it for everyone
            // at the same time when it receives the 'gameStarted: true' update.
        });
    }

    if (leaveGameButton) {
        leaveGameButton.addEventListener('click', async () => {
            if (confirm("Are you sure you want to leave the game? This will end the current session for you.")) {
                // Clean up blob URLs
                if (currentPlayer.deck && currentPlayer.deck.length > 0) {
                    currentPlayer.deck.forEach(card => {
                        if (card.imageDataUrl && card.imageDataUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(card.imageDataUrl);
                        }
                    });
                }
sessionStorage.removeItem('tcg-player-info');
                [gameState.playerDecks, gameState.playerHands, gameState.playerDiscards, gameState.playerPlayZones].forEach(stateObject => {
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

                if (gameState.code) {
                    // Tell the server this player is leaving.
                    await syncGameStateToServer({
                        type: 'LEAVE_GAME',
                        payload: { playerId: currentPlayer.id }
                    });

                    // Unsubscribe from the game channel
                    if (gameChannel) {
                        supabase.removeChannel(gameChannel);
                        gameChannel = null; // Important to nullify
                    }
                }

                // Reset local state
                currentPlayer.deck = [];
                currentPlayer.deckConfirmed = false;
                currentPlayer.isHost = false;

                gameState.gameStarted = false;
                gameState.code = null;
                gameState.players = [];

                gameState.playerDecks = {};
                gameState.playerHands = {};
                gameState.playerDiscards = {};
                gameState.playerPlayZones = {};

                // Reset UI
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
        if (gameState.gameStarted || (currentPlayer.deck && currentPlayer.deck.length > 0)) {
        }

        if (currentPlayer.deck) {
            currentPlayer.deck.forEach(card => {
                if (card.imageDataUrl && card.imageDataUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(card.imageDataUrl);
                }
            });
        }
        [gameState.playerDecks, gameState.playerHands, gameState.playerDiscards, gameState.playerPlayZones].forEach(stateObject => {
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
        
        console.log(`Setting draggable=true for card ${cardData.id}, draggable property is now:`, cardDiv.draggable);

        // Add dragstart event listener to set up data transfer
        cardDiv.addEventListener('dragstart', (event) => {
            console.log('=== DRAG START TRIGGERED ===');
            console.log('Drag start triggered for card:', cardData.id);
            console.log('Event details:', {
                type: event.type,
                target: event.target,
                currentTarget: event.currentTarget,
                draggable: event.target.draggable
            });
            
            // FIX: Temporarily disable transitions on the original card to prevent "snapping back" animation.
            cardDiv.style.transition = 'none';

            document.body.classList.add('is-dragging');
            cardDiv.classList.add(DRAGGING_CLASS);
            const sourcePlayerId = cardDiv.closest('.player-area')?.dataset.playerId;
            let sourceZoneType = cardDiv.closest('.zone')?.dataset.zoneType;
            // PATCH: If dragging from play, use the card's row property for the source zone
            if (sourceZoneType === 'play' && cardData.row) {
                sourceZoneType = `play-row${cardData.row === 'row2' ? '2' : '1'}`;
            }

            console.log('Source player ID:', sourcePlayerId, 'Source zone type:', sourceZoneType);

            if (!sourcePlayerId || !sourceZoneType) {
                console.error("Could not determine source player or zone for drag:", cardDiv);
                event.preventDefault();
                return;
            }

            const dragImage = cardDiv.cloneNode(true);
            dragImage.draggable = true; // Ensure dragImage is draggable for browser compatibility
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            dragImage.style.opacity = '0.8';

            const wasTapped = dragImage.classList.contains('tapped');
            const wasRotated180 = dragImage.classList.contains('rotated-180');

            dragImage.classList.remove('tapped', 'rotated-180', 'dragging');

            document.body.appendChild(dragImage);
            dragImage.offsetHeight; // Force a reflow to ensure dimensions are calculated correctly.

            const dragImageWidth = dragImage.offsetWidth;
            const dragImageHeight = dragImage.offsetHeight;

            if (wasTapped) dragImage.classList.add('tapped');
            if (wasRotated180) dragImage.classList.add('rotated-180');

            event.dataTransfer.setDragImage(dragImage, dragImageWidth / 2, dragImageHeight / 2);

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
            console.log('=== DRAG END TRIGGERED ===');
            console.log('Drag end for card:', cardData.id);
            document.body.classList.remove('is-dragging');
            cardDiv.classList.remove(DRAGGING_CLASS);

            cardDiv.style.transition = '';
        });

        const img = document.createElement('img');
        // Handle both imageDataUrl and publicUrl fields
        const imageUrl = cardData.imageDataUrl || cardData.publicUrl;
        if (!imageUrl) {
            console.error('Card missing image URL:', cardData);
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjMiIGhlaWdodD0iODgiIHZpZXdCb3g9IjAgMCA2MyA4OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYzIiBoZWlnaHQ9Ijg4IiBmaWxsPSIjY2NjY2NjIi8+Cjx0ZXh0IHg9IjMxLjUiIHk9IjQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMDAwIj5Ccm9rZW4gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
        } else {
            img.src = imageUrl;
        }
        img.alt = cardData.fileName || 'Card Image';
        img.draggable = false;

        // Create zoom preview element
        const zoomPreview = document.createElement('img');
        zoomPreview.className = 'zoom-preview';
        zoomPreview.src = imageUrl || img.src;
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
            if (cardDiv.classList.contains(DRAGGING_CLASS) || event.button !== 0) return;

            const zone = cardDiv.closest('.zone');
            // A card must be in the play zone to be tapped.
            if (!zone || zone.dataset.zoneType !== 'play') return;

            const cardId = cardDiv.dataset.cardId;
            const playerId = cardDiv.closest('.player-area').dataset.playerId;

            // Send a specific, small action to the server. That's it.
            syncGameStateToServer({
                type: 'TOGGLE_TAP',
                payload: {
                    playerId: playerId,
                    cardId: cardId
                }
            });
        });

        // DOUBLE CLICK: Rotate 180 degrees
        cardDiv.addEventListener('dblclick', (event) => {
            const cardId = cardDiv.dataset.cardId;
            const playerId = cardDiv.closest('.player-area').dataset.playerId;
            cardDiv.classList.toggle('rotated-180');
            syncGameStateToServer({
                type: 'TOGGLE_ROTATE_180',
                payload: {
                    playerId: playerId,
                    cardId: cardId
                }
            });
        });

        // RIGHT CLICK: Context menu
        cardDiv.addEventListener('contextmenu', (event) => {
            if (cardDiv.closest('.discard-zone')) {
                return;
            }

            console.log(`Card ${cardDiv.dataset.cardId} right-clicked`);
            const actions = [
                {
                    text: 'Flip Card',
                    action: () => {
                        const cardId = cardDiv.dataset.cardId;
                        const playerId = cardDiv.closest('.player-area').dataset.playerId;
                        const zoneType = cardDiv.closest('.zone').dataset.zoneType;

                        //flip the card in the UI for instant feedback
                        cardDiv.classList.toggle('facedown');

                        // Tell the server about the action
                        syncGameStateToServer({
                            type: 'FLIP_CARD',
                            payload: {
                                playerId: playerId,
                                cardId: cardId,
                                zoneType: zoneType
                            }
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

                        const cardId = cardDiv.dataset.cardId;
                        const playerId = cardDiv.closest('.player-area').dataset.playerId;

                        syncGameStateToServer({
                            type: 'MODIFY_COUNTERS',
                            payload: {
                                playerId: playerId,
                                cardId: cardId,
                                counterType: type,
                                value: value
                            }
                        });
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
                                const stateArray = gameState.playerPlayZones[playerId];
                                if (stateArray) {
                                    const index = stateArray.findIndex(card => card.id === cardData.id);
                                    if (index > -1) {
                                        stateArray.splice(index, 1);
                                    }
                                }

                                cardDiv.remove();

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
            count = gameState.playerDecks[playerId]?.length || 0;
            if (countElement) countElement.textContent = count;
        } else if (zoneType === 'hand') {
            count = gameState.playerHands[playerId]?.length || 0;
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
            count = gameState.playerDiscards[playerId]?.length || 0;
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
            count = gameState.playerPlayZones[playerId]?.length || 0;

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
            const handCount = gameState.playerHands[playerId]?.length || 0;
            const deckCount = gameState.playerDecks[playerId]?.length || 0;
            const discardCount = gameState.playerDiscards[playerId]?.length || 0;
            const playCountTotal = gameState.playerPlayZones[playerId]?.length || 0;
            statsBar.textContent = `Hand: ${handCount} | Deck: ${deckCount} | Discard: ${discardCount} | Play: ${playCountTotal}`;
        }
    }

    async function drawCard(playerId) {
        console.log("DRAW: Attempting to draw card for player:", playerId);
        console.log("DRAW: Current deck state:", gameState.playerDecks[playerId]);
        console.log("DRAW: Current hand state:", gameState.playerHands[playerId]);
        
        await syncGameStateToServer({
            type: 'DRAW_CARD',
            payload: {
                playerId: playerId
            }
        });
    }

    // A complete, corrected renderFromGameState function. Use this one.
    function renderFromGameState() {
        if (!gameState) {
            console.error("Render called with null/undefined gameState");
            return;
        }

        // Always update the current player's context from the latest state
        const me = gameState.players.find(p => p.id === currentPlayer.id);
        if (me) {
            currentPlayer.isHost = me.isHost;
        } else if (gameState.code) { // Only warn if we are supposed to be in a game
            console.warn("Current player not found in game state. You may have been disconnected.");
            // Optionally, force a page reload or redirect to the landing page.
            // leaveGameButton.click();
            return;
        }

        if (gameState.gameStarted) {
            // --- RENDER THE GAME BOARD ---
            showPage('game-board-page');
            gameTable.innerHTML = ''; // Clear the entire board for a fresh render
            boardGameCodeDisplay.textContent = gameState.code;

            // Determine player order (current player is always at the bottom of the screen)
            const localPlayerIndex = gameState.players.findIndex(p => p.id === currentPlayer.id);
            if (localPlayerIndex === -1) return; // Can't render if we're not in the player list

            const orderedPlayers = [
                ...gameState.players.slice(localPlayerIndex),
                ...gameState.players.slice(0, localPlayerIndex)
            ].reverse();


            orderedPlayers.forEach(player => {
                const isCurrentUser = player.id === currentPlayer.id;

                const playerArea = document.createElement('div');
                playerArea.className = 'player-area';
                playerArea.id = `player-area-${player.id}`;
                playerArea.dataset.playerId = player.id;
                playerArea.classList.toggle('current-player-area', isCurrentUser);
                playerArea.classList.toggle('opponent-player-area', !isCurrentUser);

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
                    const sessionP = gameState.players.find(p => p.id === player.id);
                    if (sessionP) sessionP.life = player.life;
                    lifeDisplay.textContent = player.life;
                });
                const increaseLifeButton = document.createElement('button');
                increaseLifeButton.textContent = '+';
                increaseLifeButton.className = 'life-button';
                increaseLifeButton.addEventListener('click', () => {
                    player.life++;
                    const sessionP = gameState.players.find(p => p.id === player.id);
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
                    const sessionP = gameState.players.find(p => p.id === player.id);
                    if (sessionP) sessionP.energy = player.energy;
                    energyDisplay.textContent = player.energy;
                });
                const increaseEnergyButton = document.createElement('button');
                increaseEnergyButton.textContent = '+';
                increaseEnergyButton.className = 'life-button';
                increaseEnergyButton.addEventListener('click', () => {
                    if (!player.energy) player.energy = 0;
                    player.energy++;
                    const sessionP = gameState.players.find(p => p.id === player.id);
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

                            if (!gameState.playerPlayZones[player.id]) gameState.playerPlayZones[player.id] = [];
                            gameState.playerPlayZones[player.id].push(tokenData);

                            const cardElement = createCardElement(tokenData, false);
                            const placeholder = targetRowContainer.querySelector('.placeholder-text');
                            if (placeholder) placeholder.remove();
                            targetRowContainer.appendChild(cardElement);

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
                deckZone.innerHTML = `<div class="cards-in-zone-container stacked-cards-display"></div>`;
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

            // After creating the structure, populate it with cards and update counts
            renderGameState(gameState);

        } else {
            // --- RENDER THE LOBBY ---
            updateLobbyUI();
            showPage('lobby-page');
        }
    }

    // In your Realtime listener, you already have the correct call:
    // gameChannel.on('postgres_changes', ..., (payload) => {
    //     gameState = payload.new.game_state;
    //     renderFromGameState(); // This will now work correctly
    // });

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
                if (!gameState.playerHands[targetPlayerId]) {
                    gameState.playerHands[targetPlayerId] = [];
                }
                targetArray = gameState.playerHands[targetPlayerId];
                break;
            case 'play':
                if (!gameState.playerPlayZones[targetPlayerId]) {
                    gameState.playerPlayZones[targetPlayerId] = [];
                }
                targetArray = gameState.playerPlayZones[targetPlayerId];
                break;
            case 'discard':
                if (!gameState.playerDiscards[targetPlayerId]) {
                    gameState.playerDiscards[targetPlayerId] = [];
                }
                targetArray = gameState.playerDiscards[targetPlayerId];
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

        const currentHandState = gameState.playerHands[playerId] || [];
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
        gameState.playerHands[playerId] = newOrderedHandState;
    }

    // Helper function to reorder the play zone state array based on current DOM order of cards in rows
    function reorderPlayZoneStateBasedOnDOM(playerId) {
        const playerAreaElement = document.getElementById(`player-area-${playerId}`);
        if (!playerAreaElement) return;

        const playZoneRow1Container = playerAreaElement.querySelector(`#play-zone-${playerId}-row1`);
        const playZoneRow2Container = playerAreaElement.querySelector(`#play-zone-${playerId}-row2`);

        const currentPlayState = gameState.playerPlayZones[playerId] || [];
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

        gameState.playerPlayZones[playerId] = newOrderedPlayState;
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
            if (!dataString) return;

            let transferredData;
            try {
                transferredData = JSON.parse(dataString);
            } catch (e) { console.error("Failed to parse transferred data on drop:", e); return; }

            const { cardId, sourcePlayerId, sourceZoneType } = transferredData;
            const targetPlayerId = ownerPlayerId;
            const targetZoneType = zoneType;

            const draggedCardElement = document.querySelector(`.card-on-board[data-card-id="${cardId}"]`);
            if (!draggedCardElement) {
                console.error("Could not find the dragged card element in the DOM.");
                return; // Early exit if the card element doesn't exist
            }

            // --- 1. OPTIMISTIC UI UPDATE (The "Best of the Original") ---
            // This part gives the user instant feedback. We move the DOM element immediately.
            // We don't touch the local `gameState` object here.

            // Determine the actual DOM container for cards
            let targetCardsContainer;
            if (targetZoneType.startsWith('play-row')) {
                targetCardsContainer = zoneElement;
            } else if (['hand', 'discard'].includes(targetZoneType)) {
                targetCardsContainer = zoneElement.querySelector('.cards-in-zone-container');
            }
            // No container needed for 'deck' as the element is removed

            if (targetZoneType === 'deck') {
                draggedCardElement.remove(); // Optimistically remove the card
            } else if (targetCardsContainer) {
                // Use your existing helper to insert the card at the right visual position
                insertCardIntoDOMZone(draggedCardElement, targetCardsContainer, event.clientX);
            }

            // You can even optimistically update card counts if you want,
            // though the server broadcast will correct it anyway.

            // --- 2. SEND ACTION TO SERVER (The "Best of Server-as-SoT") ---
            // Now, we tell the server what the user *intended* to do.
            // We send a small, specific action, not the entire game state.
            syncGameStateToServer({
                type: 'MOVE_CARD',
                payload: {
                    cardId: cardId,
                    source: {
                        playerId: sourcePlayerId,
                        zone: sourceZoneType,
                    },
                    target: {
                        playerId: targetPlayerId,
                        zone: targetZoneType,
                        dropX: event.clientX
                    }
                }
            });

            // The server will process the action, and the Realtime broadcast will
            // trigger `renderFromGameState` to make the final, authoritative update.
            // If our optimistic update was correct, the user will see no change.
            // If it was wrong (e.g., an illegal move), the UI will "snap back" to the correct state.
        });
    }

    // Deck Manipulation Functions
    function shuffleDeck(playerId) {
        if (!gameState.playerDecks[playerId] || gameState.playerDecks[playerId].length === 0) {
            console.log(`Player ${playerId} has no cards to shuffle.`);
            return;
        }

        // Fisher-Yates shuffle algorithm
        const deck = gameState.playerDecks[playerId];
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
        const discardPile = gameState.playerDiscards[playerId] || [];
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
            const discardPile = gameState.playerDiscards[playerId] || [];
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

    function moveCardFromModalAction(cardId, sourcePlayerId, sourceZoneType, targetZoneType, positionInTarget = 'end') {
        // This function no longer manipulates local state. It just tells the server what to do.
        syncGameStateToServer({
            type: 'MOVE_CARD_FROM_MODAL',
            payload: {
                cardId: cardId,
                playerId: sourcePlayerId,
                sourceZone: sourceZoneType,
                targetZone: targetZoneType,
                position: positionInTarget
            }
        });
    }

    function handleViewCardsFromDeck(playerId, viewFromTop, isFullSearch = false) {
        ensureViewCardsModalElements();
        const deck = gameState.playerDecks[playerId] || [];
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
                            moveCardFromModalAction(cardId, playerId, 'deck', 'hand');
                            cardItemContainer.remove(); // Optimistically remove from modal
                        }
                    },
                    {
                        text: 'To Top of Deck',
                        action: () => {
                            // OLD: const actualCard = findAndRemoveCardFromSourceState(...) ...
                            // NEW:
                            moveCardFromModalAction(cardId, playerId, 'deck', 'deck', 'top');
                            cardItemContainer.remove(); // Optimistic removal
                        }
                    },
                    {
                        text: 'To Bottom of Deck',
                        action: () => {
                            // OLD: const actualCard = findAndRemoveCardFromSourceState(...) ...
                            // NEW:
                            moveCardFromModalAction(cardId, playerId, 'deck', 'deck', 'end');
                            cardItemContainer.remove(); // Optimistic removal
                        }
                    },
                    {
                        text: 'To Discard',
                        action: () => {
                            // OLD: if (moveCardAndUpdateBoard(cardId, playerId, 'deck', playerId, 'discard')) { ... }
                            // NEW:
                            moveCardFromModalAction(cardId, playerId, 'deck', 'discard');
                            cardItemContainer.remove(); // Optimistic removal
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
                gameState.playerDecks[playerId] = gameState.playerDecks[playerId].filter(c => !remainingCardIds.includes(c.id));
                const cardsToReturn = currentModalCards.map(modalCard => {
                    modalCard.isFacedown = 'true';
                    modalCard.isTapped = 'false';
                    modalCard.rotation = (modalCard.rotation === '180') ? '180' : '0';
                    return modalCard;
                });
                gameState.playerDecks[playerId].unshift(...cardsToReturn);
                if (playerAreaElement) updateZoneCardCount(playerAreaElement, 'deck');
            }
        }));

        viewCardsModalFooter.appendChild(createFooterButton('Return Remaining to Bottom (Order Shown)', () => {
            if (currentModalCards.length > 0) {
                const remainingCardIds = currentModalCards.map(c => c.id);
                gameState.playerDecks[playerId] = gameState.playerDecks[playerId].filter(c => !remainingCardIds.includes(c.id));
                const cardsToReturn = currentModalCards.map(modalCard => {
                    modalCard.isFacedown = 'true';
                    modalCard.isTapped = 'false';
                    modalCard.rotation = (modalCard.rotation === '180') ? '180' : '0';
                    return modalCard;
                });
                gameState.playerDecks[playerId].push(...cardsToReturn);
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
        const discardPile = gameState.playerDiscards[playerId] || [];
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

                // We can't use the old handleMoveAction helper anymore.
                const actions = [
                    {
                        text: 'To Hand',
                        action: () => {
                            moveCardFromModalAction(cardId, playerId, 'discard', 'hand');
                            cardItemContainer.remove();
                        }
                    },
                    {
                        text: 'To Top of Deck',
                        action: () => {
                            moveCardFromModalAction(cardId, playerId, 'discard', 'deck', 'top');
                            cardItemContainer.remove();
                        }
                    },
                    {
                        text: 'To Bottom of Deck',
                        action: () => {
                            moveCardFromModalAction(cardId, playerId, 'discard', 'deck', 'end');
                            cardItemContainer.remove();
                        }
                    },
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