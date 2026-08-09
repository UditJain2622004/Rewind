import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const mockUser = {
  id: 'user-1',
  name: 'Ankush Sharma',
  email: 'ankush@rewind.app',
  handle: '@ankush_rewind',
  avatar: '/images/beach-moment.png',
  joined: 'January 2024',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rewind_user');
    return saved ? JSON.parse(saved) : mockUser;
  });

  const login = (email, password) => {
    // Mock successful login
    const userData = {
      ...mockUser,
      email: email || mockUser.email,
      name: email ? email.split('@')[0] : mockUser.name,
    };
    setUser(userData);
    localStorage.setItem('rewind_user', JSON.stringify(userData));
    return userData;
  };

  const signup = (name, email, password) => {
    // Mock successful signup
    const userData = {
      id: `user-${Date.now()}`,
      name: name || 'New Storyteller',
      email: email || 'user@rewind.app',
      handle: `@${(name || 'user').toLowerCase().replace(/\s+/g, '_')}`,
      avatar: '/images/beach-moment.png',
      joined: 'August 2026',
    };
    setUser(userData);
    localStorage.setItem('rewind_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rewind_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
