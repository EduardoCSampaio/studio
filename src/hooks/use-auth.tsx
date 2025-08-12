
"use client"

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { User, UserRole, SystemEvent } from '@/lib/data';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  getChefeId: () => string | null;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "admin@namata.com";

const logSystemEvent = async (event: Omit<SystemEvent, 'id' | 'timestamp'>) => {
    try {
        await addDoc(collection(db, "system_events"), {
            ...event,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Failed to log system event:", error);
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        // Special case for the admin user
        if (firebaseUser.email === ADMIN_EMAIL) {
            setUser({
                id: firebaseUser.uid,
                name: 'Admin',
                email: ADMIN_EMAIL,
                role: 'Admin'
            });
        } else {
            // Logic for all other users
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", firebaseUser.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                setUser({
                    id: userDoc.id,
                    name: userData.name || firebaseUser.displayName || 'Usuário',
                    email: firebaseUser.email,
                    role: userData.role as UserRole,
                    chefeId: userData.chefeId
                });
            } else {
                console.warn(`User ${firebaseUser.email} found in Auth but not in Firestore.`);
                logSystemEvent({
                    level: 'warning',
                    message: `Usuário autenticado (${firebaseUser.email}) não encontrado no banco de dados Firestore.`
                });
                setUser(null);
            }
        }
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
  };

  const getChefeId = React.useCallback((): string | null => {
    if (!user) return null;
    return user.role === 'Chefe' ? user.id : user.chefeId || null;
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, logout, getChefeId }}>
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
