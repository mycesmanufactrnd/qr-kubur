const OLLAMA_HOST =
  process.env.OLLAMA_HOST || "host.docker.internal:11434";

export async function callOllama(
  model: string,
  prompt: string,
  options?: {
    max_tokens?: number;
    temperature?: number;
  }
) {
  const res = await fetch(`http://${OLLAMA_HOST}/v1/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      max_tokens: options?.max_tokens ?? 2000,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama ${model} → ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.text?.trim() ?? "";
}
