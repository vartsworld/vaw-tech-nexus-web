import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Share, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
            <img
              src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
              alt="VAW Technologies"
              className="w-full h-full object-cover"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Install VAW Technologies</CardTitle>
          <CardDescription>
            Get quick access to our services right from your home screen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-muted-foreground">
                App is already installed! You can access it from your home screen.
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                Go to Home
              </Button>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                To install on iOS, follow these steps:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Share className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm">1. Tap the Share button in Safari</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm">2. Select "Add to Home Screen"</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm">3. Tap "Add" to confirm</p>
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Smartphone className="w-10 h-10 text-primary" />
                <div>
                  <p className="font-medium">Works offline</p>
                  <p className="text-sm text-muted-foreground">
                    Access VAW Tech even without internet
                  </p>
                </div>
              </div>
              <Button onClick={handleInstall} className="w-full gap-2" size="lg">
                <Download className="w-5 h-5" />
                Install App
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Open this page in your mobile browser to install the app.
              </p>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Go to Home
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Why install?</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Quick access from home screen
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Works offline
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Faster loading times
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Full-screen experience
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
