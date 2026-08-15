export function getReorderedFavoriteIds(visibleItems = [], remainingItems = [], activeId, overId) {
  if (!overId || activeId === overId) return null;
  const oldIndex = visibleItems.findIndex((item) => item.id === activeId);
  const newIndex = visibleItems.findIndex((item) => item.id === overId);
  if (oldIndex < 0 || newIndex < 0) return null;

  const reordered = [...visibleItems];
  const [movedItem] = reordered.splice(oldIndex, 1);
  reordered.splice(newIndex, 0, movedItem);
  const visibleIds = reordered.map((item) => item.id);

  return {
    visibleIds,
    allIds: [...visibleIds, ...remainingItems.map((item) => item.id)],
  };
}
