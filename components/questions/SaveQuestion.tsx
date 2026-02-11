"use client";

import { toggleSaveQuestionAction } from "@/lib/actions/collection.action";
import { ActionResponse } from "@/types/global";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { use, useState } from "react";
import { toast } from "sonner";

const SaveQuestion = ({
  questionId,
  hasSavedQuestionPromise,
}: {
  questionId: string;
  hasSavedQuestionPromise: Promise<ActionResponse<{ saved: boolean }>>;
}) => {
  const session = useSession();
  const userId = session?.data?.user?.id;

  const { data } = use(hasSavedQuestionPromise);

  const { saved: hasSaved } = data || {};
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (isLoading) return;
    if (!userId)
      return toast("You need to be logged in to save a question", {
        style: {
          background: "red",
        },
      });

    setIsLoading(true);

    try {
      const { success, data, error } = await toggleSaveQuestionAction({ questionId });

      if (!success) throw new Error(error?.message || "An error occurred");

      toast.success(`Question ${data?.saved ? "saved" : "unsaved"} successfully`);
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "An error occurred",
        style: {
          background: "red",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Image
      src={hasSaved ? "/icons/star-filled.svg" : "/icons/star-red.svg"}
      width={18}
      height={18}
      alt="save"
      className={`cursor-pointer ${isLoading && "opacity-50"}`}
      aria-label="Save question"
      onClick={handleSave}
    />
  );
};

export default SaveQuestion;
