'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Gamepad2 } from 'lucide-react';

// Snake Game Component
function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const gameState = useRef({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: { x: 0, y: 0 },
    nextDirection: { x: 0, y: 0 },
  });

  const gridSize = 20;
  const canvasSize = 300;

  const resetGame = useCallback(() => {
    gameState.current = {
      snake: [{ x: 10, y: 10 }],
      food: { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) },
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const { direction } = gameState.current;
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) gameState.current.nextDirection = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (direction.y !== -1) gameState.current.nextDirection = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) gameState.current.nextDirection = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (direction.x !== -1) gameState.current.nextDirection = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    const gameLoop = setInterval(() => {
      const { snake, food, nextDirection } = gameState.current;
      gameState.current.direction = nextDirection;

      const head = { ...snake[0] };
      head.x += nextDirection.x;
      head.y += nextDirection.y;

      // Check wall collision
      if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        setGameOver(true);
        clearInterval(gameLoop);
        return;
      }

      // Check self collision
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        clearInterval(gameLoop);
        return;
      }

      const newSnake = [head, ...snake];

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 10);
        gameState.current.food = {
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize),
        };
      } else {
        newSnake.pop();
      }

      gameState.current.snake = newSnake;

      // Draw
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Draw snake
      ctx.fillStyle = '#22c55e';
      newSnake.forEach((segment, index) => {
        const size = (canvasSize / gridSize) - 1;
        ctx.fillRect(
          segment.x * (canvasSize / gridSize) + 0.5,
          segment.y * (canvasSize / gridSize) + 0.5,
          size,
          size
        );
      });

      // Draw food
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(
        food.x * (canvasSize / gridSize) + (canvasSize / gridSize) / 2,
        food.y * (canvasSize / gridSize) + (canvasSize / gridSize) / 2,
        (canvasSize / gridSize) / 2 - 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }, 150);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameStarted, gameOver]);

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Draw start message
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Klik "Start Spel" om te beginnen!', canvasSize / 2, canvasSize / 2);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Gamepad2 className="h-4 w-4" />
        <span>Score: {score}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="rounded-lg border border-slate-600"
        style={{ background: '#1e293b' }}
      />
      {!gameStarted || gameOver ? (
        <Button onClick={resetGame} className="w-full">
          {gameOver ? 'Opnieuw Spelen' : 'Start Spel'}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground text-center">
          Gebruik de pijltjestoetsen om te bewegen
        </p>
      )}
    </div>
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showGame, setShowGame] = useState(false);

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <AlertTriangle className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl">Oeps! Er ging iets mis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-lg">
            Sorry de website werkt nu niet dit is ons teams fout wij zijn hard aan het werk om dit te fixen
          </p>
          
          {showGame ? (
            <SnakeGame />
          ) : (
            <div className="flex flex-col gap-2">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Probeer opnieuw
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                Terug naar home
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowGame(true)} 
                className="w-full"
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                Speel een spelletje terwijl je wacht
              </Button>
            </div>
          )}
          
          {showGame && (
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" onClick={reset} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Probeer opnieuw
              </Button>
              <Button variant="ghost" onClick={() => setShowGame(false)} className="w-full">
                Terug naar foutmelding
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
