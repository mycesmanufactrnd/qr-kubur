export function detectCode(prompt: string) {
  return /code|function|bug|error|typescript|react/i.test(prompt);
}

export function detectLong(prompt: string) {
  return prompt.length > 300;
}
