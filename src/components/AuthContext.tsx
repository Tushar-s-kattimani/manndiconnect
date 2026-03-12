
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
  login: (phone: string, role?: UserRole) => void;
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

  const login = (phone: string, role: UserRole = null) => {
    const newUser = { 
      phone, 
      role, 
      name: phone === 'Guest' ? 'Guest User' : 'Farmer John' 
    };
    setUser(newUser);
    localStorage.setItem('farmlink_user', JSON.stringify(newUser));
  };

  const setRole = (role: UserRole) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, role };
      localStorage.setItem('farmlink_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
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
