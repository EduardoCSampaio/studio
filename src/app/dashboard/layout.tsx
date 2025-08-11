
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, Square, Users, CircleUser, LogOut } from "lucide-react"

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

  const userCan = (roles: string[]) => user.role && roles.includes(user.role)

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {userCan(['Chefe', 'Financeiro']) && (
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
          {userCan(['Chefe', 'Garçom']) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/dashboard/tables")}
                tooltip="Tables"
              >
                <Link href="/dashboard/tables">
                  <Square />
                  <span>Tables</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
           {userCan(['Chefe']) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/products"}
                tooltip="Products"
              >
                <Link href="/dashboard/products">
                  <Package />
                  <span>Products</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
           {userCan(['Chefe', 'Portaria']) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/customers"}
                tooltip="Customers"
              >
                <Link href="/dashboard/customers">
                  <CircleUser />
                  <span>Customers</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
           {userCan(['Chefe']) && (
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/users"}
                tooltip="Users"
              >
                <Link href="/dashboard/users">
                  <Users />
                  <span>Users</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
           {userCan(['Bar']) && (
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Bar Orders"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Pedidos do Bar</span>
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
               <Button variant="ghost" size="icon" className="ml-auto" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                </Button>
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
  const { loading } = useAuth();
  
  if (loading) {
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
