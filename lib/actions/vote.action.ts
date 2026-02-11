"use server";

import mongoose, { ClientSession } from "mongoose";
import { AnswerModel, QuestionModel, VoteModel } from "@/database";

import { CreateVoteParams, HasVotedParams, HasVotedResponse, UpdateVoteCountParams } from "@/types/action";
import action from "../handlers/action";

import handleError from "../handlers/error";
import { ActionResponse, ErrorResponse } from "@/types/global";
import { CreateVoteSchema, HasVotedSchema, UpdateVoteCountSchema } from "../validations";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";

export async function updateVoteCountAction(
  params: UpdateVoteCountParams,
  session?: ClientSession
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: UpdateVoteCountSchema,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { targetId, targetType, voteType, change } = validationResult.params!;

  const Model = targetType === "question" ? QuestionModel : AnswerModel;
  const voteField = voteType === "upvote" ? "upvotes" : "downvotes";

  try {
    const result = await Model.findByIdAndUpdate({ _id: targetId }, { $inc: { [voteField]: change } }, { session });

    if (!result) return handleError(new Error("Failed to update vote count")) as ErrorResponse;

    return { success: true };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function CreateVoteAction(params: CreateVoteParams): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: CreateVoteSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { targetId, targetType, voteType } = validationResult.params!;
  const userId = validationResult.session?.user?.id;

  if (!userId) handleError(new Error("Unauthorized")) as ErrorResponse;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingVote = await VoteModel.findOne({
      author: userId,
      actionId: targetId,
      actionType: targetType,
    }).session(session);

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // If the user has already voted with the same voteType, remove the vote
        await VoteModel.deleteOne({ _id: existingVote._id }).session(session);
        await updateVoteCountAction({ targetId, targetType, voteType, change: -1 }, session);
      } else {
        // If the user has already voted with a different voteType, update the vote
        await VoteModel.findByIdAndUpdate(existingVote._id, { voteType }, { new: true, session });
        await updateVoteCountAction({ targetId, targetType, voteType, change: 1 }, session);
      }
    } else {
      // If the user has not voted yet, create a new vote
      await VoteModel.create(
        [
          {
            author: userId,
            actionId: targetId,
            actionType: targetType,
            voteType,
          },
        ],
        {
          session,
        }
      );
      await updateVoteCountAction({ targetId, targetType, voteType, change: 1 }, session);
    }

    await session.commitTransaction();
    session.endSession();

    revalidatePath(ROUTES.QUESTION(targetId));

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return handleError(error) as ErrorResponse;
  }
}

export async function hasVotedAction(params: HasVotedParams): Promise<ActionResponse<HasVotedResponse>> {
  const validationResult = await action({
    params,
    schema: HasVotedSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { targetId, targetType } = validationResult.params!;
  const userId = validationResult.session?.user?.id;

  try {
    const vote = await VoteModel.findOne({
      author: userId,
      actionId: targetId,
      actionType: targetType,
    });
    if (!vote) {
      return { success: false, data: { hasUpvoted: false, hasDownvoted: false } };
    }

    const hasUpvoted = vote?.voteType === "upvote";
    const hasDownvoted = vote?.voteType === "downvote";

    return { success: true, data: { hasUpvoted, hasDownvoted } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
