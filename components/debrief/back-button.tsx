import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  href: string;
  label: string;
}

export function BackButton({ href, label }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 font-display font-semibold text-[14px] text-ink py-2 -ml-1"
    >
      <ArrowLeft size={18} strokeWidth={2.2} />
      {label}
    </Link>
  );
}
