#!/usr/bin/env node
/**
 * Nanobanana MCP Server
 *
 * An MCP server for Gemini image generation API integration.
 * Provides tools for generating and editing images using Google's Gemini models.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { writeFile } from "fs/promises";
import { dirname } from "path";
import { mkdir } from "fs/promises";

import { GEMINI_MODELS } from "./constants.js";
import { generateImage, editImage } from "./services/gemini-client.js";
import {
  GenerateImageSchema,
  EditImageSchema,
  ListModelsSchema,
  ResponseFormat,
  type GenerateImageInput,
  type EditImageInput,
  type ListModelsInput
} from "./schemas/index.js";

// Create MCP server instance
const server = new McpServer({
  name: "nanobanana-mcp-server",
  version: "1.0.0"
});

/**
 * Save image to file if output path is provided
 */
async function saveImageToFile(
  base64Data: string,
  outputPath: string,
  mimeType: string
): Promise<void> {
  // Ensure directory exists
  const dir = dirname(outputPath);
  await mkdir(dir, { recursive: true });

  // Decode and write file
  const buffer = Buffer.from(base64Data, "base64");
  await writeFile(outputPath, buffer);
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif"
  };
  return extensions[mimeType] || ".png";
}

// Register: nanobanana_generate_image
server.registerTool(
  "nanobanana_generate_image",
  {
    title: "Generate Image",
    description: `Generate an image from a text prompt using Google's Gemini image generation models.

This tool creates images from descriptive text prompts using Gemini's multimodal capabilities.
For best results, be specific about:
- Subject matter and composition
- Art style (photorealistic, illustration, oil painting, etc.)
- Lighting and atmosphere
- Colors and mood

Args:
  - prompt (string): Text description of the image to generate
  - model (string): Gemini model to use (default: gemini-2.0-flash-exp-image-generation)
  - output_path (string, optional): File path to save the image

Returns:
  JSON object with:
  - success (boolean): Whether generation succeeded
  - image_base64 (string): Base64-encoded image data (if no output_path)
  - saved_to (string): File path where image was saved (if output_path provided)
  - mime_type (string): Image MIME type
  - model (string): Model used for generation
  - text (string, optional): Any text response from the model
  - error (string, optional): Error message if generation failed

Examples:
  - "A serene mountain lake at sunset with purple and orange sky reflections"
  - "Cute cartoon robot holding a coffee cup, digital art style"
  - "Professional product photo of a sleek smartphone on white background"`,
    inputSchema: GenerateImageSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  async (params: GenerateImageInput) => {
    const result = await generateImage(params.prompt, params.model);

    if (!result.success || !result.image) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: result.error || "Unknown error occurred",
            model: result.model,
            text: result.text
          }, null, 2)
        }]
      };
    }

    // If output path provided, save the image
    if (params.output_path) {
      try {
        await saveImageToFile(
          result.image.data,
          params.output_path,
          result.image.mimeType
        );

        const output = {
          success: true,
          saved_to: params.output_path,
          mime_type: result.image.mimeType,
          model: result.model,
          text: result.text
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(output, null, 2)
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `Failed to save image: ${err instanceof Error ? err.message : String(err)}`,
              model: result.model
            }, null, 2)
          }]
        };
      }
    }

    // Return base64 data
    const output = {
      success: true,
      image_base64: result.image.data,
      mime_type: result.image.mimeType,
      model: result.model,
      text: result.text
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(output, null, 2)
      }]
    };
  }
);

