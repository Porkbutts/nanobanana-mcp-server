import axios, { AxiosError } from "axios";
import { readFile } from "fs/promises";
import { extname } from "path";
import { API_BASE_URL, API_TIMEOUT } from "../constants.js";
import type {
  GeminiRequest,
  GeminiResponse,
  ImageGenerationResult,
  GeneratedImage
} from "../types.js";

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromPath(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif"
  };
  return mimeTypes[ext] || "image/png";
}

/**
 * Get the API key from environment variables
 */
function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is required. " +
      "Get your API key from https://aistudio.google.com/apikey"
    );
  }
  return apiKey;
}

/**
 * Make a request to the Gemini API
 */
export async function makeGeminiRequest(
  model: string,
  request: GeminiRequest
): Promise<GeminiResponse> {
  const apiKey = getApiKey();
  const url = `${API_BASE_URL}/models/${model}:generateContent`;

  try {
    const response = await axios.post<GeminiResponse>(url, request, {
      headers: {
        "Content-Type": "application/json"
      },
      params: {
        key: apiKey
      },
      timeout: API_TIMEOUT
    });

    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Generate an image from a text prompt
 */
export async function generateImage(
  prompt: string,
  model: string
): Promise<ImageGenerationResult> {
  const request: GeminiRequest = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"]
    }
  };

  try {
    const response = await makeGeminiRequest(model, request);

    if (!response.candidates || response.candidates.length === 0) {
      return {
        success: false,
        error: "No candidates returned from the API",
        model
      };
    }

    const candidate = response.candidates[0];
    const result: ImageGenerationResult = {
      success: true,
      model,
      finishReason: candidate.finishReason
    };

    // Extract text and image from response parts
    for (const part of candidate.content.parts) {
      if ("text" in part) {
        result.text = part.text;
      } else if ("inlineData" in part) {
        result.image = {
          mimeType: part.inlineData.mimeType,
          data: part.inlineData.data
        };
      }
    }

    if (!result.image) {
      return {
        success: false,
        error: "No image was generated. The model may have refused or encountered an issue.",
        text: result.text,
        model
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
      model
    };
  }
}

/**
 * Edit an image using a text prompt
 */
export async function editImage(
  prompt: string,
  imagePath: string,
  model: string
): Promise<ImageGenerationResult> {
  // Read image from filesystem
  let imageBase64: string;
  let imageMimeType: string;

  try {
    const imageBuffer = await readFile(imagePath);
    imageBase64 = imageBuffer.toString("base64");
    imageMimeType = getMimeTypeFromPath(imagePath);
  } catch (err) {
    return {
      success: false,
      error: `Failed to read image file: ${err instanceof Error ? err.message : String(err)}`,
      model
    };
  }

  const request: GeminiRequest = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: imageMimeType,
              data: imageBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"]
    }
  };

  try {
    const response = await makeGeminiRequest(model, request);

    if (!response.candidates || response.candidates.length === 0) {
      return {
        success: false,
        error: "No candidates returned from the API",
        model
      };
    }

    const candidate = response.candidates[0];
    const result: ImageGenerationResult = {
      success: true,
      model,
      finishReason: candidate.finishReason
    };

    // Extract text and image from response parts
    for (const part of candidate.content.parts) {
      if ("text" in part) {
        result.text = part.text;
      } else if ("inlineData" in part) {
        result.image = {
          mimeType: part.inlineData.mimeType,
          data: part.inlineData.data
        };
      }
    }

    if (!result.image) {
      return {
        success: false,
        error: "No edited image was generated. The model may have refused or encountered an issue.",
        text: result.text,
        model
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
      model
    };
  }
}

/**
 * Handle API errors and return user-friendly messages
 */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: { message?: string } }>;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const message = axiosError.response.data?.error?.message;

      switch (status) {
        case 400:
          return `Error: Invalid request. ${message || "Check your prompt and parameters."}`;
        case 401:
          return "Error: Invalid API key. Please check your GEMINI_API_KEY environment variable.";
        case 403:
          return `Error: Access denied. ${message || "Your API key may not have access to this model."}`;
        case 404:
          return "Error: Model not found. Please check the model name.";
        case 429:
          return "Error: Rate limit exceeded. Please wait before making more requests.";
        case 500:
          return "Error: Gemini API server error. Please try again later.";
        case 503:
          return "Error: Gemini API service unavailable. Please try again later.";
        default:
          return `Error: API request failed with status ${status}. ${message || ""}`;
      }
    } else if (axiosError.code === "ECONNABORTED") {
      return "Error: Request timed out. Image generation can take a while - please try again.";
    } else if (axiosError.code === "ENOTFOUND") {
      return "Error: Unable to reach Gemini API. Please check your network connection.";
    }
  }

  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}
