import { Text, View } from 'react-native';
import { Avatar } from './avatar';
import { Icon, type IconName, type IconTone } from './icon';
import { cn } from '../../lib/cn';

export type ActivityType =
  | 'product.added'
  | 'product.purchased'
  | 'product.received'
  | 'product.cancelled'
  | 'product.wishlisted'
  | 'room.created'
  | 'milestone.unlocked'
  | 'partner.joined';

export interface ActivityRowProps {
  actorName: string;
  actorVariant: 'brand' | 'coral';
  type: ActivityType;
  /** e.g. product title, room name, milestone label */
  target: string;
  /** Already-formatted relative time, e.g. "agora", "5 min", "ontem" */
  time: string;
  className?: string;
}

const VERB_BY_TYPE: Record<ActivityType, { verb: string; icon: IconName; tone: IconTone }> = {
  'product.added':     { verb: 'adicionou',         icon: 'sparkles',     tone: 'brand' },
  'product.purchased': { verb: 'comprou',           icon: 'shopping-cart', tone: 'sky' },
  'product.received':  { verb: 'recebeu',           icon: 'package-check', tone: 'brand' },
  'product.cancelled': { verb: 'cancelou',          icon: 'x-circle',      tone: 'danger' },
  'product.wishlisted':{ verb: 'voltou pra desejos', icon: 'star',          tone: 'coral' },
  'room.created':      { verb: 'criou o cômodo',    icon: 'home',          tone: 'amber' },
  'milestone.unlocked':{ verb: 'desbloqueou',        icon: 'trophy',        tone: 'amber' },
  'partner.joined':    { verb: 'entrou no enxoval', icon: 'heart',         tone: 'coral' },
};

/**
 * ActivityRow — uma linha do feed do casal.
 * "Maria adicionou Geladeira Brastemp · agora"
 */
export function ActivityRow({
  actorName,
  actorVariant,
  type,
  target,
  time,
  className,
}: ActivityRowProps) {
  const meta = VERB_BY_TYPE[type];

  return (
    <View
      className={cn('flex-row items-center px-2 py-3', className)}
      style={{ gap: 12 }}
    >
      <Avatar name={actorName} variant={actorVariant} size={36} />

      <View className="flex-1">
        <Text className="text-ink-2 text-sm" numberOfLines={2}>
          <Text className="text-ink-1 font-semibold">{actorName} </Text>
          {meta.verb}
          {' '}
          <Text className="text-ink-1 font-semibold">{target}</Text>
        </Text>
        <Text className="text-ink-4 text-xs mt-0.5">{time}</Text>
      </View>

      <View
        className="items-center justify-center rounded-full"
        style={{ width: 32, height: 32 }}
      >
        <Icon name={meta.icon} tone={meta.tone} size={18} />
      </View>
    </View>
  );
}
