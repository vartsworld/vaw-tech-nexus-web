
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type UserContextType = {
  userName: string;
  setUserName: (name: string) => void;
  hasCompletedIntro: boolean;
  setHasCompletedIntro: (completed: boolean) => void;
  resetIntroState: () => void;
  isLoggedIn: boolean; // Added isLoggedIn property
};

const UserContext = createContext<UserContextType>({
  userName: "",
  setUserName: () => {},
  hasCompletedIntro: false,
  setHasCompletedIntro: () => {},
  resetIntroState: () => {},
  isLoggedIn: false, // Added default value
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

  // Add state for login status
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check if there's a stored login state in localStorage
    const loginState = localStorage.getItem("vaw_isLoggedIn");
    return loginState === "true";
  });

  // Persist to localStorage whenever values change
  useEffect(() => {
    localStorage.setItem("vaw_userName", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("vaw_hasCompletedIntro", hasCompletedIntro.toString());
  }, [hasCompletedIntro]);

  useEffect(() => {
    localStorage.setItem("vaw_isLoggedIn", isLoggedIn.toString());
  }, [isLoggedIn]);

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
        isLoggedIn,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
