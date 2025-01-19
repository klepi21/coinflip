'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const BOD_SOLO_URL = 'https://bod.gg/assets/bod-solo2-CEyg0yC7.svg';
const SAUSAGE_URL = 'https://png.pngtree.com/png-clipart/20210311/original/pngtree-grilled-sausage-clip-art-png-image_6018415.png';

interface Obstacle {
  id: number;
  position: number;
}

export const BodRunnerGame = () => {
  const [isJumping, setIsJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setFinalScore(0);
    setGameOver(false);
    setObstacles([]);
    
    // Start the game loop
    const gameInterval = setInterval(() => {
      if (!gameOver) {
        // Update score
        setScore(prev => prev + 1);
        
        // Move obstacles
        setObstacles(prev => {
          // Move existing obstacles left
          const movedObstacles = prev
            .map(obs => ({ ...obs, position: obs.position - 3 }))
            .filter(obs => obs.position > -20);

          // Randomly add new obstacles (increased frequency)
          if (Math.random() < 0.05 && movedObstacles.length < 3) {
            movedObstacles.push({
              id: Date.now(),
              position: 100
            });
          }

          return movedObstacles;
        });
      }
    }, 50);

    // Cleanup interval on game over
    return () => clearInterval(gameInterval);
  };

  const handleGameOver = () => {
    setGameOver(true);
    setIsPlaying(false);
    setFinalScore(Math.floor(score / 5));
    setObstacles([]);
  };

  const jump = () => {
    if (!isJumping && !gameOver) {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 500);
    }
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isPlaying && !gameOver) {
          startGame();
        } else if (isPlaying) {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isJumping]);

  // Collision detection
  useEffect(() => {
    if (!isPlaying) return;

    const checkCollision = setInterval(() => {
      const playerBox = {
        x: 80,
        y: isJumping ? 100 : 0,
        width: 80,
        height: 80
      };

      obstacles.forEach(obstacle => {
        const obstacleBox = {
          x: obstacle.position * 4,
          y: 0,
          width: 60,
          height: 60
        };

        if (
          playerBox.x < obstacleBox.x + obstacleBox.width &&
          playerBox.x + playerBox.width > obstacleBox.x &&
          playerBox.y < obstacleBox.y + obstacleBox.height &&
          playerBox.y + playerBox.height > obstacleBox.y
        ) {
          handleGameOver();
        }
      });
    }, 50);

    return () => clearInterval(checkCollision);
  }, [isPlaying, isJumping, obstacles]);

  return (
    <div 
      className="w-full max-w-2xl mx-auto bg-[#FD8700] rounded-xl border-2 border-black p-4 shadow-lg cursor-pointer"
      onClick={() => {
        if (!isPlaying && !gameOver) {
          startGame();
        } else if (isPlaying) {
          jump();
        }
      }}
    >
      <div className="relative h-48 bg-[#FFA036] rounded-lg border-2 border-black overflow-hidden">
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-1 bg-black/20" />

        {/* BOD Character */}
        <motion.div
          className="absolute bottom-0 left-20"
          animate={{
            y: isJumping ? -100 : 0
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 20,
          }}
        >
          <img src={BOD_SOLO_URL} alt="BOD" className="w-20 h-20" />
        </motion.div>

        {/* Obstacles */}
        {obstacles.map(obstacle => (
          <motion.div
            key={obstacle.id}
            className="absolute bottom-0"
            initial={{ left: '100%' }}
            animate={{ left: `${obstacle.position}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          >
            <img src={SAUSAGE_URL} alt="Obstacle" className="w-16 h-16" />
          </motion.div>
        ))}

        {/* Score */}
        <div className="absolute top-4 right-4 font-doggie text-2xl text-black">
          Score: {isPlaying ? Math.floor(score / 5) : finalScore}
        </div>

        {/* Game Over / Start Screen */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white font-doggie mb-2">
                {gameOver ? 'Game Over!' : 'BOD Runner'}
              </h2>
              <p className="text-white font-doggie mb-4">
                {gameOver ? `Final Score: ${finalScore}` : 'Press SPACE or Click to start'}
              </p>
              {gameOver && (
                <button
                  onClick={startGame}
                  className="px-6 py-2 bg-[#FD8700] text-black rounded-full font-doggie border-2 border-black hover:bg-[#FD8700]/80 transition-colors"
                >
                  Play Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 