"use client"

import React, { useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { Sprout, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { t } = useLanguage();
  const { user, profile, isUserLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user && profile?.role) {
      router.push(`/${profile.role}`);
    }
  }, [user, profile, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-bold">Loading...</div>
      </div>
    );
  }

  const handleRoleSelect = (role: 'farmer' | 'retailer') => {
    router.push(`/auth/login?role=${role}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 sm:p-8">
      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary rounded-2xl text-white shadow-lg mb-4">
            <Sprout className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black font-headline text-primary tracking-tight">
            {t('app_name')}
          </h1>
          <p className="text-muted-foreground font-medium">
            Connecting Earth to Market
          </p>
        </div>

        <div className="w-full space-y-4">
          <h2 className="text-2xl font-bold text-center mb-6">{t('select_role')}</h2>
          
          <button 
            onClick={() => handleRoleSelect('farmer')}
            className="w-full flex items-center p-6 bg-white border-2 border-transparent hover:border-primary rounded-2xl shadow-md transition-all group"
          >
            <div className="p-4 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
              <Sprout className="h-8 w-8 text-primary group-hover:text-white" />
            </div>
            <div className="ml-5 text-left">
              <h3 className="text-xl font-bold">{t('farmer')}</h3>
              <p className="text-sm text-muted-foreground">List your crops and find buyers</p>
            </div>
          </button>

          <button 
            onClick={() => handleRoleSelect('retailer')}
            className="w-full flex items-center p-6 bg-white border-2 border-transparent hover:border-primary rounded-2xl shadow-md transition-all group"
          >
            <div className="p-4 bg-accent/20 rounded-xl group-hover:bg-accent transition-colors">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <div className="ml-5 text-left">
              <h3 className="text-xl font-bold">{t('retailer')}</h3>
              <p className="text-sm text-muted-foreground">Browse marketplace and place orders</p>
            </div>
          </button>
        </div>
      </main>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        &copy; 2026 FarmLink. All rights reserved.
      </footer>
    </div>
  );
}
