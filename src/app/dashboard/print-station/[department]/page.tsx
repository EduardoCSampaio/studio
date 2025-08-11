
"use client"

import * as React from "react"
import { useParams } from "next/navigation"
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
import { Printer, Wifi, WifiOff, Eye } from "lucide-react"

function PrintableReceipt({ order }: { order: Order | null }) {
    if (!order) return null;

    // Filter items to only show those for the current department
    const department = order.items[0]?.department;

    return (
        <div className="p-4 bg-white text-black font-mono text-sm border border-dashed border-black mb-4 w-full">
            <div className="text-center mb-4">
                <h2 className="text-lg font-bold">NaMata</h2>
                <p>Comanda: #{order.comandaId} {order.tableId ? `| Mesa: ${order.tableId}`: ''}</p>
                <p>Garçom: {order.waiterName}</p>
                <p>{new Date().toLocaleString()}</p>
            </div>
             <div className="mb-4">
                <h3 className="font-bold border-b border-dashed border-black text-center">--- {department?.toUpperCase()} ---</h3>
                {order.items.map(item => (
                    <p key={item.productId}>{item.quantity}x {item.name}</p>
                ))}
            </div>
        </div>
    );
}

export default function DepartmentPrintStationPage() {
    const params = useParams();
    const department = params.department as string; // 'Cozinha' or 'Bar'

    const [isConnected, setIsConnected] = React.useState(true);
    const [ordersToPrint, setOrdersToPrint] = React.useState<Order[]>([]);
    const printRef = React.useRef<HTMLDivElement>(null);
    const [currentPrintingOrder, setCurrentPrintingOrder] = React.useState<Order | null>(null);
    const isProcessing = React.useRef(false);
    const [isWakeLockActive, setWakeLockActive] = React.useState(false);
    const wakeLockRef = React.useRef<any>(null);


    // Screen Wake Lock logic
    React.useEffect(() => {
        const acquireWakeLock = async () => {
             if (document.visibilityState !== 'visible') return;
            try {
                if ('wakeLock' in navigator && !wakeLockRef.current) {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                    wakeLockRef.current.addEventListener('release', () => {
                        console.log('Screen Wake Lock was released.');
                        setWakeLockActive(false);
                        wakeLockRef.current = null;
                    });
                    setWakeLockActive(true);
                    console.log('Screen Wake Lock is active.');
                }
            } catch (err: any) {
                console.error(`Wake Lock error: ${err.name}, ${err.message}`);
                setWakeLockActive(false);
                 wakeLockRef.current = null;
            }
        };

        acquireWakeLock(); // Attempt to acquire on initial load if visible

        document.addEventListener('visibilitychange', acquireWakeLock);
        document.addEventListener('fullscreenchange', acquireWakeLock);

        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
            }
            document.removeEventListener('visibilitychange', acquireWakeLock);
            document.removeEventListener('fullscreenchange', acquireWakeLock);
        };
    }, []);

    React.useEffect(() => {
        if (!department) return;

        const q = query(
            collection(db, "orders"),
            where("status", "==", "Pending"),
            where("printedAt", "==", null),
            where("items.0.department", "==", department) // More specific query
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (isProcessing.current) return;
            isProcessing.current = true;

            const newOrders: Order[] = [];
             snapshot.docs.forEach(doc => {
                 const order = { id: doc.id, ...doc.data() } as Order;
                 // Additional client-side check just in case, though query should handle it
                 if (order.items.some(item => item.department === department)) {
                    newOrders.push(order);
                 }
            });

            if (newOrders.length > 0) {
                 setOrdersToPrint(prev => [...prev, ...newOrders]);
            }
           
            setIsConnected(true);
            isProcessing.current = false;
        }, (error) => {
            console.error(`Error listening for ${department} orders:`, error);
            setIsConnected(false);
            isProcessing.current = false;
        });

        return () => unsubscribe();
    }, [department]);

    React.useEffect(() => {
        if (ordersToPrint.length > 0 && !currentPrintingOrder) {
            const nextOrder = ordersToPrint[0];
            setCurrentPrintingOrder(nextOrder);
        }
    }, [ordersToPrint, currentPrintingOrder]);

     React.useEffect(() => {
        if (currentPrintingOrder && printRef.current) {
            const printAndMark = async () => {
                window.print();
                
                const orderRef = doc(db, "orders", currentPrintingOrder.id);
                try {
                    await updateDoc(orderRef, {
                        printedAt: serverTimestamp()
                    });
                    setOrdersToPrint(prev => prev.filter(o => o.id !== currentPrintingOrder.id));
                    setCurrentPrintingOrder(null);
                } catch(error) {
                    console.error("Failed to mark order as printed:", error);
                    setCurrentPrintingOrder(null); 
                }
            }
            const timerId = setTimeout(printAndMark, 500);
            return () => clearTimeout(timerId);
        }
    }, [currentPrintingOrder]);

    if (!department) {
        return <div>Carregando departamento...</div>;
    }

    return (
        <>
            <div className="space-y-6 p-8">
                 <div>
                    <h1 className="text-4xl font-headline font-bold text-foreground">Estação de Impressão - {department}</h1>
                    <p className="text-muted-foreground">
                        Esta página imprime novos pedidos para o departamento: <span className="font-bold">{department}</span>.
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
                                    <p className="text-lg font-medium">Imprimindo pedido da comanda #{currentPrintingOrder.comandaId}...</p>
                                    <p className="text-muted-foreground">Aguardando confirmação da impressora.</p>
                                </>
                           ) : (
                                <>
                                    <p className="text-lg font-medium">Aguardando novos pedidos para o {department}...</p>
                                    <p className="text-muted-foreground">{ordersToPrint.length} pedidos na fila.</p>
                                </>
                           )}
                        </div>
                         {isWakeLockActive && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 p-2 bg-blue-50 rounded-md">
                                <Eye className="h-4 w-4" />
                                <span>Modo "Sempre Visível" está ativo. A tela não irá desligar.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="printable-area" ref={printRef}>
                <PrintableReceipt order={currentPrintingOrder} />
            </div>
        </>
    );
}
