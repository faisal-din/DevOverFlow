import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";

const page = async () => {
  const session = await auth();

  console.log(session);
  return (
    <div>
      <h1 className="h1-bold font-inter">Welcome to DevOverFlow</h1>

      <form
        className="mt-28 px-10"
        action={async () => {
          "use server";

          await signOut({ redirectTo: ROUTES.SIGN_IN });
        }}
      >
        <Button type="submit">Logout</Button>
      </form>
    </div>
  );
};

export default page;
