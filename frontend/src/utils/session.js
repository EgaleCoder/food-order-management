/**
 * Anonymous session manager.
 * Generates and persists a UUID in localStorage so each browser tab/window
 * has a stable identity for the DB cart, without requiring authentication.
 */

const SESSION_KEY = 'food_session_id';

export const getSessionId = () => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};
