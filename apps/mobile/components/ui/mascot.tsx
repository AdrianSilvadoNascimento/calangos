import { Image, View, type ImageStyle, type ViewStyle } from 'react-native';

export type MascotVariant = 'signin' | 'organizando' | 'juntos' | 'greetings';
export type MascotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const ASSETS: Record<MascotVariant, any> = {
  signin:      require('../../assets/calangos-signin.png'),
  organizando: require('../../assets/calangos-organizando.png'),
  juntos:      require('../../assets/calangos-juntos.png'),
  greetings:   require('../../assets/greetings.png'),
};

const SIZES: Record<MascotSize, number> = {
  xs: 80,
  sm: 100,
  md: 130,
  lg: 160,
  xl: 180,
};

export interface MascotProps {
  variant?: MascotVariant;
  size?: MascotSize | number;
  /** Soft brand glow halo behind the mascot. */
  glow?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

/**
 * Mascot — wrapper sobre os PNGs 3D do calango (DESIGN_SYSTEM §9 + HI-FI-TODO §157).
 *
 * Use em onboarding, empty states e milestones.
 * NÃO use o mascote como ícone funcional — pra isso, use <Icon />.
 */
export function Mascot({
  variant = 'organizando',
  size = 'md',
  glow = false,
  style,
  imageStyle,
}: MascotProps) {
  const dim = typeof size === 'number' ? size : SIZES[size];

  return (
    <View
      style={[{ width: dim, height: dim, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      {glow && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: dim * 0.92,
            height: dim * 0.92,
            borderRadius: dim,
            backgroundColor: '#34B26C',
            opacity: 0.10,
            shadowColor: '#34B26C',
            shadowOpacity: 0.45,
            shadowRadius: dim / 2.6,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      )}
      <Image
        source={ASSETS[variant]}
        resizeMode="contain"
        style={[{ width: dim, height: dim }, imageStyle]}
      />
    </View>
  );
}
