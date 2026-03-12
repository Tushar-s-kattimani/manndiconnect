
"use client"

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  IndianRupee, 
  Weight, 
  Mail, 
  RefreshCcw, 
  Loader2, 
  Sprout,
  Leaf,
  Truck,
  CreditCard,
  Banknote,
  ShoppingBag,
  LayoutGrid,
  User,
  MapPin
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, serverTimestamp, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const CropSymbol = ({ name, className }: { name: string; className?: string }) => {
  const n = name.toLowerCase();
  if (n.includes('leaf') || n.includes('spinach') || n.includes('coriander')) return <Leaf className={className} />;
  return <Sprout className={className} />;
};

export default function RetailerPage() {
  const { t } = useLanguage();
  const { user, profile, isUserLoading, refreshProfile, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requestingTransportId, setRequestingTransportId] = useState<string | null>(null);
  
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const marketplaceQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Fetch ALL available listings across all farmers for ALL retailers
    return query(
      collection(firestore, 'listings'), 
      where('status', '==', 'Available')
    );
  }, [firestore, user?.uid]);

  const myOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'orders'),
      where('buyerId', '==', user.uid)
    );
  }, [firestore, user?.uid]);

  const { data: listings, isLoading: isDataLoading } = useCollection(marketplaceQuery);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(myOrdersQuery);

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

  const handleBuyNowClick = (listing: any) => {
    setSelectedListing(listing);
    setIsBuyNowOpen(true);
  };

  const handlePlaceOrder = () => {
    if (!user || !firestore || !selectedListing) return;
    
    setIsPlacingOrder(true);
    const orderId = `order_${Math.random().toString(36).substr(2, 9)}`;
    const orderData = {
      id: orderId,
      listingId: selectedListing.id,
      farmerId: selectedListing.farmerId,
      farmerEmail: selectedListing.farmerEmail || '',
      farmerName: selectedListing.farmerName || 'Farmer',
      buyerId: user.uid,
      buyerEmail: user.email,
      buyerName: profile?.name || user.email?.split('@')[0],
      cropName: selectedListing.cropName,
      quantityOrdered: selectedListing.quantity,
      agreedPricePerUnit: selectedListing.pricePerUnit,
      totalPrice: selectedListing.quantity * selectedListing.pricePerUnit,
      status: paymentMethod === 'online' ? 'Paid' : 'Pending',
      paymentMethod: paymentMethod,
      orderDate: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      transporterId: null
    };

    const orderRef = doc(firestore, 'orders', orderId);
    setDocumentNonBlocking(orderRef, orderData, { merge: true });

    const listingRef = doc(firestore, 'listings', selectedListing.id);
    updateDocumentNonBlocking(listingRef, { status: 'Sold', updatedAt: serverTimestamp() });

    toast({
      title: "Order Placed",
      description: `Your order for ${selectedListing.cropName} has been placed.`,
    });

    setIsBuyNowOpen(false);
    setIsPlacingOrder(false);
    setSelectedListing(null);
  };

  const handleRequestTransport = (listing: any) => {
    if (!user || !firestore) return;
    
    setRequestingTransportId(listing.id);
    
    const orderId = `order_${Math.random().toString(36).substr(2, 9)}`;
    const orderData = {
      id: orderId,
      listingId: listing.id,
      farmerId: listing.farmerId,
      farmerEmail: listing.farmerEmail || '',
      farmerName: listing.farmerName || 'Farmer',
      buyerId: user.uid,
      buyerEmail: user.email,
      buyerName: profile?.name || user.email?.split('@')[0],
      cropName: listing.cropName,
      quantityOrdered: listing.quantity,
      agreedPricePerUnit: listing.pricePerUnit,
      totalPrice: listing.quantity * listing.pricePerUnit,
      status: 'Pending Transport',
      orderDate: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      transporterId: null 
    };

    const orderRef = doc(firestore, 'orders', orderId);
    setDocumentNonBlocking(orderRef, orderData, { merge: true });

    const listingRef = doc(firestore, 'listings', listing.id);
    updateDocumentNonBlocking(listingRef, { status: 'Sold', updatedAt: serverTimestamp() });

    toast({
      title: "Transport Requested",
      description: `Order created and transport requested for ${listing.cropName}.`,
    });

    setTimeout(() => setRequestingTransportId(null), 1000);
  };

  if (isUserLoading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

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
                  Please verify your email: <strong className="text-foreground">{user.email}</strong>
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="flex flex-col gap-3">
              <Button onClick={handleRefresh} className="w-full h-12 font-bold text-lg gap-2" disabled={isRefreshing}>
                {isRefreshing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCcw className="h-5 w-5" />}
                I Have Verified
              </Button>
              <Button variant="ghost" onClick={logout} className="w-full font-bold text-muted-foreground">
                Logout
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
          <h1 className="text-4xl font-black font-headline text-primary tracking-tight">Retailer Hub</h1>

          <Tabs defaultValue="marketplace" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 max-w-[400px]">
              <TabsTrigger value="marketplace" className="gap-2 font-bold">
                <LayoutGrid className="h-4 w-4" /> Marketplace
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2 font-bold">
                <ShoppingBag className="h-4 w-4" /> My Orders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marketplace">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input 
                    className="pl-10 h-12 rounded-xl text-lg bg-white shadow-sm border-2"
                    placeholder={t('search')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {isDataLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredListings.length === 0 ? (
                     <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed">
                      <p className="text-muted-foreground font-bold">No crops available in the marketplace.</p>
                    </div>
                  ) : (
                    filteredListings.map((listing: any) => (
                      <Card key={listing.id} className="overflow-hidden group hover:shadow-xl transition-all border-2 flex flex-col bg-white">
                        <div className="relative h-32 w-full bg-primary/5 flex items-center justify-center">
                          <CropSymbol name={listing.cropName} className="h-10 w-10 text-primary" />
                          <div className="absolute top-2 right-2">
                             <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm font-bold text-[10px] gap-1">
                               <User className="h-2 w-2" /> {listing.farmerName || 'Farmer'}
                             </Badge>
                          </div>
                        </div>
                        <CardHeader className="p-4 pb-0">
                          <CardTitle className="text-lg mb-1 font-bold">{listing.cropName}</CardTitle>
                          <span className="text-xl font-black text-primary">₹{listing.pricePerUnit}/kg</span>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="font-bold">{listing.quantity} Kg Available</Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                             <MapPin className="h-2 w-2" /> Regional Farm Hub
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                          <Button onClick={() => handleBuyNowClick(listing)} className="w-full font-bold h-10 shadow-sm">Buy Now</Button>
                          <Button 
                            variant="outline" 
                            className="w-full font-bold gap-2 text-primary border-primary/20 h-10"
                            onClick={() => handleRequestTransport(listing)}
                            disabled={requestingTransportId === listing.id}
                          >
                            <Truck className="h-4 w-4" /> Transport
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders">
              {isOrdersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 max-w-5xl">
                  {!orders || orders.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed">
                      <h3 className="text-xl font-bold">No Orders Placed</h3>
                    </div>
                  ) : (
                    orders.map((order: any) => (
                      <Card key={order.id} className="border-2 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-xl font-black">{order.cropName}</CardTitle>
                            <Badge variant={order.status === 'Paid' || order.status === 'Delivered' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </div>
                          <CardDescription>
                            {order.quantityOrdered} Kg ordered on {new Date(order.orderDate).toLocaleDateString()}
                            <br />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Seller: {order.farmerName || order.farmerEmail}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between bg-primary/5 p-3 rounded-lg">
                             <span className="font-bold">Total Amount</span>
                             <span className="font-black text-primary text-xl">₹{order.totalPrice?.toLocaleString()}</span>
                          </div>
                          {order.paymentMethod && (
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                              {order.paymentMethod === 'online' ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                              Payment: {order.paymentMethod === 'online' ? 'Paid Online' : 'Cash on Delivery'}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={isBuyNowOpen} onOpenChange={setIsBuyNowOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Complete Purchase</DialogTitle>
              <DialogDescription>
                Buying <strong>{selectedListing?.quantity}Kg</strong> of {selectedListing?.cropName} from {selectedListing?.farmerName}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center">
                <span className="font-bold text-muted-foreground">Total Price</span>
                <p className="text-2xl font-black text-primary">₹{(selectedListing?.quantity * selectedListing?.pricePerUnit).toLocaleString()}</p>
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-sm">Select Payment Method</Label>
                <RadioGroup defaultValue="cod" value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cod' | 'online')}>
                  <div className="grid gap-4">
                    <Label htmlFor="cod" className="flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Banknote className="h-5 w-5 text-primary" />
                        <p className="font-bold text-sm">Cash on Delivery</p>
                      </div>
                      <RadioGroupItem value="cod" id="cod" />
                    </Label>
                    <Label htmlFor="online" className="flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <p className="font-bold text-sm">Pay Online</p>
                      </div>
                      <RadioGroupItem value="online" id="online" />
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePlaceOrder} className="w-full h-12 text-lg font-bold" disabled={isPlacingOrder}>
                {isPlacingOrder ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
