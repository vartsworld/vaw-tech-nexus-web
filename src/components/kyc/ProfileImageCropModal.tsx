import React, { useState, useRef } from "react";
import AvatarEditor from "react-avatar-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Image as ImageIcon, Check, X } from "lucide-react";

interface ProfileImageCropModalProps {
  isOpen: boolean;
  imageFile: File | string | null;
  onClose: () => void;
  onCropSave: (croppedDataUrl: string) => void;
}

export const ProfileImageCropModal: React.FC<ProfileImageCropModalProps> = ({
  isOpen,
  imageFile,
  onClose,
  onCropSave,
}) => {
  const [scale, setScale] = useState<number>(1.2);
  const editorRef = useRef<any>(null);

  const handleSave = () => {
    if (editorRef.current) {
      // Export 500x500 1:1 ratio canvas
      const canvas = editorRef.current.getImageScaledToCanvas();
      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      onCropSave(croppedDataUrl);
      onClose();
    }
  };

  if (!imageFile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1 text-center sm:text-left">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-400" />
            Adjust Profile Photo (1:1 Ratio)
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Position your face inside the crop area and zoom in/out to fit 500x500 px format.
          </DialogDescription>
        </DialogHeader>

        {/* Editor Area */}
        <div className="flex flex-col items-center justify-center my-4 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500/40 bg-zinc-900 shadow-2xl p-2 flex items-center justify-center cursor-move">
            <AvatarEditor
              ref={editorRef}
              image={imageFile}
              width={250}
              height={250}
              border={20}
              borderRadius={125} // Preset circular mask
              color={[9, 9, 11, 0.75]} // Preset dark backdrop
              scale={scale}
              rotate={0}
            />
          </div>

          {/* Zoom Slider */}
          <div className="w-full space-y-2 px-4">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span className="flex items-center gap-1 text-zinc-400">
                <ZoomOut className="h-3.5 w-3.5" /> Zoom
              </span>
              <span className="font-mono text-blue-400">{Math.round(scale * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-zinc-500" />
              <Slider
                value={[scale]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={(val) => setScale(val[0])}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-blue-400" />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-zinc-900">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs"
          >
            <X className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20"
          >
            <Check className="h-4 w-4 mr-1.5" /> Save 1:1 Avatar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
