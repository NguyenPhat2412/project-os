import { aiSettingsConfig, type AIProvider } from '@/lib/project-config';

const DEFAULT_PROVIDER: AIProvider = 'CLAUDE';

export async function getActiveAIProvider(): Promise<AIProvider> {
  const config = await aiSettingsConfig.helpers.fetch('ai_settings');
  const provider = config?.provider;
  if (provider === 'GEMINI' || provider === 'CLAUDE') return provider;
  return DEFAULT_PROVIDER;
}
