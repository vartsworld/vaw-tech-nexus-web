import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

export default function PingPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState({ player: 0, ai: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const net = { x: canvas.width / 2 - 1, y: 0, width: 2, height: 10, color: "rgba(255,255,255,0.2)" };
    const player = { x: 10, y: canvas.height / 2 - 40, width: 10, height: 80, color: "#3b82f6", score: score.player };
    const ai = { x: canvas.width - 20, y: canvas.height / 2 - 40, width: 10, height: 80, color: "#f43f5e", score: score.ai };
    const ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 8, speed: 5, velocityX: 5, velocityY: 5, color: "#fff" };

    const drawRect = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };

    const drawCircle = (x: number, y: number, r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();
    };

    const drawNet = () => {
      for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
      }
    };

    const resetBall = () => {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.velocityX = -ball.velocityX;
      ball.speed = 5;
    };

    const update = () => {
      // Move ball
      ball.x += ball.velocityX;
      ball.y += ball.velocityY;

      // AI movement logic
      ai.y += ((ball.y - (ai.y + ai.height / 2))) * 0.1;

      // Collision with top/bottom walls
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
      }

      // Check collision with paddles
      let playerHit = (ball.x < canvas.width / 2) ? player : ai;

      if (ball.x - ball.radius < playerHit.x + playerHit.width &&
          ball.x + ball.radius > playerHit.x &&
          ball.y - ball.radius < playerHit.y + playerHit.height &&
          ball.y + ball.radius > playerHit.y) {

        let collidePoint = (ball.y - (playerHit.y + playerHit.height / 2));
        collidePoint = collidePoint / (playerHit.height / 2);

        let angleRad = (Math.PI / 4) * collidePoint;
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;

        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        ball.speed += 0.5; // increase speed slightly
      }

      // Update score
      if (ball.x - ball.radius < 0) {
        ai.score++;
        setScore({ player: player.score, ai: ai.score });
        resetBall();
      } else if (ball.x + ball.radius > canvas.width) {
        player.score++;
        setScore({ player: player.score, ai: ai.score });
        resetBall();
      }
    };

    const render = () => {
      drawRect(0, 0, canvas.width, canvas.height, "#09090b");
      drawNet();
      drawRect(player.x, player.y, player.width, player.height, player.color);
      drawRect(ai.x, ai.y, ai.width, ai.height, ai.color);
      drawCircle(ball.x, ball.y, ball.radius, ball.color);
    };

    const gameLoop = () => {
      if (isPlaying) {
        update();
        render();
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    if (isPlaying) {
      gameLoop();
    } else {
      render();
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      player.y = e.clientY - rect.top - player.height / 2;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPlaying, score]); // Not technically correct to re-bind on score, but fine for simple local state

  return (
    <Card className="max-w-2xl mx-auto mt-8 bg-zinc-950 border-white/10 text-white overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-slate-900 to-slate-800">
        <CardTitle className="text-xl font-black text-white flex items-center gap-2">
          Ping Pong <span className="text-xs text-white/50 opacity-70 ml-2">[v/s AI]</span>
        </CardTitle>
        <div className="flex gap-4 font-mono font-bold text-xl">
          <span className="text-blue-500">{score.player}</span>
          <span className="text-slate-500">-</span>
          <span className="text-rose-500">{score.ai}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="border border-white/10 rounded-lg shadow-xl bg-zinc-900 w-full max-w-full"
        />
        <Button
          onClick={() => {
            if (!isPlaying && score.player > 0 === false && score.ai > 0 === false) {
              setIsPlaying(true);
            } else if (isPlaying) {
              setIsPlaying(false);
            } else {
              setScore({ player: 0, ai: 0 });
              setIsPlaying(true);
            }
          }}
          className={`mt-6 w-full max-w-[200px] ${isPlaying ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-600 hover:bg-emerald-500'}`}
        >
          {isPlaying ? 'Pause' : (score.player > 0 || score.ai > 0) ? 'Restart Game' : 'Start Game'}
        </Button>
      </CardContent>
    </Card>
  );
}
