
"use client"

import React, { useEffect, useState, useMemo } from 'react';
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
  IndianRupee, 
  MoveRight, 
  Loader2, 
  Briefcase, 
  ClipboardList,
  CheckCircle2,
  Navigation,
  XCircle,
  Check,
  User,
  ShoppingBag
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function TransporterPage() {
  const { t } = useLanguage();
  const { user, profile, isUserLoading, refreshProfile } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Simplified query for Available Jobs (Not yet assigned)
  // Filtering transporterId === null locally to avoid index issues
  const availableJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user || profile?.role !== 'transporter') return null;
    return query(
      collection(firestore, 'orders'), 
      where('status', '==', 'Pending Transport')
    );
  }, [firestore, user?.uid, profile?.role]);

  // Query for My Active Jobs
  const activeJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user || profile?.role !== 'transporter') return null;
    return query(
      collection(firestore, 'orders'), 
      where('transporterId', '==', user.uid),
      where('status', 'in', ['Accepted', 'Confirmed'])
    );
  }, [firestore, user?.uid, profile?.role]);

  // Query for Delivered
  const deliveredJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user || profile?.role !== 'transporter') return null;
    return query(
      collection(firestore, 'orders'), 
      where('transporterId', '==', user.uid),
      where('status', '==', 'Delivered')
    );
  }, [firestore, user?.uid, profile?.role]);

  const { data: availableJobs, isLoading: isAvailableLoading } = useCollection(availableJobsQuery);
  const { data: activeJobs, isLoading: isActiveLoading } = useCollection(activeJobsQuery);
  const { data: deliveredJobs, isLoading: isDeliveredLoading } = useCollection(deliveredJobsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleAcceptJob = (jobId: string) => {
    if (!user || !firestore) return;
    setUpdatingId(jobId);
    
    const docRef = doc(firestore, 'orders', jobId);
    updateDocumentNonBlocking(docRef, {
      status: 'Accepted',
      transporterId: user.uid,
      transporterEmail: user.email,
      transporterName: profile?.name || user.email?.split('@')[0],
      updatedAt: serverTimestamp()
    });

    toast({
      title: "Job Accepted",
      description: "This job is now in your active list.",
    });

    setTimeout(() => setUpdatingId(null), 800);
  };

  const handleRejectJob = (jobId: string) => {
    setRejectedIds(prev => [...prev, jobId]);
    toast({
      title: "Job Rejected",
      description: "This job will no longer show in your available list.",
    });
  };

  const handleUpdateStatus = (jobId: string, newStatus: string, successMsg: string) => {
    if (!user || !firestore) return;
    setUpdatingId(jobId);
    
    const docRef = doc(firestore, 'orders', jobId);
    updateDocumentNonBlocking(docRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    toast({
      title: "Status Updated",
      description: successMsg,
    });

    setTimeout(() => setUpdatingId(null), 800);
  };

  // Filter out locally rejected jobs and ensure transporterId is actually null (unassigned)
  const displayAvailable = useMemo(() => {
    if (!availableJobs) return [];
    return availableJobs.filter(job => 
      !rejectedIds.includes(job.id) && 
      (job.transporterId === null || job.transporterId === undefined)
    );
  }, [availableJobs, rejectedIds]);

  if (isUserLoading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  const JobCard = ({ job, isAvailable = false }: { job: any, isAvailable?: boolean }) => (
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
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Load Details</p>
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                     <p className="font-bold text-lg">{job.cropName} ({job.quantityOrdered} Kg)</p>
                  </div>
                  <MoveRight className="h-6 w-6 text-primary/40" />
                  <div className="space-y-1">
                     <p className="font-bold text-lg">Market Hub</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">Farmer: {job.farmerName || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <span className="font-medium">Buyer: {job.buyerName || 'Unknown'}</span>
                </div>
              </div>

              <div className="flex items-center font-black text-primary text-xl">
                <IndianRupee className="h-5 w-5 mr-1" /> {job.totalPrice?.toLocaleString() || '0'}
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-2">
               {isAvailable ? (
                 <>
                   <Button 
                     onClick={() => handleAcceptJob(job.id)} 
                     className="flex-1 md:w-40 font-bold shadow-lg gap-2"
                     disabled={updatingId === job.id}
                   >
                     {updatingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                     Accept
                   </Button>
                   <Button 
                     onClick={() => handleRejectJob(job.id)} 
                     variant="outline"
                     className="flex-1 md:w-40 font-bold border-destructive text-destructive hover:bg-destructive/5 gap-2"
                   >
                     <XCircle className="h-4 w-4" />
                     Reject
                   </Button>
                 </>
               ) : (
                 <>
                   {job.status === 'Accepted' && (
                     <Button 
                       onClick={() => handleUpdateStatus(job.id, 'Confirmed', 'Transport confirmed. Item is in transit.')} 
                       className="flex-1 md:w-40 font-bold shadow-lg gap-2 bg-secondary text-secondary-foreground"
                       disabled={updatingId === job.id}
                     >
                       Confirm Pickup
                     </Button>
                   )}
                   {job.status === 'Confirmed' && (
                     <Button 
                       onClick={() => handleUpdateStatus(job.id, 'Delivered', 'Order marked as delivered!')} 
                       className="flex-1 md:w-40 font-bold shadow-lg gap-2"
                       disabled={updatingId === job.id}
                     >
                       Mark Delivered
                     </Button>
                   )}
                   <Button variant="outline" className="flex-1 md:w-40 font-bold border-2">Details</Button>
                 </>
               )}
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
            <p className="text-muted-foreground font-medium">Verified Transporter Portal</p>
          </div>
          <div className="bg-primary/5 px-4 py-2 rounded-xl border-2 border-primary/10">
            <span className="text-xs font-black uppercase tracking-widest text-primary block">Completed Earnings</span>
            <span className="text-xl font-black">₹{deliveredJobs?.reduce((acc: any, curr: any) => acc + (curr.totalPrice || 0), 0).toLocaleString()}</span>
          </div>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 max-w-2xl">
            <TabsTrigger value="available" className="gap-2 font-bold">
              <ClipboardList className="h-4 w-4" /> Available Jobs
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2 font-bold">
              <Navigation className="h-4 w-4" /> My Active Jobs
            </TabsTrigger>
            <TabsTrigger value="delivered" className="gap-2 font-bold">
              <CheckCircle2 className="h-4 w-4" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {isAvailableLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
            ) : (
              <div className="max-w-5xl">
                {displayAvailable.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed">
                    <h3 className="text-xl font-bold">No Jobs Available</h3>
                    <p className="text-muted-foreground">When retailers request transport, they will appear here for you to accept.</p>
                  </div>
                ) : (
                  displayAvailable.map((job: any) => <JobCard key={job.id} job={job} isAvailable={true} />)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {isActiveLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
            ) : (
              <div className="max-w-5xl">
                {!activeJobs || activeJobs.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed">
                    <h3 className="text-xl font-bold">No Active Jobs</h3>
                    <p className="text-muted-foreground">Accept an available job to see it here.</p>
                  </div>
                ) : (
                  activeJobs.map((job: any) => <JobCard key={job.id} job={job} />)
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
                  <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed">
                    <h3 className="text-xl font-bold">No Completed Jobs</h3>
                  </div>
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
