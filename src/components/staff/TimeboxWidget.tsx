import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, X, Clock4 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TimeboxWidgetProps {
  userId: string;
  userProfile: any;
}

interface Priority {
  id: string;
  text: string;
  completed: boolean;
}

interface TimeBlock {
  id: string;
  time: string;
  task: string;
  completed: boolean;
}

const TimeboxWidget = ({ userId, userProfile }: TimeboxWidgetProps) => {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [priorities, setPriorities] = useState<Priority[]>([
    { id: '1', text: '', completed: false },
    { id: '2', text: '', completed: false },
    { id: '3', text: '', completed: false }
  ]);
  const [brainDump, setBrainDump] = useState('');
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() => {
    const blocks: TimeBlock[] = [];
    for (let hour = 5; hour <= 23; hour++) {
      const times = [`${hour}:00`, `${hour}:30`];
      times.forEach(time => {
        blocks.push({
          id: `${time}`,
          time: time,
          task: '',
          completed: false
        });
      });
    }
    return blocks;
  });
  const { toast } = useToast();

  // Auto-save data periodically
  useEffect(() => {
    const saveData = async () => {
      try {
        const plannerData = {
          date: currentDate,
          priorities,
          brain_dump: brainDump,
          time_blocks: timeBlocks
        };

        await supabase
          .from('workspace_layouts')
          .upsert({
            user_id: userId,
            layout_data: plannerData as any // Type cast for JSON storage
          });
      } catch (error) {
        console.error('Error saving planner data:', error);
      }
    };

    const timeoutId = setTimeout(saveData, 2000);
    return () => clearTimeout(timeoutId);
  }, [priorities, brainDump, timeBlocks, currentDate, userId]);

  const updatePriority = (id: string, text: string) => {
    setPriorities(prev => prev.map(p => p.id === id ? { ...p, text } : p));
  };

  const togglePriorityComplete = (id: string) => {
    setPriorities(prev => prev.map(p => p.id === id ? { ...p, completed: !p.completed } : p));
  };

  const updateTimeBlock = (id: string, task: string) => {
    setTimeBlocks(prev => prev.map(tb => tb.id === id ? { ...tb, task } : tb));
  };

  const toggleTimeBlockComplete = (id: string) => {
    setTimeBlocks(prev => prev.map(tb => tb.id === id ? { ...tb, completed: !tb.completed } : tb));
  };

  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10 h-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-lg">
          <Clock4 className="w-5 h-5" />
          Timeboxing Planner
        </CardTitle>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/60" />
          <Input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="bg-black/20 border-white/20 text-white text-sm w-auto"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
        {/* Top Priorities */}
        <div className="space-y-2">
          <h3 className="text-white font-medium text-sm">Top Priorities</h3>
          <div className="space-y-1">
            {priorities.map((priority, index) => (
              <div key={priority.id} className="flex items-center gap-2">
                <Button
                  onClick={() => togglePriorityComplete(priority.id)}
                  className={`w-4 h-4 p-0 rounded ${
                    priority.completed
                      ? 'bg-green-500/30 text-green-400'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  size="sm"
                >
                  {priority.completed && '✓'}
                </Button>
                <Input
                  placeholder={`Priority ${index + 1}`}
                  value={priority.text}
                  onChange={(e) => updatePriority(priority.id, e.target.value)}
                  className={`bg-black/20 border-white/20 text-white text-sm ${
                    priority.completed ? 'line-through opacity-60' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Brain Dump */}
        <div className="space-y-2">
          <h3 className="text-white font-medium text-sm">Brain Dump</h3>
          <Textarea
            placeholder="Jot down all ideas, tasks, or distractions that pop into your head..."
            value={brainDump}
            onChange={(e) => setBrainDump(e.target.value)}
            className="bg-black/20 border-white/20 text-white text-sm min-h-[80px] resize-none"
          />
        </div>

        {/* Time Blocks */}
        <div className="space-y-2">
          <h3 className="text-white font-medium text-sm">Hourly Blocks (30-min intervals)</h3>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {timeBlocks.map((block) => (
              <div key={block.id} className="flex items-center gap-2">
                <Button
                  onClick={() => toggleTimeBlockComplete(block.id)}
                  className={`w-4 h-4 p-0 rounded flex-shrink-0 ${
                    block.completed
                      ? 'bg-green-500/30 text-green-400'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  size="sm"
                >
                  {block.completed && '✓'}
                </Button>
                <span className="text-white/70 text-sm font-mono w-12 flex-shrink-0">
                  {block.time}
                </span>
                <Input
                  placeholder="Task or activity..."
                  value={block.task}
                  onChange={(e) => updateTimeBlock(block.id, e.target.value)}
                  className={`bg-black/20 border-white/20 text-white text-sm ${
                    block.completed ? 'line-through opacity-60' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeboxWidget;