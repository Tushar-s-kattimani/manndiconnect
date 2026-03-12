
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
  Leaf
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

// Helper for crop symbols
const CropSymbol = ({ name, className }: { name: string; className?: string }) => {
  const n = name.toLowerCase();
  if (n.includes('leaf') || n.includes('spinach') || n.includes('coriander')) return <Leaf className={className} />;
  return <Sprout className={className} />;
};

export default function FarmerPage() {
  const { t } = useLanguage();
  const { user, isUserLoading, refreshProfile, logout } = useAuth();
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

  // Query for user's specific listings
  const myListingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'listings'), where('farmerId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: listings, isLoading: isDataLoading } = useCollection(myListingsQuery);

  // Chart Configuration
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
                  Access to the Farmer Dashboard is restricted until your email is verified.
                  Please check your inbox: <strong className="text-foreground">{user.email}</strong>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-xl flex items-start gap-3">
                <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Verification ensures the security of our agricultural marketplace and prevents fraudulent listings.
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
          <div>
            <h1 className="text-3xl font-black font-headline text-primary">{t('my_listings')}</h1>
            <p className="text-muted-foreground">Logged in as: <span className="font-bold">{user.email}</span></p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-full shadow-lg gap-2 text-lg font-bold">
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
                  <div className="relative w-full aspect-video bg-primary/5 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-primary/20 overflow-hidden transition-all group">
                    <CropSymbol name={formData.cropName} className="h-16 w-16 text-primary mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="text-sm font-bold text-primary capitalize">{formData.cropName || 'Crop Symbol Preview'}</span>
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

        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 max-w-[400px]">
            <TabsTrigger value="grid" className="gap-2 font-bold">
              <LayoutGrid className="h-4 w-4" /> Listings
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 font-bold">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
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
                      <div className="relative h-32 w-full bg-primary/5 flex items-center justify-center">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary/10">
                          <CropSymbol name={listing.cropName} className="h-12 w-12 text-primary" />
                        </div>
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
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 gap-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Inventory Overview
                  </CardTitle>
                  <CardDescription>
                    Total quantity (Kg) of each crop currently listed in the marketplace.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {listings && listings.length > 0 ? (
                    <div className="h-[400px] w-full mt-4">
                      <ChartContainer config={chartConfig} className="h-full w-full">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="cropName" 
                            tickLine={false} 
                            tickMargin={10} 
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis 
                            tickLine={false} 
                            axisLine={false} 
                            tickMargin={10}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar 
                            dataKey="quantity" 
                            fill="var(--color-quantity)" 
                            radius={[4, 4, 0, 0]} 
                            barSize={40}
                          />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <p>Add some listings to view analytics.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-2 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-primary">{listings?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card className="border-2 bg-secondary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Stock Weight</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-primary">
                      {listings?.reduce((acc: number, curr: any) => acc + (curr.quantity || 0), 0).toLocaleString()} Kg
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
