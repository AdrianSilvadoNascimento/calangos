import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from './icon';
import { cn } from '../../lib/cn';

export type ChipStatus = 'wishlist' | 'purchased' | 'received' | 'cancelled';
export type ChipVariant = 'default' | 'active' | 'status';

export interface ChipProps {
  label: string;
  count?: number;
  variant?: ChipVariant;
  status?: ChipStatus;
  icon?: IconName;
  onPress?: () => void;
  className?: string;
}

const STATUS_THEME: Record<ChipStatus, { color: string; label: string }> = {
  wishlist:  { color: '#E89784', label: 'Desejado' },
  purchased: { color: '#7FB6D9', label: 'Comprado' },
  received:  { color: '#5FCB8B', label: 'Recebido' },
  cancelled: { color: '#E0746A', label: 'Cancelado' },
};

/**
 * Chip primitive — DESIGN_SYSTEM §6.Chips.
 * - default: rgba(255,255,255,.05) bg + line-2 inset border, 28px
 * - active: brand-500 bg, #04140A text
 * - status: tonal bg @ ~16% of status color, text in status color, with leading dot
 */
export function Chip({
  label,
  count,
  variant = 'default',
  status,
  icon,
  onPress,
  className,
}: ChipProps) {
  const isActive = variant === 'active';
  const isStatus = variant === 'status';
  const theme = status ? STATUS_THEME[status] : null;

  const baseClasses = cn(
    'rounded-full flex-row items-center self-start',
    'px-3 py-1.5',
    !isStatus && !isActive && 'border border-line-2',
    isActive && 'bg-brand-500',
    className,
  );

  const baseStyle = isStatus && theme
    ? { backgroundColor: `${theme.color}29` } // ~16%
    : !isActive && !isStatus
      ? { backgroundColor: 'rgba(255,255,255,0.05)' }
      : undefined;

  const textColor = isActive
    ? '#04140A'
    : isStatus && theme
      ? theme.color
      : '#C2D0C5';

  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn(baseClasses, onPress && 'active:opacity-70')}
      style={[baseStyle, { gap: 6, minHeight: 28 }]}
    >
      {isStatus && theme && (
        <View
          style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: theme.color }}
        />
      )}
      {icon && (
        <Icon
          name={icon}
          size={14}
          color={textColor}
          outline
        />
      )}
      <Text
        className="font-semibold text-xs"
        style={{ color: textColor }}
      >
        {label}
      </Text>
      {count != null && (
        <Text
          className="font-semibold text-xs opacity-70"
          style={{ color: textColor }}
        >
          · {count}
        </Text>
      )}
    </Container>
  );
}
