import type { OrderMenuItem } from "@/types/order.types";
import type { PriceListItem } from "@/types/pricelist.types";

// Keep the original catalog name in order payloads: the API validates it
// against the price list and existing orders use it for reporting.
export function getPackageDisplayName(name: string): string {
  return name
    .replace(/\s*(?:[-–—]\s*)?(?:\(\s*hermina\s*\)|hermina)\s*$/i, "")
    .trim();
}

function packageKey(item: Pick<PriceListItem, "name" | "category">): string {
  return `${item.category}:${getPackageDisplayName(item.name).toLowerCase()}`;
}

export function getOfficePriceList(
  items: PriceListItem[],
  location: string,
): PriceListItem[] {
  if (!location.trim()) return [];
  const isHermina = /\bhermina\b/i.test(location);
  const activeItems = items.filter((item) => item.is_active);
  const regularItems = activeItems.filter(
    (item) => getPackageDisplayName(item.name) === item.name.trim(),
  );
  if (!isHermina) return regularItems;

  // Shared items (including add-ons) remain available. A Hermina variant
  // replaces its regular counterpart instead of showing both prices.
  const byPackage = new Map(
    regularItems.map((item) => [packageKey(item), item]),
  );
  for (const item of activeItems) {
    if (getPackageDisplayName(item.name) !== item.name.trim()) {
      byPackage.set(packageKey(item), item);
    }
  }
  return [...byPackage.values()];
}

export function repriceDayOrders(
  dayOrders: Record<string, OrderMenuItem[]>,
  catalog: PriceListItem[],
  location: string,
): Record<string, OrderMenuItem[]> {
  const available = getOfficePriceList(catalog, location);
  const byPackage = new Map(available.map((item) => [packageKey(item), item]));
  return Object.fromEntries(
    Object.entries(dayOrders).map(([date, items]) => [
      date,
      items.flatMap((item) => {
        const original = catalog.find((entry) => entry.name === item.name);
        const replacement = original
          ? byPackage.get(packageKey(original))
          : undefined;
        return replacement
          ? [
              {
                name: replacement.name,
                qty: item.qty,
                unit_price: replacement.price,
              },
            ]
          : [];
      }),
    ]),
  );
}

export function resolvePickupLocation(
  requested: string,
  pickupPoints: string[],
): string {
  const normalized = requested.trim().toLowerCase();
  if (!normalized) return "";
  const exact = pickupPoints.find(
    (point) => point.toLowerCase() === normalized,
  );
  if (exact) return exact;
  // Short office links resolve only when there is one matching active point.
  const alias = normalized === "gama" ? "gama tower" : normalized;
  if (!["trinity", "gama tower", "hermina"].includes(alias)) return "";
  const matches = pickupPoints.filter((point) =>
    point.toLowerCase().includes(alias),
  );
  return matches.length === 1 ? matches[0] : "";
}
