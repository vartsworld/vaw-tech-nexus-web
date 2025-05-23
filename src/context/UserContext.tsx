
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type UserContextType = {
  userName: string;
  setUserName: (name: string) => void;
  hasCompletedIntro: boolean;
  setHasCompletedIntro: (completed: boolean) => void;
  resetIntroState: () => void; // Add a function to reset the intro state for testing
};

const UserContext = createContext<UserContextType>({
  userName: "",
  setUserName: () => {},
  hasCompletedIntro: false,
  setHasCompletedIntro: () => {},
  resetIntroState: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage or default values
  const [userName, setUserNameState] = useState(() => {
    const savedName = localStorage.getItem("vaw_userName");
    return savedName || "";
  });
  
  const [hasCompletedIntro, setHasCompletedIntroState] = useState(() => {
    const savedState = localStorage.getItem("vaw_hasCompletedIntro");
    return savedState === "true";
  });

  // Persist to localStorage whenever values change
  useEffect(() => {
    localStorage.setItem("vaw_userName", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("vaw_hasCompletedIntro", hasCompletedIntro.toString());
  }, [hasCompletedIntro]);

  // Wrapper functions for setting state
  const setUserName = (name: string) => {
    setUserNameState(name);
  };

  const setHasCompletedIntro = (completed: boolean) => {
    setHasCompletedIntroState(completed);
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
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
