"use client";

import { formatNumber } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface Params {
  upvotes: number;
  hasUpVoted: boolean;
  downvotes: number;
  hasDownVoted: boolean;
}

const Votes = ({ upvotes, hasUpVoted, downvotes, hasDownVoted }: Params) => {
  const session = useSession();
  const userId = session.data?.user?.id;

  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!userId)
      return toast("Please login ", {
        description: "Only logged-in users can vote.",
      });

    setIsLoading(true);

    try {
      const successMessage =
        voteType === "upvote"
          ? `Upvote ${!hasUpVoted ? "added" : "removed"} successfully`
          : `Downvote ${!hasDownVoted ? "added" : "removed"} successfully`;

      toast(successMessage, {
        description: "Your vote has been recorded.",
      });
    } catch {
      toast("Failed to vote", {
        description: "An error occurred while voting. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-center gap-2.5">
      <div className="flex-center gap-1.5">
        <Image
          src={hasUpVoted ? "/icons/upvoted.svg" : "/icons/upvote.svg"}
          width={18}
          height={18}
          alt="upvote"
          className={`cursor-pointer ${isLoading && "opacity-50"}`}
          aria-label="Upvote"
          onClick={() => !isLoading && handleVote("upvote")}
        />

        <div className="flex-center background-light700_dark400 min-w-5 rounded-sm p-1">
          <p className="subtle-medium text-dark400_light900">{formatNumber(upvotes)}</p>
        </div>
      </div>

      <div className="flex-center gap-1.5">
        <Image
          src={hasDownVoted ? "/icons/downvoted.svg" : "/icons/downvote.svg"}
          width={18}
          height={18}
          alt="downvote"
          className={`cursor-pointer ${isLoading && "opacity-50"}`}
          aria-label="Downvote"
          onClick={() => !isLoading && handleVote("downvote")}
        />

        <div className="flex-center background-light700_dark400 min-w-5 rounded-sm p-1">
          <p className="subtle-medium text-dark400_light900">{formatNumber(downvotes)}</p>
        </div>
      </div>
    </div>
  );
};

export default Votes;
