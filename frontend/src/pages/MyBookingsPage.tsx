import { useGetMyBookings, useGetAllTravelPackages, useCancelBooking } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';
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
import { BookingStatus, PaymentStatus } from '../backend';

export default function MyBookingsPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: bookings, isLoading: bookingsLoading } = useGetMyBookings();
  const { data: packages } = useGetAllTravelPackages();
  const cancelBooking = useCancelBooking();

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Please login to view your bookings</h2>
        <Button onClick={() => navigate({ to: '/' })}>Back to Home</Button>
      </div>
    );
  }

  const handleCancelBooking = async (bookingId: bigint) => {
    try {
      await cancelBooking.mutateAsync(bookingId);
      toast.success('Booking cancelled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking');
    }
  };

  const getPackageById = (packageId: bigint) => {
    return packages?.find((pkg) => pkg.id === packageId);
  };

  const bookingStatusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-green-500',
    canceled: 'bg-gray-500',
  };

  const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    paid: 'bg-green-500',
    failed: 'bg-red-500',
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate({ to: '/' })} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your travel bookings</p>
        </div>

        {bookingsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookings && bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">You haven't made any bookings yet</p>
              <Button onClick={() => navigate({ to: '/' })}>Browse Packages</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings?.map((booking) => {
              const pkg = getPackageById(booking.packageId);
              if (!pkg) return null;

              return (
                <Card key={booking.id.toString()}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{pkg.name}</CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{pkg.startLocation}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{Number(pkg.durationDays)} days</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={bookingStatusColors[booking.bookingStatus as string]}>
                          {(booking.bookingStatus as string).toUpperCase()}
                        </Badge>
                        <Badge className={paymentStatusColors[booking.paymentStatus as string]}>
                          Payment: {(booking.paymentStatus as string).toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">${Number(pkg.price)}</p>
                        <p className="text-sm text-muted-foreground">Booking ID: {booking.id.toString()}</p>
                      </div>
                      {booking.bookingStatus === BookingStatus.pending && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <X className="mr-2 h-4 w-4" />
                              Cancel Booking
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this booking? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelBooking(booking.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Cancel Booking
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
