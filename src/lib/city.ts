import { prisma } from "@/lib/db";
import { accentCount, slugify, titleCaseName } from "@/lib/text";

export async function findOrCreateCity(stateId: number, rawName: string) {
  const name = titleCaseName(rawName);
  if (name.length < 2) return null;

  const slug = slugify(name);
  if (!slug) return null;

  const existing = await prisma.city.findFirst({
    where: { stateId, slug },
  });

  if (existing) {
    if (accentCount(name) > accentCount(existing.name)) {
      return prisma.city.update({
        where: { id: existing.id },
        data: { name },
      });
    }
    return existing;
  }

  return prisma.city.create({
    data: {
      stateId,
      name,
      slug,
    },
  });
}
