
import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link, Trash } from "lucide-react";

interface ImageSelectorProps {
  currentImageUrl: string | null;
  onImageChange: (file: File | null) => void;
  onImageUrlChange: (url: string | null) => void;
  previewUrl: string | null;
}

const isVideoFile = (url: string) => {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
};

const ImageSelector = ({
  currentImageUrl,
  onImageChange,
  onImageUrlChange,
  previewUrl,
}: ImageSelectorProps) => {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [imageUrl, setImageUrl] = useState<string>(currentImageUrl || "");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageChange(e.target.files[0]);
      onImageUrlChange(null);
      setImageUrl("");
    }
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onImageChange(null);
      onImageUrlChange(imageUrl.trim());
    }
  };

  const handleClearImage = () => {
    onImageChange(null);
    onImageUrlChange(null);
    setImageUrl("");
  };

  return (
    <div className="space-y-4">
      <Tabs 
        defaultValue="upload" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="url">Enter URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-3">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {previewUrl ? "Change Media" : "Upload Image/Video"}
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*,video/mp4,video/webm,video/ogg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="url" className="space-y-3">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={handleUrlChange}
              />
              <Button type="button" onClick={handleUrlSubmit}>
                <Link className="h-4 w-4 mr-1" /> Apply
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a direct link to an image or video (JPG, PNG, MP4, WEBM, etc.)
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {previewUrl && (
        <div className="relative inline-block">
          {isVideoFile(previewUrl) ? (
            <video
              src={previewUrl}
              autoPlay
              loop
              muted
              playsInline
              className="h-32 w-auto object-contain border rounded"
            />
          ) : (
            <img
              src={previewUrl}
              alt="Preview"
              className="h-16 w-16 object-contain border rounded"
            />
          )}
          <button
            type="button"
            onClick={handleClearImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
          >
            <Trash className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageSelector;
