import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      if (window.electronAPI) {
        try {
          const user = await window.electronAPI.getCurrentUser();
          setCurrentUser(user);
        } catch (_e) {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    }
    checkUser();
  }, []);

  const login = async (username, password) => {
    if (window.electronAPI) {
      const user = await window.electronAPI.login(username, password);
      setCurrentUser(user);
      return user;
    }
  };

  const logout = async () => {
    if (window.electronAPI) {
      await window.electronAPI.logout();
      setCurrentUser(null);
    }
  };

  if (loading) return <div style={{ padding: 40, color: '#fff' }}>Loading...</div>;

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
