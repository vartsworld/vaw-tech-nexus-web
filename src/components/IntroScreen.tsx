
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { ArrowRight } from "lucide-react";

const IntroScreen: React.FC = () => {
  const { userName, setUserName, setIntroCompleted } = useUser();
  const [introStep, setIntroStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Auto-advance first step after 2 seconds
    if (introStep === 0) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setIntroStep(1);
          setIsAnimating(false);
        }, 1000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [introStep]);

  const handleNextStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIntroStep(prev => prev + 1);
      setIsAnimating(false);
    }, 500);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setUserName(inputValue.trim());
      handleNextStep();
    }
  };

  const handleEnterSite = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIntroCompleted(true);
    }, 1000);
  };

  const handleSkipIntro = () => {
    // If user has a name, use it, otherwise use "Guest"
    if (!userName) {
      setUserName("Guest");
    }
    setIntroCompleted(true);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div 
        className={`relative max-w-md w-full mx-4 neo-border glass-panel p-8 rounded-2xl shadow-tech transition-all duration-500 transform
          ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        {/* Skip Intro Button */}
        <button 
          onClick={handleSkipIntro} 
          className="absolute top-4 right-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip Intro
        </button>
        
        {/* Step 1: Logo Animation */}
        {introStep === 0 && (
          <div className="text-center py-10">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="/lovable-uploads/8a3ad1d1-fa8e-4a28-819d-ad6fc9fd461b.png" 
                alt="V Logo" 
                className="h-24 w-auto animate-float"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient animate-pulse-gentle">
              V Arts World Pvt. Ltd.
            </h1>
          </div>
        )}

        {/* Step 2: Greeting */}
        {introStep === 1 && (
          <div className="text-center py-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 animate-slide-in">
              Hello, I'm <span className="text-gradient">Mr. VAW</span>
            </h2>
            <p className="text-xl animate-slide-in" style={{animationDelay: '0.3s'}}>
              What's your name?
            </p>
            <div className="mt-6 animate-slide-in" style={{animationDelay: '0.6s'}}>
              <form onSubmit={handleNameSubmit} className="flex flex-col items-center gap-4">
                <Input
                  type="text"
                  placeholder="Enter your name"
                  className="text-center text-lg max-w-xs bg-muted/20 border-accent/30 focus:border-accent"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button type="submit" className="mt-2 group relative overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    Next 
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="absolute inset-0 bg-tech-red/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Welcome Message */}
        {introStep === 2 && (
          <div className="text-center py-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 animate-slide-in">
              Welcome, <span className="text-gradient">{userName}</span>!
            </h2>
            <p className="text-lg mb-6 animate-slide-in italic" style={{animationDelay: '0.3s'}}>
              To VAW Technologies
            </p>
            <p className="text-sm text-muted-foreground mb-8 animate-slide-in" style={{animationDelay: '0.5s'}}>
              A subsidiary of V Arts World Pvt Ltd
            </p>
            <Button 
              onClick={handleEnterSite} 
              size="lg" 
              className="mt-2 animate-slide-in group relative overflow-hidden"
              style={{animationDelay: '0.7s'}}
            >
              <span className="relative z-10 flex items-center">
                Enter Website
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="absolute inset-0 bg-tech-purple/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            </Button>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="flex justify-center mt-6 gap-2">
          {[0, 1, 2].map((step) => (
            <div 
              key={step} 
              className={`h-2 w-2 rounded-full ${
                step === introStep ? 'bg-accent' : 'bg-muted'
              } transition-colors duration-300`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;
