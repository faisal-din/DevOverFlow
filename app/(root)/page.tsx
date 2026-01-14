import { auth } from "@/auth";

const Home = async () => {
  const session = await auth();

  return (
    <>
      <h1 className="">Welcome to the world of Next.js</h1>
    </>
  );
};

export default Home;
