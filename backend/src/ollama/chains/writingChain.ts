import { callOllama } from "../ollamaClient.ts";

export async function writingChain(prompt: string) {
  const outline = await callOllama(
    "gemma3:1b",
    `Create a structured outline:\n${prompt}`,
    { temperature: 0.4 }
  );

  console.log("Outline generated (gemma3:1b):", outline);

  const draft = await callOllama(
    "qwen3:30b",
    `Write a full draft using this outline:\n${outline}`,
    { temperature: 0.7 }
  );

  console.log("Draft generated (qwen3:30b):", draft);

  const polished = await callOllama(
    "gemma3:4b",
    `Polish and improve clarity and tone:\n${draft}`,
    { temperature: 0.4 }
  );

  console.log("Polished output (gemma3:4b):", polished);

  console.log("Writing chain complete.");

  return polished;
}
