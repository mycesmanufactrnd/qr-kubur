import { detectCode, detectLong } from "./heuristics.ts";

export function routePrompt(prompt: string) {
  if (detectCode(prompt)) return "code";
  if (detectLong(prompt)) return "reasoning";
  return "chat";
}
