import { Link } from "wouter";

interface PanelCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  isActive?: boolean;
}

export default function PanelCard({
  id,
  title,
  description,
  icon,
  color,
  isActive = false,
}: PanelCardProps) {
  return (
    <Link
      href={`/${id}`}
      className={`block p-6 rounded-lg border-2 border-dashed transition-all duration-200 hover:shadow-lg ${
        isActive
          ? `${color} text-white border-solid`
          : "border-gray-300 bg-white hover:border-gray-400"
      }`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className={`text-lg font-bold mb-2 ${isActive ? "text-white" : "text-gray-900"}`}>
        {title}
      </h3>
      <p className={`text-sm ${isActive ? "text-white/90" : "text-gray-600"}`}>
        {description}
      </p>
    </Link>
  );
}
