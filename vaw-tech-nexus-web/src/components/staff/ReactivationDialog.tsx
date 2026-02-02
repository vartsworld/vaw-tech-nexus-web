import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface ReactivationDialogProps {
  open: boolean;
  reactivationCode: number;
  status: string;
  onReactivate: (code: number) => Promise<boolean>;
}

export const ReactivationDialog = ({
  open,
  reactivationCode,
  status,
  onReactivate
}: ReactivationDialogProps) => {
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const statusMessages = {
    afk: {
      title: "You've been away for 3+ hours",
      description: "Please enter the code below to reactivate your session"
    },
    resting: {
      title: "You've been away for 4+ hours",
      description: "Your session needs reactivation. Enter the code below"
    },
    sleeping: {
      title: "You've been away for 5+ hours",
      description: "Your session has been marked as sleeping. Enter the code to continue"
    }
  };

  const message = statusMessages[status as keyof typeof statusMessages] || statusMessages.afk;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 4) {
      toast.error('Please enter a 4-digit code');
      return;
    }

    setIsLoading(true);
    const numericCode = parseInt(code, 10);
    const success = await onReactivate(numericCode);

    if (success) {
      toast.success('Welcome back! Your session has been reactivated.');
      setCode('');
      setAttempts(0);
    } else {
      setAttempts(prev => prev + 1);
      setCode('');
      
      if (attempts >= 2) {
        toast.error('Too many failed attempts. Please contact HR or log in again.');
      } else {
        toast.error('Invalid code. Please try again.');
      }
    }

    setIsLoading(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(value);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <AlertCircle className="h-6 w-6 text-orange-600" />
          </div>
          <DialogTitle className="text-center text-xl">{message.title}</DialogTitle>
          <DialogDescription className="text-center">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Display Code */}
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <KeyRound className="h-4 w-4" />
                <span>Enter this code:</span>
              </div>
              <div className="text-4xl font-bold tracking-widest text-primary">
                {reactivationCode}
              </div>
            </div>
          </div>

          {/* Code Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter 4-digit code"
                value={code}
                onChange={handleCodeChange}
                className="text-center text-2xl tracking-widest"
                maxLength={4}
                autoFocus
                disabled={isLoading || attempts >= 3}
              />
              {attempts > 0 && (
                <p className="text-sm text-destructive text-center">
                  Incorrect code. {3 - attempts} {3 - attempts === 1 ? 'attempt' : 'attempts'} remaining.
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={code.length !== 4 || isLoading || attempts >= 3}
            >
              {isLoading ? 'Reactivating...' : 'Reactivate Account'}
            </Button>
          </form>

          {attempts >= 3 && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive">
                Too many failed attempts. Please contact HR or log in again.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
