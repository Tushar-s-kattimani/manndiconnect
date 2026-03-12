
"use client"

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { useOffline } from '@/components/OfflineProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search, Filter, IndianRupee, Weight, MapPin, Star, Mail, RefreshCcw } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const MOCK_LISTINGS = [
  { id: '1', farmer: 'Ram Singh', crop: 'Premium Wheat', price: 22, qty: '500kg', location: 'Punjab', rating: 4.8 },
  { id: '2', farmer: 'Suresh Kumar', crop: 'Fresh Tomatoes', price: 35, qty: '120kg', location: 'Haryana', rating: 4.5 },
  { id: '3', farmer: 'Anil Yadav', crop: 'Organic Potatoes', price: 18, qty: '1000kg', location: 'UP', rating: 4.9 },
  { id: '4', farmer: 'Manoj P.', crop: 'Red Onions', price: 40, qty: '800kg', location: 'Maharashtra', rating: 4.2 },
];

export default function RetailerPage() {
  const { t } = useLanguage();
  const { profile, isUserLoading, refreshProfile } = useAuth();
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !profile) {
      router.push('/');
    }
  }, [profile, isUserLoading, router]);

  if (isUserLoading || !profile) return null;

  const isVerified = profile.emailVerified;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {!isVerified && (
          <Alert variant="destructive" className="mb-8 border-2">
            <Mail className="h-5 w-5" />
            <AlertTitle className="font-bold">Email Not Verified</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <span>Please verify your email address to access the marketplace. Check your inbox.</span>
              <Button size="sm" variant="outline" className="gap-2 font-bold" onClick={refreshProfile}>
                <RefreshCcw className="h-4 w-4" /> I've Verified
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8 space-y-6">
          <div>
            <h1 className="text-3xl font-black font-headline text-primary">{t('marketplace')}</h1>
            <p className="text-muted-foreground">Find the best quality crops directly from farmers</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                className="pl-10 h-12 rounded-xl text-lg bg-white shadow-sm"
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-12 px-6 rounded-xl border-2 font-bold">
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {!isVerified ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-muted-foreground">Verify your email to view available listings.</p>
            </div>
          ) : (
            MOCK_LISTINGS.map((listing) => (
              <Card key={listing.id} className="overflow-hidden group hover:shadow-xl transition-all border-2">
                <div className="relative h-48 w-full bg-muted">
                   <Image 
                      src={`https://picsum.photos/seed/${listing.id}/600/400`}
                      alt={listing.crop}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      data-ai-hint="fresh vegetables"
                   />
                   <div className="absolute bottom-2 left-2 flex gap-1">
                     <div className="bg-white/90 px-2 py-1 rounded-md text-xs font-bold flex items-center">
                       <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                       {listing.rating}
                     </div>
                   </div>
                </div>
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg mb-1">{listing.crop}</CardTitle>
                      <p className="text-xs font-medium text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1" /> {listing.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-primary">₹{listing.price}</span>
                      <span className="text-xs block text-muted-foreground">/ kg</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex justify-between text-sm py-2 border-y my-3">
                    <div className="flex items-center">
                      <Weight className="h-4 w-4 mr-2 text-primary" />
                      <span>{listing.qty}</span>
                    </div>
                    <span className="font-medium">{listing.farmer}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 gap-2">
                  <Button className="flex-1 font-bold">Buy Now</Button>
                  <Button variant="outline" className="flex-1 font-bold">Negotiate</Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
