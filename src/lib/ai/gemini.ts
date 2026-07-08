import { getSession } from 'next-auth/react';
import { LANGUAGE_PROMPT_SUFFIX, type AILanguage } from '@/lib/ai/language';

async function callGemini(prompt: string, language?: AILanguage): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error('Chưa đăng nhập');
  const suffix = language ? LANGUAGE_PROMPT_SUFFIX[language] : '';
  const fullPrompt = suffix ? `${prompt}\n\n${suffix}` : prompt;
  const response = await fetch('/api/ai/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: fullPrompt, language }),
  });

  const data = (await response.json()) as { text?: string; error?: string };
  if (!response.ok) throw new Error(data.error ?? `AI lỗi: ${response.status}`);
  if (!data.text) throw new Error('Không nhận được phản hồi từ Gemini');
  return data.text.trim();
}

export async function improveBugTitle(currentTitle: string, language?: AILanguage): Promise<string> {
  const prompt = `You are a QA engineer writing professional bug reports.

Current bug title: "${currentTitle}"

Rewrite this bug title to be clear, concise, and professional.
A good bug title follows the pattern: "[Component/Area] - [What went wrong]" or "[Action] causes [unexpected result]".
Keep it under 80 characters. Return only the improved title, no explanation.`;

  const result = await callGemini(prompt, language);
  return result.replace(/^["'"]|["'"]$/g, '').trim();
}

export async function improveBugDescription(title: string, currentDescription: string, language?: AILanguage): Promise<string> {
  const prompt = `You are a QA engineer writing professional bug reports.

Bug title: "${title}"
${currentDescription ? `Current description: "${currentDescription}"` : 'No description yet.'}

Rewrite or write a clear, concise bug description as a markdown bullet list covering:
- What is happening (actual behavior)
- What should happen (expected behavior)

Format: return only a markdown bullet list (- item), 2-4 bullets, no headings, no extra text.`;

  return callGemini(prompt, language);
}

export async function improveTaskTitle(currentTitle: string, language?: AILanguage): Promise<string> {
  const prompt = `You are a software project manager writing professional task titles.

Current task title: "${currentTitle}"

Rewrite this task title to be clear, concise, and action-oriented.
A good task title starts with a verb: "Implement...", "Fix...", "Add...", "Refactor...", "Update...".
Keep it under 80 characters. Return only the improved title, no explanation.`;

  const result = await callGemini(prompt, language);
  return result.replace(/^["'"]|["'"]$/g, '').trim();
}

export async function improveTaskDescription(title: string, currentDescription: string, language?: AILanguage): Promise<string> {
  const prompt = `You are a software project manager writing professional task descriptions.

Task title: "${title}"
${currentDescription ? `Current description: "${currentDescription}"` : 'No description yet.'}

Rewrite or write a clear, concise task description as a markdown bullet list covering:
- What needs to be done
- Why it matters or what the expected outcome is

Format: return only a markdown bullet list (- item), 2-4 bullets, no headings, no extra text.`;

  return callGemini(prompt, language);
}

export async function improveBugSteps(title: string, currentSteps: string, language?: AILanguage): Promise<string> {
  const prompt = `You are a QA engineer writing professional bug reports.

Bug title: "${title}"
${currentSteps ? `Current steps: "${currentSteps}"` : 'No steps yet.'}

Write clear numbered steps to reproduce this bug. Each step should be specific and actionable.
Format: numbered list only (1. ..., 2. ...).
Return only the steps, no extra text.`;

  return callGemini(prompt, language);
}

export async function improveEpicName(currentName: string, existingNames: string[], language?: AILanguage): Promise<string> {
  const existingList = existingNames.length > 0 ? `\nExisting epics to avoid duplicating:\n${existingNames.map((n) => `- ${n}`).join('\n')}` : '';
  const prompt = `You are a software project manager writing professional product backlog epics.

Current epic name: "${currentName}"${existingList}

Rewrite this epic name to be clear, concise, and business-value oriented.
A good epic name describes a major feature area or user capability (e.g., "User Authentication & Authorization", "Shopping Cart & Checkout Flow").
Keep it under 60 characters. Do NOT duplicate any existing epic name. Return only the improved name, no explanation.`;

  const result = await callGemini(prompt, language);
  return result.replace(/^["'"]|["'"]$/g, '').trim();
}

export async function improveEpicDescription(name: string, currentDescription: string, language?: AILanguage): Promise<string> {
  const prompt = `You are a software project manager writing professional product backlog epics.

Epic name: "${name}"
${currentDescription ? `Current description: "${currentDescription}"` : 'No description yet.'}

Rewrite or write a clear, concise epic description as a markdown bullet list covering:
- What this epic encompasses (scope)
- The business value or user benefit it delivers

Format: return only a markdown bullet list (- item), 2-4 bullets, no headings, no extra text.`;

  return callGemini(prompt, language);
}

export async function improveEpicGoals(name: string, currentGoals: string, language?: AILanguage): Promise<string> {
  const prompt = `You are a software project manager writing professional product backlog epics.

Epic name: "${name}"
${currentGoals ? `Current goals: "${currentGoals}"` : 'No goals yet.'}

Rewrite or write clear, measurable goals/outcomes for this epic as a markdown bullet list covering:
- Key deliverables or acceptance criteria
- Success metrics or definition of done

Format: return only a markdown bullet list (- item), 2-4 bullets, no headings, no extra text.`;

  return callGemini(prompt, language);
}

export async function improveStoryLabel(currentLabel: string, epicName: string, language?: AILanguage): Promise<string> {
  const prompt = `You are a software project manager writing professional user stories.

Epic: "${epicName}"
Current user story: "${currentLabel}"

Rewrite this user story in standard format: "As a [role], I want [feature] so that [benefit]".
Keep it under 120 characters. Return only the improved user story, no explanation.`;

  const result = await callGemini(prompt, language);
  return result.replace(/^["'"]|["'"]$/g, '').trim();
}

export async function improveStoryDescription(label: string, epicName: string, currentDescription: string, language?: AILanguage): Promise<string> {
  const prompt = `You are a software project manager writing professional user stories.

Epic: "${epicName}"
User story: "${label}"
${currentDescription ? `Current description: "${currentDescription}"` : 'No description yet.'}

Rewrite or write a clear, concise description as a markdown bullet list covering:
- What the user needs and why
- Key interactions or behaviors expected

Format: return only a markdown bullet list (- item), 2-4 bullets, no headings, no extra text.`;

  return callGemini(prompt, language);
}

export async function improveStoryGoals(label: string, epicName: string, currentGoals: string, language?: AILanguage): Promise<string> {
  const prompt = `You are a software project manager writing professional user stories.

Epic: "${epicName}"
User story: "${label}"
${currentGoals ? `Current acceptance criteria: "${currentGoals}"` : 'No acceptance criteria yet.'}

Rewrite or write clear acceptance criteria for this user story as a numbered list.
Each criterion should be specific and testable (Given/When/Then or plain conditions).
Format: numbered list only (1. ..., 2. ...). Return only the criteria, no extra text.`;

  return callGemini(prompt, language);
}
