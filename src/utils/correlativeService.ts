import {
  saveCorrelativeConfigToFirestore,
  fetchCorrelativeConfigFromFirestore,
} from './firebase';

export interface CorrelativeConfig {
  otPrefix: string;
  otNextNumber: number;
  otDigits: number;
  quotePrefix: string;
  quoteNextNumber: number;
  quoteDigits: number;
  updatedAt?: string;
}

const STORAGE_KEY = 'aravo_correlative_config_v1';

export const DEFAULT_CORRELATIVE_CONFIG: CorrelativeConfig = {
  otPrefix: 'OT-',
  otNextNumber: 1001,
  otDigits: 5,
  quotePrefix: 'PRES-',
  quoteNextNumber: 1001,
  quoteDigits: 5,
};

/**
 * Format number with prefix and zero-padded length
 * e.g. formatCorrelative('OT-', 450, 5) => 'OT-00450'
 */
export function formatCorrelative(prefix: string, num: number, digits: number = 4): string {
  const safeNum = Math.max(1, Math.floor(Number(num) || 1));
  const safeDigits = Math.max(1, Math.min(10, Math.floor(Number(digits) || 4)));
  const padded = String(safeNum).padStart(safeDigits, '0');
  return `${prefix || ''}${padded}`;
}

/**
 * Read current correlative configuration from localStorage
 */
export function getCorrelativeConfig(): CorrelativeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        otPrefix: typeof parsed.otPrefix === 'string' ? parsed.otPrefix : DEFAULT_CORRELATIVE_CONFIG.otPrefix,
        otNextNumber: typeof parsed.otNextNumber === 'number' ? Math.max(1, parsed.otNextNumber) : DEFAULT_CORRELATIVE_CONFIG.otNextNumber,
        otDigits: typeof parsed.otDigits === 'number' ? Math.max(1, parsed.otDigits) : DEFAULT_CORRELATIVE_CONFIG.otDigits,
        quotePrefix: typeof parsed.quotePrefix === 'string' ? parsed.quotePrefix : DEFAULT_CORRELATIVE_CONFIG.quotePrefix,
        quoteNextNumber: typeof parsed.quoteNextNumber === 'number' ? Math.max(1, parsed.quoteNextNumber) : DEFAULT_CORRELATIVE_CONFIG.quoteNextNumber,
        quoteDigits: typeof parsed.quoteDigits === 'number' ? Math.max(1, parsed.quoteDigits) : DEFAULT_CORRELATIVE_CONFIG.quoteDigits,
        updatedAt: parsed.updatedAt,
      };
    }
  } catch (err) {
    console.error('Error reading correlative config:', err);
  }
  return { ...DEFAULT_CORRELATIVE_CONFIG };
}

/**
 * Save updated correlative config to localStorage and Firestore cloud
 */
export function saveCorrelativeConfig(partial: Partial<CorrelativeConfig>): CorrelativeConfig {
  const current = getCorrelativeConfig();
  const updated: CorrelativeConfig = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error persisting correlative config to localStorage:', err);
  }

  // Cloud sync in background
  saveCorrelativeConfigToFirestore(updated).catch((err) => {
    console.warn('Could not sync correlatives to Firestore:', err);
  });

  // Notify components listening to correlative updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aravo-correlative-changed', { detail: updated }));
  }

  return updated;
}

/**
 * Get next formatted OT number without necessarily consuming it, or increment it
 */
export function getNextOtNumber(consume: boolean = false): string {
  const config = getCorrelativeConfig();
  const formatted = formatCorrelative(config.otPrefix, config.otNextNumber, config.otDigits);
  if (consume) {
    saveCorrelativeConfig({ otNextNumber: config.otNextNumber + 1 });
  }
  return formatted;
}

/**
 * Get next formatted Quote number without necessarily consuming it, or increment it
 */
export function getNextQuoteNumber(consume: boolean = false): string {
  const config = getCorrelativeConfig();
  const formatted = formatCorrelative(config.quotePrefix, config.quoteNextNumber, config.quoteDigits);
  if (consume) {
    saveCorrelativeConfig({ quoteNextNumber: config.quoteNextNumber + 1 });
  }
  return formatted;
}

/**
 * Increment OT counter by 1
 */
export function incrementOtCounter(): number {
  const config = getCorrelativeConfig();
  const next = config.otNextNumber + 1;
  saveCorrelativeConfig({ otNextNumber: next });
  return next;
}

/**
 * Increment Quote counter by 1
 */
export function incrementQuoteCounter(): number {
  const config = getCorrelativeConfig();
  const next = config.quoteNextNumber + 1;
  saveCorrelativeConfig({ quoteNextNumber: next });
  return next;
}

/**
 * Sync correlative configuration from Firestore
 */
export async function syncCorrelativeWithCloud(): Promise<CorrelativeConfig> {
  try {
    const cloudConfig = await fetchCorrelativeConfigFromFirestore();
    if (cloudConfig) {
      const local = getCorrelativeConfig();
      // If cloud is newer or local is default, take cloud
      const cloudDate = cloudConfig.updatedAt ? new Date(cloudConfig.updatedAt).getTime() : 0;
      const localDate = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;

      if (cloudDate >= localDate) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudConfig));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('aravo-correlative-changed', { detail: cloudConfig }));
        }
        return cloudConfig;
      }
    }
  } catch (err) {
    console.warn('Error syncing correlatives from cloud:', err);
  }
  return getCorrelativeConfig();
}
