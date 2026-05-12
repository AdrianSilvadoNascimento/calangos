import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from './icon';
import { cn } from '../../lib/cn';

export interface TileProps {
  icon: IconName;
  iconColor: string;
  title: string;
  /** e.g. "8 itens · R$ 1.200" */
  subtitle?: string;
  /** Progress 0-1 — renders the 3px bar in iconColor. */
  progress?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  className?: string;
}

/**
 * Room tile — DESIGN_SYSTEM §6.Tiles de cômodo.
 * - card 2-col, padding 14, min-height 110
 * - top: 40×40 icon chip with bg `${color}1F` (12%)
 * - 3px progress bar in the room color
 */
export function Tile({
  icon,
  iconColor,
  title,
  subtitle,
  progress = 0,
  onPress,
  onLongPress,
  className,
}: TileProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={title}
      className={cn(
        'bg-bg-2 border border-line-1 rounded-2xl active:bg-bg-3',
        className,
      )}
      style={{ minHeight: 110, padding: 14 }}
    >
      {/* Icon chip */}
      <View
        className="items-center justify-center rounded-xl mb-3"
        style={{ width: 40, height: 40, backgroundColor: `${iconColor}1F` }}
      >
        <Icon name={icon} size={22} color={iconColor} />
      </View>

      <Text className="text-ink-1 font-semibold text-sm" numberOfLines={1}>
        {title}
      </Text>

      {subtitle && (
        <Text className="text-ink-3 text-xs mt-0.5" numberOfLines={1}>
          {subtitle}
        </Text>
      )}

      {/* Progress bar */}
      <View
        className="bg-bg-4 rounded-full overflow-hidden mt-3"
        style={{ height: 3 }}
      >
        <View
          className="rounded-full"
          style={{
            height: 3,
            width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
            backgroundColor: iconColor,
          }}
        />
      </View>
    </Pressable>
  );
}

/** "+ Novo cômodo" tile — full width, dashed border. */
export function NewTile({
  label = 'Novo cômodo',
  onPress,
}: {
  label?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="rounded-2xl active:bg-bg-2"
      style={{
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#294A39',
        paddingVertical: 18,
        alignItems: 'center',
      }}
    >
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Icon name="plus" tone="brand" size={18} outline />
        <Text className="text-brand-400 font-semibold text-sm">{label}</Text>
      </View>
    </Pressable>
  );
}
