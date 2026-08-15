export const DEFAULT_PROFILE_SECTION_ORDER = ['favorites', 'journey', 'recent', 'heatmap'];

export function normalizeProfileSectionOrder(savedOrder = []) {
  const validSaved = [...new Set(
    (Array.isArray(savedOrder) ? savedOrder : [])
      .filter((id) => DEFAULT_PROFILE_SECTION_ORDER.includes(id)),
  )];
  const merged = [
    ...validSaved,
    ...DEFAULT_PROFILE_SECTION_ORDER.filter((id) => !validSaved.includes(id)),
  ];

  if (!validSaved.includes('journey')) {
    const journeyIndex = merged.indexOf('journey');
    if (journeyIndex >= 0) merged.splice(journeyIndex, 1);
    const favoritesIndex = merged.indexOf('favorites');
    merged.splice(favoritesIndex >= 0 ? favoritesIndex + 1 : 0, 0, 'journey');
  }

  return merged;
}

export function moveProfileSection(order, id, direction) {
  const current = Array.isArray(order) ? order : [];
  const fromIndex = current.indexOf(id);
  const toIndex = fromIndex + direction;
  if (fromIndex < 0 || toIndex < 0 || toIndex >= current.length) return current;

  const next = [...current];
  [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
  return next;
}
