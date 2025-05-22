
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const CheckStorageBuckets = () => {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAndCreateBucket = async () => {
      if (checked) return;
      
      try {
        setLoading(true);
        // Check if media bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          console.error('Error listing buckets:', listError);
          throw new Error(listError.message);
        }
        
        const mediaBucket = buckets?.find(bucket => bucket.name === 'media');
        
        if (!mediaBucket) {
          // Create the bucket if it doesn't exist
          const { error: createError } = await supabase.storage.createBucket('media', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
          });
          
          if (createError) {
            console.error('Error creating bucket:', createError);
            throw new Error(createError.message);
          }
          
          console.log('Created media storage bucket');
          toast({
            title: "Storage bucket created",
            description: "Media storage has been set up successfully",
          });
        } else {
          console.log('Media bucket already exists');
        }
        
        setChecked(true);
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error checking/creating storage bucket:', errorMessage);
        setError(`Storage setup error: ${errorMessage}`);
        toast({
          title: "Storage setup error",
          description: "There was a problem setting up storage for uploads. Please check your permissions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkAndCreateBucket();
  }, [checked]);
  
  if (error && !loading) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Storage Error</AlertTitle>
        <AlertDescription>
          {error}. File uploads will not work. 
          Please check your Supabase storage permissions.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};

export default CheckStorageBuckets;
