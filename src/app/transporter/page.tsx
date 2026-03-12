
"use client"

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  MoveRight, 
  Mail, 
  RefreshCcw, 
  Loader2, 
  Lock, 
  Briefcase, 
  ClipboardList,
  CheckCircle2,
  Package,
  Navigation,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function TransporterPage() {
  const { t } = useLanguage();
  const { user, profile, isUserLoading, refreshProfile, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Query for Available Jobs (Not yet assigned)
  const availableJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !profile || profile.role !== 'transporter') return null;
    return query(
      collection(firestore, 'orders'), 
      where('status', '==', 'Pending Transport'),
      where('transporterId', '==', null)
    );
  }, [firestore, user?.uid, profile?.role]);

  // Query for Pending Pickup (Assigned but not confirmed)
  const pendingJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !profile || profile.role !== 'transporter') return null;
    return query(
      collection(firestore, 'orders'), 
      where('transporterId', '==', user.uid),
      where('status', '==', 'Accepted')
    );
  }, [firestore, user?.uid, profile?.role]);

  // Query for Confirmed (In Transit)
  const confirmedJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !profile || profile.role !== 'transporter') return null;
    return query(
      collection(firestore, 'orders'), 
      where('transporterId', '==', user.uid),
      where('status', '==', 'Confirmed')
    );
  }, [firestore, user?.uid, profile?.role]);

  // Query for Delivered
  const deliveredJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !profile || profile.role !== 'transporter') return null;
    return query(
      collection(firestore, 'orders'), 
      where('transporterId', '==', user.uid),
      where('status', '==', 'Delivered')
    );
  }, [firestore, user?.uid, profile?.role]);

  const { data: availableJobs, isLoading: isAvailableLoading } = useCollection(availableJobsQuery);
  const { data: pendingJobs, isLoading: isPendingLoading } = useCollection(pendingJobsQuery);
  const { data: confirmedJobs, isLoading: isConfirmedLoading } = useCollection(confirmedJobsQuery);
  const { data: deliveredJobs, isLoading: isDeliveredLoading } = useCollection(deliveredJobsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleUpdateStatus = (jobId: string, newStatus: string, successMsg: string) => {
    if (!user || !firestore) return;
    setUpdatingId(jobId);
    
    const docRef = doc(firestore, 'orders', jobId);
    const updateData: any = {
      status: newStatus,
      updatedAt: serverTimestamp()
    };

    if (newStatus === 'Accepted') {
      updateData.transporterId = user.uid;
      updateData.transporterEmail = user.email;
    }

    updateDocumentNonBlocking(docRef, updateData);

    toast({
      title: "Status Updated",
      description: successMsg,
    });

    setTimeout(() => setUpdatingId(null), 800);
  };

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

  const JobCard = ({ job }: { job: any }) => (
    <Card key={job.id} className="border-2 hover:border-primary transition-all overflow-hidden bg-white shadow-sm hover:shadow-md mb-4">
      <div className="flex flex-col md:flex-row">
        <div className="bg-primary/5 p-6 flex flex-col items-center justify-center md:border-r border-border min-w-[140px]">
           <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
             {job.status === 'Delivered' ? (
               <CheckCircle2 className="h-8 w-8 text-primary" />
             ) : job.status === 'Confirmed' ? (
               <Navigation className="h-8 w-8 text-primary animate-pulse" />
             ) : (
               <Truck className="h-8 w-8 text-primary" />
             )}
           </div>
           <Badge variant={job.status === 'Delivered' ? "default" : "outline"} className="font-bold uppercase tracking-wider text-[10px]">
            {job.status === 'Pending Transport' ? 'Available' : job.status}
           </Badge>
        </div>
        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Load</p>
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
               {job.status === 'Pending Transport' && (
                 <Button 
                   onClick={() => handleUpdateStatus(job.id, 'Accepted', 'Job moved to Pending Pickup.')} 
                   className="flex-1 md:w-40 font-bold shadow-lg gap-2"
                   disabled={updatingId === job.id}
                 >
                   {updatingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
                   Accept Job
                 </Button>
               )}
               {job.status === 'Accepted' && (
                 <Button 
                   onClick={() => handleUpdateStatus(job.id, 'Confirmed', 'Transport confirmed. Item is in transit.')} 
                   className="flex-1 md:w-40 font-bold shadow-lg gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                   disabled={updatingId === job.id}
                 >
                   {updatingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                   Confirm Pickup
                 </Button>
               )}
               {job.status === 'Confirmed' && (
                 <Button 
                   onClick={() => handleUpdateStatus(job.id, 'Delivered', 'Order marked as delivered!')} 
                   className="flex-1 md:w-40 font-bold shadow-lg gap-2"
                   disabled={updatingId === job.id}
                 >
                   {updatingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                   Mark Delivered
                 </Button>
               )}
               <Button variant="outline" className="flex-1 md:w-40 font-bold border-2">Details</Button>
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
            <span className="text-xs font-black uppercase tracking-widest text-primary block">Completed Earnings</span>
            <span className="text-xl font-black">₹{deliveredJobs?.reduce((acc: any, curr: any) => acc + (curr.totalPrice || 0), 0).toLocaleString()}</span>
          </div>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 max-w-4xl">
            <TabsTrigger value="available" className="gap-2 font-bold">
              <ClipboardList className="h-4 w-4" /> Available
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2 font-bold">
              <Package className="h-4 w-4" /> Pending
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="gap-2 font-bold">
              <Navigation className="h-4 w-4" /> Confirmed
            </TabsTrigger>
            <TabsTrigger value="delivered" className="gap-2 font-bold">
              <CheckCircle2 className="h-4 w-4" /> Delivered
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {isAvailableLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
            ) : (
              <div className="max-w-5xl">
                {!availableJobs || availableJobs.length === 0 ? (
                  <EmptyState icon={<ClipboardList className="h-10 w-10" />} title="No Jobs Available" desc="Check back later for new transport requests." />
                ) : (
                  availableJobs.map((job: any) => <JobCard key={job.id} job={job} />)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {isPendingLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
            ) : (
              <div className="max-w-5xl">
                {!pendingJobs || pendingJobs.length === 0 ? (
                  <EmptyState icon={<Package className="h-10 w-10" />} title="Nothing Pending" desc="Accept a job to see it here." />
                ) : (
                  pendingJobs.map((job: any) => <JobCard key={job.id} job={job} />)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="confirmed">
            {isConfirmedLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
            ) : (
              <div className="max-w-5xl">
                {!confirmedJobs || confirmedJobs.length === 0 ? (
                  <EmptyState icon={<Navigation className="h-10 w-10" />} title="Nothing in Transit" desc="Confirm pickup for a job to track it here." />
                ) : (
                  confirmedJobs.map((job: any) => <JobCard key={job.id} job={job} />)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="delivered">
            {isDeliveredLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
            ) : (
              <div className="max-w-5xl">
                {!deliveredJobs || deliveredJobs.length === 0 ? (
                  <EmptyState icon={<CheckCircle2 className="h-10 w-10" />} title="No Completed Deliveries" desc="Delivered jobs will appear here for your records." />
                ) : (
                  deliveredJobs.map((job: any) => <JobCard key={job.id} job={job} />)
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed flex flex-col items-center gap-4">
      <div className="bg-muted p-4 rounded-full text-muted-foreground">{icon}</div>
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
