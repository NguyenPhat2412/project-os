'use client';

/**
 * UserAvatar
 * ──────────
 * Shared user avatar — renders photoURL if available, otherwise falls back
 * to initials on a colored gradient. Designed for the assignee picker,
 * team lists, kanban cards, and any place that needs a member avatar.
 *
 * Accepts any object exposing `name | displayName`, `initials`, `gradient`,
 * and `photoURL` — works with Member, TeamMember, RootMember, UserProfile.
 */

import { Avatar, AvatarImage } from '@/components/ui/avatar';

export type UserAvatarSource = {
  name?: string;
  displayName?: string;
  initials?: string;
  gradient?: string;
  photoURL?: string;
};

type UserAvatarProps = {
  user: UserAvatarSource | null | undefined;
  size?: 'sm' | 'default' | 'md' | 'lg';
  className?: string;
};

function deriveInitials(user: UserAvatarSource): string {
  if (user.initials) return user.initials;
  const source = user.displayName || user.name || '';
  return source
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserAvatar({ user, size = 'sm', className }: UserAvatarProps) {
  const initials = deriveInitials(user ?? {});
  const gradient = user?.gradient;
  const photoURL = user?.photoURL;

  return (
    <Avatar
      size={size}
      initials={initials}
      gradient={gradient}
      className={className}
    >
      {photoURL ? <AvatarImage src={photoURL} alt={user?.displayName || user?.name || ''} /> : null}
    </Avatar>
  );
}
