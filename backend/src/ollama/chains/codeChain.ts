import { callOllama } from "../ollamaClient.js";
import { critiqueCodePrompt } from "../prompts/critique.js";

export async function codeChain(prompt: string) {
  const code = await callOllama(
    "qwen3-coder:30b",
    `Write clean, correct code:\n${prompt}`,
    { temperature: 0.2 }
  );

  const reviewed = await callOllama(
    "gpt-oss:20b",
    critiqueCodePrompt(code),
    { temperature: 0.1 }
  );

  return reviewed;
}
