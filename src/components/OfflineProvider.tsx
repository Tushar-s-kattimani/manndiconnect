
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Listing {
  id: string;
  cropName: string;
  quantity: string;
  price: string;
  status: 'pending' | 'synced';
  timestamp: number;
}

interface OfflineContextType {
  listings: Listing[];
  addListing: (listing: Omit<Listing, 'id' | 'status' | 'timestamp'>) => void;
  syncData: () => Promise<void>;
  isOffline: boolean;
  hasUnsynced: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('farmlink_listings');
    if (saved) setListings(JSON.parse(saved));

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addListing = (data: Omit<Listing, 'id' | 'status' | 'timestamp'>) => {
    const newListing: Listing = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      timestamp: Date.now(),
    };
    const updated = [newListing, ...listings];
    setListings(updated);
    localStorage.setItem('farmlink_listings', JSON.stringify(updated));

    if (isOffline) {
      toast({
        title: "Saved Offline",
        description: "Your listing will be synced when you go online.",
      });
    }
  };

  const syncData = async () => {
    if (isOffline) {
      toast({
        title: "Offline",
        description: "Cannot sync while offline.",
        variant: "destructive",
      });
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const synced = listings.map(l => ({ ...l, status: 'synced' as const }));
    setListings(synced);
    localStorage.setItem('farmlink_listings', JSON.stringify(synced));
    
    toast({
      title: "Sync Successful",
      description: "All local data has been pushed to the cloud.",
    });
  };

  const hasUnsynced = listings.some(l => l.status === 'pending');

  return (
    <OfflineContext.Provider value={{ listings, addListing, syncData, isOffline, hasUnsynced }}>
      {children}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};
