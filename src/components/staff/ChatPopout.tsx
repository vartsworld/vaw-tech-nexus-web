import { ReactNode, useState, useRef, useEffect } from "react";
import { X, Minimize2, Maximize2, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatPopoutProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
}

const ChatPopout = ({ title, icon, children, onClose }: ChatPopoutProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 440, y: 80 });
  const [size, setSize] = useState({ width: 400, height: 520 });
  const dragRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPosition({
        x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - size.width)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 60)),
      });
    };
    const handleMouseUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [size.width]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const maximizedStyles = isMaximized
    ? "fixed inset-4 z-[60]"
    : "fixed z-[60]";

  return (
    <div
      className={`${maximizedStyles} flex flex-col rounded-xl border border-white/15 bg-black/90 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden`}
      style={
        isMaximized
          ? undefined
          : { left: position.x, top: position.y, width: size.width, height: size.height }
      }
    >
      {/* Title bar */}
      <div
        ref={dragRef}
        onMouseDown={handleDragStart}
        className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/5 cursor-grab active:cursor-grabbing select-none flex-shrink-0"
      >
        <GripHorizontal className="w-3.5 h-3.5 text-white/30" />
        <span className="flex items-center gap-2 text-sm font-semibold text-white flex-1">
          {icon}
          {title}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
          onClick={() => setIsMaximized(!isMaximized)}
        >
          {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white/50 hover:text-red-400 hover:bg-red-500/10"
          onClick={onClose}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default ChatPopout;
