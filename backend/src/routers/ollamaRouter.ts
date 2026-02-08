// import { z } from "zod";
// import { publicProcedure, router } from "../trpc.ts";
// import { routePrompt } from "../ollama/router/routePrompt.ts";
// import { callOllama } from "../ollama/ollamaClient.ts";
// import { reasoningChain } from "../ollama/chains/reasoningChain.ts";
// import { codeChain } from "../ollama/chains/codeChain.ts";
// import { writingChain } from "../ollama/chains/writingChain.ts";

// export const ollamaRouter = router({
//   generate: publicProcedure
//     .input(
//       z.object({
//         prompt: z.string(),
//         mode: z
//           .enum(["auto", "chat", "reasoning", "code", "writing"])
//           .default("auto"),
//       })
//     )
//     .mutation(async ({ input }) => {
//       const { prompt, mode } = input;

//       const finalMode =
//         mode === "auto" ? routePrompt(prompt) : mode;

//       switch (finalMode) {
//         case "reasoning":
//           return reasoningChain(prompt);
//         case "code":
//           return codeChain(prompt);
//         case "writing":
//           return writingChain(prompt);
//         default:
//           return callOllama("qwen3:8b", prompt);
//       }
//     }),
// });


import z from "zod";
import { router, publicProcedure } from "../trpc.ts";

const NODE_SERVER_URL = process.env.NODE_SERVER_URL || "https://broadly-nonrateable-tucker.ngrok-free.dev";

export const ollamaRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        prompt: z.string(),
        mode: z
          .enum(["auto", "chat", "reasoning", "code", "writing"])
          .default("auto"),
      })
    )
    .mutation(async ({ input }) => {
      const { prompt } = input;

      try {
        const response = await fetch(`${NODE_SERVER_URL}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        return data.text ?? "No response from Ollama";
      } catch (err: any) {
        console.error("Error calling server/Ollama:", err);
        throw new Error(`Failed to fetch Ollama: ${err.message}`);
      }
    }),
});

