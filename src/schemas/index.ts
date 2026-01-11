import { z } from "zod";
import { GEMINI_MODELS } from "../constants.js";

// Response format enum
export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}

// Model selection schema
export const ModelSchema = z.enum([
  GEMINI_MODELS.FLASH,
  GEMINI_MODELS.PRO
]).default(GEMINI_MODELS.FLASH)
  .describe("Gemini model to use. 'gemini-2.0-flash-exp-image-generation' is optimized for image generation.");

// Text-to-image generation schema
export const GenerateImageSchema = z.object({
  prompt: z.string()
    .min(1, "Prompt is required")
    .max(10000, "Prompt must not exceed 10000 characters")
    .describe("Text description of the image to generate. Be specific about subject, style, lighting, composition, and mood for best results."),
  model: ModelSchema,
  output_path: z.string()
    .min(1, "Output path is required")
    .describe("File path to save the generated image.")
}).strict();

export type GenerateImageInput = z.infer<typeof GenerateImageSchema>;

// Image editing schema
export const EditImageSchema = z.object({
  prompt: z.string()
    .min(1, "Prompt is required")
    .max(10000, "Prompt must not exceed 10000 characters")
    .describe("Text description of the edit to apply. Be specific about what to change, e.g., 'change the blue car to red' or 'add a sunset in the background'."),
  image_path: z.string()
    .min(1, "Image path is required")
    .describe("File path to the image to edit. Supports PNG, JPEG, WebP, and GIF formats."),
  model: ModelSchema,
  output_path: z.string()
    .min(1, "Output path is required")
    .describe("File path to save the edited image.")
}).strict();

export type EditImageInput = z.infer<typeof EditImageSchema>;

// List models schema
export const ListModelsSchema = z.object({
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable")
}).strict();

export type ListModelsInput = z.infer<typeof ListModelsSchema>;
