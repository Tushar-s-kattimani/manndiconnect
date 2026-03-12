
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
  Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { useToast } from '@/hooks/use-toast';

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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cropName: '',
    quantity: '',
    price: '',
  });

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

  const handleConfirmOrder = (orderId: string, listingId: string) => {
    if (!firestore) return;
    setUpdatingId(orderId);
    
    // Update order status
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, {
      status: 'Accepted',
      acceptedDate: new Date().toISOString(),
      updatedAt: serverTimestamp()
    });

    // Also update listing status to 'Sold' to remove it from the marketplace
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
    setFormData({ cropName: '', quantity: '', price: '' });
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
                <Input value={formData.cropName} onChange={(e) => setFormData({...formData, cropName: e.target.value})} placeholder="Crop Name" required />
                <Input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} placeholder="Quantity (Kg)" required />
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="Price / Kg" required />
                <Button type="submit" className="w-full h-12 text-lg font-bold">Publish Listing</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 max-w-[600px]">
            <TabsTrigger value="grid" className="gap-2 font-bold"><LayoutGrid className="h-4 w-4" /> Listings</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 font-bold"><Package className="h-4 w-4" /> Orders</TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 font-bold"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings?.map((listing: any) => (
                <Card key={listing.id} className="border-2 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <CropSymbol name={listing.cropName} className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{listing.cropName}</CardTitle>
                      <CardDescription>₹{listing.pricePerUnit}/kg</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-bold">{listing.quantity} Kg Stock</Badge>
                      <Badge variant={listing.status === 'Available' ? 'default' : 'secondary'}>{listing.status}</Badge>
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
