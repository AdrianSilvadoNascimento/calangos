import type { MilestoneType } from '@enxoval/contracts';

export interface MilestoneCopy {
  /** Title shown in toast/celebration modal. */
  title: string;
  /** Body text — short. */
  body: string;
}

export const ITEM_THRESHOLDS: Record<
  Extract<MilestoneType, 'items_10' | 'items_25' | 'items_50' | 'items_100'>,
  number
> = {
  items_10: 10,
  items_25: 25,
  items_50: 50,
  items_100: 100,
};

export const COPY: Record<MilestoneType, MilestoneCopy> = {
  items_10: {
    title: 'Primeiros 10 itens 🎉',
    body: 'Que começo! Vocês estão indo bem 💍',
  },
  items_25: {
    title: '25 itens já 💍',
    body: 'Esse enxoval tá tomando forma',
  },
  items_50: {
    title: '50 itens! Quase lá 🦎',
    body: 'Vocês são uma dupla afiada',
  },
  items_100: {
    title: '100 itens! Conquista lendária 🏆',
    body: 'Os calangos estão impressionados',
  },
  first_purchased: {
    title: 'Primeiro item comprado 🛒',
    body: 'O enxoval começou a virar realidade!',
  },
  first_received: {
    title: 'Primeiro item recebido em casa 🦎',
    body: 'A casinha tá começando a ganhar vida',
  },
  room_50_percent: {
    title: 'Cômodo 50% pronto 🌿',
    body: 'Metade do caminho — continuem!',
  },
  room_100_percent: {
    title: 'Cômodo completo 🎉',
    body: 'Mais um espaço pronto pra estrear',
  },
  partner_joined: {
    title: 'Vocês estão juntos ♥',
    body: 'Agora é a dupla organizando o enxoval',
  },
};
