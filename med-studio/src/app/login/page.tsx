import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="pt-24 text-center space-y-6">
      <div className="mx-auto h-20 w-20 rounded-2xl glass glow-border overflow-hidden">
        <Image src="/logo.png" alt="MED STUDIO" width={80} height={80} className="h-full w-full object-cover" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold">MED STUDIO</h1>
        <p className="mt-1 text-sm text-slate-400">Audio processing & Roblox publishing</p>
      </div>
      <a
        href="/api/auth/discord"
        className="inline-block rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple px-6 py-3 font-medium text-white shadow-glow"
      >
        Login dengan Discord
      </a>
    </div>
  );
}
