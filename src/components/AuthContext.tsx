
"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export type UserRole = 'farmer' | 'retailer' | 'transporter' | null;

interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  name: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = async (currentUser: User) => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile({
          uid: currentUser.uid,
          email: currentUser.email,
          role: data.role as UserRole,
          name: data.name || (currentUser.email?.split('@')[0] || 'User'),
          emailVerified: currentUser.emailVerified,
        });
      } else {
        // Fallback for cases where profile might not be created yet
        setProfile({
          uid: currentUser.uid,
          email: currentUser.email,
          role: null,
          name: currentUser.email?.split('@')[0] || 'User',
          emailVerified: currentUser.emailVerified,
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile(user);
    } else {
      setProfile(null);
    }
  }, [user, firestore]);

  const logout = () => {
    auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      // Reload user from Firebase to get latest emailVerified status
      await user.reload();
      await fetchProfile(auth.currentUser!);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isUserLoading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
