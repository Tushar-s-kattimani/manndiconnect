
"use client"

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Calendar, IndianRupee, MoveRight, Mail, RefreshCcw, Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function TransporterPage() {
  const { t } = useLanguage();
  const { user, isUserLoading, refreshProfile, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const firestore = useFirestore();
  const router = useRouter();

  // Query for transport-related orders (jobs) - Only initialize if user is authenticated
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), orderBy('orderDate', 'desc'));
  }, [firestore, user]);

  const { data: jobs, isLoading: isDataLoading } = useCollection(jobsQuery);

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
                  Access to the Transporter Dashboard is restricted until your email is verified.
                  Please check your inbox: <strong className="text-foreground">{user.email}</strong>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-xl flex items-start gap-3">
                <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Verification ensures our logistics network remains reliable and secure for all parties.
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black font-headline text-primary">Transport Jobs</h1>
          <p className="text-muted-foreground">Logistics management for: <span className="font-bold">{user.email}</span></p>
        </div>

        {isDataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {!jobs || jobs.length === 0 ? (
               <div className="py-20 text-center">
                <p className="text-muted-foreground">No active transport jobs available at the moment.</p>
              </div>
            ) : (
              jobs.map((job: any) => (
                <Card key={job.id} className="border-2 hover:border-primary transition-all overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-primary/5 p-6 flex flex-col items-center justify-center md:border-r">
                       <Truck className="h-10 w-10 text-primary mb-2" />
                       <Badge variant="secondary" className="font-bold">{job.status}</Badge>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                               <p className="text-xs font-bold text-muted-foreground uppercase">Load</p>
                               <p className="font-bold">{job.quantityOrdered} Units</p>
                            </div>
                            <MoveRight className="h-5 w-5 text-muted-foreground mx-2" />
                            <div className="text-center">
                               <p className="text-xs font-bold text-muted-foreground uppercase">Farmer</p>
                               <p className="font-bold">Verified Farm</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center font-medium"><MapPin className="h-4 w-4 mr-1 text-primary" /> Delivery Zone</span>
                            <span className="flex items-center font-medium"><Calendar className="h-4 w-4 mr-1 text-primary" /> {new Date(job.orderDate).toLocaleDateString()}</span>
                            <span className="flex items-center font-bold text-primary"><IndianRupee className="h-4 w-4 mr-1" /> {job.totalPrice} Est.</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="outline" className="font-bold">Details</Button>
                           <Button className="font-bold">Accept Job</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
