"use server";

import { GlobalSearchParams } from "@/types/action";
import { GlobalSearchSchema } from "../validations";
import handleError from "../handlers/error";
import { ErrorResponse } from "@/types/global";
import action from "../handlers/action";
import { AnswerModel, QuestionModel, TagModel, UserModel } from "@/database";

export async function globalSearchAction(params: GlobalSearchParams) {
  try {
    const validationResult = await action({
      params,
      schema: GlobalSearchSchema,
    });

    if (validationResult instanceof Error) {
      return handleError(validationResult) as ErrorResponse;
    }

    const { query, type } = params;
    const regexQuery = { $regex: query, $options: "i" };

    let results = [];

    const modelsAndTypes = [
      { model: QuestionModel, searchField: "title", type: "question" },
      { model: UserModel, searchField: "name", type: "user" },
      { model: AnswerModel, searchField: "content", type: "answer" },
      { model: TagModel, searchField: "name", type: "tag" },
    ];

    const typeLower = type?.toLowerCase();

    const SearchableTypes = ["question", "answer", "user", "tag"];

    if (!typeLower || !SearchableTypes.includes(typeLower)) {
      // If no type is specified, search in all models
      for (const { model, searchField, type } of modelsAndTypes) {
        const queryResults = await model.find({ [searchField]: regexQuery }).limit(2);

        results.push(
          ...queryResults.map((item) => ({
            title: type === "answer" ? `Answers containing ${query}` : item[searchField],
            type,
            id: type === "answer" ? item.question : item._id,
          }))
        );
      }
    } else {
      // Search in the specified model type
      const modelInfo = modelsAndTypes.find((item) => item.type === type);

      if (!modelInfo) {
        throw new Error("Invalid search type");
      }

      const queryResults = await modelInfo.model.find({ [modelInfo.searchField]: regexQuery }).limit(8);

      results = queryResults.map((item) => ({
        title: type === "answer" ? `Answers containing ${query}` : item[modelInfo.searchField],
        type,
        id: type === "answer" ? item.question : item._id,
      }));
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(results)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
