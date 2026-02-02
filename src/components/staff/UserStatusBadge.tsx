import { Badge } from '@/components/ui/badge';
import { Coffee, Wifi, Clock, Moon, ZapOff, WifiOff } from 'lucide-react';

interface UserStatusBadgeProps {
  status: string;
  isBreakActive?: boolean;
  breakTimeRemaining?: number;
}

export const UserStatusBadge = ({ 
  status, 
  isBreakActive = false,
  breakTimeRemaining = 0
}: UserStatusBadgeProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine display based on break status first
  const effectiveStatus = isBreakActive ? 'coffee_break' : status;

  const statusConfig = {
    online: {
      label: 'Online',
      icon: Wifi,
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      iconColor: 'text-emerald-500',
      pulse: true
    },
    coffee_break: {
      label: `Coffee Break${breakTimeRemaining > 0 ? ` (${formatTime(breakTimeRemaining)})` : ''}`,
      icon: Coffee,
      className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      iconColor: 'text-orange-500',
      pulse: true
    },
    afk: {
      label: 'A.F.K',
      icon: Clock,
      className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      iconColor: 'text-yellow-500',
      pulse: true
    },
    resting: {
      label: 'Resting',
      icon: ZapOff,
      className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      iconColor: 'text-purple-500',
      pulse: false
    },
    sleeping: {
      label: 'Sleeping',
      icon: Moon,
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      iconColor: 'text-blue-500',
      pulse: false
    },
    offline: {
      label: 'Offline',
      icon: WifiOff,
      className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      iconColor: 'text-gray-500',
      pulse: false
    }
  };

  const config = statusConfig[effectiveStatus as keyof typeof statusConfig] || statusConfig.online;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} flex items-center gap-2 px-3 py-1.5`}>
      <div className="relative">
        <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
        {config.pulse && (
          <span className="absolute inset-0 animate-ping">
            <Icon className={`h-3.5 w-3.5 ${config.iconColor} opacity-75`} />
          </span>
        )}
      </div>
      <span className="font-medium text-xs">{config.label}</span>
    </Badge>
  );
};
