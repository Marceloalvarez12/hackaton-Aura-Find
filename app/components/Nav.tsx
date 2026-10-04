"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { WalletConnectButton } from "./WalletConnectButton";
import { CLUSTER_LABEL } from "@/lib/cluster";

const LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/#how", label: "How it works" },
];

function NavLink({ href, label, path }: { href: string; label: string; path: string }) {
  const active = path === href;
  const cls = `relative text-sm transition after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-emerald-400 after:transition-all ${
    active ? "text-white after:w-full" : "text-slate-400 after:w-0 hover:text-white hover:after:w-full"
  }`;
  // En la landing, el ancla nativa hace scroll suave sin pasar por el router.
  if (href.startsWith("/#") && path === "/") {
    return (
      <a href={href.slice(1)} className={cls}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {label}
    </Link>
  );
}

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070b14]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <NavLink key={l.href} {...l} path={path} />
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-300 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {CLUSTER_LABEL}
          </span>
          <WalletConnectButton />
        </div>
      </div>
      <nav className="flex items-center justify-center gap-6 border-t border-white/5 py-2.5 md:hidden">
        {LINKS.map((l) => (
          <NavLink key={l.href} {...l} path={path} />
        ))}
      </nav>
    </header>
  );
}
