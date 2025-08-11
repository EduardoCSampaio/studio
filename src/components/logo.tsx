import { UtensilsCrossed } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3 px-2">
      <UtensilsCrossed className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-bold font-headline text-foreground tracking-wide">
        RestoTrack
      </h1>
    </div>
  );
}
