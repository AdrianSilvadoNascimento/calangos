import { View, type ViewProps } from 'react-native';
import { cn } from '../../lib/cn';

export interface CardProps extends ViewProps {
  variant?: 'base' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/**
 * Card primitive — DESIGN_SYSTEM §6.Cards
 * - base: bg-bg-2 + 1px line-1 inset border + radius 16px
 * - elevated: bg-bg-3 + 1px line-2 inset border
 */
export function Card({
  variant = 'base',
  padding = 'md',
  className,
  children,
  ...rest
}: CardProps) {
  const bg = variant === 'elevated' ? 'bg-bg-3' : 'bg-bg-2';
  const border = variant === 'elevated' ? 'border-line-2' : 'border-line-1';

  return (
    <View
      className={cn(bg, 'border', border, 'rounded-2xl', PADDING[padding], className)}
      {...rest}
    >
      {children}
    </View>
  );
}
