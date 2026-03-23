"use client";

interface LimitCardProps {
  title: string;
  description: string;
  detail: string;
}

export default function AutoBeLandingLimitCardMovie({
  title,
  description,
  detail,
}: LimitCardProps) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
      <p className="text-[13px] text-neutral-500 leading-relaxed mb-3">
        {description}
      </p>
      <p className="text-[11px] text-neutral-700 font-mono">{detail}</p>
    </div>
  );
}
