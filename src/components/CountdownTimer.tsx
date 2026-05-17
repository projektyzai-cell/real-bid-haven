import { useEffect, useState } from "react";
import { getCountdown } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  endsAt: string;
  className?: string;
  compact?: boolean;
}

export function CountdownTimer({ endsAt, className, compact }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  tick;
  const c = getCountdown(endsAt);

  if (c.ended) {
    return (
      <div className={cn("text-sm font-medium text-muted-foreground", className)}>
        Aukcja zakończona
      </div>
    );
  }

  const urgent = c.urgent;
  const cell = (n: number, label: string) => (
    <div className="flex flex-col items-center px-1.5">
      <span className="text-base font-semibold tabular-nums leading-none">
        {String(n).padStart(2, "0")}
      </span>
      {!compact && <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>}
    </div>
  );

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl px-2 py-1.5 font-mono",
        urgent
          ? "bg-fomo text-fomo-foreground animate-pulse"
          : "bg-live text-live-foreground",
        className,
      )}
    >
      {c.days > 0 && cell(c.days, "d")}
      {cell(c.hours, "h")}
      <span className="opacity-50">:</span>
      {cell(c.minutes, "m")}
      <span className="opacity-50">:</span>
      {cell(c.seconds, "s")}
    </div>
  );
}
