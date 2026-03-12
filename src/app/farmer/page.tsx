
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { useOffline } from '@/components/OfflineProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  IndianRupee, 
  Weight, 
  CheckCircle2, 
  Mail, 
  RefreshCcw, 
  Loader2, 
  Sprout, 
  BarChart3, 
  LayoutGrid,
  Leaf,
  Package,
  ShoppingBag,
  Check,
  Phone,
  MapPin,
  Navigation,
  Search,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { useToast } from '@/hooks/use-toast';
import { getMarketIntelligence, type MarketIntelligenceOutput } from '@/ai/flows/market-intelligence-flow';

const CropSymbol = ({ name, className }: { name: string; className?: string }) => {
  const n = name.toLowerCase();
  if (n.includes('leaf') || n.includes('spinach') || n.includes('coriander')) return <Leaf className={className} />;
  return <Sprout className={className} />;
};

export default function FarmerPage() {
  const { t } = useLanguage();
  const { user, profile, isUserLoading, refreshProfile, logout } = useAuth();
  const { addListing } = useOffline();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cropName: '',
    quantity: '',
    price: '',
    phoneNumber: '',
    location: '',
  });

  // Market Intelligence State
  const [marketSearch, setMarketSearch] = useState('');
  const [marketData, setMarketData] = useState<MarketIntelligenceOutput | null>(null);
  const [isMarketLoading, setIsMarketLoading] = useState(false);

  const myListingsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !profile || profile.role !== 'farmer') return null;
    return query(collection(firestore, 'listings'), where('farmerId', '==', user.uid));
  }, [firestore, user?.uid, profile?.role]);

  const myOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !profile || profile.role !== 'farmer') return null;
    return query(collection(firestore, 'orders'), where('farmerId', '==', user.uid));
  }, [firestore, user?.uid, profile?.role]);

  const { data: listings, isLoading: isDataLoading } = useCollection(myListingsQuery);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(myOrdersQuery);

  const chartConfig = {
    quantity: {
      label: "Stock (Kg)",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    if (!listings) return [];
    return listings.map(l => ({
      cropName: l.cropName,
      quantity: l.quantity,
    }));
  }, [listings]);

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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Geolocation is not supported by your browser",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          const data = await response.json();
          const address = data.display_name?.split(',').slice(0, 3).join(',') || `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
          
          setFormData(prev => ({ ...prev, location: address }));
          toast({
            title: "Location Found",
            description: "Location field updated successfully.",
          });
        } catch (error) {
          setFormData(prev => ({ ...prev, location: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}` }));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get location. Please check permissions.",
        });
      }
    );
  };

  const handleConfirmOrder = (orderId: string, listingId: string) => {
    if (!firestore) return;
    setUpdatingId(orderId);
    
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, {
      status: 'Accepted',
      acceptedDate: new Date().toISOString(),
      updatedAt: serverTimestamp()
    });

    if (listingId) {
      const listingRef = doc(firestore, 'listings', listingId);
      updateDocumentNonBlocking(listingRef, {
        status: 'Sold',
        updatedAt: serverTimestamp()
      });
    }

    toast({
      title: "Order Confirmed",
      description: "You have accepted this order. The crop is now marked as Sold.",
    });

    setTimeout(() => setUpdatingId(null), 800);
  };

  const handleCheckMarketRate = async () => {
    if (!marketSearch) return;
    setIsMarketLoading(true);
    try {
      const data = await getMarketIntelligence({ cropName: marketSearch, location: profile?.location });
      setMarketData(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch market insights. Please try again.",
      });
    } finally {
      setIsMarketLoading(false);
    }
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
              <Mail className="mx-auto h-10 w-10 text-destructive" />
              <CardTitle className="text-2xl font-black">Verify Your Email</CardTitle>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addListing(formData);
    setFormData({ cropName: '', quantity: '', price: '', phoneNumber: '', location: '' });
    setIsAddOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-black font-headline text-primary">Farmer Dashboard</h1>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-full shadow-lg gap-2 text-lg font-bold">
                <Plus className="h-6 w-6" /> {t('add_crop')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>{t('add_crop')}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Crop Name</Label>
                  <Input value={formData.cropName} onChange={(e) => setFormData({...formData, cropName: e.target.value})} placeholder="e.g. Wheat, Tomato" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity (Kg)</Label>
                    <Input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} placeholder="Amount" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Price / Kg</Label>
                    <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="Price" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} placeholder="Contact Number" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pickup Location</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Village, City" required />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={handleGetLocation} 
                      disabled={isLocating}
                      title="Auto-detect Location"
                    >
                      {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-bold mt-4">Publish Listing</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 max-w-[800px]">
            <TabsTrigger value="grid" className="gap-2 font-bold"><LayoutGrid className="h-4 w-4" /> Listings</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 font-bold"><Package className="h-4 w-4" /> Orders</TabsTrigger>
            <TabsTrigger value="market" className="gap-2 font-bold"><TrendingUp className="h-4 w-4" /> Market Rates</TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 font-bold"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings?.map((listing: any) => (
                <Card key={listing.id} className="border-2 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <CropSymbol name={listing.cropName} className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{listing.cropName}</CardTitle>
                      <CardDescription>₹{listing.pricePerUnit}/kg</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-bold">{listing.quantity} Kg Stock</Badge>
                      <Badge variant={listing.status === 'Available' ? 'default' : 'secondary'}>{listing.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {listing.location}</div>
                      <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {listing.phoneNumber}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {listings?.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed">
                  <p className="text-muted-foreground font-bold">No active listings.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              {orders?.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed">
                  <p className="text-muted-foreground font-bold">No incoming orders yet.</p>
                </div>
              ) : (
                orders?.map((order: any) => (
                  <Card key={order.id} className="border-2 shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="bg-primary/5 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border min-w-[150px]">
                        <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
                          <ShoppingBag className="h-8 w-8 text-primary" />
                        </div>
                        <Badge variant={order.status === 'Accepted' || order.status === 'Delivered' ? 'default' : 'secondary'} className="font-bold">
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <CardTitle className="text-xl font-black">{order.cropName}</CardTitle>
                            <CardDescription>
                              Ordered by {order.buyerEmail?.split('@')[0]} • {new Date(order.orderDate).toLocaleDateString()}
                            </CardDescription>
                            <div className="flex gap-4 mt-2">
                              <span className="text-sm font-bold flex items-center gap-1">
                                <Weight className="h-3 w-3" /> {order.quantityOrdered} Kg
                              </span>
                              <span className="text-sm font-black text-primary flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" /> {order.totalPrice?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          {(order.status === 'Pending' || order.status === 'Paid') && (
                            <Button 
                              onClick={() => handleConfirmOrder(order.id, order.listingId)}
                              className="w-full md:w-auto font-bold gap-2"
                              disabled={updatingId === order.id}
                            >
                              {updatingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              Confirm Order
                            </Button>
                          )}
                          
                          {order.status === 'Accepted' && (
                            <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg flex items-center gap-2 font-bold">
                              <CheckCircle2 className="h-5 w-5" /> Confirmed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="market">
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="border-2 border-primary/20 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Market Intelligence
                  </CardTitle>
                  <CardDescription>Get AI-powered Mandi rate estimations for any crop.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search crop name (e.g. Wheat, Basmati Rice)..." 
                        className="pl-10 h-11"
                        value={marketSearch}
                        onChange={(e) => setMarketSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCheckMarketRate()}
                      />
                    </div>
                    <Button onClick={handleCheckMarketRate} disabled={isMarketLoading || !marketSearch} className="h-11 font-bold">
                      {isMarketLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check Rate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {marketData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                  <Card className="border-2 border-primary bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Estimated Mandi Rate</CardTitle>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-primary">₹{marketData.estimatedPriceRange.average}</span>
                        <span className="text-sm font-medium text-muted-foreground">per Kg</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span>Range: ₹{marketData.estimatedPriceRange.min} - ₹{marketData.estimatedPriceRange.max}</span>
                        <Badge variant="outline" className="gap-1 bg-white">
                          {marketData.trend === 'Rising' && <TrendingUp className="h-3 w-3 text-green-500" />}
                          {marketData.trend === 'Falling' && <TrendingDown className="h-3 w-3 text-red-500" />}
                          {marketData.trend === 'Stable' && <Minus className="h-3 w-3 text-blue-500" />}
                          {marketData.trend}
                        </Badge>
                      </div>
                      <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '60%' }} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Market Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium leading-relaxed">{marketData.insight}</p>
                      <div className="mt-4 text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-widest font-bold">
                        <RefreshCcw className="h-3 w-3" /> Updated {marketData.lastUpdated}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="border-2">
              <CardHeader><CardTitle>Inventory Overview</CardTitle></CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-[300px] w-full mt-4">
                    <ChartContainer config={chartConfig}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="cropName" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="quantity" fill="var(--color-quantity)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-muted-foreground">Add listings to see inventory analytics.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
