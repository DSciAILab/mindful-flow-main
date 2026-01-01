
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function useFirestore<T>(key: string, initialValue: T, userId?: string) {
  // Optimistic local state
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
        setLoading(false);
        return;
    }

    const docRef = doc(db, 'users', userId, 'data', key);
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data().value;
        // Only update if data is effectively different to avoid loops if needed, 
        // though React's setState usually handles identity checks.
        setData(cloudData as T);
      } else {
        // Doc doesn't exist yet, we stick with initialValue
        // Optionally write initialValue to cloud:
        // setDoc(docRef, { value: initialValue }, { merge: true });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore read error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, key]);

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // 1. Resolve value (handle functional updates)
      // Note: We use the current 'data' state. If 'data' is stale (e.g. before initial load), 
      // we might overwrite. This is why we rely on 'loading' in the UI to prevent writes before load.
      const valueToStore = value instanceof Function ? value(data) : value;
      
      // 2. Update local state immediately (Optimistic UI)
      setData(valueToStore);

      // 3. Sync to Firestore
      if (userId) {
        const docRef = doc(db, 'users', userId, 'data', key);
        // We store everything under a 'value' field to support arrays/primitives easily
        await setDoc(docRef, { value: valueToStore }, { merge: true });
      }
    } catch (error) {
      console.error("Error writing to Firestore", error);
      // Ideally, revert local state here if write fails
    }
  };

  return [data, setValue, loading] as const;
}
