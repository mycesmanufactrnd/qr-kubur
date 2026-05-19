import { detectCode, detectLong } from "./heuristics.js";

export function routePrompt(prompt: string) {
  if (detectCode(prompt)) return "code";
  if (detectLong(prompt)) return "reasoning";
  return "chat";
}
