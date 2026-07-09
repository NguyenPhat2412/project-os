export const DEFAULT_ADMIN_EMAILS: string[] = [];
export const ROOT_ADMIN_ROLE = 'Administrators';

export function parseAdminEmails(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function uniqueEmails(emails: string[]): string[] {
  return Array.from(new Set(emails.map((email) => email.toLowerCase())));
}

export function getClientAdminEmails(): string[] {
  return uniqueEmails([...DEFAULT_ADMIN_EMAILS, ...parseAdminEmails(process.env.NEXT_PUBLIC_ADMIN_EMAILS)]);
}

export function getServerAdminEmails(): string[] {
  return uniqueEmails([
    ...DEFAULT_ADMIN_EMAILS,
    ...parseAdminEmails(process.env.ADMIN_EMAILS),
    ...parseAdminEmails(process.env.NEXT_PUBLIC_ADMIN_EMAILS),
  ]);
}

export function isAdminEmail(email: string | null | undefined, emails: string[]): boolean {
  return email != null && emails.includes(email.toLowerCase());
}
