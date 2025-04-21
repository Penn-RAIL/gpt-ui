import { useState, useEffect } from 'react';

// Hook to manage state backed by localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Get stored value from localStorage or use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading localStorage key \"" + key + "\":", error);
      return initialValue;
    }
  });

  // Update localStorage whenever the state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
        try {
          const valueToStore = storedValue instanceof Function ? storedValue(storedValue) : storedValue;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.error("Error setting localStorage key \"" + key + "\":", error);
        }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage; 