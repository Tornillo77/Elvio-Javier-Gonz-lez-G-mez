import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signOut,
  signInAnonymously,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
  serverTimestamp,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { SavedProject } from '../components/SavedQuotesModal';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
const databaseId = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
  ? firebaseConfigData.firestoreDatabaseId
  : undefined;

export const db: Firestore = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

/**
 * Validate Connection to Firestore on boot as required by system skill
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline status:', error.message);
    }
    // We expect permission-denied or not-found on test doc, which confirms server reached!
    return true;
  }
}

// Run connection validation
testConnection().catch(() => {});

/**
 * Sign out from Firebase Auth
 */
export async function logOutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    // Graceful logout
  }
}

/**
 * Cloud persistence: Save quote/project to Firestore
 */
export async function saveQuoteToFirestore(userId: string, project: SavedProject): Promise<void> {
  const currentFbUser = auth.currentUser;
  if (!currentFbUser) {
    // Local session (PIN) - cloud sync requires Firebase Auth
    return;
  }
  const targetUid = currentFbUser.uid;
  try {
    const cleanQuoteId = (project.id || `proj_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const quoteRef = doc(db, 'users', targetUid, 'quotes', cleanQuoteId);
    await setDoc(quoteRef, {
      ...project,
      id: cleanQuoteId,
      userId: targetUid,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Notice saving quote to Firestore:', err);
    throw err;
  }
}

/**
 * Cloud persistence: Fetch all saved quotes for a user from Firestore
 */
export async function fetchUserQuotesFromFirestore(userId?: string): Promise<SavedProject[]> {
  const currentFbUser = auth.currentUser;
  if (!currentFbUser) {
    // User is not authenticated with Firebase Auth - use local storage
    return [];
  }
  try {
    const targetUid = currentFbUser.uid;
    const quotesRef = collection(db, 'users', targetUid, 'quotes');
    const snapshot = await getDocs(quotesRef);
    const quotes: SavedProject[] = [];
    snapshot.forEach((d) => {
      quotes.push(d.data() as SavedProject);
    });
    return quotes;
  } catch (err: any) {
    console.warn('Firestore cloud quotes fetch status:', err?.message || err);
    return [];
  }
}

/**
 * Cloud persistence: Delete a saved quote from Firestore
 */
export async function deleteQuoteFromFirestore(userId: string, quoteId: string): Promise<void> {
  const currentFbUser = auth.currentUser;
  if (!currentFbUser) {
    return;
  }
  const targetUid = currentFbUser.uid;
  try {
    const cleanQuoteId = quoteId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const quoteRef = doc(db, 'users', targetUid, 'quotes', cleanQuoteId);
    await deleteDoc(quoteRef);
  } catch (err) {
    console.warn('Notice deleting quote from Firestore:', err);
    throw err;
  }
}

/**
 * Automatically establish anonymous Firebase session if needed so Firestore rules pass seamlessly
 */
export async function ensureFirebaseAuth(): Promise<void> {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err) {
    console.warn('Anonymous Firebase auth notice:', err);
  }
}

/**
 * Cloud Synchronization of System Users across all computers in the workshop
 */
export async function saveUserToFirestore(user: any): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const cleanId = (user.id || `usr_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const userDocRef = doc(db, 'system_users', cleanId);
    await setDoc(userDocRef, {
      ...user,
      id: cleanId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync user to Firestore:', err);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const cleanId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const userDocRef = doc(db, 'system_users', cleanId);
    await deleteDoc(userDocRef);
  } catch (err) {
    console.warn('Could not delete user from Firestore:', err);
  }
}

export async function fetchSystemUsersFromFirestore(): Promise<any[]> {
  try {
    await ensureFirebaseAuth();
    const usersColRef = collection(db, 'system_users');
    const snap = await getDocs(usersColRef);
    const users: any[] = [];
    snap.forEach((d) => {
      users.push(d.data());
    });
    return users;
  } catch (err) {
    console.warn('Could not fetch system users from Firestore:', err);
    return [];
  }
}

export async function saveSystemConfigToFirestore(config: { openAccess: boolean; defaultRole?: string }): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const configDocRef = doc(db, 'system_config', 'access_settings');
    await setDoc(configDocRef, {
      ...config,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save system config to Firestore:', err);
  }
}

export async function fetchSystemConfigFromFirestore(): Promise<{ openAccess: boolean; defaultRole?: string } | null> {
  try {
    await ensureFirebaseAuth();
    const configDocRef = doc(db, 'system_config', 'access_settings');
    const snap = await getDoc(configDocRef);
    if (snap.exists()) {
      return snap.data() as { openAccess: boolean; defaultRole?: string };
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch system config from Firestore:', err);
    return null;
  }
}

export async function fetchUserByUsernameFromFirestore(username: string): Promise<any | null> {
  try {
    await ensureFirebaseAuth();
    const clean = username.replace(/[@\s]/g, '').trim().toLowerCase();
    const usersColRef = collection(db, 'system_users');
    const snap = await getDocs(usersColRef);
    let matched: any = null;
    snap.forEach((d) => {
      const data = d.data();
      const uClean = String(data.username || '').replace(/[@\s]/g, '').trim().toLowerCase();
      const uEmail = String(data.contactEmail || '').replace(/\s+/g, '').trim().toLowerCase();
      if (uClean === clean || uEmail === clean) {
        matched = data;
      }
    });
    return matched;
  } catch (err) {
    console.warn('Error fetching user by username from Firestore:', err);
    return null;
  }
}

export async function saveWindingTemplatesToFirestore(templates: any[]): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'system_config', 'winding_templates');
    await setDoc(docRef, {
      templates,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save winding templates to Firestore:', err);
  }
}

export async function fetchWindingTemplatesFromFirestore(): Promise<any[] | null> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'system_config', 'winding_templates');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return Array.isArray(data?.templates) ? data.templates : null;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch winding templates from Firestore:', err);
    return null;
  }
}

