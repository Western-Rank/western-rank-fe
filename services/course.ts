import { roundToNearest } from "@/lib/utils";
import { BreadthCategories, BreadthCategoryOptions, SortKey, SortOrder } from "@/lib/courses";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const SORT_MAP_ASC = new Map<string, (a: any, b: any) => number>([
  ["liked", (a, b) => b?._count?.liked ?? 0 - a?._count?.liked ?? 0],
  ["useful", (a, b) => b?._avg?.useful ?? 0 - a?._avg?.useful ?? 0],
  ["attendance", (a, b) => b?._avg?.attendance ?? 0 - a?._avg?.attendance ?? 0],
  ["difficulty", (a, b) => b?._avg?.difficulty ?? 0 - a?._avg?.difficulty ?? 0],
]);

const SORT_MAP_DESC = new Map<string, (a: any, b: any) => number>([
  ["liked", (a, b) => a?._count?.liked ?? 0 - b?._count?.liked ?? 0],
  ["useful", (a, b) => a?._avg?.useful ?? 0 - b?._avg?.useful ?? 0],
  ["attendance", (a, b) => a?._avg?.attendance ?? 0 - b?._avg?.attendance ?? 0],
  ["difficulty", (a, b) => a?._avg?.difficulty ?? 0 - b?._avg?.difficulty ?? 0],
]);

/**
 * Search for courses stored in the database.
 * @param query Substring to match course names/codes with
 * @returns List of courses that match  the given query
 */
export function searchCourses(query: string) {
  return prisma.course.findMany({
    where: {
      OR: [{ course_code: { contains: query } }, { course_name: { contains: query } }],
    },
  });
}

type GetCoursesParams = {
  sortKey?: SortKey;
  sortOrder?: SortOrder;
  filter?: GetCoursesFilterParams;
};

type GetCoursesFilterParams = {
  hasprereqs?: boolean;
  minratings?: number;
  cat?: string;
  breadth?: BreadthCategories;
};

/**
 * Get all courses stored in the database.
 * @returns List of all courses stored in the database
 */
export async function getCourses({
  sortKey = "liked",
  sortOrder = "asc",
  filter = {
    hasprereqs: false,
    minratings: 0,
    breadth: ["A", "B", "C"],
  },
}: GetCoursesParams) {
  const catfilter: Partial<Prisma.CourseWhereInput["category"]> = {};
  if (filter.cat) catfilter.category_code = filter.cat;
  if (filter.breadth) catfilter.breadth = { hasSome: filter.breadth };

  const _courses = await prisma.course.findMany({
    select: {
      course_name: true,
      course_code: true,
    },
    orderBy: {
      course_code: sortKey === "coursecode" ? sortOrder : undefined,
    },
    where: {
      AND: [
        {
          category: catfilter,
          prerequisites_text: {
            equals: filter.hasprereqs ? undefined : [],
          },
        },
      ],
    },
  });

  const aggregates = await prisma.course_Review.groupBy({
    by: ["course_code"],
    _count: {
      liked: true,
      review_id: true,
    },
    _avg: {
      difficulty: true,
      attendance: true,
      useful: true,
    },
    having: {
      course_code: {
        in: _courses.map((course) => course.course_code),
      },
      review_id: {
        _count: {
          gte: filter.minratings,
        },
      },
    },
  });

  const aggregates_map = new Map<string, Omit<(typeof aggregates)[0], "course_code">>();
  aggregates.forEach(({ course_code, ...agg }) => {
    agg._count.liked = roundToNearest(
      ((agg?._count?.liked ?? 0) / (agg?._count?.review_id ?? 1)) * 100,
      1,
    );
    aggregates_map.set(course_code, agg);
  });

  const sort_func = sortOrder === "desc" ? SORT_MAP_DESC.get(sortKey) : SORT_MAP_ASC.get(sortKey);

  const courses = _courses.map((course) => {
    const agg = aggregates_map.get(course.course_code);
    return {
      ...course,
      ...agg,
    };
  });

  return sort_func ? courses.sort(sort_func) : courses;
}

export function getCourseCount() {
  return prisma.course.count();
}

export function getAllCoursesSearch() {
  return prisma.course.findMany({
    select: {
      course_code: true,
      course_name: true,
    },
    orderBy: {
      course_code: "asc",
    },
  });
}

/**
 * Get course by course code.
 * @param courseCode the course code of the course to fetch
 * @returns the course information stored in the database
 */
export async function getCourse(courseCode: string) {
  const course_query = prisma.course.findUnique({
    where: {
      course_code: courseCode,
    },
    include: {
      prerequisites: true,
      antirequisites: true,
      corequisites: true,
      precorequisites: true,
    },
  });

  const aggregate_query = prisma.course_Review.aggregate({
    _avg: {
      difficulty: true,
      useful: true,
      attendance: true,
    },
    _count: {
      review_id: true,
    },
    where: {
      course_code: courseCode,
    },
  });

  const count_liked_query = prisma.course_Review.count({
    where: {
      course_code: courseCode,
      liked: true,
    },
  });

  const [course, aggregate, count_liked] = await prisma.$transaction([
    course_query,
    aggregate_query,
    count_liked_query,
  ]);

  return {
    ...course,
    ...aggregate,
    count_liked,
  };
}
