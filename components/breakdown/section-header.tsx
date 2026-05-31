import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  Icon: LucideIcon;
  delay?: number;
}

export function SectionHeader({ label, Icon, delay = 1 }: Props) {
  return (
    <div className={`reveal delay-${delay} sec-title mt-6 mx-1 mb-3`}>
      <span className="size-[22px] rounded-[7px] bg-coral-soft grid place-items-center shrink-0">
        <Icon size={13} className="text-coral" strokeWidth={2} />
      </span>
      <span className="font-display font-bold text-[12px] tracking-[0.06em]">{label}</span>
    </div>
  );
}
