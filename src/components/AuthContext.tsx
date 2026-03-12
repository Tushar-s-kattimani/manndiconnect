
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'farmer' | 'retailer' | 'transporter' | null;

interface User {
  phone: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('farmlink_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (phone: string) => {
    const newUser = { phone, role: null, name: 'Farmer John' };
    setUser(newUser);
    localStorage.setItem('farmlink_user', JSON.stringify(newUser));
  };

  const setRole = (role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('farmlink_user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('farmlink_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, setRole, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
