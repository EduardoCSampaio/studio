import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center gap-2 px-12">
      <Image
        src="/logo.png"
        alt="ECS Logo"
        width={140}
        height={40}
        className="h-10 w-auto"
        priority
      />
    </div>
  );
}
