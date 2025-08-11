
"use client"

import * as React from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CookingPot, Beer, Package } from "lucide-react"

export default function PrintStationHubPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-headline font-bold text-foreground">Estação de Impressão</h1>
                <p className="text-muted-foreground">
                    Abra uma estação de impressão para cada departamento em uma janela ou aba separada.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Selecione um Departamento</CardTitle>
                    <CardDescription>
                        Cada estação ouvirá e imprimirá pedidos apenas para o departamento selecionado. Mantenha a aba da estação aberta no computador conectado à impressora correspondente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                   <Card>
                       <CardHeader>
                            <CookingPot className="h-8 w-8 text-muted-foreground mb-2" />
                            <CardTitle>Estação da Cozinha</CardTitle>
                            <CardDescription>Ouvirá e imprimirá todos os pedidos de comida.</CardDescription>
                       </CardHeader>
                       <CardContent>
                           <Link href="/dashboard/print-station/Cozinha" target="_blank">
                                <Button className="w-full">Abrir Estação da Cozinha</Button>
                           </Link>
                       </CardContent>
                   </Card>
                    <Card>
                       <CardHeader>
                            <Beer className="h-8 w-8 text-muted-foreground mb-2" />
                            <CardTitle>Estação do Bar</CardTitle>
                            <CardDescription>Ouvirá e imprimirá todos os pedidos de bebida.</CardDescription>
                       </CardHeader>
                       <CardContent>
                            <Link href="/dashboard/print-station/Bar" target="_blank">
                                <Button className="w-full">Abrir Estação do Bar</Button>
                            </Link>
                       </CardContent>
                   </Card>
                   <Card>
                       <CardHeader>
                            <Package className="h-8 w-8 text-muted-foreground mb-2" />
                            <CardTitle>Estação Geral</CardTitle>
                            <CardDescription>Ouvirá e imprimirá todos os pedidos diversos.</CardDescription>
                       </CardHeader>
                       <CardContent>
                            <Link href="/dashboard/print-station/Geral" target="_blank">
                                <Button className="w-full">Abrir Estação Geral</Button>
                            </Link>
                       </CardContent>
                   </Card>
                </CardContent>
            </Card>
        </div>
    );
}
