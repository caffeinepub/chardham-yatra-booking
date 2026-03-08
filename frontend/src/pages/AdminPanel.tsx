import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useIsCallerAdmin,
  useGetAllTravelPackages,
  useGetAllBookings,
  useAddTravelPackage,
  useUpdateTravelPackage,
  useDeleteTravelPackage,
  useUpdateBookingStatus,
  useUpdatePaymentStatus,
  useIsStripeConfigured,
  useSetStripeConfiguration,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Pencil, Trash2, Package, ShoppingBag, CreditCard } from 'lucide-react';
import PackageFormDialog from '../components/PackageFormDialog';
import StripeConfigDialog from '../components/StripeConfigDialog';
import { toast } from 'sonner';
import { TravelPackageType, Booking, BookingStatus, PaymentStatus } from '../backend';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminPanel() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: packages } = useGetAllTravelPackages();
  const { data: bookings } = useGetAllBookings();
  const { data: isStripeConfigured } = useIsStripeConfigured();
  const deletePackage = useDeleteTravelPackage();
  const updateBookingStatus = useUpdateBookingStatus();
  const updatePaymentStatus = useUpdatePaymentStatus();

  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TravelPackageType | null>(null);
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);

  const isAuthenticated = !!identity;

  if (!isAuthenticated || (!adminLoading && !isAdmin)) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
        <Button onClick={() => navigate({ to: '/' })}>Back to Home</Button>
      </div>
    );
  }

  const handleDeletePackage = async (id: bigint) => {
    try {
      await deletePackage.mutateAsync(id);
      toast.success('Package deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete package');
    }
  };

  const handleEditPackage = (pkg: TravelPackageType) => {
    setEditingPackage(pkg);
    setPackageDialogOpen(true);
  };

  const handleAddPackage = () => {
    setEditingPackage(null);
    setPackageDialogOpen(true);
  };

  const handleUpdateBookingStatus = async (bookingId: bigint, status: string) => {
    try {
      await updateBookingStatus.mutateAsync({
        id: bookingId,
        status: status as BookingStatus,
      });
      toast.success('Booking status updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update booking status');
    }
  };

  const handleUpdatePaymentStatus = async (bookingId: bigint, status: string) => {
    try {
      await updatePaymentStatus.mutateAsync({
        id: bookingId,
        status: status as PaymentStatus,
      });
      toast.success('Payment status updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment status');
    }
  };

  const getPackageById = (packageId: bigint) => {
    return packages?.find((pkg) => pkg.id === packageId);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate({ to: '/' })} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage packages, bookings, and payments</p>
        </div>

        {!isStripeConfigured && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Configuration Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Please configure Stripe to enable payment processing for bookings.
              </p>
              <Button onClick={() => setStripeDialogOpen(true)}>Configure Stripe</Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="packages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="packages">
              <Package className="mr-2 h-4 w-4" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="settings">
              <CreditCard className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Travel Packages</h2>
              <Button onClick={handleAddPackage}>
                <Plus className="mr-2 h-4 w-4" />
                Add Package
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {packages?.map((pkg) => (
                <Card key={pkg.id.toString()}>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{pkg.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">${Number(pkg.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{Number(pkg.durationDays)} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available:</span>
                        <span className="font-medium">{Number(pkg.availableSpots)} spots</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditPackage(pkg)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex-1">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Package</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{pkg.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePackage(pkg.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <h2 className="text-2xl font-bold">All Bookings</h2>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Booking Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings?.map((booking) => {
                      const pkg = getPackageById(booking.packageId);
                      return (
                        <TableRow key={booking.id.toString()}>
                          <TableCell className="font-mono text-sm">
                            {booking.id.toString()}
                          </TableCell>
                          <TableCell>{pkg?.name || 'Unknown'}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {booking.user.toString().slice(0, 10)}...
                          </TableCell>
                          <TableCell>
                            <Select
                              value={booking.bookingStatus as string}
                              onValueChange={(value) => handleUpdateBookingStatus(booking.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={BookingStatus.pending}>Pending</SelectItem>
                                <SelectItem value={BookingStatus.confirmed}>Confirmed</SelectItem>
                                <SelectItem value={BookingStatus.canceled}>Canceled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={booking.paymentStatus as string}
                              onValueChange={(value) => handleUpdatePaymentStatus(booking.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={PaymentStatus.pending}>Pending</SelectItem>
                                <SelectItem value={PaymentStatus.paid}>Paid</SelectItem>
                                <SelectItem value={PaymentStatus.failed}>Failed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">${Number(pkg?.price || 0)}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-2xl font-bold">Payment Settings</h2>

            <Card>
              <CardHeader>
                <CardTitle>Stripe Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">
                      {isStripeConfigured ? 'Configured' : 'Not configured'}
                    </p>
                  </div>
                  <Badge variant={isStripeConfigured ? 'default' : 'destructive'}>
                    {isStripeConfigured ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Button onClick={() => setStripeDialogOpen(true)}>
                  {isStripeConfigured ? 'Update Configuration' : 'Configure Stripe'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PackageFormDialog
        open={packageDialogOpen}
        onOpenChange={setPackageDialogOpen}
        editingPackage={editingPackage}
      />

      <StripeConfigDialog open={stripeDialogOpen} onOpenChange={setStripeDialogOpen} />
    </div>
  );
}
