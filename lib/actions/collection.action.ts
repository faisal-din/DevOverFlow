"use server";

import { CollectionBaseParams } from "@/types/action";
import { ActionResponse, ErrorResponse } from "@/types/global";
import { CollectionBaseSchema } from "../validations";
import action from "../handlers/action";
import handleError from "../handlers/error";
import { CollectionModel, QuestionModel } from "@/database";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";

export async function toggleSaveQuestionAction(
  params: CollectionBaseParams
): Promise<ActionResponse<{ saved: boolean }>> {
  const validationResult = await action({
    params,
    schema: CollectionBaseSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;
  const userId = validationResult.session?.user?.id;

  try {
    const question = await QuestionModel.findById(questionId);
    if (!question) throw new Error("Question not found");

    const collection = await CollectionModel.findOne({
      question: questionId,
      author: userId,
    });

    if (collection) {
      await CollectionModel.findByIdAndDelete(collection.id);

      revalidatePath(ROUTES.QUESTION(questionId));

      return {
        success: true,
        data: {
          saved: false,
        },
      };
    }

    await CollectionModel.create({
      question: questionId,
      author: userId,
    });

    revalidatePath(ROUTES.QUESTION(questionId));

    return {
      success: true,
      data: {
        saved: true,
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function hasSavedQuestionAction(
  params: CollectionBaseParams
): Promise<ActionResponse<{ saved: boolean }>> {
  const validationResult = await action({
    params,
    schema: CollectionBaseSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;
  const userId = validationResult.session?.user?.id;

  try {
    const collection = await CollectionModel.findOne({
      question: questionId,
      author: userId,
    });

    return {
      success: true,
      data: {
        saved: !!collection, // Convert to boolean to indicate if the question is saved or not
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
