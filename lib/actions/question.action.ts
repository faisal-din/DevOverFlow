"use server";

import mongoose, { FilterQuery } from "mongoose";

import action from "../handlers/action";
import {
  AskQuestionSchema,
  EditQuestionSchema,
  GetQuestionSchema,
  IncrementViewsSchema,
  PaginatedSearchParamsSchema,
} from "../validations";

import type { ActionResponse, ErrorResponse, PaginatedSearchParams, Question } from "@/types/global";
import handleError from "../handlers/error";

import QuestionModel, { IQuestionDoc } from "@/database/question.model";
import TagModel, { ITagDoc } from "@/database/tag.model";
import TagQuestionModel from "@/database/tag-question.model";
import { createQuestionParams, EditQuestionParams, GetQuestionParams, IncrementViewsParams } from "@/types/action";
import dbConnect from "../mongoose";

export async function createQuestionAction(params: createQuestionParams): Promise<ActionResponse<Question>> {
  const validationResult = await action({
    params,
    schema: AskQuestionSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { title, content, tags } = validationResult.params!;
  const userId = validationResult?.session?.user?.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [question] = await QuestionModel.create([{ title, content, author: userId }], { session });

    if (!question) {
      throw new Error("Failed to create question");
    }

    const tagIds: mongoose.Types.ObjectId[] = [];
    const tagQuestionDocuments = [];

    for (const tag of tags) {
      const existingTag = await TagModel.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${tag}$`, "i") } },
        { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
        { upsert: true, new: true, session }
      );

      tagIds.push(existingTag._id);
      tagQuestionDocuments.push({
        tag: existingTag._id,
        question: question._id,
      });
    }

    await TagQuestionModel.insertMany(tagQuestionDocuments, { session });

    await QuestionModel.findByIdAndUpdate(question._id, { $push: { tags: { $each: tagIds } } }, { session });

    await session.commitTransaction();

    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    session.endSession();
  }
}

export async function editQuestionAction(params: EditQuestionParams): Promise<ActionResponse<IQuestionDoc>> {
  const validationResult = await action({
    params,
    schema: EditQuestionSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { title, content, tags, questionId } = validationResult.params!;
  const userId = validationResult?.session?.user?.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const question = await QuestionModel.findById(questionId).populate("tags");

    if (!question) {
      throw new Error("Question not found");
    }

    if (question.author.toString() !== userId) {
      throw new Error("Unauthorized");
    }

    if (question.title !== title || question.content !== content) {
      question.title = title;
      question.content = content;
      await question.save({ session });
    }

    const tagsToAdd = tags.filter(
      (tag) => !question.tags.some((t: ITagDoc) => t.name.toLowerCase().includes(tag.toLowerCase()))
    );

    const tagsToRemove = question.tags.filter(
      (tag: ITagDoc) => !tags.some((t) => t.toLowerCase() === tag.name.toLowerCase())
    );

    const newTagDocuments = [];

    if (tagsToAdd.length > 0) {
      for (const tag of tagsToAdd) {
        const existingTag = await TagModel.findOneAndUpdate(
          { name: { $regex: `^${tag}$`, $options: "i" } },
          { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
          { upsert: true, new: true, session }
        );

        if (existingTag) {
          newTagDocuments.push({
            tag: existingTag._id,
            question: questionId,
          });

          question.tags.push(existingTag._id);
        }
      }
    }

    if (tagsToRemove.length > 0) {
      const tagIdsToRemove = tagsToRemove.map((tag: ITagDoc) => tag._id);

      await TagModel.updateMany({ _id: { $in: tagIdsToRemove } }, { $inc: { questions: -1 } }, { session });

      await TagQuestionModel.deleteMany({ tag: { $in: tagIdsToRemove }, question: questionId }, { session });

      question.tags = question.tags.filter(
        (tag: mongoose.Types.ObjectId) => !tagIdsToRemove.some((id: mongoose.Types.ObjectId) => id.equals(tag._id))
      );
    }

    if (newTagDocuments.length > 0) {
      await TagQuestionModel.insertMany(newTagDocuments, { session });
    }

    await question.save({ session });
    await session.commitTransaction();

    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export async function getQuestionAction(params: GetQuestionParams): Promise<ActionResponse<Question>> {
  const validationResult = await action({
    params,
    schema: GetQuestionSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;

  try {
    const question = await QuestionModel.findById(questionId).populate("tags").populate("author", "_id name image");

    if (!question) {
      throw new Error("Question not found");
    }

    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function getAllQuestionsAction(
  params: PaginatedSearchParams
): Promise<ActionResponse<{ questions: Question[]; isNext: boolean }>> {
  const validationResult = await action({
    params,
    schema: PaginatedSearchParamsSchema,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { page = 1, pageSize = 10, query, filter } = params;
  const skip = (Number(page) - 1) * pageSize;
  const limit = Number(pageSize);

  const filterQuery: FilterQuery<typeof QuestionModel> = {};

  if (filter === "recommended") {
    return { success: true, data: { questions: [], isNext: false } };
  }

  if (query) {
    filterQuery.$or = [{ title: { $regex: new RegExp(query, "i") } }, { content: { $regex: new RegExp(query, "i") } }];
  }

  let sortCriteria = {};

  switch (filter) {
    case "newest":
      sortCriteria = { createdAt: -1 };
      break;
    case "unanswered":
      filterQuery.answers = 0;
      sortCriteria = { createdAt: -1 };
      break;
    case "popular":
      sortCriteria = { upvotes: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }
  try {
    const totalQuestions = await QuestionModel.countDocuments(filterQuery);

    const questions = await QuestionModel.find(filterQuery)
      .populate("tags", "name")
      .populate("author", "name image")
      .lean()
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

    const isNext = totalQuestions > skip + questions.length;

    return {
      success: true,
      data: { questions: JSON.parse(JSON.stringify(questions)), isNext },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function incrementViewsAction(params: IncrementViewsParams): Promise<ActionResponse<{ views: number }>> {
  const validationResult = await action({
    params,
    schema: IncrementViewsSchema,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;

  try {
    const question = await QuestionModel.findById(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    question.views += 1;

    await question.save();

    return {
      success: true,
      data: { views: question.views },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function getHotQuestionsAction(): Promise<ActionResponse<Question[]>> {
  try {
    await dbConnect();

    const questions = await QuestionModel.find().sort({ views: -1, upvotes: -1 }).limit(5);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(questions)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

//! This comment block BELOW explains how Server Actions work in Next.js and their dual nature when used in Server and Client Components.

// Server Actions are designed to be used in different context:
// 1. In Server Components: They act like regular async functions.
// 2. In Client Components: When used in form actions or event handlers, they are invoked via a POST request to the server.

// It's a Direct Invocation.
// When you use a Server Action in a Server Component, you're directly calling the function on the server. There's no HTTP request involved at all because both the Server Component and the Server Action are executing in the same server environment.

// Example of using Server Action in a Server Component:
// import { createQuestionAction } from '@/lib/actions/question.action';
//
// const result = await createQuestionAction({ title: 'Sample', content: 'This is a sample question.', tags: ['tag1', 'tag2'] });
//
// In this case, the createQuestionAction function is called directly, and it executes on the server without any HTTP request.
//
// This direct invocation is efficient and leverages the server's capabilities without the overhead of network communication. There is no serialization or deserialization of data since everything happens within the server's context.
//

// However, when you use a Server Action in a Client Component, Next.js automatically handles the communication between the client and server. It serializes the function call into an HTTP POST request, sends it to the server, executes the Server Action there, and then sends the result back to the client.
//
// Example of using Server Action in a Client Component:
// import { createQuestionAction } from '@/lib/actions/question.action';
//
// const handleSubmit = async () => {
//   const result = await createQuestionAction({ title: 'Sample', content: 'This is a sample question.', tags: ['tag1', 'tag2'] });
// };
//
// In this scenario, Next.js takes care of the details of making the HTTP request to invoke the Server Action on the server side.
//
// This dual nature of Server Actions allows developers to write server-side logic that can be seamlessly integrated into both server and client components, enhancing code reuse and maintainability.
//

//? Note:
// When using Server Actions in Client Components, ensure that the actions are designed to handle serialization and deserialization of data, as they will be transmitted over HTTP.
// Also, be mindful of the performance implications of making network requests from the client to the server, especially for actions that may be called frequently.
// For more details, refer to the official Next.js documentation on Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
