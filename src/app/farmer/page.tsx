
"use client"

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { useOffline } from '@/components/OfflineProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, IndianRupee, Weight, CheckCircle2, History, Camera, Mail, RefreshCcw, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export default function FarmerPage() {
  const { t } = useLanguage();
  const { user, profile, isUserLoading, refreshProfile } = useAuth();
  const { addListing } = useOffline();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    cropName: '',
    quantity: '',
    price: '',
  });

  // Query for user's specific listings
  const myListingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'listings'), where('farmerId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: listings, isLoading: isDataLoading } = useCollection(myListingsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) return null;

  const isVerified = user.emailVerified;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;
    addListing(formData);
    setFormData({ cropName: '', quantity: '', price: '' });
    setIsAddOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {!isVerified && (
          <Alert variant="destructive" className="mb-8 border-2">
            <Mail className="h-5 w-5" />
            <AlertTitle className="font-bold">Email Not Verified</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <span>Please verify your email address to start listing crops. We store data associated with your email for security.</span>
              <Button size="sm" variant="outline" className="gap-2 font-bold" onClick={refreshProfile}>
                <RefreshCcw className="h-4 w-4" /> I've Verified
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black font-headline text-primary">{t('my_listings')}</h1>
            <p className="text-muted-foreground">Logged in as: <span className="font-bold">{user.email}</span></p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isVerified} className="h-12 px-6 rounded-full shadow-lg gap-2 text-lg font-bold">
                <Plus className="h-6 w-6" />
                {t('add_crop')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('add_crop')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <div className="w-full aspect-video bg-muted rounded-xl flex flex-col items-center justify-center border-2 border-dashed hover:border-primary transition-colors cursor-pointer group">
                    <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-2" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">Click to add photo</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold">{t('crop_name')}</label>
                  <Input 
                    value={formData.cropName}
                    onChange={(e) => setFormData({...formData, cropName: e.target.value})}
                    placeholder="e.g. Wheat, Tomato" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-bold">{t('quantity')} (Kg)</label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9"
                        type="number" 
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        placeholder="0.00" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-bold">Price / Kg</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9"
                        type="number" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00" 
                        required 
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-bold">
                  {t('submit')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isDataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!listings || listings.length === 0 ? (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <History className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No Listings Found</h3>
                <p className="text-muted-foreground">Start by adding your first crop harvest!</p>
              </div>
            ) : (
              listings.map((listing: any) => (
                <Card key={listing.id} className="overflow-hidden border-2 hover:border-primary transition-all">
                  <div className="relative h-48 w-full bg-muted">
                    <Image 
                        src={`https://picsum.photos/seed/${listing.id}/600/400`}
                        alt={listing.cropName}
                        fill
                        className="object-cover"
                        data-ai-hint="crop harvest"
                    />
                    <Badge className="absolute top-4 right-4 bg-primary">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center text-xl">
                      <span>{listing.cropName}</span>
                      <span className="text-primary font-bold">₹{listing.pricePerUnit}/kg</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                      <Weight className="h-4 w-4 mr-1" />
                      <span>{listing.quantity} Kg Available</span>
                    </div>
                    <div className="text-xs text-muted-foreground italic mb-4">
                      Owner: {listing.farmerEmail}
                    </div>
                    <Button variant="outline" className="w-full font-bold">View Details</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
