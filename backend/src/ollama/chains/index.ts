export { reasoningChain } from "./reasoningChain";
export { codeChain } from "./codeChain";
export { writingChain } from "./writingChain";

// | Category       | Model           |
// | -------------- | --------------- |
// | chat           | qwen3:8b        |
// | reasoning      | deepseek-r1:18b |
// | hard reasoning | gpt-oss:20b     |
// | code           | qwen3-code:30b  |
// | small code     | qwen3-code:8b   |
// | summarize      | gemma:4b        |
// | rewrite        | gemma:1b        |
// | vision         | qwen-vl:30b     |

// High-quality answer chain
// gemma:1b   → rewrite prompt
// deepseek   → think
// qwen3:8b   → explain nicely

// Code review chain
// qwen3-code:30b → write code
// gpt-oss:20b    → review for bugs

// Writing chain
// gemma:1b → outline
// qwen3:30b → draft
// gemma:4b → polish
