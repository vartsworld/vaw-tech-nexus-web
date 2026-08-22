import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ArcadeGameHeaderProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  onBack?: () => void;
}

export default function ArcadeGameHeader({ title, description, icon: Icon = Gamepad2, onBack }: ArcadeGameHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('?arcade');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{title}</h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Arcade Game
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{description}</p>
        </div>
      </div>

      <Button
        onClick={handleBack}
        variant="outline"
        className="bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white font-medium text-xs rounded-xl self-start sm:self-auto flex items-center gap-2 transition-all hover:border-white/20"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Arcade
      </Button>
    </div>
  );
}
