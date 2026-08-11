import React, { useState, useEffect, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, X, Check, ShieldCheck, AlertCircle } from "lucide-react";

interface KYCCameraDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  fullName?: string;
  username?: string;
}

export const KYCCameraDrawer: React.FC<KYCCameraDrawerProps> = ({
  isOpen,
  onClose,
  onCapture,
  fullName = "",
  username = "",
}) => {
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize camera stream when drawer opens & facingMode changes
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (isOpen && !capturedImage) {
      const initCam = async () => {
        setIsInitializing(true);
        setCameraError(null);
        try {
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          currentStream = mediaStream;
          setStream(mediaStream);

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            await videoRef.current.play().catch((e) => console.error("Play error:", e));
          }
        } catch (err: any) {
          console.error("Camera drawer error:", err);
          setCameraError("Camera access denied or unavailable. Please check camera permissions.");
        } finally {
          setIsInitializing(false);
        }
      };

      initCam();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode, capturedImage]);

  // Clean up stream on unmount or close
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleClose = () => {
    stopStream();
    setCapturedImage(null);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      // 1. Draw camera video frame
      ctx.save();
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 2. Generate current formatted Date and Time strings separately
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      // Helper function to draw rounded chips on canvas
      const drawChip = (
        text: string,
        x: number,
        y: number,
        align: "left" | "right",
        bgColor: string,
        textColor: string,
        borderColor: string
      ) => {
        const paddingX = 14;
        const paddingY = 8;
        const fontSize = Math.max(12, Math.round(canvas.height * 0.028));
        ctx.font = `600 ${fontSize}px monospace, sans-serif`;

        const textMetrics = ctx.measureText(text);
        const boxWidth = textMetrics.width + paddingX * 2;
        const boxHeight = fontSize + paddingY * 2;
        const borderRadius = boxHeight / 2;

        let drawX = x;
        if (align === "right") {
          drawX = x - boxWidth;
        }

        ctx.save();
        // Background chip with subtle opacity
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(drawX, y, boxWidth, boxHeight, borderRadius);
        ctx.fill();

        // Border stroke
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Text content
        ctx.fillStyle = textColor;
        ctx.textBaseline = "middle";
        ctx.fillText(text, drawX + paddingX, y + boxHeight / 2);
        ctx.restore();
      };

      const margin = 16;

      // TOP LEFT: Full Name (if provided)
      if (fullName) {
        drawChip(
          fullName,
          margin,
          margin,
          "left",
          "rgba(15, 23, 42, 0.75)",
          "#ffffff",
          "rgba(59, 130, 246, 0.6)"
        );
      }

      // TOP RIGHT: Username (if provided)
      if (username) {
        drawChip(
          `@${username.replace(/^@/, "")}`,
          canvas.width - margin,
          margin,
          "right",
          "rgba(15, 23, 42, 0.75)",
          "#38bdf8",
          "rgba(56, 189, 248, 0.6)"
        );
      }

      // BOTTOM LEFT: Date Chip
      drawChip(
        dateStr,
        margin,
        canvas.height - margin - Math.max(12, Math.round(canvas.height * 0.028)) - 16,
        "left",
        "rgba(15, 23, 42, 0.75)",
        "#e2e8f0",
        "rgba(255, 255, 255, 0.25)"
      );

      // BOTTOM RIGHT: Time Chip
      drawChip(
        timeStr,
        canvas.width - margin,
        canvas.height - margin - Math.max(12, Math.round(canvas.height * 0.028)) - 16,
        "right",
        "rgba(15, 23, 42, 0.75)",
        "#34d399",
        "rgba(52, 211, 153, 0.5)"
      );

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedImage(dataUrl);
      stopStream();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSubmit = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="bg-zinc-950 border-t border-zinc-800 text-zinc-100 max-h-[92vh] flex flex-col p-0 outline-none">
        {/* Drawer Header */}
        <DrawerHeader className="px-5 py-3 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <DrawerTitle className="text-base font-bold text-white flex items-center gap-2">
                Live KYC Selfie Verification
              </DrawerTitle>
              <DrawerDescription className="text-xs text-zinc-400">
                Identity verification capture only (not used as profile photo)
              </DrawerDescription>
            </div>
          </div>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {/* Drawer Body / Camera Frame Area */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center overflow-y-auto">
          <div className="relative w-full max-w-sm aspect-[3/4] sm:aspect-[4/3] rounded-3xl overflow-hidden bg-black border-2 border-zinc-800 shadow-2xl flex flex-col items-center justify-center">
            {capturedImage ? (
              /* VIEW CAPTURED IMAGE WITH EMBEDDED CANVASES & PREVIEW */
              <div className="relative w-full h-full">
                <img
                  src={capturedImage}
                  alt="Captured KYC Selfie"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              /* LIVE CAMERA FEED */
              <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Camera Overlay Framing Guide */}
                <div className="absolute inset-0 pointer-events-none border-[3px] border-dashed border-blue-500/40 rounded-3xl m-4 flex flex-col justify-between p-4">
                  <div className="text-[10px] text-blue-300 font-mono bg-blue-950/60 backdrop-blur-md border border-blue-500/30 rounded-full px-2.5 py-0.5 self-center">
                    Center Your Face
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono text-center">
                    Hold Steady
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <AlertCircle className="h-10 w-10 text-amber-400" />
                    <p className="text-xs text-amber-200 font-medium">{cameraError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFacingMode((prev) => (prev === "user" ? "environment" : "user"))}
                      className="border-zinc-700 bg-zinc-900 text-xs text-white"
                    >
                      Retry Camera Access
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Controls */}
        <DrawerFooter className="px-6 py-4 border-t border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center">
          {!capturedImage ? (
            /* CAMERA CONTROL BAR: Shutter middle, Flip right */
            <div className="w-full max-w-sm flex items-center justify-between px-6">
              {/* Left Placeholder for symmetry */}
              <div className="w-12 h-12" />

              {/* CENTER: SHUTTER BUTTON */}
              <button
                type="button"
                onClick={takePhoto}
                disabled={!!cameraError || isInitializing}
                className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 transition-all border-4 border-white/20 shadow-xl flex items-center justify-center text-white"
                title="Capture Photo"
              >
                <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                  <Camera className="h-6 w-6" />
                </div>
              </button>

              {/* RIGHT SIDE: FLIP CAMERA BUTTON */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white active:scale-95 transition-all flex items-center justify-center shadow-md"
                title="Flip Camera (Front / Back)"
              >
                <RefreshCw className="h-5 w-5 text-blue-400" />
              </button>
            </div>
          ) : (
            /* PREVIEW ACTION BUTTONS: Retake / Submit */
            <div className="w-full max-w-sm flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRetake}
                className="flex-1 h-12 rounded-2xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white font-semibold text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Retake Photo
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20"
              >
                <Check className="h-4 w-4 mr-2" /> Submit Photo
              </Button>
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
