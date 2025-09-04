import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TimeboxWidgetProps {
  userId: string;
  userProfile: any;
}

const TimeboxWidget = ({ userId, userProfile }: TimeboxWidgetProps) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes in seconds
  const [totalTime, setTotalTime] = useState(25 * 60);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      toast({
        title: "Time's Up!",
        description: "Your focus session has completed.",
      });
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, toast]);

  const handleStart = () => {
    if (!isActive && timeLeft === totalTime) {
      // Starting new session
      const newTotalTime = minutes * 60 + seconds;
      setTotalTime(newTotalTime);
      setTimeLeft(newTotalTime);
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    const newTotalTime = minutes * 60 + seconds;
    setTotalTime(newTotalTime);
    setTimeLeft(newTotalTime);
  };

  const handleTimeChange = () => {
    if (!isActive) {
      const newTotalTime = minutes * 60 + seconds;
      setTotalTime(newTotalTime);
      setTimeLeft(newTotalTime);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10 h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Focus Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Display */}
        <div className="text-center">
          <div className="text-4xl font-mono text-white mb-2">
            {formatTime(timeLeft)}
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 mb-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Time Input */}
        <div className="flex gap-2 items-center justify-center">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
              onBlur={handleTimeChange}
              className="w-16 bg-black/20 border-white/20 text-white text-center"
              min="0"
              max="99"
              disabled={isActive}
            />
            <span className="text-white text-sm">m</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={seconds}
              onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              onBlur={handleTimeChange}
              className="w-16 bg-black/20 border-white/20 text-white text-center"
              min="0"
              max="59"
              disabled={isActive}
            />
            <span className="text-white text-sm">s</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={handleStart}
            className={`${
              isActive 
                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30' 
                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30'
            }`}
            size="sm"
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            onClick={handleReset}
            className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 border-gray-500/30"
            size="sm"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Presets */}
        <div className="flex gap-1 justify-center flex-wrap">
          {[5, 15, 25, 45].map((preset) => (
            <Button
              key={preset}
              onClick={() => {
                if (!isActive) {
                  setMinutes(preset);
                  setSeconds(0);
                  const newTotalTime = preset * 60;
                  setTotalTime(newTotalTime);
                  setTimeLeft(newTotalTime);
                }
              }}
              className="bg-white/5 hover:bg-white/10 text-white/70 text-xs px-2 py-1 h-auto"
              disabled={isActive}
              size="sm"
            >
              {preset}m
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeboxWidget;