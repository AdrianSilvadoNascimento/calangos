import { useState, forwardRef, type Ref } from 'react';
import { View, Text, TextInput, Pressable, type TextInputProps } from 'react-native';
import { Icon, type IconName } from './icon';
import { cn } from '../../lib/cn';

export interface InputProps extends Omit<TextInputProps, 'placeholderTextColor' | 'style'> {
  label?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onPressRightIcon?: () => void;
  /** Renders an eye/eye-off toggle and manages secureTextEntry. */
  secureToggle?: boolean;
  error?: string;
  className?: string;
  /** Optional minimum height in px when multiline is true (default 120). */
  minHeight?: number;
}

/**
 * Input primitive — DESIGN_SYSTEM §6.Inputs.
 * - height 54, radius 16, bg-bg-2
 * - icon at left in ink-3
 * - focused: bg-bg-1 + 1.5px brand-500 border
 * - label = eyebrow 11px UPPERCASE above
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    leftIcon,
    rightIcon,
    onPressRightIcon,
    secureToggle,
    error,
    className,
    onFocus,
    onBlur,
    secureTextEntry: secureTextEntryProp,
    multiline,
    minHeight,
    ...rest
  }: InputProps,
  ref: Ref<TextInput>,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const secureTextEntry = secureToggle ? !revealed : secureTextEntryProp;
  const effectiveRightIcon = secureToggle ? (revealed ? 'eye-off' : 'eye') : rightIcon;
  const handleRightIconPress = secureToggle ? () => setRevealed((v) => !v) : onPressRightIcon;
  const containerHeight = multiline ? undefined : 54;
  const containerMinHeight = multiline ? (minHeight ?? 120) : undefined;

  return (
    <View className={cn('w-full', className)}>
      {label && (
        <Text className="text-ink-3 text-[11px] uppercase font-semibold mb-2 ml-0.5"
              style={{ letterSpacing: 1.6 }}>
          {label}
        </Text>
      )}

      <View
        className={cn(
          'rounded-2xl border',
          multiline ? 'flex-row items-start' : 'flex-row items-center',
          focused ? 'bg-bg-1 border-brand-500' : 'bg-bg-2 border-line-2',
          error && 'border-danger',
        )}
        style={{ height: containerHeight, minHeight: containerMinHeight, borderWidth: focused ? 1.5 : 1 }}
      >
        {leftIcon && (
          <View className={cn('pl-4', multiline && 'pt-4')}>
            <Icon name={leftIcon} tone="ink-3" size={20} outline />
          </View>
        )}

        <TextInput
          ref={ref}
          className="flex-1 text-ink-1 px-4 text-base"
          style={{
            fontFamily: 'Geist_400Regular',
            ...(multiline ? { paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top' as const } : null),
          }}
          placeholderTextColor="#5F786A"
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {effectiveRightIcon && (
          <Pressable
            onPress={handleRightIconPress}
            hitSlop={8}
            className="pr-4 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={secureToggle ? (revealed ? 'Esconder senha' : 'Mostrar senha') : undefined}
          >
            <Icon name={effectiveRightIcon} tone="ink-3" size={20} outline />
          </Pressable>
        )}
      </View>

      {error && <Text className="text-danger text-xs mt-1.5 ml-0.5">{error}</Text>}
    </View>
  );
});
