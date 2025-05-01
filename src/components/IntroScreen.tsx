
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Lottie from "lottie-react";
import { useToast } from "@/components/ui/use-toast";

const IntroScreen = () => {
  const { setUserName, setHasCompletedIntro } = useUser();
  const [stage, setStage] = useState<"animation" | "logo" | "greeting" | "name">("animation");
  const [nameInput, setNameInput] = useState("");
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);
  const [greetingAnimationComplete, setGreetingAnimationComplete] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const { toast } = useToast();

  // Fetch the animation data when component mounts
  useEffect(() => {
    const fetchAnimation = async () => {
      try {
        const response = await fetch("https://www.varts.org/dev/Logo-5-%5Bremix%5D.json");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch animation: ${response.status}`);
        }
        
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        console.error("Error loading animation:", error);
        toast({
          title: "Animation Error",
          description: "Failed to load the intro animation. Proceeding with standard intro.",
          variant: "destructive",
        });
        // If animation fails to load, skip to logo stage
        setStage("logo");
      }
    };
    
    fetchAnimation();
  }, [toast]);

  // Handle animation completion
  const handleAnimationComplete = () => {
    setStage("logo");
  };

  // Handle logo animation timing
  useEffect(() => {
    if (stage === "logo") {
      const timer = setTimeout(() => {
        setLogoAnimationComplete(true);
        setStage("greeting");
      }, 3000); // 3 seconds for logo animation
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
      {/* JSON Animation Stage */}
      {stage === "animation" && animationData && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-[280px] md:w-[400px] h-[280px] md:h-[400px]">
            <Lottie 
              animationData={animationData} 
              loop={false}
              onComplete={handleAnimationComplete}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Logo Animation */}
      {stage === "logo" && (
        <div className="flex flex-col items-center justify-center animate-fade-in">
          <div className="text-5xl md:text-7xl font-bold font-['Space_Grotesk'] mb-4 animate-pulse">
            <span className="text-gradient">V Arts World</span>
          </div>
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
