import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  typingUsers: { user_id: string; full_name: string }[];
  className?: string;
}

const TypingIndicator = ({ typingUsers, className = '' }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].full_name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].full_name} and ${typingUsers[1].full_name} are typing`;
    } else {
      return `${typingUsers[0].full_name} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`flex items-center gap-2 text-xs text-white/60 ${className}`}
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      <span>{getTypingText()}</span>
    </motion.div>
  );
};

export default TypingIndicator;
