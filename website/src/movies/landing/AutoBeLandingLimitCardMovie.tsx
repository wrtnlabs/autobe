"use client";

interface LimitCardProps {
  bgColor: string;
  borderColor: string;
  hoverBgColor: string;
  hoverBorderColor: string;
  iconBgColor: string;
  iconColor: string;
  icon: string;
  titleColor: string;
  title: string;
  description: string;
  footer?: React.ReactNode;
}

export default function AutoBeLandingLimitCardMovie({
  bgColor,
  borderColor,
  hoverBgColor,
  hoverBorderColor,
  iconBgColor,
  iconColor,
  icon,
  titleColor,
  title,
  description,
  footer,
}: LimitCardProps) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-2xl p-6 transition-all duration-300 hover:${hoverBgColor} hover:${hoverBorderColor}`}>
      <div className="flex items-start mb-4">
        <div className={`w-10 h-10 ${iconBgColor} rounded-full flex items-center justify-center mr-4`}>
          <span className={`${iconColor} text-xl`}>{icon}</span>
        </div>
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${titleColor} mb-2`}>
            {title}
          </h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
      {footer && <div className="pl-14">{footer}</div>}
    </div>
  );
}