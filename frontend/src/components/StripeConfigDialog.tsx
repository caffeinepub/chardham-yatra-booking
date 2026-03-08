import { useState } from 'react';
import { useSetStripeConfiguration } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface StripeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StripeConfigDialog({ open, onOpenChange }: StripeConfigDialogProps) {
  const setStripeConfig = useSetStripeConfiguration();
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB,AU');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretKey.trim()) {
      toast.error('Please enter your Stripe secret key');
      return;
    }

    const allowedCountries = countries.split(',').map((c) => c.trim()).filter(Boolean);

    if (allowedCountries.length === 0) {
      toast.error('Please enter at least one country code');
      return;
    }

    try {
      await setStripeConfig.mutateAsync({
        secretKey,
        allowedCountries,
      });
      toast.success('Stripe configured successfully');
      onOpenChange(false);
      setSecretKey('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to configure Stripe');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Stripe</DialogTitle>
          <DialogDescription>
            Enter your Stripe credentials to enable payment processing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretKey">Stripe Secret Key</Label>
            <Input
              id="secretKey"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_test_..."
              required
            />
            <p className="text-xs text-muted-foreground">
              Your Stripe secret key (starts with sk_test_ or sk_live_)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="countries">Allowed Countries</Label>
            <Input
              id="countries"
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              placeholder="US,CA,GB,AU"
              required
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated country codes (e.g., US,CA,GB,AU)
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={setStripeConfig.isPending}>
              {setStripeConfig.isPending ? 'Configuring...' : 'Configure Stripe'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
