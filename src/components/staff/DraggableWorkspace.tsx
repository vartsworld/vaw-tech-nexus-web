import { Card, CardContent } from '@/components/ui/card';
import TasksManager from './TasksManager';

interface DraggableWorkspaceProps {
  userId: string;
  userProfile: any;
}

/** The staff workspace: just "My Dashboard" (tasks). There are no other widgets to arrange. */
const DraggableWorkspace = ({ userId, userProfile }: DraggableWorkspaceProps) => (
  <div className="p-3 sm:p-6">
    <Card className="min-h-[350px] border-white/10 bg-black/20 backdrop-blur-lg sm:min-h-[500px]">
      <CardContent className="h-full p-0">
        <TasksManager userId={userId} userProfile={userProfile} />
      </CardContent>
    </Card>
  </div>
);

export default DraggableWorkspace;
