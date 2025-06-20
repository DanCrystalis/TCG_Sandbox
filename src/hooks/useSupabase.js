import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ACTION_TYPES } from '../types/gameState';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

export const useSupabase = () => {
  const [gameChannel, setGameChannel] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Generate game code
  const generateGameCode = useCallback(() => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  }, []);

  // Host a new game
  const hostGame = useCallback(async (playerData) => {
    const gameCode = generateGameCode();
    
    const initialGameState = {
      players: [playerData],
      gameStarted: false,
      maxPlayers: 4
    };

    const { data, error } = await supabase
      .from('games')
      .insert({
        code: gameCode,
        host_id: playerData.id,
        game_state: initialGameState
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Could not create the game: ${error.message}`);
    }

    return { gameCode, gameState: initialGameState };
  }, [generateGameCode]);

  // Sync game state to server
  const syncGameStateToServer = useCallback(async (action) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-game-state', {
        body: {
          gameCode: action.gameCode,
          action: action
        }
      });

      if (error) {
        throw new Error(`Error performing action '${action.type}': ${error.message}`);
      }

      return data;
    } catch (err) {
      throw new Error(`Network or other error during sync: ${err.message}`);
    }
  }, []);

  // Connect to game channel
  const connectToGameChannel = useCallback((gameCode, onStateUpdate) => {
    // Unsubscribe from existing channel
    if (gameChannel) {
      supabase.removeChannel(gameChannel);
    }

    const channel = supabase.channel(`game:${gameCode}`, {
      config: {
        broadcast: {
          self: true,
        },
      },
    });

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `code=eq.${gameCode}`
        },
        (payload) => {
          console.log('Received state update from server:', payload);
          if (onStateUpdate) {
            onStateUpdate(payload.new.game_state);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for game ${gameCode}:`, status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setGameChannel(channel);
    return channel;
  }, [gameChannel]);

  // Disconnect from game channel
  const disconnectFromGameChannel = useCallback(() => {
    if (gameChannel) {
      supabase.removeChannel(gameChannel);
      setGameChannel(null);
      setIsConnected(false);
    }
  }, [gameChannel]);

  // Upload card images to storage
  const uploadCardImages = useCallback(async (files, playerId) => {
    const uploadedCards = [];
    let cardIdCounter = 0;

    for (const file of Array.from(files)) {
      if (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')) {
        // Handle ZIP file upload
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(file);
        
        for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
          if (!zipEntry.dir && /\.(jpe?g|png|webp|gif|svg|bmp|tiff|ico|heic|heif|avif)$/i.test(zipEntry.name)) {
            const blob = await zipEntry.async('blob');
            const cardId = `card_${playerId}_${Date.now()}_${cardIdCounter++}`;
            const filePath = `${playerId}/${cardId}-${zipEntry.name}`;

            const { error: uploadError } = await supabase.storage
              .from('card-images')
              .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: true
              });

            if (uploadError) {
              console.error('Error uploading card image:', uploadError);
              continue;
            }

            const { data: urlData } = supabase.storage
              .from('card-images')
              .getPublicUrl(filePath);

            uploadedCards.push({ 
              id: cardId, 
              publicUrl: urlData.publicUrl, 
              fileName: zipEntry.name 
            });
          }
        }
      } else if (file.type.startsWith('image/')) {
        // Handle individual image upload
        const cardId = `card_${playerId}_${Date.now()}_${cardIdCounter++}`;
        const filePath = `${playerId}/${cardId}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('card-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading card image:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('card-images')
          .getPublicUrl(filePath);

        uploadedCards.push({ 
          id: cardId, 
          publicUrl: urlData.publicUrl, 
          fileName: file.name 
        });
      }
    }

    return uploadedCards;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromGameChannel();
    };
  }, [disconnectFromGameChannel]);

  return {
    supabase,
    isConnected,
    generateGameCode,
    hostGame,
    syncGameStateToServer,
    connectToGameChannel,
    disconnectFromGameChannel,
    uploadCardImages
  };
}; 