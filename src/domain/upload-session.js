const STORE_LABELS = {
  paknsave: "Pak'nSave",
  newworld: "New World",
  woolworths: "Woolworths"
};

export function getStoreLabel(storeKey) {
  return STORE_LABELS[storeKey] ?? storeKey;
}

export class UploadSessionStore {
  constructor() {
    this.sessions = new Map();
  }

  start(chatId, storeKey) {
    this.sessions.set(String(chatId), {
      storeKey,
      imageUrls: []
    });
  }

  addImage(chatId, imageUrl) {
    const session = this.sessions.get(String(chatId));
    if (!session) {
      return null;
    }

    session.imageUrls.push(imageUrl);
    return session;
  }

  get(chatId) {
    return this.sessions.get(String(chatId)) ?? null;
  }

  clear(chatId) {
    this.sessions.delete(String(chatId));
  }
}
