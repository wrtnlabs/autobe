"use client";

interface LimitCardProps {
  title: string;
  description: string;
  footer?: React.ReactNode;
}

export default function AutoBeLandingLimitCardMovie({
  title,
  description,
  footer,
}: LimitCardProps) {
  return (
    <div className="text-left">
      <h3 className="text-base md:text-lg font-semibold text-white tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xl">
        {description}
      </p>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}