import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { globalSearchAction } from "@/lib/actions/search.action";
import { toast } from "sonner";
import { GlobalSearchedItem } from "@/types/global";

import { ReloadIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import Image from "next/image";
import GlobalFilter from "./filters/GlobalFilter";

const GlobalSearchResult = () => {
  const searchParams = useSearchParams();

  const [result, setResult] = useState([]);
  const [isLoading, setLoading] = useState(true);

  const global = searchParams.get("global");
  const type = searchParams.get("type");

  useEffect(() => {
    const fetchResult = async () => {
      setResult([]);
      setLoading(true);

      try {
        const res = await globalSearchAction({
          query: global as string,
          type,
        });

        setResult(res.data);
      } catch (error) {
        toast.error("Failed to fetch global search results", {
          description: (error as Error).message || "Failed to fetch global search results, please try again later.",
          style: {
            backgroundColor: "#FF4D4F",
            color: "#FFFFFF",
          },
        });
        console.log(error);
        setResult([]);
      } finally {
        setLoading(false);
      }
    };

    if (global) {
      fetchResult();
    }
  }, [global, type]);

  const renderLink = (type: string, id: string) => {
    switch (type) {
      case "question":
        return `/questions/${id}`;
      case "answer":
        return `/questions/${id}`;
      case "user":
        return `/profile/${id}`;
      case "tag":
        return `/tags/${id}`;
      default:
        return "/";
    }
  };

  return (
    <div className="bg-light-800 dark:bg-dark-400 absolute top-full z-10 mt-3 w-full rounded-xl py-5 shadow-sm">
      <GlobalFilter />
      <div className="bg-light-700/50 dark:bg-dark-500/50 my-5 h-[1px]" />

      <div className="space-y-5">
        <p className="text-dark400_light900 paragraph-semibold px-5">Top Match</p>

        {isLoading ? (
          <div className="flex-center flex-col px-5">
            <ReloadIcon className="text-primary-500 my-2 h-10 w-10 animate-spin" />
            <p className="text-dark200_light800 body-regular">Browsing the whole database..</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {result?.length > 0 ? (
              result?.map((item: GlobalSearchedItem, index) => (
                <Link
                  href={renderLink(item.type, item.id)}
                  key={item.type + item.id + index}
                  className="hover:bg-light-700/50 dark:hover:bg-dark-500/50 flex w-full cursor-pointer items-start gap-3 px-5 py-2.5"
                >
                  <Image
                    src="/icons/tag.svg"
                    alt="tags"
                    width={18}
                    height={18}
                    className="invert-colors mt-1 object-contain"
                  />

                  <div className="flex flex-col">
                    <p className="body-medium text-dark200_light800 line-clamp-1">{item.title}</p>
                    <p className="text-light400_light500 small-medium mt-1 font-bold capitalize">{item.type}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex-center flex-col px-5">
                <p className="text-5xl">🫣</p>
                <p className="text-dark200_light800 body-regular px-5 py-2.5">Oops, no results found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearchResult;
