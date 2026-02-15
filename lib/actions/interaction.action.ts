import mongoose from "mongoose";

import InteractionModel, { IInteractionDoc } from "@/database/interaction.model";

import { ActionResponse, ErrorResponse } from "@/types/global";
import { CreateInteractionSchema } from "../validations";
import { CreateInteractionParams } from "@/types/action";
import action from "../handlers/action";
import handleError from "../handlers/error";

export async function createInteraction(params: CreateInteractionParams): Promise<ActionResponse<IInteractionDoc>> {
  const validationResult = await action({
    params,
    schema: CreateInteractionSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const {
    action: actionType,
    actionId,
    actionTarget,
    authorId, // target user who owns the content (question/answer)
  } = validationResult.params!;
  const userId = validationResult.session?.user?.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [interaction] = await InteractionModel.create(
      [
        {
          user: userId,
          action: actionType,
          actionId,
          actionType: actionTarget,
        },
      ],
      { session }
    );

    // Todo: Update reputation for both the performer and the content author

    await session.commitTransaction();

    return { success: true, data: JSON.parse(JSON.stringify(interaction)) };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}
