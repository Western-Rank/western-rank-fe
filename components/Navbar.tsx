import { CourseSearchItem, SearchbarDialog } from "@/components/Searchbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

type NavbarProps = {
  searchBar?: boolean;
  className?: string;
  courses: CourseSearchItem[];
};

const Navbar = ({ courses, className, searchBar }: NavbarProps) => {
  const { data: auth } = useSession();

  return (
    <nav
      className={cn(
        "bg-background flex items-center justify-between px-4 md:px-8 lg:px-15 xl:px-40",
        className,
      )}
    >
      <Link href="/" className="p-2 flex flex-col items-center">
        <Image src="/logo.svg" alt="logo" width={42} height={30} />
        <span className="text-primary font-extrabold text-sm">Rank</span>
      </Link>
      <div className="flex items-center">
        {searchBar ? <SearchbarDialog courses={courses} /> : ""}
        {auth?.user ? (
          <>
            <Button asChild variant="link" className="px-1 md:px-2">
              <Link href="/profile" className="text-sm">
                Profile
              </Link>
            </Button>
            <Button asChild variant="link" className="px-1 md:px-2s">
              {/* TODO change to onclick with signout() */}
              <Link href="/api/auth/signout" className="text-sm">
                Log out
              </Link>
            </Button>
          </>
        ) : (
          <Button asChild variant="link" className="px-1">
            <Link href="/api/auth/signin" className="text-sm">
              Log in
            </Link>
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
