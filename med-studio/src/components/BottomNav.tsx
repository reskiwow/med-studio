"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const ITEMS = [
  { href: "/", label: "Beranda", icon: HomeIcon },
  { href: "/upload", label: "Upload", icon: UploadIcon },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/tools", label: "Tools", icon: ToolsIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Single shared gradient def — referenced by url(#navGradient) from
          every icon below. Previously each icon rendered its own <defs> with
          the same id, producing 5 duplicate ids in the DOM at once. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="navGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4d6bff" />
            <stop offset="100%" stopColor="#9b5bff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="mx-auto max-w-md px-3 pb-3">
        <div className="glass glow-border rounded-2xl flex justify-between px-2 py-2">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl tap-scale ${
                  active ? "text-white" : "text-slate-400"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 rounded-xl bg-white/10"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative"><Icon active={active} /></span>
                <span className="relative text-[10px]">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function iconColor(active?: boolean) {
  return active ? "url(#navGradient)" : "currentColor";
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor(active)} strokeWidth="1.8">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UploadIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor(active)} strokeWidth="1.8">
      <path d="M12 16V4M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HistoryIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor(active)} strokeWidth="1.8">
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7v5l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ToolsIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor(active)} strokeWidth="1.8">
      <path
        d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4L21 6l-3-3-3.3 3.3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SettingsIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor(active)} strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
