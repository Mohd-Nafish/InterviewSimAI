import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}

export interface StorageOptions {
  version?: number;
  namespace?: string;
}

export interface TypedStorage<T> {
  readonly key: string;
  get(): Promise<T | null>;
  set(value: T): Promise<void>;
  update(updater: (current: T | null) => T): Promise<T>;
  remove(): Promise<void>;
  exists(): Promise<boolean>;
}

const DEFAULT_NAMESPACE = '@interviewsim';

const buildKey = (key: string, options: StorageOptions = {}): string => {
  const namespace = options.namespace ?? DEFAULT_NAMESPACE;
  const versioned = options.version != null ? `${key}/v${options.version}` : key;
  return `${namespace}:${versioned}`;
};

export function createStorage<T>(
  key: string,
  options: StorageOptions = {},
): TypedStorage<T> {
  const fullKey = buildKey(key, options);

  const get = async (): Promise<T | null> => {
    let raw: string | null;
    try {
      raw = await AsyncStorage.getItem(fullKey);
    } catch (err) {
      throw new StorageError(`Failed to read storage key "${fullKey}"`, err);
    }
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      throw new StorageError(
        `Stored value at "${fullKey}" is not valid JSON`,
        err,
      );
    }
  };

  const set = async (value: T): Promise<void> => {
    let serialized: string;
    try {
      serialized = JSON.stringify(value);
    } catch (err) {
      throw new StorageError(
        `Value for "${fullKey}" is not JSON-serializable`,
        err,
      );
    }
    try {
      await AsyncStorage.setItem(fullKey, serialized);
    } catch (err) {
      throw new StorageError(`Failed to write storage key "${fullKey}"`, err);
    }
  };

  const remove = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(fullKey);
    } catch (err) {
      throw new StorageError(`Failed to remove storage key "${fullKey}"`, err);
    }
  };

  const exists = async (): Promise<boolean> => {
    try {
      const raw = await AsyncStorage.getItem(fullKey);
      return raw != null;
    } catch (err) {
      throw new StorageError(`Failed to probe storage key "${fullKey}"`, err);
    }
  };

  const update = async (updater: (current: T | null) => T): Promise<T> => {
    const current = await get();
    const next = updater(current);
    await set(next);
    return next;
  };

  return { key: fullKey, get, set, update, remove, exists };
}

export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (err) {
    throw new StorageError('Failed to clear storage', err);
  }
};
