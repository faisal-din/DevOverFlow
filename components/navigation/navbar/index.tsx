import Image from "next/image";
import Link from "next/link";
import Theme from "./Theme";
import MobileNavigation from "./MobileNavigation";
import UserAvatar from "@/components/UserAvatar";
import { auth } from "@/auth";
import GlobalSearch from "@/components/search/GlobalSearch";
import ROUTES from "@/constants/routes";

const Navbar = async () => {
  const session = await auth();

  return (
    <nav className="flex-between background-light900_dark200 shadow-light-300 fixed z-50 w-full gap-5 p-6 sm:px-12 dark:shadow-none">
      <Link href={ROUTES.HOME} className="flex items-center gap-1">
        <Image src="/images/site-logo.svg" width={23} height={23} alt="Dev overFlow Logo" />

        <p className="h2-bold font-space-grotesk text-dark-100 dark:text-light-900 max-sm:hidden">
          Dev<span className="text-primary-500">OverFlow</span>
        </p>
      </Link>

      <GlobalSearch />

      <div className="flex-between gap-5">
        <Theme />

        {session?.user?.id && (
          <UserAvatar id={session.user.id} name={session.user.name} imageUrl={session.user?.image} />
        )}

        <MobileNavigation />
      </div>
    </nav>
  );
};

export default Navbar;
