import { Switch, Text, View } from 'react-native';
import { Icon, type IconName } from './icon';
import { cn } from '../../lib/cn';

export interface ToggleRowProps {
  label: string;
  description?: string;
  icon?: IconName;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * ToggleRow — switch nativo com label/description.
 * Hit target ≥ 44px (DESIGN_SYSTEM §10).
 */
export function ToggleRow({
  label,
  description,
  icon,
  value,
  onChange,
  disabled,
  className,
}: ToggleRowProps) {
  return (
    <View
      className={cn('flex-row items-center px-4 py-3', className)}
      style={{ minHeight: 56 }}
    >
      {icon && (
        <View style={{ marginRight: 12 }}>
          <Icon name={icon} tone="ink-3" size={20} outline />
        </View>
      )}
      <View className="flex-1 mr-3">
        <Text className="text-ink-1 font-semibold text-sm">{label}</Text>
        {description && (
          <Text className="text-ink-3 text-xs mt-0.5">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: '#1F4A3A', true: '#34B26C' }}
        thumbColor={value ? '#DDF5E4' : '#8AA194'}
        ios_backgroundColor="#1F4A3A"
      />
    </View>
  );
}
