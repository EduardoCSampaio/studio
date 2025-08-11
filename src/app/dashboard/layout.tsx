
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Package, Users, LogOut, Beer, CookingPot, PlusSquare, DollarSign, Printer, Square, Calendar, Book } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"
import { useAuth, AuthProvider } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserRole } from "@/lib/data"
import { ThemeToggle } from "@/components/theme-toggle"

function DashboardSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const getInitials = (name: string) => {
    const names = name.split(' ')
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`
    }
    return name.substring(0, 2)
  }

  const userCan = (roles: UserRole[]) => user.role && roles.includes(user.role)

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {userCan(['Chefe']) && (
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}
           {userCan(['Garçom']) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/waiter"}
                tooltip="Lançar Pedido"
              >
                <Link href="/dashboard/waiter">
                  <PlusSquare />
                  <span>Lançar Pedido</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
          {userCan(['Chefe']) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/dashboard/tables") && pathname !== '/dashboard/tables/[tableId]'}
                tooltip="Mesas"
              >
                <Link href="/dashboard/tables">
                  <Square />
                  <span>Mesas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
           {userCan(['Chefe']) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/products"}
                tooltip="Produtos"
              >
                <Link href="/dashboard/products">
                  <Package />
                  <span>Produtos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
           {userCan(['Chefe', 'Portaria', 'Caixa']) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/customers"}
                tooltip="Comandas"
              >
                <Link href="/dashboard/customers">
                  <Users />
                  <span>Comandas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/reservations"}
                tooltip="Reservas"
              >
                <Link href="/dashboard/reservations">
                  <Calendar />
                  <span>Reservas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           {userCan(['Chefe', 'Caixa']) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/cashier"}
                tooltip="Caixa"
              >
                <Link href="/dashboard/cashier">
                  <DollarSign />
                  <span>Caixa</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
           {userCan(['Chefe', 'Caixa']) && (
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/reports"}
                tooltip="Relatórios"
              >
                <Link href="/dashboard/reports">
                  <Book />
                  <span>Relatórios</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
           {userCan(['Chefe']) && (
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/users"}
                tooltip="Usuários"
              >
                <Link href="/dashboard/users">
                  <Users />
                  <span>Usuários</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
           {userCan(['Bar']) && (
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/bar"}
                  tooltip="Pedidos do Bar"
                >
                  <Link href="/dashboard/bar">
                    <Beer />
                    <span>Pedidos do Bar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
           )}
            {userCan(['Cozinha']) && (
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/kitchen"}
                  tooltip="Pedidos da Cozinha"
                >
                  <Link href="/dashboard/kitchen">
                    <CookingPot />
                    <span>Pedidos da Cozinha</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
           )}
           {userCan(['Chefe']) && (
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/print-station"}
                  tooltip="Estação de Impressão"
                >
                  <Link href="/dashboard/print-station">
                    <Printer />
                    <span>Estação de Impressão</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
           )}

        </SidebarMenu>
      </SidebarContent>
       <SidebarSeparator />
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2">
              <Avatar>
                  <AvatarImage src={`https://i.pravatar.cc/40?u=${user.id}`} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.role}</span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                 <ThemeToggle />
                 <Button variant="ghost" size="icon" onClick={logout}>
                      <LogOut className="h-4 w-4" />
                  </Button>
              </div>
          </div>
        </SidebarFooter>
    </Sidebar>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading, user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
     if (!loading && !user) {
        router.push("/login");
     }
  }, [loading, user, router])
  
  if (loading || !user) {
      return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <DashboardSidebar />
          <div className="flex-1 md:p-6 lg:p-8 p-4">
            <div className="md:hidden flex justify-between items-center mb-4">
               <Logo />
               <SidebarTrigger />
            </div>
            {children}
          </div>
        </div>
      </SidebarProvider>
  )
}
