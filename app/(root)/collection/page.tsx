import { auth } from "@/auth";
import QuestionCard from "@/components/cards/QuestionCard";
import DataRenderer from "@/components/DataRenderer";
import CommonFilters from "@/components/filters/CommonFilters";
import Pagination from "@/components/Pagination";
import LocalSearch from "@/components/search/LocalSearch";
import { CollectionFilters } from "@/constants/filters";
import ROUTES from "@/constants/routes";
import { EMPTY_COLLECTIONS } from "@/constants/states";
import { getSavedQuestionsAction } from "@/lib/actions/collection.action";
import { RouteParams } from "@/types/global";
import { redirect } from "next/navigation";
import React from "react";

const CollectionPage = async ({ searchParams }: RouteParams) => {
  const { page, pageSize, query, filter } = await searchParams;

  const { success, data, error } = await getSavedQuestionsAction({
    page: Number(page) || 1,
    pageSize: Number(pageSize) || 10,
    query,
    filter,
  });

  const loggedInUser = await auth();

  if (!loggedInUser) {
    redirect(ROUTES.SIGN_IN);
  }

  const { collection, isNext } = data || {};

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Saved Questions</h1>

      <div className="mt-11 flex justify-between gap-5 max-sm:flex-col sm:items-center">
        <LocalSearch
          route={ROUTES.COLLECTION}
          iconPosition="left"
          imgSrc="/icons/search.svg"
          placeholder="Search amazing minds here..."
          otherClasses="flex-1"
        />

        <CommonFilters filters={CollectionFilters} otherClasses="min-h-[56px] sm:min-w-[170px]" />
      </div>

      <DataRenderer
        success={success}
        error={error}
        data={collection}
        empty={EMPTY_COLLECTIONS}
        render={(collection) => (
          <div className="mt-10 flex w-full flex-col gap-6">
            {collection.map((item) => (
              <QuestionCard key={item._id} question={item.question} />
            ))}
          </div>
        )}
      />

      <Pagination page={page} isNext={isNext || false} />
    </>
  );
};

export default CollectionPage;
