import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Your payment could not be processed. Please try again or contact support if the problem persists.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate({ to: '/' })} className="w-full">
              Browse Packages
            </Button>
            <Button onClick={() => navigate({ to: '/my-bookings' })} variant="outline" className="w-full">
              View My Bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
