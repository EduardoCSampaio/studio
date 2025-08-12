
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
import { type Order, type OrderItem } from "@/lib/data"
import { Printer, Wifi, WifiOff, Eye } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

type PrintableOrder = Order & {
    itemsToPrint: OrderItem[];
}

function PrintableReceipt({ order, department }: { order: PrintableOrder | null, department: string | null }) {
    if (!order || !department) return null;

    return (
        <div className="p-4 bg-white text-black font-mono text-sm border border-dashed border-black mb-4 w-full">
            <div className="text-center mb-4">
                <h2 className="text-lg font-bold">ECS</h2>
                <p>Comanda: #{order.comandaId} {order.tableId ? `| Mesa: ${order.tableId}`: ''}</p>
                <p>Garçom: {order.waiterName}</p>
                <p>{new Date().toLocaleString()}</p>
            </div>
             <div className="mb-4">
                <h3 className="font-bold border-b border-dashed border-black text-center">--- {department.toUpperCase()} ---</h3>
                {order.itemsToPrint.map((item, index) => (
                    <p key={`${item.productId}-${index}`}>{item.quantity}x {item.name}</p>
                ))}
            </div>
        </div>
    );
}

export default function DepartmentPrintStationPage() {
    const params = useParams();
    const department = params.department as string; 
    const { getChefeId } = useAuth();
    
    const [isConnected, setIsConnected] = React.useState(true);
    const [ordersToPrintQueue, setOrdersToPrintQueue] = React.useState<PrintableOrder[]>([]);
    const printRef = React.useRef<HTMLDivElement>(null);
    const [currentPrintingOrder, setCurrentPrintingOrder] = React.useState<PrintableOrder | null>(null);
    
    const isProcessingPrint = React.useRef(false); // Ref to prevent re-triggering print
    const [isWakeLockActive, setWakeLockActive] = React.useState(false);
    const wakeLockRef = React.useRef<any>(null);


    React.useEffect(() => {
        const acquireWakeLock = async () => {
             if (document.visibilityState !== 'visible') return;
            try {
                if ('wakeLock' in navigator && !wakeLockRef.current) {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                    wakeLockRef.current.addEventListener('release', () => {
                        setWakeLockActive(false);
                        wakeLockRef.current = null;
                    });
                    setWakeLockActive(true);
                }
            } catch (err: any) {
                console.error(`Wake Lock error: ${err.name}, ${err.message}`);
                setWakeLockActive(false);
                 wakeLockRef.current = null;
            }
        };

        acquireWakeLock();

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
        const chefeId = getChefeId();
        if (!department || !chefeId) return;

        const q = query(
            collection(db, "orders"),
            where("chefeId", "==", chefeId),
            where("status", "==", "Pending"),
            where("printedAt", "==", null),
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newOrdersToProcess: PrintableOrder[] = [];
             snapshot.docs.forEach(doc => {
                 const order = { id: doc.id, ...doc.data() } as Order;
                 const itemsForThisDepartment = order.items.filter(item => item.department === department);
                 
                 if (itemsForThisDepartment.length > 0) {
                    newOrdersToProcess.push({
                        ...order,
                        itemsToPrint: itemsForThisDepartment,
                    });
                 }
            });

            if (newOrdersToProcess.length > 0) {
                 setOrdersToPrintQueue(prevQueue => {
                    const existingIds = new Set(prevQueue.map(o => o.id));
                    const uniqueNewOrders = newOrdersToProcess.filter(o => !existingIds.has(o.id));
                    return [...prevQueue, ...uniqueNewOrders];
                 });
            }
           
            setIsConnected(true);
        }, (error) => {
            console.error(`Error listening for ${department} orders:`, error);
            setIsConnected(false);
        });

        return () => unsubscribe();
    }, [department, getChefeId]);


     React.useEffect(() => {
        // If not currently printing and there's an order in the queue, start printing it.
        if (!isProcessingPrint.current && ordersToPrintQueue.length > 0) {
            isProcessingPrint.current = true;
            const nextOrder = ordersToPrintQueue[0];
            setCurrentPrintingOrder(nextOrder);
        }
    }, [ordersToPrintQueue]);

     React.useEffect(() => {
        if (currentPrintingOrder && printRef.current) {
            const printAndMark = async () => {
                window.print();
                
                const orderRef = doc(db, "orders", currentPrintingOrder.id);
                try {
                    // This update is now safe because it only marks the original order
                    await updateDoc(orderRef, {
                        printedAt: serverTimestamp()
                    });
                } catch(error) {
                    console.error("Failed to mark order as printed:", error);
                } finally {
                    // This logic will run regardless of success or failure
                    // Remove the printed order from the queue and allow the next one to print
                    setOrdersToPrintQueue(prev => prev.filter(o => o.id !== currentPrintingOrder.id));
                    setCurrentPrintingOrder(null);
                    isProcessingPrint.current = false;
                }
            }
            // Use a short timeout to allow the receipt component to render before printing
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
                                    <p className="text-muted-foreground">{ordersToPrintQueue.length} pedidos na fila.</p>
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
                <PrintableReceipt order={currentPrintingOrder} department={department} />
            </div>
        </>
    );
}
