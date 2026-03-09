
import { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import StrictModeDroppable from '@/components/ui/StrictModeDroppable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, X, Plus, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import TasksManager from './TasksManager';
import TeamChat from './TeamChat';
import MiniChess from './MiniChess';
import TimeboxWidget from './TimeboxWidget';
import WidgetManager from './WidgetManager';
import { ActivityLogPanel } from './ActivityLogPanel';

interface DraggableWorkspaceProps {
  userId: string;
  userProfile: any;
}

interface WorkspaceItem {
  id: string;
  component: string;
  title: string;
  span?: 'full' | 'half';
  removable?: boolean;
  isVisible?: boolean;
}

const availableWidgets = [
  { component: 'TeamChat', title: 'Team Chat', span: 'half' as const, removable: true },
  { component: 'MiniChess', title: 'Mini Chess', span: 'half' as const, removable: true },
  { component: 'ActivityLogPanel', title: 'Activity Logger', span: 'half' as const, removable: true },
  { component: 'TimeboxWidget', title: 'Focus Timer', span: 'half' as const, removable: true },
];

const DraggableWorkspace = ({ userId, userProfile }: DraggableWorkspaceProps) => {
  const isMobile = useIsMobile();
  // Default: Only Tasks Manager visible, other widgets hidden
  const defaultItems: WorkspaceItem[] = [
    { id: 'tasks', component: 'TasksManager', title: 'My Dashboard', span: 'full', removable: false, isVisible: true },
  ];

  const [items, setItems] = useState<WorkspaceItem[]>(defaultItems);
  const [selectedWidget, setSelectedWidget] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(!isMobile);
  const { toast } = useToast();

  // Load saved layout on mount
  useEffect(() => {
    const loadWorkspaceLayout = async () => {
      try {
        const { data, error } = await supabase
          .from('workspace_layouts')
          .select('layout_data')
          .eq('user_id', userId)
          .single();

        if (data?.layout_data && !error) {
          const savedLayout = data.layout_data as unknown as WorkspaceItem[];
          if (Array.isArray(savedLayout) && savedLayout.length > 0) {
            setItems(savedLayout);
          }
        }
      } catch (error) {
        console.error('Error loading workspace layout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaceLayout();
  }, [userId]);

  // Save layout when items change
  useEffect(() => {
    if (isLoading) return;

    const saveLayout = async () => {
      try {
        await supabase
          .from('workspace_layouts')
          .upsert([{
            user_id: userId,
            layout_data: JSON.parse(JSON.stringify(items)),
            updated_at: new Date().toISOString(),
          }], {
            onConflict: 'user_id',
          });
      } catch (error) {
        console.error('Error saving workspace layout:', error);
      }
    };

    const timeoutId = setTimeout(saveLayout, 1000);
    return () => clearTimeout(timeoutId);
  }, [items, userId, isLoading]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
  }, [items]);

  const addWidget = useCallback(() => {
    if (!selectedWidget) return;

    const widget = availableWidgets.find(w => w.component === selectedWidget);
    if (!widget) return;

    const newId = `${widget.component.toLowerCase()}-${Date.now()}`;
    const newItem: WorkspaceItem = {
      id: newId,
      component: widget.component,
      title: widget.title,
      span: widget.span,
      removable: widget.removable,
      isVisible: true,
    };

    setItems(prev => [...prev, newItem]);
    setSelectedWidget('');

    toast({
      title: "Widget Added",
      description: `${widget.title} has been added to your workspace.`,
    });
  }, [selectedWidget, toast]);

  const toggleWidgetVisibility = useCallback((id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, isVisible: !item.isVisible } : item
    ));
  }, []);

  const showAllWidgets = useCallback(() => {
    setItems(prev => prev.map(item => ({ ...item, isVisible: true })));
    toast({
      title: "All Widgets Shown",
      description: "All widgets are now visible.",
    });
  }, [toast]);

  const hideAllWidgets = useCallback(() => {
    setItems(prev => prev.map(item => ({ ...item, isVisible: false })));
    toast({
      title: "All Widgets Hidden",
      description: "All widgets are now collapsed.",
    });
  }, [toast]);

  const removeWidget = useCallback((id: string) => {
    const removedWidget = items.find(item => item.id === id);
    setItems(prev => prev.filter(item => item.id !== id));

    if (removedWidget) {
      toast({
        title: "Widget Removed",
        description: `${removedWidget.title} has been removed from your workspace.`,
      });
    }
  }, [items, toast]);

  const getAvailableWidgets = useCallback(() => {
    const currentComponents = items.map(item => item.component);
    return availableWidgets.filter(widget => !currentComponents.includes(widget.component));
  }, [items]);

  const renderComponent = (item: WorkspaceItem) => {
    switch (item.component) {
      case 'TasksManager':
        return <TasksManager userId={userId} userProfile={userProfile} />;
      case 'TeamChat':
        return <TeamChat userId={userId} userProfile={userProfile} />;
      case 'MiniChess':
        return <MiniChess userId={userId} userProfile={userProfile} />;
      case 'ActivityLogPanel':
        return <ActivityLogPanel userId={userId} className="bg-transparent border-0" />;
      case 'TimeboxWidget':
        return <TimeboxWidget userId={userId} userProfile={userProfile} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Widget Controls - Collapsible on mobile */}
      <Card className="bg-black/10 backdrop-blur-lg border-white/10">
        <button
          className="w-full flex items-center justify-between p-3 sm:p-4 sm:cursor-default"
          onClick={() => isMobile && setShowControls(!showControls)}
        >
          <span className="text-sm font-medium text-foreground/80">Widget Controls</span>
          {isMobile && (
            showControls
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {(showControls || !isMobile) && (
          <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <Select value={selectedWidget} onValueChange={setSelectedWidget}>
                <SelectTrigger className="w-full sm:w-48 bg-black/20 border-white/20 text-foreground">
                  <SelectValue placeholder="Add a widget..." />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-lg border-border">
                  {getAvailableWidgets().map((widget) => (
                    <SelectItem
                      key={widget.component}
                      value={widget.component}
                    >
                      {widget.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  onClick={addWidget}
                  disabled={!selectedWidget}
                  className="flex-1 sm:flex-none bg-primary/20 hover:bg-primary/30 text-foreground border-primary/30"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Widget
                </Button>
                <WidgetManager
                  widgets={items.map(item => ({
                    id: item.id,
                    name: item.title,
                    description: `${item.component} widget`,
                    isVisible: item.isVisible ?? true,
                  }))}
                  onToggleWidget={toggleWidgetVisibility}
                  onShowAll={showAllWidgets}
                  onHideAll={hideAllWidgets}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <StrictModeDroppable droppableId="workspace">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${item.span === 'full' ? 'lg:col-span-2' : 'lg:col-span-1'
                        } ${snapshot.isDragging
                          ? 'opacity-80 transform rotate-1 z-50'
                          : ''
                        } transition-all duration-200`}
                    >
                      <Card className={`bg-black/20 backdrop-blur-lg border-white/10 relative group ${
                        item.component === 'TasksManager'
                          ? 'min-h-[350px] sm:min-h-[500px]'
                          : 'h-[350px] sm:h-[500px]'
                      }`}>
                        {/* Controls - always visible on mobile, hover on desktop */}
                        <div className={`absolute top-2 right-2 flex gap-1 z-10 transition-opacity duration-200 ${
                          isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <Button
                            onClick={() => toggleWidgetVisibility(item.id)}
                            className="p-1 h-6 w-6 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 hover:text-blue-300 border-blue-500/30"
                            size="sm"
                            title={item.isVisible ? 'Hide widget' : 'Show widget'}
                          >
                            {item.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </Button>
                          {item.removable && (
                            <Button
                              onClick={() => removeWidget(item.id)}
                              className="p-1 h-6 w-6 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 border-red-500/30"
                              size="sm"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                          {!isMobile && (
                            <div
                              {...provided.dragHandleProps}
                              className="p-1 h-6 w-6 cursor-grab active:cursor-grabbing bg-white/10 hover:bg-white/20 rounded flex items-center justify-center"
                            >
                              <GripVertical className="w-3 h-3 text-white/60 hover:text-white/80" />
                            </div>
                          )}
                        </div>

                        {/* Drag handle for mobile - hidden since drag doesn't work well on touch */}
                        {isMobile && (
                          <div {...provided.dragHandleProps} className="sr-only" />
                        )}

                        <CardContent className={`p-0 h-full transition-all duration-300 ${!item.isVisible ? 'max-h-12 overflow-hidden' : ''}`}>
                          {!item.isVisible ? (
                            <div className="p-3 sm:p-4 cursor-pointer hover:bg-white/5" onClick={() => toggleWidgetVisibility(item.id)}>
                              <div className="flex items-center justify-between">
                                <h3 className="text-foreground font-medium text-sm">{item.title}</h3>
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                          ) : (
                            renderComponent(item)
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>
    </div>
  );
};

export default DraggableWorkspace;
