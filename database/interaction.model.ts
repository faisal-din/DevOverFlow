import { model, models, Schema, Types } from "mongoose";
import { required } from "zod/v4-mini";

export interface ICollection {
  user: Types.ObjectId;
  action: string;
  actionId: Types.ObjectId;
  actionType: "question" | "answer";
}

const CollectionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    actionId: { type: Schema.Types.ObjectId, required: true },
    actionType: { type: String, enum: ["question", "answer"], required: true },
  },
  { timestamps: true }
);

const CollectionModel = models?.Collection || model<ICollection>("Collection", CollectionSchema);

export default CollectionModel;
