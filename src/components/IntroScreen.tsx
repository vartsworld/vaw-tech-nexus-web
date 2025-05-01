
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Lottie from "lottie-react";
import { Skeleton } from "@/components/ui/skeleton";

const IntroScreen = () => {
  const { setUserName, setHasCompletedIntro } = useUser();
  const [stage, setStage] = useState<"logo" | "greeting" | "name">("logo");
  const [nameInput, setNameInput] = useState("");
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);
  const [greetingAnimationComplete, setGreetingAnimationComplete] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const [animationLoading, setAnimationLoading] = useState(true);
  const [animationError, setAnimationError] = useState(false);

  const animationUrl = "https://www.varts.org/dev/Logo-5-%5Bremix%5D.json";

  // Fetch animation data
  useEffect(() => {
    const fetchAnimationData = async () => {
      try {
        setAnimationLoading(true);
        const response = await fetch(animationUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setAnimationData(data);
        setAnimationLoading(false);
        setAnimationError(false);
        console.log("Animation data loaded successfully");
      } catch (error) {
        console.error("Error loading animation data:", error);
        setAnimationError(true);
        setAnimationLoading(false);
      }
    };

    fetchAnimationData();
  }, [animationUrl]);

  // Handle logo animation timing
  useEffect(() => {
    if (stage === "logo") {
      const timer = setTimeout(() => {
        setLogoAnimationComplete(true);
        setStage("greeting");
      }, 5000); // 5 seconds for logo animation (increased to allow Lottie to play)
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Handle greeting animation timing
  useEffect(() => {
    if (stage === "greeting") {
      const timer = setTimeout(() => {
        setGreetingAnimationComplete(true);
        setStage("name");
      }, 2000); // 2 seconds for greeting animation
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setHasCompletedIntro(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Logo Animation */}
      {stage === "logo" && (
        <div className="flex flex-col items-center justify-center animate-fade-in w-full max-w-md">
          {/* Loading state */}
          {animationLoading && (
            <Skeleton className="w-64 h-64 rounded-full mx-auto mb-4" />
          )}
          
          {/* Animation display */}
          {!animationLoading && !animationError && animationData && (
            <div className="w-64 h-64 mx-auto">
              <Lottie
                animationData={animationData}
                loop={true}
                autoplay={true}
                className="w-full h-full"
              />
            </div>
          )}
          
          {/* Fallback for error */}
          {animationError && (
            <div className="text-5xl md:text-7xl font-bold font-['Space_Grotesk'] mb-4 animate-pulse">
              <span className="text-gradient">V Arts World</span>
            </div>
          )}
          
          <div className="text-2xl md:text-3xl text-muted-foreground mb-8 animate-pulse">
            Pvt. Ltd.
          </div>
        </div>
      )}

      {/* Greeting Animation */}
      {stage === "greeting" && (
        <div className="flex flex-col items-center justify-center animate-fade-in">
          <div className="mb-6 relative">
            <h2 className="text-3xl md:text-5xl font-bold font-['Space_Grotesk']">
              Hello, I'm <span className="text-gradient">Mr. VAW</span>
            </h2>
          </div>
          <div className="text-xl md:text-2xl text-muted-foreground">
            What's your name?
          </div>
        </div>
      )}

      {/* Name Input */}
      {stage === "name" && (
        <div className="flex flex-col items-center justify-center w-full max-w-md px-4 animate-fade-in">
          <form onSubmit={handleNameSubmit} className="w-full space-y-6">
            <div className="flex flex-col items-center space-y-4 w-full">
              <Input
                type="text"
                placeholder="Enter your name"
                className="futuristic-input text-center text-xl h-14"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
              />
              <Button 
                type="submit" 
                size="lg"
                disabled={!nameInput.trim()}
                className="bg-primary hover:bg-primary/80 text-primary-foreground group relative overflow-hidden w-full"
              >
                <span className="relative z-10 flex items-center">
                  Enter VAW Technologies
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-tech-red/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              </Button>
            </div>
          </form>
          <div className="mt-12 text-center text-sm italic text-muted-foreground animate-fade-in">
            A subsidiary of V Arts World Pvt Ltd
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroScreen;
