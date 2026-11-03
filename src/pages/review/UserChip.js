import { Avatar } from "components/avatar";
import { Badge } from "components/badge";

// Who is logged in on the review page: the avatar with the initials, the name, the email and the role.
// user is { name, email, role } from the service; a missing name falls back to the email.
export default function UserChip({ user }) {
  if (!user) return null;
  const name = user.name || user.email || "?";
  return (
    <div className="flex min-w-0 items-center gap-2" aria-label={`Logged in as ${name}`}>
      <Avatar name={name} size="sm" />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate typo-medium-text-sm">{name}</span>
        {user.name && user.email && <span className="max-w-48 truncate text-caption typo-regular-text-sm">{user.email}</span>}
      </div>
      <Badge tone={user.role === "admin" ? "info" : "neutral"} dot={false}>{user.role === "admin" ? "Admin" : "Reviewer"}</Badge>
    </div>
  );
}
