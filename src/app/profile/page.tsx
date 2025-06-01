import { UserProfileClient } from "@/components/user-profile-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle } from "lucide-react";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

async function getUserProfile() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email })
    .select('-password');

  if (!user) {
    redirect('/auth/signin');
  }

  return {
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    preferences: {
      seat: user.preferences.seat || "No Preference",
      meal: user.preferences.meal || "No Preference",
      notifications: {
        flightUpdates: user.preferences.notifications.flightUpdates,
        checkInReminders: user.preferences.notifications.checkInReminders,
        promotionalOffers: user.preferences.notifications.promotionalOffers,
      },
    },
    bookingHistory: user.bookingHistory?.map((booking: {
      flightId: string;
      airline: string;
      flightNumber: string;
      origin: string;
      destination: string;
      departureTime: Date;
      arrivalTime: Date;
      duration: string;
      price: number;
      status: string;
    }) => ({
      ...booking,
      departureTime: booking.departureTime.toISOString(),
      arrivalTime: booking.arrivalTime.toISOString(),
    })) || [],
  };
}

export default async function ProfilePage() {
  const userProfile = await getUserProfile();

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <UserCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-semibold">Your Profile</CardTitle>
          </div>
          <CardDescription>Manage your personal information, travel preferences, and notification settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserProfileClient initialProfile={userProfile} />
        </CardContent>
      </Card>
    </div>
  );
}
