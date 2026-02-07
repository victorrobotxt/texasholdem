import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, PlayerAction } from '../types';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5001';

const socket: Socket = io(API_BASE_URL, {
    transports: ['websocket', 'polling'], 
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    autoConnect: true,
});

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const gameIdRef = useRef<string | null>(null);
  
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleApiResponse = (data: GameState) => {
    setGameState(data);
    if (data.gameId) gameIdRef.current = data.gameId;
    setError(null);
  };

  useEffect(() => {
    const onConnect = () => {
        console.log("✅ Socket Connected");
        
        if (disconnectTimerRef.current) {
            clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = null;
        }
        setIsConnected(true);

        if (gameIdRef.current) {
            console.log("🔄 Re-joining room:", gameIdRef.current);
            socket.emit('join', { gameId: gameIdRef.current });
        }
    };

    const onDisconnect = () => {
        console.warn("⚠️ Socket Disconnected (Waiting to see if temporary...)");
        
        if (!disconnectTimerRef.current) {
            disconnectTimerRef.current = setTimeout(() => {
                console.error("❌ Disconnect confirmed (timeout reached)");
                setIsConnected(false);
            }, 1500);
        }
    };

    const onUpdate = (newState: GameState) => {
        setIsLoading(false);
        handleApiResponse(newState);
    };

    const onError = (err: { message: string }) => {
        console.error("❌ Socket Error:", err);
        setError(err.message);
        setIsLoading(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('update', onUpdate);
    socket.on('error', onError);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('update', onUpdate);
      socket.off('error', onError);
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
    };
  }, []);
  
  const newGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: 'You' }),
      });
      if (!response.ok) throw new Error('Failed to start a new game.');
      const data: GameState = await response.json();
      handleApiResponse(data); 
      if (socket.connected) socket.emit('join', { gameId: data.gameId });
      else socket.connect();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePlayerAction = useCallback(async (action: PlayerAction, amount: number = 0) => {
    if (!gameState || gameState.activePlayerId !== 0) return;
    setIsLoading(true);
    setError(null);
    socket.emit('action', { gameId: gameState.gameId, playerId: 0, action, amount });
  }, [gameState]);
  
  const nextHand = useCallback(async () => {
    if (!gameState || isLoading) return;
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/game/${gameState.gameId}/next`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to start next hand.');
        const data: GameState = await response.json();
        handleApiResponse(data);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }, [gameState, isLoading]);

  return { gameState, handlePlayerAction, newGame, nextHand, isConnected, isLoading, error };
};
