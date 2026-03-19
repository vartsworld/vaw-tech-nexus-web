import { useEffect, useState } from "react";
import { Droppable, DroppableProps } from "react-beautiful-dnd";

/**
 * Workaround for react-beautiful-dnd not working with React 18 StrictMode.
 * Delays rendering of the Droppable until after the initial mount.
 */
const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
};

export default StrictModeDroppable;
