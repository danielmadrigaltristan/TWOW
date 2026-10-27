import { ComboEffect, MutagenColor, SchoolId } from './models';

export const MUTAGEN_COLORS: readonly MutagenColor[] = ['green', 'red', 'blue'];
export const MUTAGEN_NAMES: Record<MutagenColor, string> = { green: 'verde', red: 'rojo', blue: 'azul' };
export const SCHOOL_MUTAGEN_EFFECTS: Partial<Record<SchoolId, Record<MutagenColor, ComboEffect>>> = {
  wolf: { blue: { damage: 1 }, red: { shield: 1 }, green: { recover: 1 } },
  cat: { blue: { damage: 2 }, red: { damage: 1 }, green: { shield: 1 } },
  bear: { blue: { shield: 1 }, red: { shield: 1 }, green: { shield: 1 } },
  viper: { blue: { damage: 1 }, red: { damage: 2 }, green: { damage: 1 } },
  griffin: { blue: { recover: 1 }, red: { damage: 1 }, green: { recover: 1 } },
  manticore: { blue: { potions: 1 }, red: { damage: 1 }, green: { potions: 1 } },
};
