
"use client"

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  IndianRupee, 
  Weight, 
  MapPin, 
  Star, 
  Mail, 
  RefreshCcw, 
  Loader2, 
  Lock, 
  Sprout,
  Leaf,
  Truck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Helper for crop symbols
const CropSymbol = ({ name, className }: { name: string; className?: string }) => {
  const n = name.toLowerCase();
  if (n.includes('leaf') || n.includes('spinach') || n.includes('coriander')) return <Leaf className={className} />;
  return <Sprout className={className} />;
};

export default function RetailerPage() {
  const { t } = useLanguage();
  const { user, isUserLoading, refreshProfile, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requestingTransportId, setRequestingTransportId] = useState<string | null>(null);
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Query for all available listings - Only initialize if user is authenticated
  const marketplaceQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'listings'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: listings, isLoading: isDataLoading } = useCollection(marketplaceQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setIsRefreshing(false);
  };

  const handleRequestTransport = (listing: any) => {
    if (!user) return;
    
    setRequestingTransportId(listing.id);
    
    const orderId = `order_${Math.random().toString(36).substr(2, 9)}`;
    const orderData = {
      id: orderId,
      listingId: listing.id,
      farmerId: listing.farmerId,
      buyerId: user.uid,
      buyerEmail: user.email,
      cropName: listing.cropName,
      quantityOrdered: listing.quantity,
      agreedPricePerUnit: listing.pricePerUnit,
      totalPrice: listing.quantity * listing.pricePerUnit,
      status: 'Pending Transport',
      orderDate: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      transporterId: null // Explicitly null so transporters can find it
    };

    const docRef = doc(firestore, 'orders', orderId);
    setDocumentNonBlocking(docRef, orderData, { merge: true });

    toast({
      title: "Transport Requested",
      description: `Transport request for ${listing.cropName} has been sent to the network.`,
    });

    // Simulate small delay for UI feedback
    setTimeout(() => setRequestingTransportId(null), 1000);
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  // Verification Gate
  if (!user.emailVerified) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-2 shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center">
                <Mail className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black">Verify Your Email</CardTitle>
                <CardDescription className="text-base mt-2">
                  Access to the Retailer Marketplace is restricted until your email is verified.
                  Please check your inbox: <strong className="text-foreground">{user.email}</strong>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-xl flex items-start gap-3">
                <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Verification ensures the quality of our buyers and protects farmers from false orders.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                onClick={handleRefresh} 
                className="w-full h-12 font-bold text-lg gap-2"
                disabled={isRefreshing}
              >
                {isRefreshing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCcw className="h-5 w-5" />}
                I Have Verified
              </Button>
              <Button variant="ghost" onClick={logout} className="w-full font-bold text-muted-foreground">
                Logout and Try Different Account
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  const filteredListings = listings?.filter(l => 
    l.cropName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
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
            {filteredListings.length === 0 ? (
               <div className="col-span-full py-20 text-center">
                <p className="text-muted-foreground font-bold">No crops found matching your search.</p>
              </div>
            ) : (
              filteredListings.map((listing: any) => (
                <Card key={listing.id} className="overflow-hidden group hover:shadow-xl transition-all border-2 flex flex-col">
                  <div className="relative h-32 w-full bg-primary/5 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary/10 group-hover:scale-110 transition-transform">
                      <CropSymbol name={listing.cropName} className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <div className="bg-white/90 px-2 py-1 rounded-md text-xs font-bold flex items-center shadow-sm">
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
                          <MapPin className="h-3 w-3 mr-1" /> Verified Farm
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-primary">₹{listing.pricePerUnit}</span>
                        <span className="text-xs block text-muted-foreground">/ kg</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 flex-grow">
                    <div className="flex justify-between text-sm py-2 border-y my-3">
                      <div className="flex items-center">
                        <Weight className="h-4 w-4 mr-2 text-primary" />
                        <span>{listing.quantity} Kg</span>
                      </div>
                      <span className="font-medium truncate max-w-[100px] text-xs text-muted-foreground">
                        {listing.farmerEmail?.split('@')[0]}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                    <Button className="w-full font-bold">Buy Now</Button>
                    <Button 
                      variant="outline" 
                      className="w-full font-bold gap-2 text-primary border-primary/20 hover:bg-primary/5"
                      onClick={() => handleRequestTransport(listing)}
                      disabled={requestingTransportId === listing.id}
                    >
                      {requestingTransportId === listing.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                      Transport
                    </Button>
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
