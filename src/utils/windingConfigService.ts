import {
  saveWindingTemplatesToFirestore,
  fetchWindingTemplatesFromFirestore,
} from './firebase';

export interface WindingDefinition {
  id: number; // 1 al 8
  title: string;
  category: 'Bobinado exterior' | 'Bobinado interior';
  exitName: string;
  shortDescription: string;
  color: string;
  imageUrl?: string; // Imagen personalizada subida por el usuario (base64 o URL)
  updatedAt?: string;
}

const STORAGE_KEY = 'aravo_custom_winding_directions_v2';
const EVENT_NAME = 'aravo_winding_directions_updated';

export const DEFAULT_WINDING_DEFINITIONS: WindingDefinition[] = [
  {
    id: 1,
    title: '1. Bobinado exterior - Salida izquierda',
    category: 'Bobinado exterior',
    exitName: 'Salida izquierda',
    shortDescription: 'Bobinado exterior: El papel pasa por encima de la bobina con salida izquierda',
    color: '#009688',
  },
  {
    id: 2,
    title: '2. Bobinado exterior - Salida derecha',
    category: 'Bobinado exterior',
    exitName: 'Salida derecha',
    shortDescription: 'Bobinado exterior: El papel pasa por encima de la bobina con salida derecha',
    color: '#f4511e',
  },
  {
    id: 3,
    title: '3. Bobinado exterior - Salida de pie',
    category: 'Bobinado exterior',
    exitName: 'Salida de pie',
    shortDescription: 'Bobinado exterior: El papel pasa por encima de la bobina con salida de pie',
    color: '#d81b60',
  },
  {
    id: 4,
    title: '4. Bobinado exterior - Salida cabeza',
    category: 'Bobinado exterior',
    exitName: 'Salida cabeza',
    shortDescription: 'Bobinado exterior: El papel pasa por encima de la bobina con salida cabeza',
    color: '#8bc34a',
  },
  {
    id: 5,
    title: '5. Bobinado interior - Salida izquierda',
    category: 'Bobinado interior',
    exitName: 'Salida izquierda',
    shortDescription: 'Bobinado interior: El papel pasa por debajo de la bobina con salida izquierda',
    color: '#29b6f6',
  },
  {
    id: 6,
    title: '6. Bobinado interior - Salida derecha',
    category: 'Bobinado interior',
    exitName: 'Salida derecha',
    shortDescription: 'Bobinado interior: El papel pasa por debajo de la bobina con salida derecha',
    color: '#8e24aa',
  },
  {
    id: 7,
    title: '7. Bobinado interior - Salida de pie',
    category: 'Bobinado interior',
    exitName: 'Salida de pie',
    shortDescription: 'Bobinado interior: El papel pasa por debajo de la bobina con salida de pie',
    color: '#fbc02d',
  },
  {
    id: 8,
    title: '8. Bobinado interior - Salida cabeza',
    category: 'Bobinado interior',
    exitName: 'Salida cabeza',
    shortDescription: 'Bobinado interior: El papel pasa por debajo de la bobina con salida cabeza',
    color: '#c62828',
  },
];

/**
 * Comprime y convierte cualquier archivo de imagen (PNG, JPG, SVG, WebP)
 * a una cadena Base64 optimizada de alta calidad pero ligera para almacenamiento.
 */
export function compressAndConvertImageFile(file: File, maxDimension: number = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    // Si ya es un SVG vectorial pequeño, leer como data URL directo
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fondo transparente o blanco suave
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Obtener las definiciones actuales de sentidos de bobinado
 */
export function getWindingDefinitions(): WindingDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WINDING_DEFINITIONS));
      return DEFAULT_WINDING_DEFINITIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_WINDING_DEFINITIONS;
    }

    // Asegurar que existan los 8 sentidos combinando con defaults si falta alguno
    const map = new Map<number, WindingDefinition>();
    for (const def of DEFAULT_WINDING_DEFINITIONS) {
      map.set(def.id, { ...def });
    }
    for (const item of parsed) {
      if (item && item.id >= 1 && item.id <= 8) {
        map.set(item.id, { ...map.get(item.id)!, ...item });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  } catch (err) {
    console.error('Error al leer sentidos de bobinado:', err);
    return DEFAULT_WINDING_DEFINITIONS;
  }
}

/**
 * Guardar la lista completa de definiciones en localStorage y Firebase Firestore
 */
export function saveWindingDefinitions(defs: WindingDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defs));
    // Disparar evento para que todos los componentes se enteren
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: defs }));
    }
    // Sincronizar en segundo plano con la nube
    saveWindingTemplatesToFirestore(defs).catch(() => {});
  } catch (err) {
    console.error('Error al guardar sentidos de bobinado:', err);
  }
}

/**
 * Actualizar una definición específica por su ID (1 al 8)
 */
export function updateWindingDefinition(
  id: number,
  updates: Partial<WindingDefinition>
): WindingDefinition[] {
  const current = getWindingDefinitions();
  const next = current.map((d) =>
    d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
  );
  saveWindingDefinitions(next);
  return next;
}

/**
 * Asignar o actualizar la imagen personalizada de una posición
 */
export function setWindingImage(id: number, imageUrl: string): WindingDefinition[] {
  return updateWindingDefinition(id, { imageUrl });
}

/**
 * Eliminar la imagen personalizada de una posición
 */
export function removeWindingImage(id: number): WindingDefinition[] {
  const current = getWindingDefinitions();
  const next = current.map((d) => {
    if (d.id === id) {
      const copy = { ...d };
      delete copy.imageUrl;
      return copy;
    }
    return d;
  });
  saveWindingDefinitions(next);
  return next;
}

/**
 * Restablecer todos los sentidos a los valores y configuraciones de fábrica
 */
export function resetWindingDefinitions(): WindingDefinition[] {
  saveWindingDefinitions(DEFAULT_WINDING_DEFINITIONS);
  return DEFAULT_WINDING_DEFINITIONS;
}

/**
 * Sincronizar definiciones desde Firebase Firestore al cargar la app
 */
export async function syncWindingDefinitionsWithCloud(): Promise<WindingDefinition[]> {
  try {
    const cloudDefs = await fetchWindingTemplatesFromFirestore();
    if (cloudDefs && Array.isArray(cloudDefs) && cloudDefs.length > 0) {
      const local = getWindingDefinitions();
      const localMap = new Map<number, WindingDefinition>();
      for (const l of local) localMap.set(l.id, l);

      for (const cd of cloudDefs) {
        if (cd && cd.id >= 1 && cd.id <= 8) {
          const prev = localMap.get(cd.id) || DEFAULT_WINDING_DEFINITIONS[cd.id - 1];
          localMap.set(cd.id, {
            ...prev,
            ...cd,
            imageUrl: cd.imageUrl || prev.imageUrl,
          });
        }
      }

      const consolidated = Array.from(localMap.values()).sort((a, b) => a.id - b.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consolidated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: consolidated }));
      }
      return consolidated;
    } else {
      // Si la nube está vacía, subir las actuales
      const current = getWindingDefinitions();
      saveWindingTemplatesToFirestore(current).catch(() => {});
      return current;
    }
  } catch (err) {
    console.warn('Sincronización en la nube de sentidos de bobinado:', err);
    return getWindingDefinitions();
  }
}

/**
 * Hook/Suscripción a cambios de definiciones
 */
export function onWindingDefinitionsChange(callback: (defs: WindingDefinition[]) => void): () => void {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<WindingDefinition[]>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getWindingDefinitions());
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }
  return () => {};
}
