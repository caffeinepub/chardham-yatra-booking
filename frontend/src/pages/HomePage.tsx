import { useState, useMemo } from 'react';
import { useGetAllTravelPackages } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, MapPin, Calendar, Users, Star } from 'lucide-react';
import { ThemeType } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { data: packages, isLoading } = useGetAllTravelPackages();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [priceRange, setPriceRange] = useState([0, 10000]);

  const filteredPackages = useMemo(() => {
    if (!packages) return [];

    return packages.filter((pkg) => {
      const matchesSearch =
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.startLocation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTheme = selectedTheme === 'all' || pkg.category === selectedTheme;

      const price = Number(pkg.price);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      return matchesSearch && matchesTheme && matchesPrice;
    });
  }, [packages, searchQuery, selectedTheme, priceRange]);

  const themeLabels: Record<string, string> = {
    adventure: 'Adventure',
    luxury: 'Luxury',
    family: 'Family',
    romantic: 'Romantic',
    cultural: 'Cultural',
    nature: 'Nature',
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/assets/generated/travel-hero-banner.dim_1200x400.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        </div>
        <div className="relative container h-full flex flex-col justify-center items-start text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 max-w-2xl">
            Discover Your Next Adventure
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-xl text-white/90">
            Explore amazing destinations and create unforgettable memories
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b bg-muted/30">
        <div className="container py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger>
                  <SelectValue placeholder="All Themes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Themes</SelectItem>
                  {Object.entries(themeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
              <Slider
                min={0}
                max={10000}
                step={100}
                value={priceRange}
                onValueChange={setPriceRange}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="container py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Travel Packages</h2>
          <p className="text-muted-foreground">
            {filteredPackages.length} {filteredPackages.length === 1 ? 'package' : 'packages'} available
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No packages found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPackages.map((pkg) => (
              <Card
                key={pkg.id.toString()}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate({ to: '/package/$packageId', params: { packageId: pkg.id.toString() } })}
              >
                <div className="relative h-48 overflow-hidden">
                  {pkg.images.length > 0 ? (
                    <img
                      src={pkg.images[0].getDirectURL()}
                      alt={pkg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {pkg.discountPercentage && (
                    <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
                      {Number(pkg.discountPercentage)}% OFF
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1">{pkg.name}</CardTitle>
                    <Badge variant="outline">{themeLabels[pkg.category as string]}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{pkg.startLocation}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{pkg.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{Number(pkg.durationDays)} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{Number(pkg.availableSpots)} spots</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{Number(pkg.rating)}/5</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">${Number(pkg.price)}</p>
                    <p className="text-xs text-muted-foreground">per person</p>
                  </div>
                  <Button>View Details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
