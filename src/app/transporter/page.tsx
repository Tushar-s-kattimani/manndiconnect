
"use client"

import React, { useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Truck, MapPin, Calendar, IndianRupee, MoveRight, Mail, RefreshCcw, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

export default function TransporterPage() {
  const { t } = useLanguage();
  const { user, profile, isUserLoading, refreshProfile } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  // Query for transport-related orders (jobs)
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('orderDate', 'desc'));
  }, [firestore]);

  const { data: jobs, isLoading: isDataLoading } = useCollection(jobsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) return null;

  const isVerified = user.emailVerified;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {!isVerified && (
          <Alert variant="destructive" className="mb-8 border-2">
            <Mail className="h-5 w-5" />
            <AlertTitle className="font-bold">Email Not Verified</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <span>Please verify your email address to browse transport jobs. Logged in as: {user.email}</span>
              <Button size="sm" variant="outline" className="gap-2 font-bold" onClick={refreshProfile}>
                <RefreshCcw className="h-4 w-4" /> I've Verified
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
            {!isVerified ? (
              <div className="py-20 text-center">
                <p className="text-muted-foreground">Verify your email to view available transport jobs.</p>
              </div>
            ) : !jobs || jobs.length === 0 ? (
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
