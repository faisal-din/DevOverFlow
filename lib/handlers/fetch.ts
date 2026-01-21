import { ActionResponse } from "@/types/global";
import logger from "../logger";
import handleError from "./error";
import { RequestError } from "../http-errors";

interface FetchOptions extends RequestInit {
  timeout?: number; // in milliseconds
}

const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export async function fetchHandler<T>(url: string, options: FetchOptions = {}): Promise<ActionResponse<T>> {
  const { timeout = 5000, headers: customHeaders = {}, ...restOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const headers: HeadersInit = {
    ...defaultHeaders,
    ...customHeaders,
  };

  const config: RequestInit = {
    ...restOptions,
    headers,
    signal: controller.signal,
  };

  try {
    const response = await fetch(url, config);

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new RequestError(response.status, `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const errorMessage = isError(error) ? error : new Error("An unknown error occurred");

    if (errorMessage.name === "AbortError") {
      logger.warn(`Request to ${url} timed out.`);
    } else {
      return handleError(errorMessage) as ActionResponse<T>;
    }
  }
}
