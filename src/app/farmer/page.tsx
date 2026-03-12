
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
  History, 
  Mail, 
  RefreshCcw, 
  Loader2, 
  Sprout, 
  BarChart3, 
  LayoutGrid,
  Lock,
  Leaf,
  Package,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
                <Card key={listing.id} className="border-2">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{listing.cropName}</CardTitle>
                      <span className="text-primary font-bold">₹{listing.pricePerUnit}/kg</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">{listing.quantity} Kg Stock</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              {orders?.map((order: any) => (
                <Card key={order.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl font-black">{order.cropName}</CardTitle>
                    <CardDescription>{order.quantityOrdered} Kg from {order.buyerEmail?.split('@')[0]}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-primary">Total Revenue: ₹{order.totalPrice?.toLocaleString()}</p>
                    <Badge variant="secondary">{order.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="border-2">
              <CardHeader><CardTitle>Inventory Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  <ChartContainer config={chartConfig}>
                    <BarChart data={chartData}><XAxis dataKey="cropName" /><YAxis /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="quantity" fill="var(--color-quantity)" /></BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
