"use client";

interface FeatureCardProps {
  num: string;
  title: string;
  subtitle: string;
  description: string;
  footer: string;
  span?: boolean;
}

export default function AutoBeLandingStrengthCardMovie({
  num,
  title,
  subtitle,
  description,
  footer,
  span,
}: FeatureCardProps) {
  return (
    <div
      className={`group rounded-2xl border border-neutral-800/50 transition-all duration-300 hover:border-neutral-700/60 p-8 ${
        span ? "lg:col-span-2" : ""
      }`}
    >
      <div className="text-[10px] font-mono text-neutral-700 mb-4">{num}</div>
      <h3 className="text-base font-semibold mb-2 text-white">{title}</h3>
      <p className="text-xs text-neutral-400 mb-3">{subtitle}</p>
      <p className="text-xs text-neutral-500 leading-relaxed mb-5">
        {description}
      </p>
      <p className="text-[11px] text-neutral-700 font-mono">{footer}</p>
    </div>
  );
}
