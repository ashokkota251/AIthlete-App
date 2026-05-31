interface Props {
  title: string;
  copy: string;
  delay?: number;
}

export function NextActionCard({ title, copy, delay = 4 }: Props) {
  return (
    <div className={`card-coral reveal delay-${delay}`}>
      <div className="eyebrow !text-white/82">Do this next</div>
      <h3 className="mt-2.5 font-display font-bold text-[19px] leading-tight">{title}</h3>
      <p className="mt-1 text-[13px] text-white/90 leading-[1.5]">{copy}</p>
    </div>
  );
}
