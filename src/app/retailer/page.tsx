
"use client"

import React, { useState, useEffect, useMemo } from 'react';
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
  Truck,
  CreditCard,
  Banknote,
  ShoppingBag,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp, where } from 'firebase/firestore';
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
  
  // Buy Now States
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Query for Available Listings
  const marketplaceQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'listings'), 
      where('status', '==', 'Available'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  // Query for Retailer's Orders
  const myOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'orders'),
      where('buyerId', '==', user.uid),
      orderBy('orderDate', 'desc')
    );
  }, [firestore, user]);

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
      buyerId: user.uid,
      buyerEmail: user.email,
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

    // Create the order
    const orderRef = doc(firestore, 'orders', orderId);
    setDocumentNonBlocking(orderRef, orderData, { merge: true });

    // Mark listing as Sold to remove it from marketplace
    const listingRef = doc(firestore, 'listings', selectedListing.id);
    updateDocumentNonBlocking(listingRef, { status: 'Sold', updatedAt: serverTimestamp() });

    toast({
      title: "Order Placed",
      description: `Your order for ${selectedListing.cropName} has been placed. Check the Orders tab.`,
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
      buyerId: user.uid,
      buyerEmail: user.email,
      cropName: listing.cropName,
      quantityOrdered: listing.quantity,
      agreedPricePerUnit: listing.pricePerUnit,
      totalPrice: listing.quantity * listing.pricePerUnit,
      status: 'Pending Transport',
      orderDate: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      transporterId: null 
    };

    // Create the order
    const orderRef = doc(firestore, 'orders', orderId);
    setDocumentNonBlocking(orderRef, orderData, { merge: true });

    // Mark listing as Sold to remove it from marketplace
    const listingRef = doc(firestore, 'listings', listing.id);
    updateDocumentNonBlocking(listingRef, { status: 'Sold', updatedAt: serverTimestamp() });

    toast({
      title: "Transport Requested",
      description: `Order created and transport requested for ${listing.cropName}.`,
    });

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
            <h1 className="text-4xl font-black font-headline text-primary tracking-tight">Retailer Hub</h1>
            <p className="text-muted-foreground font-medium">Verified Buyer: <span className="text-foreground font-bold">{user.email}</span></p>
          </div>

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
                <Button variant="outline" className="h-12 px-6 rounded-xl border-2 font-bold">
                  <Filter className="h-5 w-5 mr-2" />
                  Filter
                </Button>
              </div>

              {isDataLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredListings.length === 0 ? (
                     <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed">
                      <p className="text-muted-foreground font-bold">No crops currently available in the marketplace.</p>
                    </div>
                  ) : (
                    filteredListings.map((listing: any) => (
                      <Card key={listing.id} className="overflow-hidden group hover:shadow-xl transition-all border-2 flex flex-col bg-white">
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
                              <CardTitle className="text-lg mb-1 font-bold">{listing.cropName}</CardTitle>
                              <p className="text-xs font-medium text-muted-foreground flex items-center">
                                <MapPin className="h-3 w-3 mr-1" /> Regional Farm
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
                            <div className="flex items-center font-bold">
                              <Weight className="h-4 w-4 mr-2 text-primary" />
                              <span>{listing.quantity} Kg</span>
                            </div>
                            <span className="font-medium truncate max-w-[100px] text-xs text-muted-foreground">
                              {listing.farmerEmail?.split('@')[0]}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                          <Button onClick={() => handleBuyNowClick(listing)} className="w-full font-bold h-10 shadow-sm">Buy Now</Button>
                          <Button 
                            variant="outline" 
                            className="w-full font-bold gap-2 text-primary border-primary/20 hover:bg-primary/5 h-10"
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
            </TabsContent>

            <TabsContent value="orders">
              {isOrdersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 max-w-5xl">
                  {!orders || orders.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed flex flex-col items-center gap-4">
                      <div className="bg-muted p-4 rounded-full text-muted-foreground"><ShoppingBag className="h-10 w-10" /></div>
                      <div>
                        <h3 className="text-xl font-bold">No Orders Placed</h3>
                        <p className="text-muted-foreground">Your purchase history will appear here once you place an order.</p>
                      </div>
                    </div>
                  ) : (
                    orders.map((order: any) => (
                      <Card key={order.id} className="border-2 hover:border-primary transition-all overflow-hidden bg-white shadow-sm">
                        <div className="flex flex-col md:flex-row">
                          <div className="bg-primary/5 p-6 flex flex-col items-center justify-center md:border-r border-border min-w-[140px]">
                             <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
                               <ShoppingBag className="h-8 w-8 text-primary" />
                             </div>
                             <Badge variant="secondary" className="font-bold uppercase tracking-wider text-[10px]">
                              {order.status}
                             </Badge>
                          </div>
                          <div className="flex-1 p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-black text-xl">{order.cropName}</h3>
                                  <Badge variant="outline" className="font-bold">{order.quantityOrdered} Kg</Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                  <span className="flex items-center font-medium text-muted-foreground">
                                    <Mail className="h-4 w-4 mr-1.5 text-primary" /> 
                                    Farmer: {order.farmerEmail?.split('@')[0]}
                                  </span>
                                  <span className="flex items-center font-medium text-muted-foreground">
                                    <Clock className="h-4 w-4 mr-1.5 text-primary" /> 
                                    {new Date(order.orderDate).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center font-black text-primary text-base">
                                    <IndianRupee className="h-4 w-4 mr-1" /> 
                                    {order.totalPrice?.toLocaleString()} Total
                                  </span>
                                </div>
                                {order.paymentMethod && (
                                  <div className="text-xs font-bold uppercase text-muted-foreground bg-muted inline-block px-2 py-1 rounded">
                                    Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                 <Button variant="outline" className="font-bold border-2">Order Details</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Buy Now Dialog */}
        <Dialog open={isBuyNowOpen} onOpenChange={setIsBuyNowOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Complete Purchase</DialogTitle>
              <DialogDescription>
                Review details for {selectedListing?.cropName} and select payment.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Amount</p>
                  <p className="text-2xl font-black text-primary">₹{(selectedListing?.quantity * selectedListing?.pricePerUnit).toLocaleString()}</p>
                </div>
                <div className="text-right text-sm font-medium">
                  <p>{selectedListing?.quantity} Kg x ₹{selectedListing?.pricePerUnit}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-bold">Payment Method</Label>
                <RadioGroup 
                  defaultValue="cod" 
                  value={paymentMethod} 
                  onValueChange={(v) => setPaymentMethod(v as 'cod' | 'online')}
                  className="grid gap-4"
                >
                  <div>
                    <RadioGroupItem value="cod" id="cod" className="peer sr-only" />
                    <Label
                      htmlFor="cod"
                      className="flex items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Banknote className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-bold">Cash on Delivery</p>
                          <p className="text-xs text-muted-foreground">Pay on arrival</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="online" id="online" className="peer sr-only" />
                    <Label
                      htmlFor="online"
                      className="flex items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-bold">Pay Online</p>
                          <p className="text-xs text-muted-foreground">Fast & secure instant pay</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handlePlaceOrder} 
                className="w-full h-12 text-lg font-bold shadow-lg"
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
