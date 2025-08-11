
"use client"

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User, UserRole } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// This is a simplified simulation. In a real app, you'd fetch this from Firestore
// based on the FirebaseUser's UID.
const userRoles: Record<string, UserRole> = {
  'chefe@namata.com': 'Chefe',
  'portaria@namata.com': 'Portaria',
  'garcom@namata.com': 'Garçom',
  'bar@namata.com': 'Bar',
  'financeiro@namata.com': 'Financeiro',
  'cozinha@namata.com': 'Cozinha',
  'caixa@namata.com': 'Caixa',
};


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // This is a simplified mapping. In a real app, you'd fetch user profile from Firestore.
        const role = firebaseUser.email ? userRoles[firebaseUser.email] || 'Garçom' : 'Garçom';
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email || 'Usuário',
          email: firebaseUser.email || '',
          role: role,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    await auth.signOut();
    setUser(null);
    router.push('/login');
    setLoading(false);
  };

  // We don't provide a login function as it's handled by Firebase UI or custom logic
  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
