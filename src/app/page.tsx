
"use client"

import React, { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, CheckCircle2, Sprout, ShoppingCart, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { t } = useLanguage();
  const { user, login, setRole } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'role'>('phone');
  const router = useRouter();

  if (user && user.role) {
    router.push(`/${user.role}`);
    return null;
  }

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(phone);
    setStep('role');
  };

  const handleRoleSelect = (role: 'farmer' | 'retailer' | 'transporter') => {
    setRole(role);
    router.push(`/${role}`);
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

        {step === 'phone' && (
          <Card className="w-full shadow-xl border-t-4 border-primary">
            <CardHeader>
              <CardTitle className="text-2xl">{t('login')}</CardTitle>
              <CardDescription>Enter your mobile number to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder={t('phone_number')} 
                    className="pl-10 h-12 text-lg"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-bold">
                  Send OTP
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'otp' && (
          <Card className="w-full shadow-xl border-t-4 border-primary">
            <CardHeader>
              <CardTitle className="text-2xl">{t('enter_otp')}</CardTitle>
              <CardDescription>We sent a 6-digit code to {phone}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <Input 
                  placeholder="000000" 
                  className="text-center h-16 text-3xl font-bold tracking-[0.5em]"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full h-12 text-lg font-bold">
                  {t('verify')}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'role' && (
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
              <div className="p-4 bg-secondary/20 rounded-xl group-hover:bg-secondary transition-colors">
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-5 text-left">
                <h3 className="text-xl font-bold">{t('retailer')}</h3>
                <p className="text-sm text-muted-foreground">Browse marketplace and place orders</p>
              </div>
            </button>

            <button 
              onClick={() => handleRoleSelect('transporter')}
              className="w-full flex items-center p-6 bg-white border-2 border-transparent hover:border-primary rounded-2xl shadow-md transition-all group"
            >
              <div className="p-4 bg-accent/20 rounded-xl group-hover:bg-accent transition-colors">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-5 text-left">
                <h3 className="text-xl font-bold">{t('transporter')}</h3>
                <p className="text-sm text-muted-foreground">Manage logistics and find transport jobs</p>
              </div>
            </button>
          </div>
        )}
      </main>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        &copy; 2024 FarmLink. All rights reserved.
      </footer>
    </div>
  );
}
