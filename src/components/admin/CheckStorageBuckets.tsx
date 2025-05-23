
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
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (createError) {
            console.error('Error creating bucket:', createError);
            // If we can't create it automatically, suggest manual creation
            if (createError.message.includes('permission') || createError.message.includes('policy')) {
              throw new Error('Media bucket does not exist in storage. Please create it manually in the Supabase dashboard.');
            } else {
              throw new Error(createError.message);
            }
          }
          
          console.log('Created media storage bucket');
          toast({
            title: "Storage bucket created",
            description: "Media storage has been set up successfully",
          });
        } else {
          console.log('Media bucket already exists');
          toast({
            title: "Storage ready",
            description: "Media storage is properly configured",
          });
        }
        
        setChecked(true);
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error checking/creating storage bucket:', errorMessage);
        setError(`Storage setup error: ${errorMessage}`);
        toast({
          title: "Storage setup error",
          description: "There was a problem with the storage configuration. Please check your Supabase storage settings.",
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
          <p className="mt-2 font-medium">Please follow these steps:</p>
          <ol className="list-decimal ml-5 mt-1">
            <li>Log in to your Supabase dashboard</li>
            <li>Go to "Storage" section</li>
            <li>Click "New Bucket"</li>
            <li>Name it "media" and set it to "public"</li>
            <li>Click "Create bucket"</li>
            <li>Set appropriate RLS policies to allow uploads</li>
            <li>Refresh this page</li>
          </ol>
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};

export default CheckStorageBuckets;
