export const critiqueCodePrompt = (code: string) =>
  `Review the following code for bugs, edge cases, and improvements.
Return corrected code if needed.\n\n${code}`;
