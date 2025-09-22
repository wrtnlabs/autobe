"use client";

interface FeatureCardProps {
  gradientFrom: string;
  gradientTo: string;
  hoverFrom: string;
  hoverTo: string;
  shadowColor: string;
  iconBg: string;
  iconColor: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  footerColor: string;
  footer: string;
}

export default function AutoBeLandingStrengthCardMovie({
  gradientFrom,
  gradientTo,
  hoverFrom,
  hoverTo,
  shadowColor,
  iconBg,
  iconColor,
  icon,
  title,
  subtitle,
  description,
  footerColor,
  footer,
}: FeatureCardProps) {
  return (
    <div 
      className="border border-gray-600/30 rounded-2xl p-8 transition-all duration-300 hover:border-gray-500/50 hover:scale-[1.02]"
      style={{
        background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `linear-gradient(to bottom right, ${hoverFrom}, ${hoverTo})`;
        e.currentTarget.style.boxShadow = `0 20px 25px -5px ${shadowColor}40, 0 10px 10px -5px ${shadowColor}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`;
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mb-6`}>
        <div className={`${iconColor} text-2xl`}>{icon}</div>
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-300 mb-4">{subtitle}</p>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <p className={`${footerColor} text-sm font-semibold`}>{footer}</p>
    </div>
  );
}