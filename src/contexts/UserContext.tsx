
import React, { createContext, useState, useEffect, useContext } from 'react';

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  isIntroCompleted: boolean;
  setIntroCompleted: (completed: boolean) => void;
}

const defaultContext: UserContextType = {
  userName: '',
  setUserName: () => {},
  isIntroCompleted: false,
  setIntroCompleted: () => {},
};

export const UserContext = createContext<UserContextType>(defaultContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userName, setUserName] = useState<string>('');
  const [isIntroCompleted, setIntroCompleted] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has previously visited and set name
    const storedName = localStorage.getItem('vawUserName');
    const introCompleted = localStorage.getItem('vawIntroCompleted');
    
    if (storedName) {
      setUserName(storedName);
    }
    
    if (introCompleted === 'true') {
      setIntroCompleted(true);
    }
  }, []);
  
  const handleSetUserName = (name: string) => {
    setUserName(name);
    localStorage.setItem('vawUserName', name);
  };
  
  const handleSetIntroCompleted = (completed: boolean) => {
    setIntroCompleted(completed);
    localStorage.setItem('vawIntroCompleted', completed.toString());
  };

  return (
    <UserContext.Provider 
      value={{ 
        userName, 
        setUserName: handleSetUserName,
        isIntroCompleted,
        setIntroCompleted: handleSetIntroCompleted
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
