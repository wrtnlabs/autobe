"use client";

interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  footer: string;
}

export default function AutoBeLandingStrengthCardMovie({
  title,
  subtitle,
  description,
  footer,
}: FeatureCardProps) {
  return (
    <div className="text-left">
      <h3 className="text-base md:text-lg font-semibold text-white tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
      <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-sm">
        {description}
      </p>
      <div className="mt-5 pt-4 border-t border-white/10">
        <p className="text-xs text-slate-400 font-semibold tracking-[0.14em] uppercase">
          {footer}
        </p>
      </div>
    </div>
  );
}