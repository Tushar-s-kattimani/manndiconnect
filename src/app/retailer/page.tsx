
"use client"

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search, Filter, IndianRupee, Weight, MapPin, Star, Mail, RefreshCcw, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

export default function RetailerPage() {
  const { t } = useLanguage();
  const { user, isUserLoading, refreshProfile } = useAuth();
  const [search, setSearch] = useState('');
  const firestore = useFirestore();
  const router = useRouter();

  // Query for all available listings
  const marketplaceQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'listings'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: listings, isLoading: isDataLoading } = useCollection(marketplaceQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) return null;

  const isVerified = user.emailVerified;

  const filteredListings = listings?.filter(l => 
    l.cropName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {!isVerified && (
          <Alert variant="destructive" className="mb-8 border-2">
            <Mail className="h-5 w-5" />
            <AlertTitle className="font-bold">Email Not Verified</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <span>Please verify your email address to access the marketplace. Check your inbox: {user.email}</span>
              <Button size="sm" variant="outline" className="gap-2 font-bold" onClick={refreshProfile}>
                <RefreshCcw className="h-4 w-4" /> I've Verified
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8 space-y-6">
          <div>
            <h1 className="text-3xl font-black font-headline text-primary">{t('marketplace')}</h1>
            <p className="text-muted-foreground">Find quality crops directly from verified farmers</p>
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

        {isDataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {!isVerified ? (
              <div className="col-span-full py-20 text-center">
                <p className="text-muted-foreground">Verify your email to view available listings.</p>
              </div>
            ) : filteredListings.length === 0 ? (
               <div className="col-span-full py-20 text-center">
                <p className="text-muted-foreground font-bold">No crops found matching your search.</p>
              </div>
            ) : (
              filteredListings.map((listing: any) => (
                <Card key={listing.id} className="overflow-hidden group hover:shadow-xl transition-all border-2">
                  <div className="relative h-48 w-full bg-muted">
                    <Image 
                        src={`https://picsum.photos/seed/${listing.id}/600/400`}
                        alt={listing.cropName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        data-ai-hint="fresh vegetables"
                    />
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <div className="bg-white/90 px-2 py-1 rounded-md text-xs font-bold flex items-center">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                        4.5
                      </div>
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg mb-1">{listing.cropName}</CardTitle>
                        <p className="text-xs font-medium text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" /> Verified Farmer
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-primary">₹{listing.pricePerUnit}</span>
                        <span className="text-xs block text-muted-foreground">/ kg</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex justify-between text-sm py-2 border-y my-3">
                      <div className="flex items-center">
                        <Weight className="h-4 w-4 mr-2 text-primary" />
                        <span>{listing.quantity} Kg</span>
                      </div>
                      <span className="font-medium truncate max-w-[100px]">{listing.farmerEmail}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 gap-2">
                    <Button className="flex-1 font-bold">Buy Now</Button>
                    <Button variant="outline" className="flex-1 font-bold">Chat</Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