// Register: nanobanana_edit_image
server.registerTool(
  "nanobanana_edit_image",
  {
    title: "Edit Image",
    description: `Edit an existing image using a text prompt with Gemini's image editing capabilities.

This tool modifies images based on natural language instructions. You can:
- Change colors, objects, or elements
- Add or remove items from the scene
- Transform the style or mood
- Apply effects or filters

Args:
  - prompt (string): Description of the edit to apply
  - image_base64 (string): Base64-encoded image data to edit
  - image_mime_type (string): MIME type of input image (default: image/png)
  - model (string): Gemini model to use
  - output_path (string, optional): File path to save the edited image

Returns:
  JSON object with:
  - success (boolean): Whether editing succeeded
  - image_base64 (string): Base64-encoded edited image data (if no output_path)
  - saved_to (string): File path where image was saved (if output_path provided)
  - mime_type (string): Image MIME type
  - model (string): Model used for editing
  - text (string, optional): Any text response from the model
  - error (string, optional): Error message if editing failed

Examples:
  - "Change the car color from blue to red"
  - "Add a rainbow in the sky"
  - "Remove the person in the background"
  - "Make this photo look like an oil painting"`,
    inputSchema: EditImageSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  async (params: EditImageInput) => {
    const result = await editImage(
      params.prompt,
      params.image_base64,
      params.image_mime_type,
      params.model
    );

    if (!result.success || !result.image) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: result.error || "Unknown error occurred",
            model: result.model,
            text: result.text
          }, null, 2)
        }]
      };
    }

    // If output path provided, save the image
    if (params.output_path) {
      try {
        await saveImageToFile(
          result.image.data,
          params.output_path,
          result.image.mimeType
        );

        const output = {
          success: true,
          saved_to: params.output_path,
          mime_type: result.image.mimeType,
          model: result.model,
          text: result.text
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(output, null, 2)
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `Failed to save image: ${err instanceof Error ? err.message : String(err)}`,
              model: result.model
            }, null, 2)
          }]
        };
      }
    }

    // Return base64 data
    const output = {
      success: true,
      image_base64: result.image.data,
      mime_type: result.image.mimeType,
      model: result.model,
      text: result.text
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(output, null, 2)
      }]
    };
  }
);

// Register: nanobanana_list_models
server.registerTool(
  "nanobanana_list_models",
  {
    title: "List Available Models",
    description: `List the available Gemini models for image generation.

Returns information about each supported model including its capabilities and recommended use cases.

Args:
  - response_format (string): Output format - 'markdown' or 'json' (default: markdown)

Returns:
  List of available models with their descriptions and capabilities.`,
    inputSchema: ListModelsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: ListModelsInput) => {
    const models = [
      {
        id: GEMINI_MODELS.FLASH,
        name: "Gemini 2.0 Flash (Image Generation)",
        description: "Optimized for fast, high-quality image generation from text prompts.",
        capabilities: ["text-to-image", "image-editing"],
        recommended_for: "General image generation tasks requiring speed and quality"
      },
      {
        id: GEMINI_MODELS.PRO,
        name: "Gemini 2.0 Flash Exp",
        description: "Experimental model with multimodal capabilities.",
        capabilities: ["text-to-image", "image-editing", "image-understanding"],
        recommended_for: "Complex image tasks requiring advanced reasoning"
      }
    ];

    if (params.response_format === ResponseFormat.JSON) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ models }, null, 2)
        }]
      };
    }

    // Markdown format
    const lines = [
      "# Available Gemini Image Generation Models",
      ""
    ];

    for (const model of models) {
      lines.push(`## ${model.name}`);
      lines.push(`**Model ID:** \`${model.id}\``);
      lines.push("");
      lines.push(model.description);
      lines.push("");
      lines.push(`**Capabilities:** ${model.capabilities.join(", ")}`);
      lines.push("");
      lines.push(`**Recommended for:** ${model.recommended_for}`);
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    return {
      content: [{
        type: "text",
        text: lines.join("\n")
      }]
    };
  }
);

// Main function - stdio transport
async function main() {
  // Validate API key is present
  if (!process.env.GEMINI_API_KEY) {
    console.error("WARNING: GEMINI_API_KEY environment variable is not set.");
    console.error("Get your API key from https://aistudio.google.com/apikey");
    console.error("The server will start but API calls will fail without a valid key.");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Nanobanana MCP server running via stdio");
}

main().catch(error => {
  console.error("Server error:", error);
  process.exit(1);
});
