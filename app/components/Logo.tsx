import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-10 w-10" }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-2xl" }[size];
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <svg
        viewBox="0 0 32 32"
        className={`${dims} transition group-hover:rotate-12`}
        fill="none"
      >
        <defs>
          <linearGradient id="aura-grad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14" stroke="url(#aura-grad)" strokeWidth="2" opacity="0.4" />
        <circle cx="16" cy="16" r="9" stroke="url(#aura-grad)" strokeWidth="2" opacity="0.7" />
        <circle cx="16" cy="16" r="4" fill="url(#aura-grad)" />
      </svg>
      <span className={`${text} font-bold tracking-tight`}>
        aura<span className="bg-gradient-to-r from-emerald-300 to-violet-400 bg-clip-text text-transparent">fint</span>
      </span>
    </Link>
  );
}
