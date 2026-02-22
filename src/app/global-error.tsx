'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// Snake Game Component
function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const gridSize = 20;
  const canvasSize = 300;

  const gameState = useRef({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: { x: 0, y: 0 },
    nextDirection: { x: 0, y: 0 },
  });

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

      if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        setGameOver(true);
        clearInterval(gameLoop);
        return;
      }

      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        clearInterval(gameLoop);
        return;
      }

      const newSnake = [head, ...snake];

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

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      ctx.fillStyle = '#22c55e';
      newSnake.forEach((segment) => {
        const size = (canvasSize / gridSize) - 1;
        ctx.fillRect(
          segment.x * (canvasSize / gridSize) + 0.5,
          segment.y * (canvasSize / gridSize) + 0.5,
          size,
          size
        );
      });

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Klik "Start Spel" om te beginnen!', canvasSize / 2, canvasSize / 2);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
        🎮 Score: {score}
      </div>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{ 
          borderRadius: '0.5rem', 
          border: '1px solid #475569',
          background: '#1e293b'
        }}
      />
      {!gameStarted || gameOver ? (
        <button
          onClick={resetGame}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            width: '100%'
          }}
        >
          {gameOver ? 'Opnieuw Spelen' : 'Start Spel'}
        </button>
      ) : (
        <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
          Gebruik de pijltjestoetsen om te bewegen
        </p>
      )}
    </div>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showGame, setShowGame] = useState(false);

  return (
    <html lang="nl">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#f97316" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ margin: '0 auto' }}
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" x2="12" y1="9" y2="13"/>
                <line x1="12" x2="12.01" y1="17" y2="17"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
              Oeps! Er ging iets mis
            </h1>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '1rem' }}>
              Sorry de website werkt nu niet dit is ons teams fout wij zijn hard aan het werk om dit te fixen
            </p>
            
            {showGame ? (
              <SnakeGame />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={reset}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    width: '100%'
                  }}
                >
                  🔄 Probeer opnieuw
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  style={{
                    background: 'transparent',
                    color: '#3b82f6',
                    border: '1px solid #e2e8f0',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                >
                  Terug naar home
                </button>
                <button
                  onClick={() => setShowGame(true)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                >
                  🎮 Speel een spelletje terwijl je wacht
                </button>
              </div>
            )}
            
            {showGame && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  onClick={reset}
                  style={{
                    background: 'transparent',
                    color: '#3b82f6',
                    border: '1px solid #e2e8f0',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                >
                  🔄 Probeer opnieuw
                </button>
                <button
                  onClick={() => setShowGame(false)}
                  style={{
                    background: 'transparent',
                    color: '#64748b',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    width: '100%'
                  }}
                >
                  Terug naar foutmelding
                </button>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
