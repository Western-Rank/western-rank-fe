import Review, { UserReview } from "@/components/Review";
import ReviewPrompt from "@/components/ReviewPrompt";
import { useSession } from "next-auth/react";
import { useState } from "react";

import Goose from "@/components/Goose";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/components/ui/use-toast";
import { SortKey, SortKeys, SortOrder } from "@/lib/reviews";
import { Course_ReviewsData } from "@/pages/api/reviews";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownNarrowWide, ArrowUpNarrowWide } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const TAKE_DEFAULT = 5;

interface ReviewListProps {
  courseCode: string;
}

/**
 * A component that renders all reviews for a course, a user's review
 * sorting controls, and includes the review prompt dialog for reviewing.
 */
const ReviewList = ({ courseCode }: ReviewListProps) => {
  const { data: auth } = useSession();

  const [sortKey, setSortKey] = useState<SortKey>("date_created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [take, setTake] = useState<number | undefined>(TAKE_DEFAULT);
  const queryClient = useQueryClient();
  const resetTake = () => {
    setTake(TAKE_DEFAULT);
  };

  const {
    data: reviewsData,
    isLoading,
    isError,
    isSuccess,
  } = useQuery<Course_ReviewsData>({
    queryKey: ["reviews", courseCode, sortKey, sortOrder, take],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        course_code: courseCode,
        sortKey: sortKey,
        sortOrder: sortOrder,
      });

      if (take) {
        searchParams.append("take", take.toString());
      }
      const response = await fetch(`/api/reviews?${searchParams.toString()}`);
      if (!response.ok) throw new Error("Courses were not found");
      return response.json();
    },
    refetchOnWindowFocus: false,
    onError(err: any) {
      toast({
        title: `Error loading reviews for ${courseCode}`,
        description: `${err.message.slice(0, 100) + "..." ?? ""}`,
        variant: "destructive",
      });
    },
  });

  const hasReviewed = !!auth?.user?.email && !!reviewsData && !!reviewsData.userReview;

  return (
    <div className="break-words" id="reviews">
      <h5 className="font-bold text-lg">Written Reviews ({reviewsData?._count?.review_id ?? 0})</h5>
      <div className="flex flex-col sm:flex-row gap-2 items-center sm:justify-between py-2">
        <div className="flex items-center w-full gap-2">
          <label className="min-w-fit">Sort By</label>
          <Select
            value={sortKey}
            onValueChange={(value) => {
              resetTake();
              setSortKey(value as (typeof SortKeys)[number]);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="light">
              {SortKeys.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option.split("_").join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex space-x-1">
            <Toggle
              pressed={sortOrder === "asc"}
              onPressedChange={() => {
                resetTake();
                setSortOrder("asc");
              }}
              value="asc"
            >
              <ArrowUpNarrowWide />
            </Toggle>
            <Toggle
              pressed={sortOrder === "desc"}
              onPressedChange={() => {
                resetTake();
                setSortOrder("desc");
              }}
              value="desc"
            >
              <ArrowDownNarrowWide />
            </Toggle>
          </div>
        </div>
        {!hasReviewed && isSuccess && (
          <ReviewPrompt
            courseCode={courseCode}
            onSubmitReview={() => queryClient.invalidateQueries(["reviews", courseCode])}
          />
        )}
      </div>
      <div className="flex flex-col gap-4 py-2">
        {isSuccess && hasReviewed && reviewsData?.userReview && (
          <UserReview
            review={reviewsData?.userReview}
            onEdit={() => queryClient.invalidateQueries(["reviews", courseCode])}
            onDelete={() => queryClient.invalidateQueries(["reviews", courseCode])}
          />
        )}
        {isLoading && (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </>
        )}
        {isSuccess && reviewsData?.reviews?.length > 0 && (
          <>
            {reviewsData?.reviews?.map((review) => (
              <Review
                key={review.review_id}
                review={{
                  ...review,
                  date_created: new Date(review.date_created),
                  last_edited: new Date(review.last_edited),
                  date_taken: new Date(review.date_taken),
                }}
              />
            ))}
            {take && reviewsData._count.review_id > take && (
              <Button variant="outline" onClick={() => setTake(undefined)}>
                Show all {reviewsData?._count.review_id} Reviews
              </Button>
            )}
          </>
        )}
        {isSuccess && reviewsData?.reviews?.length === 0 && (
          <div className="py-6 text-center flex flex-col items-center">
            <Goose>
              <p className="text-purple-200">
                HONK!
                <br /> {`(Translation: ${`No ${hasReviewed ? "other" : ""} written reviews yet)`})`}
              </p>
            </Goose>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewList;
