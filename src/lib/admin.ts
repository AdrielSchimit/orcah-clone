/**
 * Admin é função interna, guardada em users.role (USER | ADMIN).
 * Não existe mais lista de e-mails, env ADMIN_EMAILS nem slug de empresa que conceda admin:
 * registrar um e-mail "de admin" no cadastro público cria um USER comum.
 * Promover alguém é processo interno (migration ou banco), nunca pelo app.
 */
export function isAdmin(user: { role?: string | null } | null | undefined) {
  return user?.role === "ADMIN";
}
