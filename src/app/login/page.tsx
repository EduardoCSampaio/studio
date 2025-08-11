
"use client"
import { useRouter } from 'next/navigation';
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
import { users } from "@/lib/data"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function LoginAs({ onLogin }: { onLogin: () => void }) {
  const { login } = useAuth()

  const handleLogin = (userId: string) => {
    login(userId)
    onLogin()
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => handleLogin(user.id)}
          className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors flex items-center gap-4 border"
        >
          <Avatar>
            <AvatarImage src={`https://i.pravatar.cc/40?u=${user.id}`} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <CardTitle className="text-2xl font-bold">
              Bem-vindo, {user.name.split(" ")[0]}!
            </CardTitle>
            <CardDescription>
              Você já está logado como {user.role}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
             <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={`https://i.pravatar.cc/120?u=${user.id}`} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              Ir para o Dashboard
            </Button>
            <Button className="w-full" variant="outline" onClick={logout}>
              Sair (Log out)
            </Button>
          </CardFooter>
        </Card>
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
          <CardTitle className="text-2xl font-bold">Entrar Como</CardTitle>
          <CardDescription>
            Selecione um usuário para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginAs onLogin={() => router.push("/dashboard")} />
        </CardContent>
      </Card>
    </div>
  )
}
