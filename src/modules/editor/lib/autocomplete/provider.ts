// AI autocomplete provider — gutted in Chunk C (AI subsystem strip).
// The function signature is preserved so inlineExtension.ts still compiles.
// Chunk D will remove the @ai-sdk/* dependencies entirely.

export type CompletionDeps = {
  provider: string;
  modelId: string;
  /** API key for the configured provider, or null for keyless (LM Studio). */
  apiKey: string | null;
  lmstudioBaseURL: string;
};

export async function requestCompletion(
  _req: unknown,
  _deps: CompletionDeps,
  _signal: AbortSignal,
): Promise<string> {
  // No AI backend — always return empty so the ghost text is never shown.
  return "";
}
