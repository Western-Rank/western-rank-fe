import { Course, Course_Review } from "@prisma/client";
import { GetServerSideProps } from "next";
import Navbar from "../../components/Navbar";
import ReviewList from "../../components/ReviewList";
import { getCourse } from "../../services/course";
import { getReviewsbyCourse } from "../../services/review";
import { Separator } from "@/components/ui/separator";
import useShowMore from "@/hooks/useShowMore";
import { Button } from "@/components/ui/button";

/**
 * Course review page for the given course_code
 */
const testReviews: Course_Review[] = [
  {
    review_id: 1,
    course_code: "AAAA 1000",
    professor: "Professor A",
    review: "An amazing adult awesomely aggregrating addictive assignments",
    email: "a@awwscar.ca",
    difficulty: 1,
    liked: true,
    attendance: 11,
    enthusiasm: 24,
    anon: false,
    date_created: new Date("2020-06-19"),
    last_edited: new Date("2021-06-19"),
    term_taken: "Fall",
    date_taken: new Date(),
  },
  {
    review_id: 2,
    course_code: "BBBB 2222",
    professor: "Professor B",
    review: "Bad, barely beautiful, boring. BAD!",
    email: "b@bing.com",
    difficulty: 10,
    liked: false,
    attendance: 22,
    enthusiasm: 30,
    anon: true,
    date_created: new Date("2022-09-19"),
    last_edited: new Date("2022-10-19"),
    term_taken: "Winter",
    date_taken: new Date(),
  },
];

interface CourseProps {
  reviews: Course_Review[]; // all course reviews for this course
  course: Course; // the course information for the course displayed on this page
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // provided by the dynamic route, e.g. /course/CALC1000
  const { course_code } = context.params as { course_code: string };

  const course = await getCourse(course_code);
  if (!course)
    return {
      notFound: true,
    };

  // TODO consider lazy loading reviews on client side with react query
  const reviews = (await getReviewsbyCourse(course_code)) || [];

  return {
    props: {
      reviews,
      course,
    } as Partial<CourseProps>,
  };
};

const Course = ({ reviews, course }: CourseProps) => {
  const [course_description, isExpanded, toggleExpand] = useShowMore({
    text: course?.description ?? "",
    maxLength: 200,
  });

  return (
    <>
      <main className="light bg-background text-primary">
        <Navbar searchBar className="dark z-1" />
        <div className="flex flex-col light">
          <div className="py-4 pt-16 bg-background dark relative">
            <div className="h-40 w-[40vw] absolute bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-blue-800 via-purple-800 to-background bottom-0 left-0 blur-2xl opacity-25"></div>
            <h4 className="px-4 md:px-8 lg:px-15 xl:px-40 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-blue-800 py-1">
              {course.course_code}
            </h4>
            <h5 className="px-4 md:px-8 lg:px-15 xl:px-40 text-xl text-primary">
              {course.course_name}
            </h5>
          </div>

          <div className="py-8 px-4 md:px-8 lg:px-15 xl:px-40 ">
            <p className="text-primary flex flex-col">
              {course_description}
              {isExpanded != undefined && (
                <Button
                  variant="link"
                  className="px-1 pt-4 my-0 h-2 self-end"
                  onClick={toggleExpand}
                >
                  Show {!isExpanded ? "More" : "Less"}
                </Button>
              )}
            </p>
          </div>

          <div className="px-4 md:px-8 lg:px-15 xl:px-40">
            <Separator className="border-primary" />
          </div>

          <div className="px-4 md:px-8 lg:px-15 xl:px-40 flex-grow flex flex-col-reverse gap-4 lg:gap-6 lg:flex-row py-6">
            <div className="flex-grow lg:max-w-[75vw]">
              <ReviewList courseCode={course.course_code} reviews={testReviews} />
            </div>

            <Separator orientation="vertical" className="w-[1px] h-200" />

            <div className="lg:w-96 flex flex-col gap-4">
              <div>
                <h5 className="text-lg font-semibold">Prerequisites</h5>
                <p>{course?.prerequisites || "None"}</p>
              </div>
              <div>
                <h5 className="text-lg font-semibold">Antirequisites</h5>
                <p>{course?.antirequisites || "None"}</p>
              </div>
              <div>
                <h5 className="text-lg font-semibold">Extra Info</h5>
                <p>{course?.extra_info || "None"}</p>
              </div>
              <div>
                <h5 className="text-lg font-semibold">Locations</h5>
                <p>{course.location?.replace(",", ", ") || ""}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Course;
