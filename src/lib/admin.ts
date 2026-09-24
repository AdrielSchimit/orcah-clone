const BUILTIN_ADMIN_EMAILS = ["schimitadriel100@gmail.com", "cesar.turmina1@gmail.com"];
const PREVIEW_ADMIN_SLUGS = ["cesar-turmina"];

function adminEmails() {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...BUILTIN_ADMIN_EMAILS.map((email) => email.toLowerCase()), ...fromEnv]);
}

export function isPreviewAdmin(user: {
  email: string;
  company?: { slug?: string | null } | null;
}) {
  const email = user.email.trim().toLowerCase();
  const slug = user.company?.slug;
  return adminEmails().has(email) || (slug != null && PREVIEW_ADMIN_SLUGS.includes(slug));
}