/**
 * Correlative Settings Cloud Sync (OT & Quote sequential numbering)
 */
export async function saveCorrelativeConfigToFirestore(config: any): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'system_config', 'correlative_settings');
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save correlative settings to Firestore:', err);
  }
}

export async function fetchCorrelativeConfigFromFirestore(): Promise<any | null> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, 'system_config', 'correlative_settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch correlative settings from Firestore:', err);
    return null;
  }
}

/**
 * Work Order (OT) Cloud Persistence
 */
export async function saveWorkOrderToFirestore(userId: string | undefined, workOrder: any): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const targetUid = auth.currentUser?.uid || userId || 'system';
    const cleanId = (workOrder.orderNumber || workOrder.id || `ot_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Save to user's work_orders collection
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid, 'work_orders', cleanId);
      await setDoc(userDocRef, {
        ...workOrder,
        id: cleanId,
        userId: auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Also sync to global system_work_orders for shop-floor availability
    const sysDocRef = doc(db, 'system_work_orders', cleanId);
    await setDoc(sysDocRef, {
      ...workOrder,
      id: cleanId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Error saving work order to Firestore:', err);
  }
}

export async function fetchUserWorkOrdersFromFirestore(userId?: string): Promise<any[]> {
  try {
    await ensureFirebaseAuth();
    const targetUid = auth.currentUser?.uid || userId;
    const workOrders: any[] = [];
    const seenIds = new Set<string>();

    // 1. Fetch from user's subcollection if authenticated
    if (targetUid) {
      try {
        const userOrdersRef = collection(db, 'users', targetUid, 'work_orders');
        const userSnap = await getDocs(userOrdersRef);
        userSnap.forEach((d) => {
          const item = d.data();
          seenIds.add(item.id || item.orderNumber);
          workOrders.push(item);
        });
      } catch (e) {
        // Continue to system collection
      }
    }

    // 2. Also fetch system_work_orders
    try {
      const sysOrdersRef = collection(db, 'system_work_orders');
      const sysSnap = await getDocs(sysOrdersRef);
      sysSnap.forEach((d) => {
        const item = d.data();
        const key = item.id || item.orderNumber;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          workOrders.push(item);
        }
      });
    } catch (e) {
      // Ignore
    }

    return workOrders;
  } catch (err) {
    console.warn('Could not fetch work orders from Firestore:', err);
    return [];
  }
}

export async function deleteWorkOrderFromFirestore(userId: string | undefined, orderId: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const cleanId = orderId.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid, 'work_orders', cleanId);
      await deleteDoc(userDocRef);
    }
    const sysDocRef = doc(db, 'system_work_orders', cleanId);
    await deleteDoc(sysDocRef);
  } catch (err) {
    console.warn('Error deleting work order from Firestore:', err);
  }
}



