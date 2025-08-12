
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
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useAuth } from "@/hooks/use-auth.tsx"
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user) {
        if (user.role === 'Admin') {
            router.push("/dashboard/admin");
        } else {
             router.push("/dashboard");
        }
    }
  }, [user, loading, router]);


  const handleLogin = async () => {
    if (!email || !password) {
        toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Por favor, preencha o e-mail e a senha.",
        });
        return;
    }
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O hook useAuth irá detectar a mudança de estado e redirecionar.
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
             toast({
                variant: "destructive",
                title: "Falha na autenticação",
                description: "Usuário ou senha inválidos. Verifique suas credenciais.",
            });
        } else {
             toast({
                variant: "destructive",
                title: "Erro de Autenticação",
                description: "Ocorreu um erro inesperado. Tente novamente.",
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
          <CardTitle className="text-2xl font-bold">Acesso Administrativo</CardTitle>
          <CardDescription>
            Use suas credenciais de administrador para entrar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@namata.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoggingIn}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                    id="password" 
                    type="password" 
                    placeholder="Sua senha" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoggingIn}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
            </div>
        </CardContent>
        <CardFooter>
            <Button className="w-full" onClick={handleLogin} disabled={isLoggingIn}>
                {isLoggingIn ? "Entrando..." : "Entrar como Admin"}
            </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
