
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { useAuth } from '@/components/AuthContext';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface Listing {
  id: string;
  cropName: string;
  quantity: number;
  pricePerUnit: number;
  status: 'Available' | 'Sold' | 'pending';
  farmerId: string;
  farmerEmail: string;
  farmerName: string;
  createdAt: any;
  updatedAt: any;
}

interface OfflineContextType {
  addListing: (listing: { cropName: string, quantity: string, price: string }) => void;
  syncData: () => Promise<void>;
  isOffline: boolean;
  hasUnsynced: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { profile } = useAuth();
  const firestore = useFirestore();
  const [isOffline, setIsOffline] = useState(false);
  const [unsyncedListings, setUnsyncedListings] = useState<Listing[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    if (user) {
      const saved = localStorage.getItem(`farmlink_unsynced_${user.uid}`);
      if (saved) setUnsyncedListings(JSON.parse(saved));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const addListing = (data: { cropName: string, quantity: string, price: string }) => {
    if (!user) return;

    const listingId = Math.random().toString(36).substr(2, 9);
    const newListing: any = {
      id: listingId,
      cropName: data.cropName,
      quantity: parseFloat(data.quantity),
      pricePerUnit: parseFloat(data.price),
      status: 'Available',
      farmerId: user.uid,
      farmerEmail: user.email || '',
      farmerName: profile?.name || user.email?.split('@')[0] || 'Farmer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isOffline) {
      const updated = [...unsyncedListings, { ...newListing, status: 'pending' }];
      setUnsyncedListings(updated);
      localStorage.setItem(`farmlink_unsynced_${user.uid}`, JSON.stringify(updated));
      toast({
        title: "Saved Offline",
        description: "Listing will sync when you are back online.",
      });
    } else {
      const docRef = doc(firestore, 'listings', listingId);
      setDocumentNonBlocking(docRef, {
        ...newListing,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({
        title: "Listing Added",
        description: "Successfully published to the marketplace.",
      });
    }
  };

  const syncData = async () => {
    if (isOffline || !user || unsyncedListings.length === 0) return;

    try {
      for (const item of unsyncedListings) {
        const docRef = doc(firestore, 'listings', item.id);
        const { status, ...data } = item;
        setDocumentNonBlocking(docRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      
      setUnsyncedListings([]);
      localStorage.removeItem(`farmlink_unsynced_${user.uid}`);
      
      toast({
        title: "Sync Successful",
        description: "Offline data has been pushed to the cloud.",
      });
    } catch (error) {
      console.error("Sync failed", error);
    }
  };

  const hasUnsynced = unsyncedListings.length > 0;

  return (
    <OfflineContext.Provider value={{ addListing, syncData, isOffline, hasUnsynced }}>
      {children}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};
