export const  Stat = ({ k, v }: { k: string; v: string }) => {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2">
      <div className="text-sm font-semibold">{k}</div>
      <div className="text-[11px] text-white/70">{v}</div>
    </div>
  );
}
