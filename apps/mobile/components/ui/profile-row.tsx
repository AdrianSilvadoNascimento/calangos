import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from './icon';
import { cn } from '../../lib/cn';

export interface ProfileRowProps {
  /** Eyebrow label, rendered uppercase 11px. */
  label: string;
  value: string;
  icon?: IconName;
  /** Optional right-side slot replacing the chevron (e.g. badge, switch). */
  rightSlot?: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

/**
 * ProfileRow — DESIGN_SYSTEM §6.
 * Linha clicável usada nos cards de perfil e configurações.
 */
export function ProfileRow({
  label,
  value,
  icon,
  rightSlot,
  onPress,
  className,
}: ProfileRowProps) {
  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn(
        'flex-row items-center px-4 py-4',
        onPress && 'active:bg-bg-3',
        className,
      )}
    >
      {icon && (
        <View style={{ marginRight: 12 }}>
          <Icon name={icon} tone="ink-3" size={18} outline />
        </View>
      )}
      <View className="flex-1">
        <Text
          className="text-ink-3 font-semibold mb-0.5"
          style={{ fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' }}
        >
          {label}
        </Text>
        <Text className="text-ink-1 font-semibold text-sm" numberOfLines={1}>
          {value}
        </Text>
      </View>
      {rightSlot ?? (onPress && <Icon name="chevron-right" tone="ink-4" size={16} outline />)}
    </Container>
  );
}

/** Visual divider between rows inside a card. */
export function RowDivider({ className }: { className?: string }) {
  return <View className={cn('h-px bg-line-1 mx-4', className)} />;
}
