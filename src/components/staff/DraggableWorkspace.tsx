
import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import TasksManager from './TasksManager';
import TeamChat from './TeamChat';
import MiniChess from './MiniChess';
import SpotifyWidget from './SpotifyWidget';

interface DraggableWorkspaceProps {
  userId: string;
  userProfile: any;
}

interface WorkspaceItem {
  id: string;
  component: string;
  title: string;
  span?: 'full' | 'half';
}

const DraggableWorkspace = ({ userId, userProfile }: DraggableWorkspaceProps) => {
  const [items, setItems] = useState<WorkspaceItem[]>([
    { id: 'tasks', component: 'TasksManager', title: 'Tasks Manager', span: 'full' },
    { id: 'chat', component: 'TeamChat', title: 'Team Chat', span: 'half' },
    { id: 'chess', component: 'MiniChess', title: 'Mini Chess', span: 'half' },
    { id: 'spotify', component: 'SpotifyWidget', title: 'Spotify Widget', span: 'half' },
  ]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
  }, [items]);

  const renderComponent = (item: WorkspaceItem) => {
    switch (item.component) {
      case 'TasksManager':
        return <TasksManager userId={userId} userProfile={userProfile} />;
      case 'TeamChat':
        return <TeamChat userId={userId} userProfile={userProfile} />;
      case 'MiniChess':
        return <MiniChess userId={userId} userProfile={userProfile} />;
      case 'SpotifyWidget':
        return <SpotifyWidget userId={userId} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="workspace">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${
                        item.span === 'full' ? 'lg:col-span-2' : 'lg:col-span-1'
                      } ${
                        snapshot.isDragging
                          ? 'opacity-80 transform rotate-2 z-50'
                          : ''
                      } transition-all duration-200`}
                    >
                      <Card className="bg-black/20 backdrop-blur-lg border-white/10 h-full relative group">
                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing z-10"
                        >
                          <GripVertical className="w-4 h-4 text-white/60 hover:text-white/80" />
                        </div>
                        
                        <CardContent className="p-0 h-full">
                          {renderComponent(item)}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default DraggableWorkspace;
