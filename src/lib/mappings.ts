// src/lib/mappings.ts

export const PUBLIC_CATEGORIES = ["AUTRE", "INFO"] as const;
export type TagMapping = Record<string, string>;


export function getAllCategories(mapping: TagMapping): string[] {
  return [...PUBLIC_CATEGORIES, ...Object.values(mapping)];
}

export function getAllowedCategories(
  userTags: string[], 
  isSuperAdmin: boolean, 
  mapping: TagMapping 
): string[] {
  if (isSuperAdmin) {
    return getAllCategories(mapping);
  }

  const allowed = new Set<string>(PUBLIC_CATEGORIES);
  userTags.forEach((tag) => {
    const category = mapping[tag];
    if (category) {
      allowed.add(category);
    }
  });

  return Array.from(allowed);
}

export async function getTagMappingFromDB(): Promise<TagMapping> {
  const { prisma } = await import("./prisma"); 
  const mappings = await prisma.categoryMapping.findMany();
  const map: TagMapping = {};
  mappings.forEach(m => { map[m.tag] = m.category; });
  return map;
}

/**
 * Vérifie si l'utilisateur peut éditer une catégorie.
 * Retourne true si c'est public OU si l'user a le tag correspondant.
 */
export function canEditCategory(
  userTags: string[] = [], 
  targetCategory: string = "", 
  mapping: TagMapping = {}
): boolean {
  const cat = (targetCategory || "AUTRE").toUpperCase();

  // Les catégories publiques sont modifiables par tout le monde
  if (PUBLIC_CATEGORIES.includes(cat as any)) {
    return true;
  }

  // Pour le reste (COMITS, SPORT, etc.), il faut posséder le tag qui pointe vers cette catégorie
  // On vérifie si parmis les tags de l'user, l'un d'eux est mappé sur 'cat' en base
  return userTags.some(tag => mapping[tag] === cat);
}