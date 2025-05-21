
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImageUploadFieldProps {
  initialImageUrl: string | null;
  onImageChange: (url: string | null) => void;
  bucketName?: string;
  folderPath?: string;
  label?: string;
}

const ImageUploadField = ({
  initialImageUrl,
  onImageChange,
  bucketName = 'media',
  folderPath = 'clients',
  label = 'Client Image'
}: ImageUploadFieldProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Update preview if initialImageUrl changes
    setImagePreview(initialImageUrl);
  }, [initialImageUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      toast({
        title: "Image uploaded successfully",
      });
      
      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (imageFile) {
      const url = await uploadImage();
      if (url) {
        onImageChange(url);
      }
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    onImageChange(null);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="image-upload" className="block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("image-upload")?.click()}
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {imagePreview ? "Change Image" : "Upload Image"}
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        
        {imageFile && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Save Image"}
          </Button>
        )}
        
        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-16 w-16 object-cover rounded"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            >
              <Trash className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadField;
