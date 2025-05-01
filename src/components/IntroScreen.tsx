import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const IntroScreen = () => {
  const { setUserName, setHasCompletedIntro } = useUser();
  const [stage, setStage] = useState<"logo" | "greeting" | "name" | "door-opening">("logo");
  const [nameInput, setNameInput] = useState("");
  const [gifLoaded, setGifLoaded] = useState(false);
  const [gifError, setGifError] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [doorProgress, setDoorProgress] = useState(0);
  const isMobile = useIsMobile();
  
  const fullText = "Hello, I'm Mr. VAW";
  const typingSpeed = 100; // ms per character
  
  // Handle GIF animation timing
  useEffect(() => {
    if (stage === "logo") {
      // Reset error state on mount
      setGifError(false);
      setGifLoaded(false);
      
      console.info("Attempting to load GIF...");
      
      // After GIF displays for 5 seconds, move to greeting
      const timer = setTimeout(() => {
        setStage("greeting");
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Handle typing animation for greeting
  useEffect(() => {
    if (stage === "greeting") {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypingText(fullText.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          
          // After typing completes, show "What's your name?" with fade-in
          setTimeout(() => {
            setShowNameInput(true);
            
            // Show button after name input appears
            setTimeout(() => {
              setShowButton(true);
            }, 800);
          }, 500);
        }
      }, typingSpeed);
      
      return () => clearInterval(typingInterval);
    }
  }, [stage]);

  // Door opening animation effect
  useEffect(() => {
    if (stage === "door-opening") {
      let animationProgress = 0;
      // Make animation smoother by reducing speed and using non-linear progress
      const animationSpeed = 12; // ms per frame - slower for smoother animation
      
      const doorAnimation = setInterval(() => {
        if (animationProgress < 100) {
          // Use easing function for smoother animation (quadratic easing)
          const increment = 0.8 + (animationProgress / 300); // Gradual acceleration
          animationProgress += increment;
          setDoorProgress(animationProgress);
        } else {
          clearInterval(doorAnimation);
          // When door is fully open, complete the intro
          setTimeout(() => {
            setHasCompletedIntro(true);
          }, 500);
        }
      }, animationSpeed);
      
      return () => clearInterval(doorAnimation);
    }
  }, [stage, setHasCompletedIntro]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      // Start the door opening animation instead of immediately completing
      setStage("door-opening");
    }
  };

  const gifUrl = isMobile 
    ? "https://www.varts.org/wp-content/uploads/2025/05/ezgif-789ea740a66a2c.gif"
    : "https://www.varts.org/wp-content/uploads/2025/05/ezgif-34875bda657622.gif";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* GIF Animation */}
      {stage === "logo" && (
        <div className="flex flex-col items-center justify-center animate-fade-in h-full w-full bg-black">
          <div className="h-full w-full relative bg-black">
            <img 
              src={gifUrl}
              alt="VAW Logo Animation"
              className="w-full h-full object-contain md:object-cover max-w-screen max-h-screen"
              style={{ 
                objectPosition: 'center center',
                width: '100vw',
                height: '100vh',
                backgroundColor: 'black' 
              }}
              onLoad={() => {
                console.info("GIF loaded successfully");
                setGifLoaded(true);
              }}
              onError={() => {
                console.error("Failed to load GIF");
                setGifError(true);
              }}
            />
            
            {/* Fallback if there's an error loading the GIF */}
            {gifError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-3xl font-bold text-primary animate-pulse">VAW</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Typing Animation */}
      {stage === "greeting" && (
        <div className="flex flex-col items-center justify-center animate-fade-in space-y-8">
          <div className="mb-6 relative">
            <h2 className="text-3xl md:text-5xl font-bold font-['Space_Grotesk']">
              <span className="text-gradient">{typingText}</span>
              <span className="animate-pulse">|</span>
            </h2>
          </div>
          
          {/* What's your name text with fade-in */}
          <div className={`text-xl md:text-2xl text-muted-foreground transition-opacity duration-1000 ${showNameInput ? 'opacity-100' : 'opacity-0'}`}>
            What's your name?
          </div>
          
          {/* Name Input with animated entrance */}
          {showNameInput && (
            <div className="flex flex-col items-center justify-center w-full max-w-md px-4 space-y-6 animate-slide-in">
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
                  
                  {/* Animated Button */}
                  <div className={`w-full transition-all duration-1000 transform ${showButton ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <Button 
                      type="submit" 
                      size="lg"
                      className="bg-primary hover:bg-primary/80 text-primary-foreground group relative overflow-hidden w-full"
                    >
                      <span className="relative z-10 flex items-center">
                        Push & open the Door to VAW
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <span className="absolute inset-0 bg-tech-red/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                    </Button>
                  </div>
                </div>
              </form>
              
              <div className="mt-12 text-center text-sm italic text-muted-foreground animate-fade-in">
                A subsidiary of V Arts World Pvt Ltd
              </div>
            </div>
          )}
        </div>
      )}

      {/* Door Opening Animation */}
      {stage === "door-opening" && (
        <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black">
          <div className="relative w-full h-full">
            {/* Left door panel */}
            <div 
              className="absolute top-0 bottom-0 bg-tech-gold/10 backdrop-blur-md border-r border-tech-gold/30 transition-transform duration-1500 ease-out flex items-center justify-end"
              style={{ 
                left: 0, 
                width: '50%',
                transform: `translateX(-${doorProgress}%)` 
              }}
            >
              <div className="h-full w-4 bg-gradient-to-l from-tech-gold/20 to-transparent"></div>
            </div>
            
            {/* Right door panel */}
            <div 
              className="absolute top-0 bottom-0 bg-tech-gold/10 backdrop-blur-md border-l border-tech-gold/30 transition-transform duration-1500 ease-out flex items-center justify-start"
              style={{ 
                right: 0, 
                width: '50%',
                transform: `translateX(${doorProgress}%)` 
              }}
            >
              <div className="h-full w-4 bg-gradient-to-r from-tech-gold/20 to-transparent"></div>
            </div>
            
            {/* Light beam through opening door */}
            <div 
              className="absolute top-0 left-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent transition-all duration-1500 ease-out"
              style={{ 
                width: `${doorProgress * 2.5}%`, 
                transform: `translateX(-50%)`, 
                opacity: doorProgress / 150 + 0.2
              }}
            ></div>
            
            {/* Preview of home page fading in behind doors */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-background to-background/90 transition-opacity duration-1500 ease-out flex items-center justify-center"
              style={{ opacity: doorProgress / 100 }}
            >
              <h1 className="text-4xl md:text-7xl font-bold text-gradient opacity-70">Welcome to VAW</h1>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroScreen;
