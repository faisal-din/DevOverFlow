import { auth } from "@/auth";
import ProfileForm from "@/components/forms/ProfileForm";
import ROUTES from "@/constants/routes";
import { getUserByIdAction } from "@/lib/actions/user.action";
import { User } from "@/types/global";
import { redirect } from "next/navigation";
import React from "react";

const Page = async () => {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.SIGN_IN);

  const { success, data } = await getUserByIdAction({ userId: session.user.id });
  if (!success) redirect(ROUTES.SIGN_IN);

  console.log({
    userdata: data,
  });

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Edit Profile</h1>

      <ProfileForm user={data?.user as User} />
    </>
  );
};

export default Page;
