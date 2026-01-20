import User from "@/database/user.model";
import handleError from "@/lib/handlers/error";
import { ValidationError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { UserSchema } from "@/lib/validations";
import { APIErrorResponse } from "@/types/global";
import { error } from "console";
import { NextResponse } from "next/server";

// GET /api/users - Retrieve a list of all users
export async function GET() {
  try {
    await dbConnect();

    const users = await User.find().select("-password");

    return NextResponse.json(
      {
        success: true,
        data: users,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();

    const validatedData = UserSchema.safeParse(body);

    if (!validatedData.success) {
      throw new ValidationError(validatedData.error.flatten().fieldErrors);
    }

    const { username, email } = validatedData.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists.");
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) throw new Error("Username is already taken.");

    const newUser = await User.create(validatedData.data);

    return NextResponse.json(
      {
        success: true,
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
