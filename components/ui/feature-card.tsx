export const  FeatureCard = ({ title, desc }: { title: string; desc: string }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs leading-5 text-white/70">{desc}</div>
    </div>
  );
}