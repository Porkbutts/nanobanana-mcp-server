// Gemini API Constants
export const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Available models for image generation
export const GEMINI_MODELS = {
  FLASH: "gemini-2.0-flash-exp-image-generation",
  PRO: "gemini-2.0-flash-exp"
} as const;

// Supported aspect ratios
export const ASPECT_RATIOS = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "21:9",
  "9:21"
] as const;

// Image sizes (Pro model only)
export const IMAGE_SIZES = ["1K", "2K", "4K"] as const;

// Response character limit
export const CHARACTER_LIMIT = 25000;

// Default timeout for API requests (60 seconds for image generation)
export const API_TIMEOUT = 60000;
