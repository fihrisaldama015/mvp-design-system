import { Avatar, Badge } from "./ui";

// Who is logged in on the review page: the avatar with the initials, the name, the email and the role.
// user is { name, email, role } from the service; a missing name falls back to the email.
export default function UserChip({ user }) {
  if (!user) return null;
  const name = user.name || user.email || "?";
  return (
    <div className="rk-flex rk-min-w-0 rk-items-center rk-gap-2" aria-label={`Logged in as ${name}`}>
      <Avatar name={name} size="sm" />
      <div className="rk-flex rk-min-w-0 rk-flex-col rk-leading-tight">
        <span className="rk-truncate rk-typo-medium-text-sm">{name}</span>
        {user.name && user.email && <span className="rk-max-w-48 rk-truncate rk-text-caption rk-typo-regular-text-sm">{user.email}</span>}
      </div>
      <Badge tone={user.role === "admin" ? "info" : "neutral"} dot={false}>{user.role === "admin" ? "Admin" : "Reviewer"}</Badge>
    </div>
  );
}
