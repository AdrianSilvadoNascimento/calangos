import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';
import { Icon, type IconName } from './icon';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'ghost' | 'secondary' | 'danger-ghost';
export type ButtonSize = 'xs' | 'sm' | 'md';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const SIZE_STYLES: Record<ButtonSize, { height: number; px: string; text: string; iconSize: number; gap: number }> = {
  xs: { height: 30, px: 'px-3',   text: 'text-xs',  iconSize: 14, gap: 6 },
  sm: { height: 38, px: 'px-4',   text: 'text-sm',  iconSize: 16, gap: 8 },
  md: { height: 52, px: 'px-5',   text: 'text-base', iconSize: 18, gap: 10 },
};

interface VariantStyle {
  bg: string;
  border?: string;
  textColor: string;
  iconColor: string;
  pressedBg: string;
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  'primary':       { bg: 'bg-brand-500', textColor: '#04140A', iconColor: '#04140A', pressedBg: 'active:bg-brand-700' },
  'ghost':         { bg: 'bg-transparent', border: 'border border-line-2', textColor: '#F2F6EF', iconColor: '#F2F6EF', pressedBg: 'active:bg-bg-2' },
  'secondary':     { bg: 'bg-bg-3', border: 'border border-line-2', textColor: '#F2F6EF', iconColor: '#F2F6EF', pressedBg: 'active:bg-bg-4' },
  'danger-ghost':  { bg: '', textColor: '#E0746A', iconColor: '#E0746A', pressedBg: 'active:opacity-70' },
};

/**
 * Button primitive — DESIGN_SYSTEM §6.Buttons.
 * - primary: brand-500 + #04140A text, height 52, radius 999
 * - ghost: transparent + line-2 border
 * - secondary: bg-3 + line-2 border
 * - danger-ghost: transparent coral background, danger text
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = true,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const sz = SIZE_STYLES[size];
  const v = VARIANTS[variant];
  const isDangerGhost = variant === 'danger-ghost';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || loading }}
      disabled={disabled || loading}
      className={cn(
        'rounded-full items-center justify-center flex-row',
        sz.px,
        v.bg,
        v.border,
        v.pressedBg,
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-60',
        className,
      )}
      style={[
        { height: sz.height, gap: sz.gap },
        isDangerGhost && { backgroundColor: 'rgba(224,116,106,0.10)' },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.textColor} size="small" />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} size={sz.iconSize} color={v.iconColor} outline />}
          <Text className={cn('font-semibold', sz.text)} style={{ color: v.textColor }}>
            {label}
          </Text>
          {rightIcon && <Icon name={rightIcon} size={sz.iconSize} color={v.iconColor} outline />}
        </>
      )}
    </Pressable>
  );
}

/** Compact text-only "link" button — `← Voltar` style, brand-400 color (DESIGN_SYSTEM §8). */
export function LinkButton({
  label,
  leftIcon,
  rightIcon,
  onPress,
  className,
}: {
  label: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onPress?: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      className={cn('flex-row items-center self-start py-2 active:opacity-70', className)}
      style={{ gap: 6 }}
    >
      {leftIcon && <Icon name={leftIcon} tone="brand" size={18} outline />}
      <Text className="text-brand-400 font-semibold text-base">{label}</Text>
      {rightIcon && <Icon name={rightIcon} tone="brand" size={18} outline />}
    </Pressable>
  );
}

/**
 * Floating Action Button — primary accent, drop shadow, 56×56.
 * Used in cômodo detalhe (DESIGN_SYSTEM §8 + §4).
 */
export function FAB({
  icon = 'plus',
  onPress,
  accessibilityLabel,
  bottom = 24,
}: {
  icon?: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  bottom?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="absolute right-6 items-center justify-center active:opacity-80"
      style={{
        bottom,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#34B26C',
        boxShadow: '0px 6px 16px rgba(7, 18, 13, 0.45)',
      }}
    >
      <Icon name={icon} size={26} color="#04140A" strokeWidth={2.2} outline />
    </Pressable>
  );
}
