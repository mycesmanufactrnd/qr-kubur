import { callOllama } from "../ollamaClient.ts";
import { rewritePrompt } from "../prompts/rewrite.ts";

export async function reasoningChain(prompt: string) {
  const rewritten = await callOllama(
    "gemma3:1b",
    rewritePrompt(prompt),
    { temperature: 0.3 }
  );

  const reasoning = await callOllama(
    "deepseek-r1:8b",
    rewritten,
    { temperature: 0.2 }
  );

  const explained = await callOllama(
    "qwen3:8b",
    `Explain the following clearly:\n${reasoning}`,
    { temperature: 0.6 }
  );

  return explained;
}
