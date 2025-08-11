import { Sprout } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3 px-2">
      <Sprout className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-bold font-headline text-foreground tracking-wide">
        NaMata
      </h1>
    </div>
  );
}
