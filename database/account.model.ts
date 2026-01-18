import { model, models, Schema } from "mongoose";

export interface IAccount {
  userId: string;
  name: string;
  image?: string;
  password?: string;
  provider: string;
  providerAccountId: string;
}

const AccountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: "string", required: true },
    image: { type: "string" },
    password: { type: "string" },
    provider: { type: "string", required: true },
    providerAccountId: { type: "string", required: true },
  },
  { timestamps: true }
);

const AccountModel = models?.Account || model<IAccount>("Account", AccountSchema);

export default AccountModel;
