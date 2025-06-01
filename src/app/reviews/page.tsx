import { FlightReviewCard } from "@/components/flight-review-card";
import { FlightReviewForm } from "@/components/flight-review-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, MessageSquare } from "lucide-react";
import connectDB from "@/lib/db";
import { Review } from "@/models/Review";

async function getReviews() {
  await connectDB();
  const reviews = await Review.find()
    .sort({ date: -1 })
    .populate('userId', 'name email')
    .limit(50);
  
  return reviews.map(review => ({
    id: review._id.toString(),
    airline: review.airline,
    flightNumber: review.flightNumber,
    rating: review.rating,
    comment: review.comment,
    userName: review.userId.name,
    date: review.date.toISOString(),
  }));
}

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
           <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-semibold">Share Your Experience</CardTitle>
          </div>
          <CardDescription>
            Help other travelers by leaving a review for your recent flights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FlightReviewForm />
        </CardContent>
      </Card>

      <Separator />

      <div>
        <div className="flex items-center gap-3 mb-6">
            <Star className="h-7 w-7 text-accent" />
            <h2 className="text-2xl font-semibold text-foreground">Recent Flight Reviews</h2>
        </div>
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <FlightReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-10">
            <CardContent>
              <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
