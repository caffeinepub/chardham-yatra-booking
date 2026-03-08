import { useState, useEffect } from 'react';
import { useAddTravelPackage, useUpdateTravelPackage } from '../hooks/useQueries';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TravelPackageType, ThemeType } from '../backend';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPackage: TravelPackageType | null;
}

export default function PackageFormDialog({ open, onOpenChange, editingPackage }: PackageFormDialogProps) {
  const addPackage = useAddTravelPackage();
  const updatePackage = useUpdateTravelPackage();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<string>(ThemeType.adventure);
  const [durationDays, setDurationDays] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [availableSpots, setAvailableSpots] = useState('');
  const [rating, setRating] = useState('5');

  useEffect(() => {
    if (editingPackage) {
      setName(editingPackage.name);
      setDescription(editingPackage.description);
      setPrice(Number(editingPackage.price).toString());
      setCategory(editingPackage.category as string);
      setDurationDays(Number(editingPackage.durationDays).toString());
      setStartLocation(editingPackage.startLocation);
      setEndLocation(editingPackage.endLocation);
      setAvailableSpots(Number(editingPackage.availableSpots).toString());
      setRating(Number(editingPackage.rating).toString());
    } else {
      resetForm();
    }
  }, [editingPackage, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategory(ThemeType.adventure);
    setDurationDays('');
    setStartLocation('');
    setEndLocation('');
    setAvailableSpots('');
    setRating('5');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || !price || !durationDays || !startLocation || !endLocation || !availableSpots) {
      toast.error('Please fill in all required fields');
      return;
    }

    const packageData: TravelPackageType = {
      id: editingPackage?.id || BigInt(0),
      name,
      description,
      price: BigInt(price),
      category: category as ThemeType,
      durationDays: BigInt(durationDays),
      startLocation,
      endLocation,
      availableSpots: BigInt(availableSpots),
      rating: BigInt(rating),
      images: editingPackage?.images || [],
      itinerary: editingPackage?.itinerary || [],
      includedServices: editingPackage?.includedServices || [],
      reviews: editingPackage?.reviews || [],
      startValidity: editingPackage?.startValidity || BigInt(0),
      endValidity: editingPackage?.endValidity || BigInt(0),
      discountPercentage: editingPackage?.discountPercentage,
    };

    try {
      if (editingPackage) {
        await updatePackage.mutateAsync({ id: editingPackage.id, updatedPackage: packageData });
        toast.success('Package updated successfully');
      } else {
        await addPackage.mutateAsync(packageData);
        toast.success('Package added successfully');
      }
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save package');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editingPackage ? 'Edit Package' : 'Add New Package'}</DialogTitle>
          <DialogDescription>
            {editingPackage ? 'Update the package details below.' : 'Fill in the details to create a new travel package.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Tropical Paradise Getaway"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the package..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1999"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ThemeType.adventure}>Adventure</SelectItem>
                    <SelectItem value={ThemeType.luxury}>Luxury</SelectItem>
                    <SelectItem value={ThemeType.family}>Family</SelectItem>
                    <SelectItem value={ThemeType.romantic}>Romantic</SelectItem>
                    <SelectItem value={ThemeType.cultural}>Cultural</SelectItem>
                    <SelectItem value={ThemeType.nature}>Nature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durationDays">Duration (Days) *</Label>
                <Input
                  id="durationDays"
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="7"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableSpots">Available Spots *</Label>
                <Input
                  id="availableSpots"
                  type="number"
                  value={availableSpots}
                  onChange={(e) => setAvailableSpots(e.target.value)}
                  placeholder="20"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startLocation">Start Location *</Label>
                <Input
                  id="startLocation"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="e.g., Bali, Indonesia"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endLocation">End Location *</Label>
                <Input
                  id="endLocation"
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  placeholder="e.g., Bali, Indonesia"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input
                id="rating"
                type="number"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={addPackage.isPending || updatePackage.isPending}
              >
                {addPackage.isPending || updatePackage.isPending
                  ? 'Saving...'
                  : editingPackage
                  ? 'Update Package'
                  : 'Add Package'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
