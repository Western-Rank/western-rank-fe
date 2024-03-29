import { prisma } from "@/lib/db";

export type UserWithCourseReviews = ReturnType<typeof getUserByEmail>;

/**
 * Get a user by their email
 * @param email email of the user
 * @returns The user object in the database
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    include: {
      Course_Review: true,
    },
    where: {
      email,
    },
  });
}

export async function deleteUserByEmail(email: string) {
  return prisma.user.delete({
    where: {
      email: email,
    },
  });
}
