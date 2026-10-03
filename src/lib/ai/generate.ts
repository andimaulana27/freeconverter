import "server-only";

import { generateText, Output, type FlexibleSchema } from "ai";
import type { z } from "zod";
import { createGoogleProvider } from "@/lib/ai/provider";
import type { AiModelProfile, TokenStep } from "@/lib/ai/types";

type ThinkingLevel = "low" | "medium" | "high";

function thinkingLevel(value: string | null): ThinkingLevel | undefined {
  if (value === "low" || value === "medium" || value === "high") return value;
  return undefined;
}

export async function generateStructured<T>(input: {
  profile: AiModelProfile;
  schema: FlexibleSchema<T> | z.ZodType<T>;
  name: string;
  prompt: string;
  extraSystem?: string;
}): Promise<{ output: T; step: TokenStep }> {
  const google = createGoogleProvider();
  const level = thinkingLevel(input.profile.thinking_level);
  const result = await generateText({
    model: google(input.profile.model_id),
    output: Output.object({
      name: input.name,
      schema: input.schema as FlexibleSchema<T>,
      description: input.profile.task_prompt,
    }),
    system: [input.profile.system_prompt, input.extraSystem].filter(Boolean).join("\n\n"),
    prompt: `${input.profile.task_prompt}\n\n${input.prompt}`,
    temperature: input.profile.temperature ?? undefined,
    maxOutputTokens: input.profile.max_output_tokens ?? undefined,
    providerOptions: level
      ? {
          google: {
            thinkingConfig: { thinkingLevel: level },
          },
        }
      : undefined,
  });

  if (result.output == null) {
    throw new Error(`The ${input.name} model returned no structured output.`);
  }

  return {
    output: result.output,
    step: {
      task: input.profile.task_key,
      modelId: input.profile.model_id,
      promptVersion: input.profile.prompt_version,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      totalTokens: result.usage?.totalTokens ?? 0,
    },
  };
}

export async function generateIllustrationPng(input: {
  profile: AiModelProfile;
  prompt: string;
}): Promise<{ bytes: Uint8Array; mediaType: string; step: TokenStep }> {
  const google = createGoogleProvider();
  const result = await generateText({
    model: google(input.profile.model_id),
    system: input.profile.system_prompt,
    prompt: `${input.profile.task_prompt}\n\n${input.prompt}\n\nAbsolutely no letters, numbers, logos, watermarks, captions, or user interface.`,
    providerOptions: {
      google: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "512",
        },
      },
    },
  });

  const file = (result.files ?? []).find((item) => item.mediaType.startsWith("image/"));
  if (!file) {
    throw new Error("The illustration model returned no image.");
  }

  const bytes = file.uint8Array ?? (file.base64 ? Uint8Array.from(Buffer.from(file.base64, "base64")) : null);
  if (!bytes?.byteLength) {
    throw new Error("The illustration model returned an empty image.");
  }

  return {
    bytes,
    mediaType: file.mediaType || "image/png",
    step: {
      task: input.profile.task_key,
      modelId: input.profile.model_id,
      promptVersion: input.profile.prompt_version,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      totalTokens: result.usage?.totalTokens ?? 0,
    },
  };
}
