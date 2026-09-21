const STORAGE_KEY = 'cimbarTextBundleDraftV1';

export async function loadDraft() {
  if (globalThis.chrome?.storage?.local) {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] ?? null;
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export async function saveDraft(draft) {
  if (globalThis.chrome?.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: draft });
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}
