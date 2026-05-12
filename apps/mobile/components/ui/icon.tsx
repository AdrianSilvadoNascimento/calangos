import {
  // Navigation / chevrons
  ArrowLeft, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  // Tabs
  Home, Grid2x2, Heart, User,
  // Actions
  Plus, Pencil, Trash2, X, Check, Search, Filter, MoreVertical, MoreHorizontal, Share2,
  // Status
  Star, ShoppingCart, PackageCheck, XCircle, Package, CircleCheck, Store, AlertCircle,
  // Media
  Image as ImageIcon,
  // Communication
  Bell, Mail, Link2,
  // Vibes
  Sparkles, Trophy, PawPrint, LogOut, Download, Settings,
  // Auth / forms
  Eye, EyeOff, Lock,
  // Room icons
  UtensilsCrossed, BedDouble, Bath, Shirt, Laptop,
  Leaf, Brush, Flower2, Gamepad2, Armchair, Utensils,
  Music, BookOpen, Dumbbell,
  type LucideIcon,
} from 'lucide-react-native';

const ICON_MAP = {
  // navigation
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  // tabs
  'home': Home,
  'grid': Grid2x2,
  'heart': Heart,
  'user': User,
  // actions
  'plus': Plus,
  'pencil': Pencil,
  'trash': Trash2,
  'x': X,
  'check': Check,
  'search': Search,
  'filter': Filter,
  'more-vertical': MoreVertical,
  'more-horizontal': MoreHorizontal,
  'share': Share2,
  // status
  'star': Star,
  'shopping-cart': ShoppingCart,
  'package-check': PackageCheck,
  'x-circle': XCircle,
  'package': Package,
  'circle-check': CircleCheck,
  'store': Store,
  'alert-circle': AlertCircle,
  // media
  'image': ImageIcon,
  // communication
  'bell': Bell,
  'mail': Mail,
  'link': Link2,
  // vibes
  'sparkles': Sparkles,
  'trophy': Trophy,
  'paw': PawPrint,
  'log-out': LogOut,
  'download': Download,
  'settings': Settings,
  // forms
  'eye': Eye,
  'eye-off': EyeOff,
  'lock': Lock,
  // room icons
  'utensils-crossed': UtensilsCrossed,
  'bed': BedDouble,
  'bath': Bath,
  'shirt': Shirt,
  'laptop': Laptop,
  'leaf': Leaf,
  'brush': Brush,
  'flower': Flower2,
  'gamepad': Gamepad2,
  'armchair': Armchair,
  'utensils': Utensils,
  'music': Music,
  'book': BookOpen,
  'dumbbell': Dumbbell,
} as const;

export type IconName = keyof typeof ICON_MAP;

const TONE_COLORS = {
  'brand': '#5FCB8B',
  'brand-strong': '#34B26C',
  'coral': '#E89784',
  'amber': '#D9B370',
  'rose': '#D98A99',
  'sky': '#7FB6D9',
  'danger': '#E0746A',
  'ink-1': '#F2F6EF',
  'ink-2': '#C2D0C5',
  'ink-3': '#8AA194',
  'ink-4': '#5F786A',
  'current': 'currentColor',
} as const;

export type IconTone = keyof typeof TONE_COLORS;

export interface IconProps {
  name: IconName;
  size?: number;
  tone?: IconTone;
  color?: string;
  /** Disable the duotone fill (outline only). */
  outline?: boolean;
  /** Duotone fill alpha as 0–255 byte (default 0x30 ≈ 18%, per DESIGN_SYSTEM §5). */
  fillAlpha?: number;
  strokeWidth?: number;
}

/**
 * Duotone wrapper for Lucide icons.
 *
 * - default: outline 1.6px + fill currentColor @ ~18% opacity (DESIGN_SYSTEM §5)
 * - `tone` maps to design tokens; `color` overrides; `outline` disables fill.
 */
export function Icon({
  name,
  size = 22,
  tone,
  color,
  outline = false,
  fillAlpha = 0x30,
  strokeWidth = 1.6,
}: IconProps) {
  const LucideComp = ICON_MAP[name] as LucideIcon;
  if (!LucideComp) {
    if (__DEV__) console.warn(`<Icon name="${name}"> not registered in ICON_MAP`);
    return null;
  }

  const resolved = color ?? (tone ? TONE_COLORS[tone] : '#C2D0C5'); // default ink-2
  const fill = outline ? 'none' : `${resolved}${fillAlpha.toString(16).padStart(2, '0')}`;

  return (
    <LucideComp
      size={size}
      color={resolved}
      strokeWidth={strokeWidth}
      fill={fill}
    />
  );
}
