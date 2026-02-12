"use server";

import { CollectionBaseParams } from "@/types/action";
import { ActionResponse, Collection, ErrorResponse, PaginatedSearchParams } from "@/types/global";
import { CollectionBaseSchema, PaginatedSearchParamsSchema } from "../validations";
import action from "../handlers/action";
import handleError from "../handlers/error";
import { CollectionModel, QuestionModel } from "@/database";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";
import mongoose, { PipelineStage } from "mongoose";

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

export async function getSavedQuestionsAction(
  params: PaginatedSearchParams
): Promise<ActionResponse<{ collections: Collection[]; isNext: boolean }>> {
  const validationResult = await action({
    params,
    schema: PaginatedSearchParamsSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const userId = validationResult.session?.user?.id;
  const { page = 1, pageSize = 10, query, filter } = validationResult.params!;

  const skip = (Number(page) - 1) * pageSize;
  const limit = pageSize;

  const sortOptions: Record<string, Record<string, 1 | -1>> = {
    mostrecent: { "question.createdAt": -1 },
    oldest: { "question.createdAt": 1 },
    mostvoted: { "question.upvotes": -1 },
    mostviewed: { "question.views": -1 },
    mostanswered: { "question.answers": -1 },
  };

  const sortCriteria = sortOptions[filter as keyof typeof sortOptions] || { "question.createdAt": -1 };

  try {
    const pipline: PipelineStage[] = [
      { $match: { author: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "questions",
          localField: "question",
          foreignField: "_id",
          as: "question",
        },
      },
      { $unwind: "$question" },
      {
        $lookup: {
          from: "users",
          localField: "question.author",
          foreignField: "_id",
          as: "question.author",
        },
      },
      { $unwind: "$question.author" },
      {
        $lookup: {
          from: "tags",
          localField: "question.tags",
          foreignField: "_id",
          as: "question.tags",
        },
      },
    ];

    if (query) {
      pipline.push({
        $match: {
          "question.title": { $regex: query, $options: "i" },
          "question.content": { $regex: query, $options: "i" },
        },
      });
    }

    const [totalCount] = await CollectionModel.aggregate([...pipline, { $count: "count" }]);

    pipline.push({ $sort: sortCriteria }, { $skip: skip }, { $limit: limit });

    pipline.push({ $project: { question: 1, author: 1 } });

    const questions = await CollectionModel.aggregate(pipline);

    const isNext = totalCount.count > page * questions.length;

    return {
      success: true,
      data: {
        collections: JSON.parse(JSON.stringify(questions)),
        isNext,
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
