export function dedupeByMalId(items = []) {
  return Array.from(
    new Map(items.filter((item) => item?.mal_id != null).map((item) => [item.mal_id, item])).values(),
  );
}
