/**
 * Resolve exam_category from a test's categoryId.
 * Walks up to the root category and returns its slug.
 * Returns undefined when unresolvable — never hardcodes.
 *
 * Two category sources are supported:
 *  1. Practice-test categories (parentCategoryId), supplied by the app through
 *     setPracticeCategoriesProvider() — for example from a global store.
 *  2. Question-bank categories (parentId, level), passed per call as
 *     `qbCategories` when the page has them loaded.
 */

/** Minimal shape for practice-test categories. */
export interface PracticeCategoryLike {
  id: string;
  name: string;
  parentCategoryId?: string | null;
}

/** Minimal shape for question-bank categories. */
interface QBCategoryLike {
  id: string;
  name: string;
  parentId?: string | null;
  level?: number;
  subcategories?: QBCategoryLike[];
}

let practiceCategories: () => PracticeCategoryLike[] = () => [];

/** Register where practice-test categories come from (call once at startup). */
export function setPracticeCategoriesProvider(provider: () => PracticeCategoryLike[]): void {
  practiceCategories = provider;
}

/** "SAT" -> "sat", "AP Calculus" -> "ap-calculus". */
function categorySlug(name?: string): string {
  return (name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Flatten a QB category tree into a flat array. */
function flattenQBTree(nodes: QBCategoryLike[]): QBCategoryLike[] {
  const out: QBCategoryLike[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.subcategories?.length) {
      out.push(...flattenQBTree(n.subcategories));
    }
  }
  return out;
}

export function resolveExamCategory(
  categoryId: string | undefined,
  qbCategories?: QBCategoryLike[],
): string | undefined {
  if (!categoryId) return undefined;

  // 1. Practice-test categories (parentCategoryId)
  const categories = practiceCategories();
  let cat = categories.find(c => c.id === categoryId);
  if (cat) {
    while (cat!.parentCategoryId) {
      const parent = categories.find(c => c.id === cat!.parentCategoryId);
      if (!parent) break;
      cat = parent;
    }
    return categorySlug(cat!.name) || undefined;
  }

  // 2. Question-bank categories (parentId / level)
  if (qbCategories?.length) {
    const flat = flattenQBTree(qbCategories);
    let qbCat = flat.find(c => c.id === categoryId);
    if (qbCat) {
      while (qbCat!.parentId) {
        const parent = flat.find(c => c.id === qbCat!.parentId);
        if (!parent) break;
        qbCat = parent;
      }
      return categorySlug(qbCat!.name) || undefined;
    }
  }

  // Unresolvable — the QB hierarchy may not be loaded on this page.
  return undefined;
}
