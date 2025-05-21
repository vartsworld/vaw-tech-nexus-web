
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CheckStorageBuckets = () => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAndCreateBucket = async () => {
      if (checked) return;
      
      try {
        // Check if media bucket exists
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        
        const mediaBucket = buckets?.find(bucket => bucket.name === 'media');
        
        if (!mediaBucket) {
          // Create the bucket if it doesn't exist
          const { error: createError } = await supabase.storage.createBucket('media', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
          });
          
          if (createError) throw createError;
          
          console.log('Created media storage bucket');
        }
        
        setChecked(true);
      } catch (error) {
        console.error('Error checking/creating storage bucket:', error);
        toast({
          title: "Storage setup error",
          description: "There was a problem setting up storage for uploads",
          variant: "destructive",
        });
      }
    };
    
    checkAndCreateBucket();
  }, [checked]);
  
  return null; // This component doesn't render anything
};

export default CheckStorageBuckets;
