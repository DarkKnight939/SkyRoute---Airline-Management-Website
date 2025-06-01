"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, Clock, Plane, Calendar } from "lucide-react";
import Link from "next/link";

interface Flight {
  id: string;
  itineraries: Array<{
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
    }>;
  }>;
  price: {
    total: string;
    currency: string;
  };
}

export default function FlightDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const flightId = params.id;

  const flightData = searchParams.get('data');
  const flight = flightData ? JSON.parse(decodeURIComponent(flightData)) : null;

  if (!flight) {
    return (
      <div className="container mx-auto py-8">
        <p>Flight information not found. Please try searching again.</p>
        <Link href="/flight-search">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/flight-search">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Flight Details</CardTitle>
            <CardDescription>Review your flight information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Flight Route */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{flight.itineraries[0].segments[0].departure.iataCode}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(flight.itineraries[0].segments[0].departure.at), 'HH:mm')}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <Plane className="h-6 w-6 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">Direct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{flight.itineraries[0].segments[0].arrival.iataCode}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(flight.itineraries[0].segments[0].arrival.at), 'HH:mm')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {flight.price.currency} {flight.price.total}
                </div>
                <div className="text-sm text-muted-foreground">Total Price</div>
              </div>
            </div>

            {/* Flight Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Flight Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Flight Number</div>
                      <div className="text-sm text-muted-foreground">
                        {flight.itineraries[0].segments[0].carrierCode} {flight.itineraries[0].segments[0].number}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Duration</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(
                          (new Date(flight.itineraries[0].segments[0].arrival.at).getTime() -
                            new Date(flight.itineraries[0].segments[0].departure.at).getTime()) /
                            (1000 * 60 * 60)
                        )}h
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Date</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(flight.itineraries[0].segments[0].departure.at), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Airport Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-medium">Departure</div>
                    <div className="text-sm text-muted-foreground">
                      Terminal {flight.itineraries[0].segments[0].departure.terminal}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Arrival</div>
                    <div className="text-sm text-muted-foreground">
                      Terminal {flight.itineraries[0].segments[0].arrival.terminal}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Button */}
            <Button className="w-full" size="lg">
              Proceed to Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}