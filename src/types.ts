// Gemini API Types

export interface GeminiTextPart {
  text: string;
}

export interface GeminiInlineDataPart {
  inlineData: {
    mimeType: string;
    data: string;  // base64 encoded
  };
}

export type GeminiPart = GeminiTextPart | GeminiInlineDataPart;

export interface GeminiContent {
  role?: "user" | "model";
  parts: GeminiPart[];
}

export interface GenerationConfig {
  responseModalities?: string[];
  responseMimeType?: string;
}

export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: GenerationConfig;
}

export interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
    role: string;
  };
  finishReason: string;
  index: number;
}

export interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion?: string;
}

export interface GeneratedImage {
  mimeType: string;
  data: string;  // base64 encoded
}

export interface ImageGenerationResult {
  success: boolean;
  text?: string;
  image?: GeneratedImage;
  error?: string;
  model: string;
  finishReason?: string;
}
