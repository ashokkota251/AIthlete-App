import type { DeepNarration } from "@/lib/metrics/types";

interface Props {
  deep: DeepNarration;
  delay?: number;
}

export function NextRideCard({ deep, delay = 7 }: Props) {
  const { nextRide } = deep;
  return (
    <div className={`card-coral reveal delay-${delay}`}>
      <div className="eyebrow !text-white/82">Plan your next ride</div>
      <h3 className="mt-2.5 font-display font-bold text-[21px] leading-tight">
        {nextRide.title}
      </h3>
      <div className="text-[13px] text-white/90 mt-0.5 mb-3.5">{nextRide.when}</div>

      <div className="grid grid-cols-3 gap-2 mb-3.5">
        <Tile value={`${nextRide.durationMin} min`} label="Duration" />
        <Tile value={nextRide.intensity} label="Intensity" />
        <Tile value={nextRide.targetHr} label="Target HR" />
      </div>

      <p
        className="text-[12.5px] leading-[1.5] text-white/92"
        dangerouslySetInnerHTML={{
          __html: nextRide.why.replace(/\*\*(.+?)\*\*/g, "<b class='font-bold'>$1</b>"),
        }}
      />
    </div>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/16 backdrop-blur-sm rounded-[13px] py-2.5 px-2 text-center">
      <div className="font-display font-bold text-[15px] leading-tight nums">{value}</div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.05em] text-white/75 font-semibold">
        {label}
      </div>
    </div>
  );
}
