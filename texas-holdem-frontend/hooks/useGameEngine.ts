import { useState, useCallback, useEffect } from 'react';
import { GameState, PlayerAction } from '../types';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5001';
const socket: Socket = io(API_BASE_URL);

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiResponse = (data: GameState) => {
    setGameState(data);
    setError(null);
    setMessage(null);
  };

  useEffect(() => {
    socket.on('update', (newState: GameState) => {
        setIsLoading(false);
        handleApiResponse(newState);
    });

    socket.on('error', (err: { message: string }) => {
        console.error("Socket error:", err);
        setError(err.message);
        setIsLoading(false);
    });

    return () => {
      socket.off('update');
      socket.off('error');
    };
  }, []);
  
  // Effect to join the game room once we have a game ID
  useEffect(() => {
    if (gameState?.gameId) {
      socket.emit('join', { gameId: gameState.gameId });
    }
  }, [gameState?.gameId]);

  const newGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: 'You' }),
      });
      if (!response.ok) throw new Error('Failed to start a new game.');
      const data: GameState = await response.json();
      handleApiResponse(data); // Set initial state
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
    socket.emit('action', {
        gameId: gameState.gameId,
        playerId: 0,
        action,
        amount
    });
  }, [gameState]);
  
  const nextHand = useCallback(async () => {
    if (!gameState || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch(`${API_BASE_URL}/api/game/${gameState.gameId}/next`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to start the next hand.');
        const data: GameState = await response.json();
        handleApiResponse(data);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }, [gameState, isLoading]);

  return { gameState, handlePlayerAction, newGame, nextHand, message, isLoading, error };
};
