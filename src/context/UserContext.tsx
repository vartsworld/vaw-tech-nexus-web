
import React, { createContext, useContext, useState, ReactNode } from "react";

type UserContextType = {
  userName: string;
  setUserName: (name: string) => void;
  hasCompletedIntro: boolean;
  setHasCompletedIntro: (completed: boolean) => void;
};

const UserContext = createContext<UserContextType>({
  userName: "",
  setUserName: () => {},
  hasCompletedIntro: false,
  setHasCompletedIntro: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userName, setUserName] = useState("");
  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);

  return (
    <UserContext.Provider
      value={{
        userName,
        setUserName,
        hasCompletedIntro,
        setHasCompletedIntro,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
