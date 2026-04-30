import { useState, useEffect } from 'react';
import { fetchMenuItems } from '../services/menuService';

const useMenu = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMenuItems()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { items, loading, error };
};

export default useMenu;
