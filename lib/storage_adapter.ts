// Web-compatible storage adapter for Supabase that works with SSR

class WebSafeStorageAdapter {
  private storage: any = null;
  private isInitialized = false;

  private async initStorage() {
    if (this.isInitialized) return;
    
    // Only import AsyncStorage on client-side or non-web platforms
    if (typeof window !== 'undefined') {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        this.storage = AsyncStorage;
      } catch (error) {
        console.warn('AsyncStorage not available:', error);
      }
    }
    
    this.isInitialized = true;
  }

  async getItem(key: string): Promise<string | null> {
    await this.initStorage();
    if (!this.storage) return null;
    try {
      return await this.storage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.initStorage();
    if (!this.storage) return;
    try {
      await this.storage.setItem(key, value);
    } catch {
      // Silently fail
    }
  }

  async removeItem(key: string): Promise<void> {
    await this.initStorage();
    if (!this.storage) return;
    try {
      await this.storage.removeItem(key);
    } catch {
      // Silently fail
    }
  }
}

export const webSafeStorage = new WebSafeStorageAdapter();
