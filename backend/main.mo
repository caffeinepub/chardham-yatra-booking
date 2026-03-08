import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";

actor {
  // Extend with storage mixin
  include MixinStorage();

  // Extend with authorization & role-based access control mixin
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Empty = { empty : () };

  // Types
  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
  };

  public type Destination = {
    id : Nat;
    name : Text;
    description : Text;
    location : Text;
    price : Nat;
    theme : ThemeType;
    images : [Storage.ExternalBlob];
    itineraries : [Itinerary];
    isFeatured : Bool;
    travelPackages : [TravelPackageType];
  };

  public type Booking = {
    id : Nat;
    user : Principal;
    packageId : Nat;
    bookingStatus : BookingStatus;
    paymentStatus : PaymentStatus;
    stripeSessionId : ?Text;
  };

  public type Itinerary = {
    day : Nat;
    title : Text;
    description : Text;
  };

  public type TravelPackageType = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    images : [Storage.ExternalBlob];
    itinerary : [Itinerary];
    category : ThemeType;
    durationDays : Nat;
    startLocation : Text;
    endLocation : Text;
    availableSpots : Nat;
    discountPercentage : ?Nat;
    includedServices : [IncludedService];
    reviews : [Review];
    rating : Nat;
    startValidity : Nat;
    endValidity : Nat;
  };

  public type AdminAccount = {
    username : Text;
    passwordHash : Text;
    accessLevel : Text;
    permissions : Nat;
  };

  public type BookingStatus = {
    #pending;
    #confirmed;
    #canceled;
  };

  public type PaymentStatus = {
    #pending;
    #paid;
    #failed;
  };

  public type ThemeType = {
    #adventure;
    #luxury;
    #family;
    #romantic;
    #cultural;
    #nature;
  };

  public type IncludedService = {
    name : Text;
    description : Text;
    cost : Nat;
    type_ : IncludedServiceType;
    availabilityStart : ?Nat;
    availabilityEnd : ?Nat;
    rating : Nat;
  };

  public type Review = {
    user : Text;
    rating : Nat;
    comment : Text;
    date : Nat;
    verificationStatus : ReviewStatus;
  };

  public type ReviewStatus = {
    #submitted;
    #approved;
    #rejected;
  };

  public type IncludedServiceType = {
    #transportation;
    #accommodation;
    #meals;
    #tours;
    #guide;
    #insurance;
  };

  public type PackageFilter = {
    location : ?Text;
    priceRange : ?{ min : Nat; max : Nat };
    theme : ?ThemeType;
    durationDays : ?Nat;
    startValidity : ?Nat;
    endValidity : ?Nat;
    rating : ?Nat;
    discountPercentage : ?Nat;
    availableSpots : ?Nat;
    name : ?Text;
    transportationType : ?IncludedServiceType;
    mealAvailability : ?Bool;
    verifiedReviews : ?Bool;
    tourGuideAvailability : ?Bool;
    minRating_ : ?Nat;
    maxRating : ?Nat;
    packageType : ?Text;
    destination : ?Text;
    includedServices : ?[IncludedServiceType];
  };

  module TravelPackageType {
    public func compare(p1 : TravelPackageType, p2 : TravelPackageType) : Order.Order {
      Text.compare(p1.name, p2.name);
    };
  };

  module IncludedService {
    public func compare(s1 : IncludedService, s2 : IncludedService) : Order.Order {
      Text.compare(s1.name, s2.name);
    };
  };

  module Review {
    public func compare(r1 : Review, r2 : Review) : Order.Order {
      Nat.compare(r1.rating, r2.rating);
    };
  };

  var nextId = 0;

  let destinations = Map.empty<Nat, Destination>();
  let bookings = Map.empty<Nat, Booking>();
  let travelPackages = Map.empty<Nat, TravelPackageType>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  func getNextId() : Nat {
    nextId += 1;
    nextId;
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Transportation CRUD
  func adjustSpotAvailability(id : Nat, adjustment : Nat, increase : Bool) : () {
    switch (travelPackages.get(id)) {
      case (null) { Runtime.trap("Travel package not found: Id " # id.toText()) };
      case (?t) {
        let newAvailableSpots = if (increase) {
          t.availableSpots + adjustment;
        } else if (t.availableSpots >= adjustment) {
          t.availableSpots - adjustment;
        } else {
          Runtime.trap("Insufficient spots available in travel package: " # t.availableSpots.toText());
        };

        let updated = {
          t with
          availableSpots = newAvailableSpots;
        };

        travelPackages.add(id, updated);
      };
    };
  };

  // Travel Package CRUD - Admin Only
  public shared ({ caller }) func addTravelPackage(newPackage : TravelPackageType) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add travel packages");
    };
    let id = getNextId();
    let travelPackageWithId = { newPackage with id };
    travelPackages.add(id, travelPackageWithId);
    id;
  };

  public query ({ caller }) func getTravelPackage(id : Nat) : async ?TravelPackageType {
    // Public access - anyone can view packages
    travelPackages.get(id);
  };

  public query ({ caller }) func getAllTravelPackages() : async [TravelPackageType] {
    // Public access - anyone can browse packages
    travelPackages.values().toArray().sort();
  };

  public shared ({ caller }) func updateTravelPackage(id : Nat, updatedPackage : TravelPackageType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update travel packages");
    };
    travelPackages.add(id, updatedPackage);
  };

  public shared ({ caller }) func deleteTravelPackage(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete travel packages");
    };
    travelPackages.remove(id);
  };

  // Destination CRUD - Admin Only
  public shared ({ caller }) func addDestination(newDestination : Destination) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add destinations");
    };
    let id = getNextId();
    let destinationWithId = { newDestination with id };
    destinations.add(id, destinationWithId);
    id;
  };

  public query ({ caller }) func getDestination(id : Nat) : async ?Destination {
    // Public access - anyone can view destinations
    destinations.get(id);
  };

  public query ({ caller }) func getAllDestinations() : async [Destination] {
    // Public access - anyone can browse destinations
    destinations.values().toArray();
  };

  public shared ({ caller }) func updateDestination(id : Nat, updatedDestination : Destination) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update destinations");
    };
    destinations.add(id, updatedDestination);
  };

  public shared ({ caller }) func deleteDestination(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete destinations");
    };
    destinations.remove(id);
  };

  // Booking Management
  public shared ({ caller }) func createBooking(packageId : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create bookings");
    };

    // Verify package exists
    switch (travelPackages.get(packageId)) {
      case (null) { Runtime.trap("Travel package not found") };
      case (?pkg) {
        if (pkg.availableSpots == 0) {
          Runtime.trap("No available spots for this package");
        };
      };
    };

    let id = getNextId();
    let booking : Booking = {
      id = id;
      user = caller;
      packageId = packageId;
      bookingStatus = #pending;
      paymentStatus = #pending;
      stripeSessionId = null;
    };
    bookings.add(id, booking);

    // Reduce available spots
    adjustSpotAvailability(packageId, 1, false);

    id;
  };

  public query ({ caller }) func getBooking(id : Nat) : async ?Booking {
    switch (bookings.get(id)) {
      case (null) { null };
      case (?booking) {
        // Users can only view their own bookings, admins can view all
        if (booking.user == caller or AccessControl.isAdmin(accessControlState, caller)) {
          ?booking;
        } else {
          Runtime.trap("Unauthorized: Can only view your own bookings");
        };
      };
    };
  };

  public query ({ caller }) func getMyBookings() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bookings");
    };
    bookings.values().toArray().filter(func(b) { b.user == caller });
  };

  public query ({ caller }) func getAllBookings() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all bookings");
    };
    bookings.values().toArray();
  };

  public shared ({ caller }) func updateBookingStatus(id : Nat, status : BookingStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update booking status");
    };
    switch (bookings.get(id)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        let updated = { booking with bookingStatus = status };
        bookings.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func updatePaymentStatus(id : Nat, status : PaymentStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update payment status");
    };
    switch (bookings.get(id)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        let updated = { booking with paymentStatus = status };
        bookings.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func cancelBooking(id : Nat) : async () {
    switch (bookings.get(id)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        // Users can cancel their own bookings, admins can cancel any
        if (booking.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only cancel your own bookings");
        };

        let updated = { booking with bookingStatus = #canceled };
        bookings.add(id, updated);

        // Restore available spots
        adjustSpotAvailability(booking.packageId, 1, true);
      };
    };
  };

  // Additional Travel Package Query Functions - Public Access
  public query ({ caller }) func filterByPriceRange(minPrice : Nat, maxPrice : Nat) : async [TravelPackageType] {
    travelPackages.values().toArray().sort().filter(
      func(t) { t.price >= minPrice and t.price <= maxPrice }
    );
  };

  public query ({ caller }) func filterByCategory(category : ThemeType) : async [TravelPackageType] {
    travelPackages.values().toArray().sort().filter(
      func(t) { t.category == category }
    );
  };

  public query ({ caller }) func filterByLocation(location : Text) : async [TravelPackageType] {
    travelPackages.values().toArray().sort().filter(
      func(t) { t.startLocation.contains(#text location) }
    );
  };

  public query ({ caller }) func getWithAvailableSpots() : async [TravelPackageType] {
    travelPackages.values().toArray().sort().filter(
      func(t) { t.availableSpots > 0 }
    );
  };

  public query ({ caller }) func getAllByPriceAscending() : async [TravelPackageType] {
    travelPackages.values().toArray().sort();
  };

  public query ({ caller }) func searchByName(searchText : Text) : async [TravelPackageType] {
    travelPackages.values().toArray().sort().filter(
      func(t) { t.name.contains(#text searchText) }
    );
  };

  // Included Services CRUD - Public Query Access
  public query ({ caller }) func getServicesByType(serviceType : IncludedServiceType) : async [IncludedService] {
    let allServices = travelPackages.values().toArray().flatMap(func(tp) { tp.includedServices.values() });
    allServices.sort().filter(
      func(s) { s.type_ == serviceType }
    );
  };

  public query ({ caller }) func getAllServices() : async [IncludedService] {
    let allServices = travelPackages.values().toArray().flatMap(func(tp) { tp.includedServices.values() });
    allServices.sort();
  };

  public query ({ caller }) func filterServicesByAvailability(start : ?Nat, end : ?Nat) : async [IncludedService] {
    let allServices = travelPackages.values().toArray().flatMap(func(tp) { tp.includedServices.values() });
    allServices.sort().filter(
      func(s) {
        switch (s.availabilityStart, s.availabilityEnd) {
          case (?serviceStart, ?serviceEnd) {
            switch (start, end) {
              case (?queryStart, ?queryEnd) {
                return serviceStart >= queryStart and serviceEnd <= queryEnd;
              };
              case (?queryStart, null) { return serviceEnd >= queryStart };
              case (null, ?queryEnd) { return serviceStart <= queryEnd };
              case (null, null) { return true };
            };
          };
          case (null, _) { return false };
          case (_, null) { return false };
        };
      }
    );
  };

  public query ({ caller }) func getAvailableServices() : async [IncludedService] {
    let allServices = travelPackages.values().toArray().flatMap(func(tp) { tp.includedServices.values() });
    allServices.sort().filter(
      func(s) {
        let now = 0; // adjust with actual current timestamp in production
        switch (s.availabilityStart, s.availabilityEnd) {
          case (?start, ?end) { now >= start and now <= end };
          case (?start, null) { now >= start };
          case (null, ?end) { now <= end };
          case (null, null) { true };
        };
      }
    );
  };

  // Review Query Functions - Public Access
  public query ({ caller }) func getReviewsForPackage(packageId : Nat) : async [Review] {
    switch (travelPackages.get(packageId)) {
      case (null) { [] };
      case (?pkg) { pkg.reviews };
    };
  };

  public query ({ caller }) func filterReviewsByRating(minRating : Nat, maxRating : Nat) : async [Review] {
    let allReviews = travelPackages.values().toArray().flatMap(func(tp) { tp.reviews.values() });
    allReviews.sort().filter(
      func(r) { r.rating >= minRating and r.rating <= maxRating }
    );
  };

  public query ({ caller }) func getVerifiedReviews() : async [Review] {
    let allReviews = travelPackages.values().toArray().flatMap(func(tp) { tp.reviews.values() });
    allReviews.sort().filter(
      func(r) { r.verificationStatus == #approved }
    );
  };

  // Advanced Service Filter - Public Access
  public query ({ caller }) func filterServices(serviceType : IncludedServiceType, minRating : Nat, priceRange : ({ min : Nat; max : Nat }), availability : ({ start : ?Nat; end : ?Nat })) : async [IncludedService] {
    let allServices = travelPackages.values().toArray().flatMap(func(tp) { tp.includedServices.values() });
    allServices.sort().filter(
      func(s) {
        s.type_ == serviceType
        and
        s.rating >= minRating
        and
        s.cost >= priceRange.min and s.cost <= priceRange.max
        and
        validateAvailability(s, availability);
      }
    );
  };

  func validateAvailability(service : IncludedService, desired : { start : ?Nat; end : ?Nat }) : Bool {
    switch (service.availabilityStart, service.availabilityEnd) {
      case (?start, ?end) {
        switch (desired.start, desired.end) {
          case (?desiredStart, ?desiredEnd) {
            return start >= desiredStart and end <= desiredEnd;
          };
          case (?desiredStart, null) { return end >= desiredStart };
          case (null, ?desiredEnd) { return start <= desiredEnd };
          case (null, null) { return true };
        };
      };
      case (_, _) { return true };
    };
  };

  // Stripe configuration - Admin Only
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfig := ?config;
  };

  // Get Stripe configuration
  func getStripeConfig() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be configured first") };
      case (?config) { config };
    };
  };

  // Stripe session status check - User Only (for their own bookings)
  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check payment status");
    };
    await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);
  };

  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public query({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfig(), caller, items, successUrl, cancelUrl, transform);
  };

  public query ({ caller }) func getPackageCategoryFilter(category : ThemeType) : async [TravelPackageType] {
    travelPackages.values().toArray().sort().filter(
      func(product) { product.category == category }
    );
  };

  public query ({ caller }) func getAvailableSpotsFilter() : async [TravelPackageType] {
    travelPackages.values().toArray().sort().filter(
      func(product) { product.availableSpots > 0 }
    );
  };

  public query ({ caller }) func getCustomQuestionnaire(countryName : Text) : async Text {
    // Public access - anyone can view questionnaires
    switch (countryName) {
      case ("Italy") {
        "Do you have any dietary restrictions identifying with Mediterranean cuisine? (Yes/No)\nAre you interested in wine tasting experiences? (Yes/No)\nWould you like to participate in historical city tours? (Yes/No)";
      };
      case ("Japan") {
        "Are you comfortable with traditional Japanese seating arrangements? (Yes/No)\nWould you prefer a private or group tea ceremony experience? (Yes/No)\nAre you interested in cherry blossom season travel? (Yes/No)";
      };
      case ("France") {
        "Do you wish to participate in wine tours in Bordeaux or Champagne? (Yes/No)\nWould you like guided tours of historical art museums? (Yes/No)\nAre you interested in joining culinary workshops focused on French cuisine? (Yes/No)";
      };
      case ("Australia") {
        "Would you like to participate in guided snorkeling or diving tours? (Yes/No)\nAre you interested in wildlife safaris? (Yes/No)\nDo you need advice on visa requirements for entry to Australia? (Yes/No)";
      };
      case ("Brazil") {
        "Are you comfortable joining group samba dancing lessons? (Yes/No)\nWould you like guided tours of the Amazon Rainforest? (Yes/No)\nDo you have special requests for participating in Brazilian cultural festivals? (Yes/No)";
      };
      case ("Canada") {
        "Are you seeking winter sports and ski packages? (Yes/No)\nDo you wish to participate in wildlife watching tours? (Yes/No)\nWould you like to join adventure trekking in Canada's National Parks? (Yes/No)";
      };
      case ("Greece") {
        "Are you interested in Greek island-hopping experiences? (Yes/No)\nWould you like to join historical tours of ancient ruins? (Yes/No)\nDo you seek culinary experiences with traditional Greek cuisine? (Yes/No)";
      };
      case ("Thailand") {
        "Are you seeking wellness retreats and spa packages? (Yes/No)\nDo you wish to participate in guided trekking tours? (Yes/No)\nAre you interested in water sports or diving experiences? (Yes/No)";
      };
      case ("South Africa") {
        "Are you seeking luxury safari and wildlife experiences? (Yes/No)\nWould you like to join wine tasting tours in Western Cape? (Yes/No)\nAre you interested in guided city tours and cultural events? (Yes/No)";
      };
      case ("United States") {
        "Are you seeking cross-country road trips? (Yes/No)\nWould you prefer city-specific travel experiences? (Yes/No)\nDo you need advice on travel insurance for international visitors? (Yes/No)";
      };
      case (_) {
        Runtime.trap("No custom questionnaire available for this country");
      };
    };
  };
};
