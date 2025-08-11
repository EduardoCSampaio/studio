
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { collection, onSnapshot, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { type Order } from "@/lib/data"
import { Printer, Wifi, WifiOff } from "lucide-react"

function PrintableReceipt({ order }: { order: Order | null }) {
    if (!order) return null;

    return (
        <div className="p-4 bg-white text-black font-mono text-sm border border-dashed border-black mb-4 w-full">
            <div className="text-center mb-4">
                <h2 className="text-lg font-bold">RestoTrack</h2>
                <p>Comanda: #{order.comandaId} {order.tableId ? `| Mesa: ${order.tableId}`: ''}</p>
                <p>Garçom: {order.waiterName}</p>
                <p>{new Date().toLocaleString()}</p>
            </div>
             <div className="mb-4">
                <h3 className="font-bold border-b border-dashed border-black text-center">--- {order.items[0].department.toUpperCase()} ---</h3>
                {order.items.map(item => (
                    <p key={item.productId}>{item.quantity}x {item.name}</p>
                ))}
            </div>
        </div>
    );
}

export default function PrintStationPage() {
    const [isConnected, setIsConnected] = React.useState(true);
    const [ordersToPrint, setOrdersToPrint] = React.useState<Order[]>([]);
    const printRef = React.useRef<HTMLDivElement>(null);
    const [currentPrintingOrder, setCurrentPrintingOrder] = React.useState<Order | null>(null);

    React.useEffect(() => {
        const q = query(
            collection(db, "orders"),
            where("printedAt", "==", null),
            where("status", "==", "Pending")
        );

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const newOrders: Order[] = [];
                snapshot.forEach(doc => {
                    newOrders.push({ id: doc.id, ...doc.data() } as Order);
                });
                // Add new orders to the queue
                setOrdersToPrint(prev => [...prev, ...newOrders]);
                setIsConnected(true);
            }, 
            (error) => {
                console.error("Error listening for new orders:", error);
                setIsConnected(false);
            }
        );

        return () => unsubscribe();
    }, []);

    React.useEffect(() => {
        // If there's an order to print and we are not already printing
        if (ordersToPrint.length > 0 && !currentPrintingOrder) {
            const nextOrder = ordersToPrint[0];
            setCurrentPrintingOrder(nextOrder);
        }
    }, [ordersToPrint, currentPrintingOrder]);

    React.useEffect(() => {
        if (currentPrintingOrder && printRef.current) {
            // Trigger browser print dialog
            window.print();
            
            // Mark the order as printed in Firestore
            const orderRef = doc(db, "orders", currentPrintingOrder.id);
            updateDoc(orderRef, {
                printedAt: serverTimestamp()
            }).then(() => {
                 // Remove the printed order from the local queue and reset the current printing order
                setOrdersToPrint(prev => prev.filter(o => o.id !== currentPrintingOrder.id));
                setCurrentPrintingOrder(null);
            }).catch(error => {
                console.error("Failed to mark order as printed:", error);
                // Handle error - maybe retry or notify
                setCurrentPrintingOrder(null); // Reset to allow next order to print
            });
        }
    }, [currentPrintingOrder]);

    return (
        <>
            <div className="space-y-6">
                 <div>
                    <h1 className="text-4xl font-headline font-bold text-foreground">Estação de Impressão</h1>
                    <p className="text-muted-foreground">
                        Esta página busca e imprime novos pedidos automaticamente. Mantenha-a aberta em um computador conectado às impressoras.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Status da Conexão</span>
                             {isConnected ? (
                                <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                                    <Wifi className="h-4 w-4" /> Conectado
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-sm font-medium text-red-600">
                                    <WifiOff className="h-4 w-4" /> Desconectado
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                           Ouvindo novos pedidos do Firestore em tempo real.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                           <Printer className="h-16 w-16 text-muted-foreground mb-4" />
                           {currentPrintingOrder ? (
                                <>
                                    <p className="text-lg font-medium">Imprimindo pedido para a comanda #{currentPrintingOrder.comandaId}...</p>
                                    <p className="text-muted-foreground">Aguardando confirmação da impressora.</p>
                                </>
                           ) : (
                                <>
                                    <p className="text-lg font-medium">Aguardando novos pedidos...</p>
                                    <p className="text-muted-foreground">{ordersToPrint.length} pedidos na fila.</p>
                                </>
                           )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="printable-area" ref={printRef}>
                <PrintableReceipt order={currentPrintingOrder} />
            </div>
        </>
    );
}

