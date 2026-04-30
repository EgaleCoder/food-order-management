/**
 * MenuContext – caches menu items in React state so the API is called only once
 * per app session (or until a manual refresh is triggered).
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { fetchMenuItems } from '../services/menuService';


const MenuContext = createContext(null);

export const MenuProvider = ({ children }) => {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [fetched, setFetched] = useState(false); // ← cache flag

  const loadMenu = useCallback(async (force = false) => {
    if (fetched && !force) {
      //logger.debug('[MenuContext] Cache hit – skipping fetch');
      return;
    }
    //logger.info('[MenuContext] Fetching menu items from API');
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMenuItems();
      setItems(data);
      setFetched(true);
      //logger.info(`[MenuContext] Fetched ${data.length} menu items`);
    } catch (e) {
      //logger.error('[MenuContext] Failed to fetch menu items', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetched]);

  return (
    <MenuContext.Provider value={{ items, loading, error, loadMenu }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used inside MenuProvider');
  return ctx;
};
