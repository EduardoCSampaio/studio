import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center gap-2 px-12">
      <Image
        src="/logo.png"
        alt="ECS Logo"
        width={175}
        height={50}
        className="h-20 w-auto"
        priority
      />
    </div>
  );
}
