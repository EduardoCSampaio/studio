
"use client"

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { User, UserRole, SystemEvent } from '@/lib/data';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, onSnapshot, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  getChefeId: () => string | null;
  refreshUser: () => Promise<void>;
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        setLoading(true);
        let userQuery;
        if (firebaseUser.email === ADMIN_EMAIL) {
            setUser({
                id: firebaseUser.uid,
                name: 'Admin',
                email: ADMIN_EMAIL,
                role: 'Admin'
            });
            setLoading(false);
            return;
        } else {
            userQuery = query(collection(db, "users"), where("email", "==", firebaseUser.email));
        }

        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
            const userDocRef = doc(db, 'users', querySnapshot.docs[0].id);
            // Listen for real-time updates on the user document
            const unsubscribeSnapshot = onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                     setUser({
                        id: userDoc.id,
                        name: userData.name || firebaseUser.displayName || 'Usuário',
                        email: firebaseUser.email as string,
                        role: userData.role as UserRole,
                        chefeId: userData.chefeId,
                        photoURL: userData.photoURL
                    });
                } else {
                     setUser(null);
                }
                 setLoading(false);
            });
            return () => unsubscribeSnapshot(); // Cleanup snapshot listener
        } else {
            console.warn(`User ${firebaseUser.email} found in Auth but not in Firestore.`);
            logSystemEvent({
                level: 'warning',
                message: `Usuário autenticado (${firebaseUser.email}) não encontrado no banco de dados Firestore.`
            });
            setUser(null);
            setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
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

  const refreshUser = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
        return;
    }
    
    let userDocRef;
    if (firebaseUser.email !== ADMIN_EMAIL) {
        const userQuery = query(collection(db, "users"), where("email", "==", firebaseUser.email));
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
             userDocRef = querySnapshot.docs[0].ref;
        } else {
            return;
        }
    } else {
        return; // Admin user is static, no need to refresh from DB
    }

    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
            id: userDoc.id,
            name: userData.name || firebaseUser.displayName || 'Usuário',
            email: firebaseUser.email as string,
            role: userData.role as UserRole,
            chefeId: userData.chefeId,
            photoURL: userData.photoURL
        });
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, logout, getChefeId, refreshUser }}>
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
