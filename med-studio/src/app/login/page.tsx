import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="login-screen">
      <div className="login-art">
        <div className="login-logo">
          <Image src="/logo.png" alt="MED STUDIO" width={150} height={150} className="h-full w-full object-cover" />
        </div>
      </div>
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          MED <span className="text-neon-blue">STUDIO</span>
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-200">Audio Processing <span className="text-neon-blue">&amp;</span> Roblox Upload</p>
        <p className="mx-auto mt-5 max-w-[250px] text-[10px] leading-5 text-slate-400">
          Upload audio, proses sesuai kebutuhan, dan publish resmi ke Roblox dengan mudah.
        </p>
      </div>
      <a
        href="/api/auth/discord"
        className="primary-button mt-5 w-full"
      >
        <span className="text-base">☯</span> Login dengan Discord
      </a>
      <p className="text-center text-[9px] text-slate-400">♢ Aman · Cepat · Terpercaya</p>
    </div>
  );
}
