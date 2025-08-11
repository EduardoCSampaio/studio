
"use client"
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
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
import { useAuth } from "@/hooks/use-auth"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login successful!" });
      router.push("/dashboard");
    } catch (error: any) {
        // Try to sign up if login fails (for demo purposes)
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            toast({ title: "Welcome! Account created." });
            router.push("/dashboard");
        } catch (signupError: any) {
             toast({
                variant: "destructive",
                title: "Authentication Failed",
                description: signupError.message,
            });
        }
    }
  };

  if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (user) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Use seu email e senha para continuar.
            <br/>
            <small className="text-xs">Ex: garcom@restotrack.com / 123456</small>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin}>Entrar</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
