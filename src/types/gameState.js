// Game State Types and Interfaces

export const GAME_PAGES = {
  LANDING: 'landing',
  LOBBY: 'lobby',
  GAME_BOARD: 'game-board'
};

export const ZONE_TYPES = {
  HAND: 'hand',
  DECK: 'deck',
  DISCARD: 'discard',
  PLAY: 'play',
  PLAY_ROW1: 'play-row1',
  PLAY_ROW2: 'play-row2'
};

export const ACTION_TYPES = {
  JOIN_GAME: 'JOIN_GAME',
  CONFIRM_DECK: 'CONFIRM_DECK',
  CLEAR_DECK: 'CLEAR_DECK',
  START_GAME: 'START_GAME',
  LEAVE_GAME: 'LEAVE_GAME',
  MOVE_CARD: 'MOVE_CARD',
  MOVE_CARD_FROM_MODAL: 'MOVE_CARD_FROM_MODAL',
  DRAW_CARD: 'DRAW_CARD',
  TOGGLE_TAP: 'TOGGLE_TAP',
  TOGGLE_ROTATE_180: 'TOGGLE_ROTATE_180',
  FLIP_CARD: 'FLIP_CARD',
  MODIFY_COUNTERS: 'MODIFY_COUNTERS'
};

// Card data structure
export const CardData = {
  id: String,
  fileName: String,
  publicUrl: String,
  imageDataUrl: String,
  isTapped: Boolean,
  isFacedown: Boolean,
  rotation: String,
  counters: Array,
  row: String // for play zone cards
};

// Player data structure
export const PlayerData = {
  id: String,
  name: String,
  isHost: Boolean,
  deck: Array,
  deckConfirmed: Boolean,
  life: Number,
  energy: Number
};

// Game state structure
export const GameState = {
  code: String,
  players: Array,
  maxPlayers: Number,
  gameStarted: Boolean,
  playerDecks: Object,
  playerHands: Object,
  playerDiscards: Object,
  playerPlayZones: Object
};

// Current player structure
export const CurrentPlayer = {
  id: String,
  name: String,
  isHost: Boolean,
  deck: Array,
  deckConfirmed: Boolean,
  life: Number,
  energy: Number
};

// Action payload structure
export const ActionPayload = {
  type: String,
  payload: Object
}; 