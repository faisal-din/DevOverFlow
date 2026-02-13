import ROUTES from "@/constants/routes";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import TagCard from "../cards/TagCard";
import { getHotQuestionsAction } from "@/lib/actions/question.action";
import DataRenderer from "../DataRenderer";
import { getTopTagsAction } from "@/lib/actions/tag.action";

// const hotQuestions = [
//   { _id: "1", title: "How to create a custom hook in React?" },
//   { _id: "2", title: "How to use React Query?" },
//   { _id: "3", title: "How to use Redux?" },
//   { _id: "4", title: "How to use React Router?" },
//   { _id: "5", title: "How to use React Context?" },
// ];

// const popularTags = [
//   { _id: "1", name: "react", questions: 100 },
//   { _id: "2", name: "javascript", questions: 200 },
//   { _id: "3", name: "typescript", questions: 150 },
//   { _id: "4", name: "nextjs", questions: 50 },
//   { _id: "5", name: "react-query", questions: 75 },
// ];

const RightSidebar = async () => {
  const [{ success, data: hotQuestions, error }, { success: tagSuccess, data: tags, error: tagError }] =
    await Promise.all([getHotQuestionsAction(), getTopTagsAction()]);

  return (
    <section className="custom-scrollbar background-light900_dark200 light-border shadow-light-300 sticky top-0 right-0 flex h-screen w-[350px] flex-col gap-6 overflow-y-auto border-l p-6 pt-36 max-xl:hidden dark:shadow-none">
      <div>
        <h3 className="h3-bold text-dark200_light900">Top Questions</h3>

        <DataRenderer
          success={success}
          data={hotQuestions}
          error={error}
          empty={{
            title: "No Questions Found.",
            message: "No questions have been asked yet.",
          }}
          render={(hotQuestions) => (
            <div className="mt-7 flex w-full flex-col gap-[30px]">
              {hotQuestions.map(({ _id, title }) => (
                <Link
                  key={_id}
                  href={ROUTES.QUESTION(_id)}
                  className="flex cursor-pointer items-center justify-between gap-7"
                >
                  <p className="body-medium text-dark500_light700 line-clamp-2">{title}</p>

                  <Image
                    src="/icons/chevron-right.svg"
                    alt="Chevron"
                    width={20}
                    height={20}
                    className="invert-colors"
                  />
                </Link>
              ))}
            </div>
          )}
        />
      </div>

      <div className="mt-16">
        <h3 className="h3-bold text-dark200_light900">Popular Tags</h3>

        <DataRenderer
          data={tags}
          success={tagSuccess}
          error={tagError}
          empty={{
            title: "No tags found",
            message: "No tags have been created yet.",
          }}
          render={(tags) => (
            <div className="mt-7 flex flex-col gap-4">
              {tags.map(({ _id, name, questions }) => (
                <TagCard key={_id} _id={_id} name={name} questions={questions} showCount compact />
              ))}
            </div>
          )}
        />
      </div>
    </section>
  );
};

export default RightSidebar;
