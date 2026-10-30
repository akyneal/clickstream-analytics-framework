/**
 * Ecommerce helpers for Phase 5 catalog tracking.
 * Builds GA4 ecommerce item objects and payloads.
 */

/** Input shape accepted by toItem. Callers derive these from domain objects. */
export interface ToItemInput {
  id: string;
  name: string;
  category: 'course' | 'class' | 'event' | 'resource';
  category2?: string;
  brand: 'platform' | 'tutor';
  variant: 'free' | 'one_time' | 'subscription' | 'subscribers_only';
  price: number;
}

/** GA4 ecommerce item shape. */
export interface GA4Item {
  item_id: string;
  item_name: string;
  item_category: string;
  item_category2?: string;
  item_brand: string;
  item_variant: string;
  price: number;
  index?: number;
  item_list_name?: string;
}

/** Maximum items sent in a view_item_list event. */
export const MAX_LIST_ITEMS = 20;

/**
 * Build a GA4 ecommerce item from a domain content object.
 *
 * Rules:
 * - `item_name` = published title (caller must pass the correct field, no sanitization here)
 * - `price` = 0 for free items
 * - `index` is 0-based, set only in list contexts
 * - `item_list_name` is set only when `listName` is provided
 * - `item_category2` is omitted when undefined
 */
export function toItem(
  content: ToItemInput,
  listName?: string,
  index?: number,
): GA4Item {
  const item: GA4Item = {
    item_id: content.id,
    item_name: content.name,
    item_category: content.category,
    item_brand: content.brand,
    item_variant: content.variant,
    price: content.price,
  };

  if (content.category2 !== undefined && content.category2 !== null && content.category2 !== '') {
    item.item_category2 = content.category2;
  }

  if (index !== undefined) {
    item.index = index;
  }

  if (listName !== undefined) {
    item.item_list_name = listName;
  }

  return item;
}

/**
 * Wrap items in an ecommerce payload.
 * Currency is always "USD" when items have prices.
 */
export function buildEcommerce(
  items: GA4Item[],
  options?: { currency?: string; value?: number },
): Record<string, unknown> {
  const eco: Record<string, unknown> = { items };
  eco.currency = options?.currency ?? 'USD';
  if (options?.value !== undefined) eco.value = options.value;
  return eco;
}
