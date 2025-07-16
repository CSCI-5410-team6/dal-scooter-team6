// AuthContext.tsx
//we are using this one so please do not delete it
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext<any>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cognitoUser, setCognitoUser] = useState<any>(null);
  return (
    <AuthContext.Provider value={{ cognitoUser, setCognitoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
