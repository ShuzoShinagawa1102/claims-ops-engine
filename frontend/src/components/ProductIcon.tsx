import { Car, Heart, Plane, Home } from 'lucide-react';
import type { ProductType } from '../types';
import clsx from 'clsx';

const ICONS: Record<ProductType, React.ElementType> = {
  auto: Car,
  health: Heart,
  travel: Plane,
  property: Home,
};

const COLORS: Record<ProductType, string> = {
  auto: 'text-blue-500',
  health: 'text-rose-500',
  travel: 'text-sky-500',
  property: 'text-amber-600',
};

interface Props {
  type: ProductType;
  size?: number;
  className?: string;
}

export default function ProductIcon({ type, size = 16, className }: Props) {
  const Icon = ICONS[type] ?? Car;
  return <Icon size={size} className={clsx(COLORS[type], className)} />;
}
