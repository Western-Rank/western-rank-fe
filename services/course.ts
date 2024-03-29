import { CourseSearchItem } from "@/components/Searchbar";
import { BreadthCategories, SORT_MAP_ASC, SORT_MAP_DESC, SortKey, SortOrder } from "@/lib/courses";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Search for courses stored in the database.
 * @param query Substring to match course names/codes with
 * @returns List of courses that match the given query
 */
export function searchCourses(query: string) {
  return prisma.course.findMany({
    where: {
      OR: [{ course_code: { contains: query } }, { course_name: { contains: query } }],
    },
  });
}

export type GetCoursesParams = {
  sortKey?: SortKey;
  sortOrder?: SortOrder;
  pageSize?: number;
  cursor?: number;
} & GetCoursesFilterParams;

type GetCoursesFilterParams = {
  noprereqs?: boolean;
  minratings?: number;
  cat?: string;
  breadth?: BreadthCategories;
};

export type ExploreCourse = {
  _count?:
    | {
        liked: number;
        review_id: number;
      }
    | undefined;
  _avg?:
    | {
        difficulty: number | null;
        attendance: number | null;
        useful: number | null;
      }
    | undefined;
  rank: number;
} & CourseSearchItem;

// export type ExploreCourse = Omit<Course, "precorequisites">;

type GetCoursesServiceReturn = {
  courses: ExploreCourse[];
  length: number;
};

/**
 * Get all courses stored in the database.
 * @returns List of all courses stored in the database, total amount of courses.
 */
export async function getCourses({
  sortKey = "liked",
  sortOrder = "asc",
  breadth = ["A", "B", "C"],
  minratings = 0,
  pageSize = 20,
  cursor = 0,
  noprereqs,
  cat,
}: GetCoursesParams): Promise<GetCoursesServiceReturn> {
  const categoryFilters: Partial<Prisma.CourseWhereInput["category"]> = {};
  if (cat) categoryFilters.category_code = { equals: cat };
  if (breadth) categoryFilters.breadth = { hasSome: breadth };

  const prereqFilters: Partial<Prisma.CourseWhereInput["prerequisites_text"]> = {};
  if (noprereqs) prereqFilters.equals = [];

  const _courses = await prisma.course.findMany({
    select: {
      course_name: true,
      course_code: true,
    },
    orderBy: {
      course_code: sortOrder,
    },
    where: {
      AND: [
        {
          category: categoryFilters,
          prerequisites_text: prereqFilters,
        },
      ],
    },
  });

  const course_liked = await prisma.course_Review.groupBy({
    by: ["course_code"],
    _count: {
      liked: true,
    },
    where: {
      liked: {
        equals: true,
      },
    },
    having: {
      course_code: {
        in: _courses.map((course) => course.course_code),
      },
      review_id: {
        _count: {
          gte: minratings,
        },
      },
    },
  });

  console.log(course_liked);

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
          gte: minratings,
        },
      },
    },
  });

  const aggregates_map = new Map<string, Omit<(typeof aggregates)[0], "course_code">>();
  const isFilteringAggregates = minratings !== 0; // add difficulty, attendance, useful, liked

  // console.log(aggregates);

  aggregates.forEach(({ course_code, ...agg }) => {
    agg._count.liked = 0;
    aggregates_map.set(course_code, agg);
  });

  course_liked.forEach(({ course_code, ...course_liked }) => {
    const count_agg = aggregates_map.get(course_code)?._count;
    if (count_agg) {
      count_agg.liked = ((course_liked._count.liked ?? 0) / (count_agg.review_id ?? 1)) * 100;
    }
  });

  console.log(aggregates_map);

  const sort_func = sortOrder === "desc" ? SORT_MAP_DESC.get(sortKey) : SORT_MAP_ASC.get(sortKey);

  const courses = (
    !isFilteringAggregates
      ? _courses
      : _courses.filter((course) => aggregates_map.has(course.course_code))
  ).map((course) => {
    return {
      ...course,
      ...aggregates_map.get(course.course_code),
    };
  });

  if (sort_func) {
    courses.sort(sort_func);
  }

  return {
    courses: courses
      .slice(cursor, cursor + pageSize)
      .map((c, idx) => ({ ...c, rank: cursor + idx + 1 })),
    length: courses.length,
  };
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

export async function getCourseCategories() {
  return prisma.category.findMany({
    select: {
      category_code: true,
    },
  });
}
