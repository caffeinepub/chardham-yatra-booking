import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetTravelPackage, useCreateCheckoutSession } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, Users, Star, ArrowLeft, Check } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { toast } from 'sonner';
import { ShoppingItem } from '../backend';

export default function PackageDetailsPage() {
  const { packageId } = useParams({ from: '/package/$packageId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: pkg, isLoading } = useGetTravelPackage(BigInt(packageId));
  const createCheckout = useCreateCheckoutSession();

  const isAuthenticated = !!identity;

  const handleBookNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book this package');
      return;
    }

    if (!pkg) return;

    try {
      const items: ShoppingItem[] = [
        {
          productName: pkg.name,
          productDescription: pkg.description,
          priceInCents: BigInt(Number(pkg.price) * 100),
          currency: 'usd',
          quantity: BigInt(1),
        },
      ];

      const session = await createCheckout.mutateAsync(items);
      window.location.href = session.url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate checkout');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-96 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Package not found</h2>
        <Button onClick={() => navigate({ to: '/' })}>Back to Home</Button>
      </div>
    );
  }

  const themeLabels: Record<string, string> = {
    adventure: 'Adventure',
    luxury: 'Luxury',
    family: 'Family',
    romantic: 'Romantic',
    cultural: 'Cultural',
    nature: 'Nature',
  };

  const serviceTypeLabels: Record<string, string> = {
    transportation: 'Transportation',
    accommodation: 'Accommodation',
    meals: 'Meals',
    tours: 'Tours',
    guide: 'Guide',
    insurance: 'Insurance',
  };

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate({ to: '/' })} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Packages
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Carousel */}
            {pkg.images.length > 0 && (
              <Carousel className="w-full">
                <CarouselContent>
                  {pkg.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative h-96 rounded-lg overflow-hidden">
                        <img
                          src={image.getDirectURL()}
                          alt={`${pkg.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {pkg.images.length > 1 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>
            )}

            {/* Package Info */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{pkg.name}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{pkg.startLocation} → {pkg.endLocation}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{Number(pkg.rating)}/5</span>
                      <span className="text-sm">({pkg.reviews.length} reviews)</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-base px-4 py-2">
                  {themeLabels[pkg.category as string]}
                </Badge>
              </div>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{Number(pkg.durationDays)} Days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{Number(pkg.availableSpots)} Spots Available</span>
                </div>
              </div>

              <Separator className="my-6" />

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">{pkg.description}</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Included Services</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {pkg.includedServices.map((service, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 rounded-lg border">
                          <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {serviceTypeLabels[service.type as string]}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="itinerary" className="space-y-4">
                  {pkg.itinerary.map((day) => (
                    <Card key={Number(day.day)}>
                      <CardHeader>
                        <CardTitle className="text-lg">Day {Number(day.day)}: {day.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{day.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                  {pkg.reviews.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No reviews yet</p>
                  ) : (
                    pkg.reviews.map((review, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{review.user}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(Number(review.date) / 1000000).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{Number(review.rating)}/5</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">${Number(pkg.price)}</span>
                  <span className="text-muted-foreground">per person</span>
                </div>
                {pkg.discountPercentage && (
                  <Badge className="w-fit bg-destructive text-destructive-foreground">
                    {Number(pkg.discountPercentage)}% OFF
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{Number(pkg.durationDays)} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available Spots</span>
                    <span className="font-medium">{Number(pkg.availableSpots)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-medium">{Number(pkg.rating)}/5</span>
                  </div>
                </div>
                <Separator />
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBookNow}
                  disabled={createCheckout.isPending || Number(pkg.availableSpots) === 0}
                >
                  {createCheckout.isPending
                    ? 'Processing...'
                    : Number(pkg.availableSpots) === 0
                    ? 'Sold Out'
                    : 'Book Now'}
                </Button>
                {!isAuthenticated && (
                  <p className="text-xs text-center text-muted-foreground">
                    Please login to book this package
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
