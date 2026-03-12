
"use client"

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, MapPin, Calendar, IndianRupee, MoveRight, Mail, RefreshCcw, Loader2, Lock, Briefcase, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, where, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function TransporterPage() {
  const { t } = useLanguage();
  const { user, profile, isUserLoading, refreshProfile, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Query for transport-related orders (jobs assigned to this transporter)
  const myJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user || profile?.role !== 'transporter') return null;
    return query(
      collection(firestore, 'orders'), 
      where('transporterId', '==', user.uid),
      orderBy('orderDate', 'desc')
    );
  }, [firestore, user?.uid, profile?.role]);

  // Query for available jobs (pending transport, no transporter assigned yet)
  const availableJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user || profile?.role !== 'transporter') return null;
    return query(
      collection(firestore, 'orders'), 
      where('status', '==', 'Pending Transport'),
      orderBy('orderDate', 'desc')
    );
  }, [firestore, user?.uid, profile?.role]);

  const { data: myJobs, isLoading: isMyJobsLoading } = useCollection(myJobsQuery);
  const { data: availableJobs, isLoading: isAvailableLoading } = useCollection(availableJobsQuery);

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

  const handleAcceptJob = (job: any) => {
    if (!user) return;
    setAcceptingId(job.id);
    
    const docRef = doc(firestore, 'orders', job.id);
    updateDocumentNonBlocking(docRef, {
      transporterId: user.uid,
      transporterEmail: user.email,
      status: 'Transport Accepted',
      updatedAt: serverTimestamp()
    });

    toast({
      title: "Job Accepted!",
      description: `You are now the transporter for this ${job.cropName} shipment.`,
    });

    setTimeout(() => setAcceptingId(null), 1000);
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

  const JobCard = ({ job, isAvailable }: { job: any, isAvailable: boolean }) => (
    <Card key={job.id} className="border-2 hover:border-primary transition-all overflow-hidden bg-white shadow-sm hover:shadow-md">
      <div className="flex flex-col md:flex-row">
        <div className="bg-primary/5 p-6 flex flex-col items-center justify-center md:border-r border-border min-w-[140px]">
           <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
             <Truck className="h-8 w-8 text-primary" />
           </div>
           <Badge variant={isAvailable ? "outline" : "secondary"} className="font-bold uppercase tracking-wider text-[10px]">
            {job.status}
           </Badge>
        </div>
        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Load Content</p>
                   <p className="font-bold text-lg">{job.cropName} ({job.quantityOrdered} Kg)</p>
                </div>
                <MoveRight className="h-6 w-6 text-primary/40 mx-2" />
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Destination</p>
                   <p className="font-bold text-lg">Marketplace Hub</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span className="flex items-center font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1.5 text-primary" /> 
                  Regional Delivery
                </span>
                <span className="flex items-center font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1.5 text-primary" /> 
                  {job.orderDate ? new Date(job.orderDate).toLocaleDateString() : 'TBD'}
                </span>
                <span className="flex items-center font-black text-primary text-base">
                  <IndianRupee className="h-4 w-4 mr-1" /> 
                  {job.totalPrice?.toLocaleString() || '0'} Pay
                </span>
              </div>
            </div>
            <div className="flex flex-row md:flex-col gap-2">
               {isAvailable ? (
                 <Button 
                   onClick={() => handleAcceptJob(job)} 
                   className="flex-1 md:w-32 font-bold shadow-lg gap-2"
                   disabled={acceptingId === job.id}
                 >
                   {acceptingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
                   Accept
                 </Button>
               ) : (
                 <Button className="flex-1 md:w-32 font-bold shadow-lg">Manage</Button>
               )}
               <Button variant="outline" className="flex-1 md:w-32 font-bold border-2">Details</Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black font-headline text-primary tracking-tight">Logistics Center</h1>
            <p className="text-muted-foreground font-medium">Managing transport for: <span className="text-foreground">{user.email}</span></p>
          </div>
          <div className="bg-primary/5 px-4 py-2 rounded-xl border-2 border-primary/10">
            <span className="text-xs font-black uppercase tracking-widest text-primary block">Active Balance</span>
            <span className="text-xl font-black">₹{myJobs?.reduce((acc: any, curr: any) => acc + (curr.totalPrice || 0), 0).toLocaleString()}</span>
          </div>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 max-w-[400px]">
            <TabsTrigger value="available" className="gap-2 font-bold">
              <ClipboardList className="h-4 w-4" /> Available Jobs
            </TabsTrigger>
            <TabsTrigger value="myjobs" className="gap-2 font-bold">
              <Briefcase className="h-4 w-4" /> My Active Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {isAvailableLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl">
                {!availableJobs || availableJobs.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed flex flex-col items-center gap-4">
                    <div className="bg-muted p-4 rounded-full">
                      <Briefcase className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">No Available Jobs</h3>
                      <p className="text-muted-foreground">Check back later for new transport requests from retailers.</p>
                    </div>
                  </div>
                ) : (
                  availableJobs.map((job: any) => <JobCard key={job.id} job={job} isAvailable={true} />)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="myjobs" className="space-y-4">
            {isMyJobsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl">
                {!myJobs || myJobs.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed flex flex-col items-center gap-4">
                    <div className="bg-muted p-4 rounded-full">
                      <Truck className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">No Active Jobs</h3>
                      <p className="text-muted-foreground">Accept a job from the "Available Jobs" tab to get started.</p>
                    </div>
                  </div>
                ) : (
                  myJobs.map((job: any) => <JobCard key={job.id} job={job} isAvailable={false} />)
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
