import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Review {
    date: bigint;
    user: string;
    comment: string;
    rating: bigint;
    verificationStatus: ReviewStatus;
}
export interface TravelPackageType {
    id: bigint;
    durationDays: bigint;
    startValidity: bigint;
    reviews: Array<Review>;
    name: string;
    description: string;
    endLocation: string;
    availableSpots: bigint;
    category: ThemeType;
    rating: bigint;
    endValidity: bigint;
    price: bigint;
    discountPercentage?: bigint;
    includedServices: Array<IncludedService>;
    startLocation: string;
    itinerary: Array<Itinerary>;
    images: Array<ExternalBlob>;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Destination {
    id: bigint;
    theme: ThemeType;
    itineraries: Array<Itinerary>;
    name: string;
    description: string;
    travelPackages: Array<TravelPackageType>;
    isFeatured: boolean;
    price: bigint;
    location: string;
    images: Array<ExternalBlob>;
}
export interface Itinerary {
    day: bigint;
    title: string;
    description: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface IncludedService {
    availabilityStart?: bigint;
    cost: bigint;
    name: string;
    type: IncludedServiceType;
    description: string;
    availabilityEnd?: bigint;
    rating: bigint;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Booking {
    id: bigint;
    paymentStatus: PaymentStatus;
    user: Principal;
    bookingStatus: BookingStatus;
    stripeSessionId?: string;
    packageId: bigint;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
}
export enum BookingStatus {
    canceled = "canceled",
    pending = "pending",
    confirmed = "confirmed"
}
export enum IncludedServiceType {
    meals = "meals",
    transportation = "transportation",
    tours = "tours",
    accommodation = "accommodation",
    insurance = "insurance",
    guide = "guide"
}
export enum PaymentStatus {
    pending = "pending",
    paid = "paid",
    failed = "failed"
}
export enum ReviewStatus {
    submitted = "submitted",
    approved = "approved",
    rejected = "rejected"
}
export enum ThemeType {
    nature = "nature",
    romantic = "romantic",
    cultural = "cultural",
    adventure = "adventure",
    luxury = "luxury",
    family = "family"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDestination(newDestination: Destination): Promise<bigint>;
    addTravelPackage(newPackage: TravelPackageType): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelBooking(id: bigint): Promise<void>;
    createBooking(packageId: bigint): Promise<bigint>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteDestination(id: bigint): Promise<void>;
    deleteTravelPackage(id: bigint): Promise<void>;
    filterByCategory(category: ThemeType): Promise<Array<TravelPackageType>>;
    filterByLocation(location: string): Promise<Array<TravelPackageType>>;
    filterByPriceRange(minPrice: bigint, maxPrice: bigint): Promise<Array<TravelPackageType>>;
    filterReviewsByRating(minRating: bigint, maxRating: bigint): Promise<Array<Review>>;
    filterServices(serviceType: IncludedServiceType, minRating: bigint, priceRange: {
        max: bigint;
        min: bigint;
    }, availability: {
        end?: bigint;
        start?: bigint;
    }): Promise<Array<IncludedService>>;
    filterServicesByAvailability(start: bigint | null, end: bigint | null): Promise<Array<IncludedService>>;
    getAllBookings(): Promise<Array<Booking>>;
    getAllByPriceAscending(): Promise<Array<TravelPackageType>>;
    getAllDestinations(): Promise<Array<Destination>>;
    getAllServices(): Promise<Array<IncludedService>>;
    getAllTravelPackages(): Promise<Array<TravelPackageType>>;
    getAvailableServices(): Promise<Array<IncludedService>>;
    getAvailableSpotsFilter(): Promise<Array<TravelPackageType>>;
    getBooking(id: bigint): Promise<Booking | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomQuestionnaire(countryName: string): Promise<string>;
    getDestination(id: bigint): Promise<Destination | null>;
    getMyBookings(): Promise<Array<Booking>>;
    getPackageCategoryFilter(category: ThemeType): Promise<Array<TravelPackageType>>;
    getReviewsForPackage(packageId: bigint): Promise<Array<Review>>;
    getServicesByType(serviceType: IncludedServiceType): Promise<Array<IncludedService>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTravelPackage(id: bigint): Promise<TravelPackageType | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVerifiedReviews(): Promise<Array<Review>>;
    getWithAvailableSpots(): Promise<Array<TravelPackageType>>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchByName(searchText: string): Promise<Array<TravelPackageType>>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateBookingStatus(id: bigint, status: BookingStatus): Promise<void>;
    updateDestination(id: bigint, updatedDestination: Destination): Promise<void>;
    updatePaymentStatus(id: bigint, status: PaymentStatus): Promise<void>;
    updateTravelPackage(id: bigint, updatedPackage: TravelPackageType): Promise<void>;
}
