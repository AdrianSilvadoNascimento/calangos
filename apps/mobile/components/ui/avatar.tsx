import { View, Text, ViewStyle } from 'react-native';

export interface AvatarProps {
  name: string;
  variant: 'brand' | 'coral';
  size?: number;
  style?: ViewStyle;
  className?: string;
}

export function Avatar({ name, variant, size = 64, style, className }: AvatarProps) {
  const initials = name
    ?.split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const bg = variant === 'brand' ? '#34B26C' : '#E89784';
  const textColor = variant === 'brand' ? '#04140A' : '#3D1F18';
  const fontSize = size * 0.34;

  return (
    <View
      className={className}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: textColor, fontSize, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}
