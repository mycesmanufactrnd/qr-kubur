import { useState } from "react";
import { trpc } from "@/utils/trpc";

let typingTimeouts = [];

export default function Ollama() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("auto"); 
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generate = trpc.ollama.generate.useMutation({
    onSuccess: (data) => {
      setOutput("");
      setIsLoading(false);

      // Split into ~50 char chunks
      const chunks = data.match(/.{1,50}(\s|$)/g) || [];
      chunks.forEach((chunk, i) => {
        const t = setTimeout(() => {
          setOutput((prev) => prev + chunk);
        }, i * 50); // 50ms between chunks → simulate typing
        typingTimeouts.push(t);
      });
    },
    onError: (err) => {
      setOutput(`Error: ${err.message}`);
      setIsLoading(false);
    },
  });

  const handleClick = () => {
    if (!input.trim()) return;

    typingTimeouts.forEach(clearTimeout);
    typingTimeouts = [];

    setOutput("");
    setIsLoading(true);

    generate.mutate({
      prompt: input,
      mode: mode
    });
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Ollama Prompt (Simulated Streaming)</h2>

      <input
        type="text"
        placeholder="Type your prompt here"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", fontSize: "1rem", marginBottom: "0.5rem" }}
      />

      <div style={{ marginBottom: "0.5rem" }}>
        <label>
          Mode:{" "}
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="auto">Auto</option>
            <option value="chat">Chat</option>
            <option value="reasoning">Reasoning</option>
            <option value="code">Code</option>
            <option value="writing">Writing</option>
          </select>
        </label>
      </div>

      <button
        onClick={handleClick}
        style={{
          padding: "0.5rem 1rem",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        Generate
      </button>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "5px",
          minHeight: "80px",
          backgroundColor: "#f9f9f9",
          whiteSpace: "pre-wrap",
        }}
      >
        {isLoading ? "Generating..." : output || "Response will appear here"}
      </div>
    </div>
  );
}
