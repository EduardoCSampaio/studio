
"use client"
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useAuth } from "@/hooks/use-auth.tsx"
import { useToast } from '@/hooks/use-toast';
import { testUsers, type User } from '@/lib/data';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  React.useEffect(() => {
    // If user is already logged in, redirect to the appropriate dashboard.
    if (user) {
      if (user.role === 'Garçom') {
        router.push("/dashboard/waiter");
      } else if (user.role === 'Portaria') {
        router.push("/dashboard/customers");
      } else if (user.role === 'Bar') {
          router.push("/dashboard/bar");
      } else if (user.role === 'Cozinha') {
          router.push("/dashboard/kitchen");
      } else if (user.role === 'Caixa') {
        router.push("/dashboard/cashier");
      }
      else {
        router.push("/dashboard");
      }
    }
  }, [user, router]);


  const handleLogin = async (testUser: Omit<User, 'id'>) => {
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, testUser.email, '123456');
      toast({ title: `Bem-vindo, ${testUser.name}!` });
      // Redirect logic is in useEffect
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
             toast({
                variant: "destructive",
                title: "Falha na autenticação",
                description: "Usuário ou senha inválidos. Contate o administrador.",
            });
        } else {
             toast({
                variant: "destructive",
                title: "Erro de Autenticação",
                description: error.message,
            });
        }
    } finally {
        setIsLoggingIn(false);
    }
  };

  if (loading || isLoggingIn || user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Logo />
          <p className="mt-4">Carregando...</p>
        </div>
      )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold">Entrar como</CardTitle>
          <CardDescription>
            Selecione um perfil para testar a aplicação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
                {testUsers.map((testUser) => (
                    <Button 
                        key={testUser.email} 
                        className="w-full" 
                        onClick={() => handleLogin(testUser)}
                        disabled={isLoggingIn}
                    >
                        {testUser.name} ({testUser.role})
                    </Button>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
