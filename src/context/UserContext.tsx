
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setEnabled } from "cuelume";

type UserContextType = {
  userName: string;
  setUserName: (name: string) => void;
  hasCompletedIntro: boolean;
  setHasCompletedIntro: (completed: boolean) => void;
  resetIntroState: () => void; // Add a function to reset the intro state for testing
  interactionSoundsEnabled: boolean;
  setInteractionSoundsEnabled: (enabled: boolean) => void;
};

const UserContext = createContext<UserContextType>({
  userName: "",
  setUserName: () => {},
  hasCompletedIntro: false,
  setHasCompletedIntro: () => {},
  resetIntroState: () => {},
  interactionSoundsEnabled: true,
  setInteractionSoundsEnabled: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage or default values
  const [userName, setUserNameState] = useState(() => {
    const savedName = localStorage.getItem("vaw_userName");
    return savedName || "";
  });
  
  const [hasCompletedIntro, setHasCompletedIntroState] = useState(() => {
    localStorage.setItem("vaw_hasCompletedIntro", "true");
    return true;
  });

  const [interactionSoundsEnabled, setInteractionSoundsEnabledState] = useState(() => {
    const saved = localStorage.getItem("vaw_interactionSoundsEnabled");
    return saved !== "false"; // default to true
  });

  // Persist to localStorage whenever values change
  useEffect(() => {
    localStorage.setItem("vaw_userName", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("vaw_hasCompletedIntro", hasCompletedIntro.toString());
  }, [hasCompletedIntro]);

  useEffect(() => {
    localStorage.setItem("vaw_interactionSoundsEnabled", interactionSoundsEnabled.toString());
    setEnabled(interactionSoundsEnabled);
  }, [interactionSoundsEnabled]);

  // Wrapper functions for setting state
  const setUserName = (name: string) => {
    setUserNameState(name);
  };

  const setHasCompletedIntro = (completed: boolean) => {
    setHasCompletedIntroState(completed);
  };

  const setInteractionSoundsEnabled = (enabled: boolean) => {
    setInteractionSoundsEnabledState(enabled);
  };
  
  // Function to reset intro state (for testing purposes)
  const resetIntroState = () => {
    localStorage.removeItem("vaw_hasCompletedIntro");
    setHasCompletedIntroState(false);
  };

  return (
    <UserContext.Provider
      value={{
        userName,
        setUserName,
        hasCompletedIntro,
        setHasCompletedIntro,
        resetIntroState,
        interactionSoundsEnabled,
        setInteractionSoundsEnabled,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
