import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';

function normalizeSearchValue(value = '') {
  return String(value).trim().toLocaleLowerCase('pt-BR');
}

function toDisplayNamePrefix(value = '') {
  return normalizeSearchValue(value)
    .split(/\s+/)
    .map((part) => part ? `${part[0].toLocaleUpperCase('pt-BR')}${part.slice(1)}` : '')
    .join(' ');
}

function userRelevance(user, normalizedTerm) {
  const searchName = normalizeSearchValue(user.searchName);
  const displayName = normalizeSearchValue(user.displayName || user.name);

  if (searchName === normalizedTerm || displayName === normalizedTerm) return 0;
  if (searchName.startsWith(normalizedTerm)) return 1;
  if (displayName.startsWith(normalizedTerm)) return 2;
  return 3;
}

export function mergePublicUserSnapshots(settledSnapshots, searchTerm) {
  const successfulSnapshots = settledSnapshots
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  if (successfulSnapshots.length === 0) {
    const error = new Error('Não foi possível consultar os perfis agora.');
    error.cause = settledSnapshots[0]?.reason;
    throw error;
  }

  const usersById = new Map();
  successfulSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((userDoc) => {
      const user = { uid: userDoc.id, ...userDoc.data() };
      if (user.isPublic !== false && !usersById.has(userDoc.id)) {
        usersById.set(userDoc.id, user);
      }
    });
  });

  const normalizedTerm = normalizeSearchValue(searchTerm);
  const users = [...usersById.values()].sort((first, second) => {
    const relevanceDifference = userRelevance(first, normalizedTerm) - userRelevance(second, normalizedTerm);
    if (relevanceDifference !== 0) return relevanceDifference;

    return String(first.displayName || first.name || '')
      .localeCompare(String(second.displayName || second.name || ''), 'pt-BR');
  });

  return {
    users,
    partialFailure: successfulSnapshots.length < settledSnapshots.length,
  };
}

export async function searchPublicUsers(searchTerm) {
  const normalizedTerm = normalizeSearchValue(searchTerm);
  if (normalizedTerm.length < 2) return { users: [], partialFailure: false };

  const displayNamePrefix = toDisplayNamePrefix(searchTerm);
  const usersRef = collection(db, 'users');
  const querySpecs = [
    ['searchName', normalizedTerm],
    ['displayName', displayNamePrefix],
    ['name', displayNamePrefix],
  ];
  const searches = querySpecs.map(([field, value]) => getDocs(query(
    usersRef,
    where(field, '>=', value),
    where(field, '<=', `${value}\uf8ff`),
    limit(20),
  )));

  const snapshots = await Promise.allSettled(searches);
  return mergePublicUserSnapshots(snapshots, normalizedTerm);
}
