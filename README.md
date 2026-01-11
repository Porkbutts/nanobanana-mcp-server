# Nanobanana MCP Server

An MCP (Model Context Protocol) server for Google's Gemini image generation API. Generate and edit images using natural language prompts.

## Features

- **Text-to-Image Generation**: Create images from descriptive text prompts
- **Image Editing**: Modify existing images using natural language instructions
- **Multiple Models**: Support for Gemini 2.0 Flash image generation models

## Prerequisites

- Node.js 18 or higher
- A Google AI API key (get one at https://aistudio.google.com/apikey)

## Installation

```bash
npm install
npm run build
```

## Configuration

Set your Gemini API key as an environment variable:

```bash
export GEMINI_API_KEY="your-api-key-here"
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "nanobanana": {
      "command": "node",
      "args": ["/path/to/nanobanana-mcp-server/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

### `nanobanana_generate_image`

Generate an image from a text prompt.

**Parameters:**
- `prompt` (required): Text description of the image to generate
- `model` (optional): Gemini model to use (default: `gemini-2.0-flash-exp-image-generation`)
- `output_path` (optional): File path to save the generated image

**Example:**
```
Generate an image of a serene mountain lake at sunset with purple and orange sky reflections
```

### `nanobanana_edit_image`

Edit an existing image using a text prompt.

**Parameters:**
- `prompt` (required): Description of the edit to apply
- `image_base64` (required): Base64-encoded image data
- `image_mime_type` (optional): MIME type of input image (default: `image/png`)
- `model` (optional): Gemini model to use
- `output_path` (optional): File path to save the edited image

**Example:**
```
Change the car color from blue to red
```

### `nanobanana_list_models`

List available Gemini models for image generation.

**Parameters:**
- `response_format` (optional): Output format - `markdown` or `json` (default: `markdown`)

## Development

```bash
# Watch mode with auto-reload
npm run dev

# Build
npm run build

# Run
npm start
```

## License

MIT
