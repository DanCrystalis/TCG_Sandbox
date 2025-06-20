# TCG Sandbox React Application

This is a React.js version of the TCG Sandbox application.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm

### Installation
1. Install dependencies:
```bash
npm install
```

### Running the Application
1. Start the development server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

**Important**: The React app runs on port 3000, not the original HTML file. Make sure you're accessing `http://localhost:3000` and not the old `index.html` file.

### Development
- The React app is located in the `src/` directory
- Components are in `src/components/`
- Supabase logic is in `src/hooks/useSupabase.js`
- Game state types are in `src/types/gameState.js`

### File Structure
```
src/
├── components/
│   ├── LandingPage.js
│   ├── LobbyPage.js
│   ├── DeckUpload.js
│   ├── GameBoard.js
│   ├── PlayerArea.js
│   └── Card.js
├── hooks/
│   └── useSupabase.js
├── types/
│   └── gameState.js
├── App.js
└── index.js
```

### Troubleshooting
If you see "Unexpected token '<'" errors:
1. Make sure you're accessing `http://localhost:3000`
2. Ensure the React development server is running (`npm start`)
3. Check the browser console for any compilation errors

The old `index.html` and `script.js` files are still in the root directory but are not used by the React app.