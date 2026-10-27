import { Card, School, LABELS } from './models';
// Source: Numeración y explicación de cartas del automa.docx.
// Duplicate IDs in sections 2.2 and e.3.3 normalized to 8 and 27.
const specifications: readonly Omit<Card, 'description'>[] = [
  {
    "id": 1,
    "level": 1,
    "kind": "generic",
    "color": "blue",
    "destination": 2,
    "movement": 4,
    "direction": "up",
    "actions": [
      "alchemy",
      "special",
      "trace"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 0
    },
    "market": [
      6
    ],
    "damage": 2,
    "shield": 0,
    "monsterAttack": "bite",
    "dice": [
      1,
      2,
      3,
      4,
      4
    ],
    "mutagens": [
      "red"
    ]
  },
  {
    "id": 2,
    "level": 1,
    "kind": "generic",
    "color": "purple",
    "destination": 15,
    "movement": 2,
    "direction": "down",
    "actions": [
      "lowest",
      "bomb"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 0
    },
    "market": [
      1,
      5
    ],
    "damage": 2,
    "shield": 0,
    "monsterAttack": "charge",
    "dice": [
      5,
      3,
      3,
      4,
      4
    ],
    "mutagens": [],
    "potion": {
      "damage": 1
    }
  },
  {
    "id": 3,
    "level": 1,
    "kind": "generic",
    "color": "green",
    "destination": 8,
    "movement": 1,
    "direction": "up",
    "actions": [
      "defense",
      "lowest"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 0
    },
    "market": [
      4,
      6
    ],
    "damage": 1,
    "shield": 2,
    "monsterAttack": "bite",
    "dice": [
      1,
      5,
      2,
      2,
      2
    ],
    "mutagens": [],
    "onDamage": {
      "maxShield": true
    }
  },
  {
    "id": 4,
    "level": 1,
    "kind": "generic",
    "color": "red",
    "destination": 11,
    "movement": 3,
    "direction": "down",
    "actions": [
      "lowest",
      "alchemy",
      "potion"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 0
    },
    "market": [
      3
    ],
    "damage": 3,
    "shield": 0,
    "monsterAttack": "charge",
    "dice": [
      1,
      2,
      3,
      4,
      6
    ],
    "mutagens": []
  },
  {
    "id": 5,
    "level": 1,
    "kind": "generic",
    "color": "yellow",
    "destination": 5,
    "movement": 3,
    "direction": "up",
    "actions": [
      "attack",
      "special"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 0
    },
    "market": [
      2
    ],
    "damage": 2,
    "shield": 1,
    "monsterAttack": "charge",
    "dice": [
      6,
      6,
      3,
      3,
      3
    ],
    "mutagens": [
      "green"
    ],
    "onDamage": {
      "damage": 2
    }
  },
  {
    "id": 6,
    "level": 1,
    "kind": "generic",
    "color": "blue",
    "destination": 16,
    "movement": 4,
    "direction": "down",
    "actions": [
      "attack",
      "potion"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 0
    },
    "market": [
      1
    ],
    "damage": 3,
    "shield": 0,
    "monsterAttack": "bite",
    "dice": [
      1,
      3,
      4,
      4,
      4
    ],
    "mutagens": [
      "blue"
    ]
  },
  {
    "id": 7,
    "level": 2,
    "kind": "generic",
    "color": "purple",
    "destination": 18,
    "movement": 3,
    "direction": "up",
    "actions": [
      "alchemy",
      "potion"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 1
    },
    "market": [
      4
    ],
    "damage": 2,
    "shield": 0,
    "monsterAttack": "bite",
    "dice": [
      1,
      2,
      3,
      4,
      5
    ],
    "mutagens": [
      "blue",
      "green"
    ],
    "potion": {
      "damage": 2
    }
  },
  {
    "id": 8,
    "level": 2,
    "kind": "generic",
    "color": "green",
    "destination": 10,
    "movement": 3,
    "direction": "down",
    "actions": [
      "lowest",
      "defense"
    ],
    "phase2": [
      "witcher",
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 1
    },
    "market": [
      1
    ],
    "damage": 3,
    "shield": 0,
    "monsterAttack": "charge",
    "dice": [
      1,
      3,
      4,
      4,
      4
    ],
    "mutagens": [
      "blue"
    ]
  },
  {
    "id": 9,
    "level": 2,
    "kind": "generic",
    "color": "red",
    "destination": 1,
    "movement": 3,
    "direction": "up",
    "actions": [
      "highest",
      "special"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 1
    },
    "market": [
      6
    ],
    "damage": 5,
    "shield": 0,
    "monsterAttack": "charge",
    "dice": [
      5,
      3,
      3,
      3,
      3
    ],
    "mutagens": [],
    "effect": {
      "discard": 1
    }
  },
  {
    "id": 10,
    "level": 2,
    "kind": "generic",
    "color": "yellow",
    "destination": 6,
    "movement": 3,
    "direction": "down",
    "actions": [
      "attack",
      "defense"
    ],
    "phase2": [
      "witcher",
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 1
    },
    "market": [
      3
    ],
    "damage": 2,
    "shield": 2,
    "monsterAttack": "bite",
    "dice": [
      1,
      1,
      1,
      2,
      2
    ],
    "mutagens": [
      "blue",
      "red"
    ]
  },
  {
    "id": 11,
    "level": 2,
    "kind": "generic",
    "color": "blue",
    "destination": 12,
    "movement": 4,
    "direction": "up",
    "actions": [
      "potion",
      "potion"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 2
    },
    "market": [
      1,
      2
    ],
    "damage": 3,
    "shield": 0,
    "monsterAttack": "bite",
    "dice": [
      1,
      6,
      3,
      5,
      5
    ],
    "mutagens": [],
    "bomb": {
      "chain": true
    }
  },
  {
    "id": 12,
    "level": 2,
    "kind": "generic",
    "color": "purple",
    "destination": 13,
    "movement": 2,
    "direction": "down",
    "actions": [
      "defense",
      "potion"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 2
    },
    "market": [
      2
    ],
    "damage": 3,
    "shield": 0,
    "monsterAttack": "charge",
    "dice": [
      4,
      2,
      2,
      5,
      5
    ],
    "mutagens": [],
    "bomb": {
      "discard": 1,
      "damage": 2
    }
  },
  {
    "id": 13,
    "level": 3,
    "kind": "generic",
    "color": "green",
    "destination": 3,
    "movement": 3,
    "direction": "up",
    "actions": [
      "attack",
      "trace"
    ],
    "phase2": [
      "witcher",
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 3
    },
    "market": [
      3
    ],
    "damage": 3,
    "shield": 2,
    "monsterAttack": "charge",
    "dice": [
      2,
      3,
      4,
      5,
      6
    ],
    "mutagens": [],
    "potion": {
      "recover": 1
    }
  },
  {
    "id": 14,
    "level": 3,
    "kind": "generic",
    "color": "red",
    "destination": 7,
    "movement": 3,
    "direction": "down",
    "actions": [
      "special",
      "bomb"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 3
    },
    "market": [
      2
    ],
    "damage": 6,
    "shield": 0,
    "monsterAttack": "charge",
    "dice": [
      1,
      1,
      1,
      1,
      1
    ],
    "mutagens": [],
    "effect": {
      "discard": 1
    }
  },
  {
    "id": 15,
    "level": 3,
    "kind": "generic",
    "color": "yellow",
    "destination": 9,
    "movement": 1,
    "direction": "up",
    "actions": [
      "defense",
      "highest",
      "potion"
    ],
    "phase2": [
      "meditate",
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 3
    },
    "market": [
      3,
      5
    ],
    "damage": 3,
    "shield": 1,
    "monsterAttack": "bite",
    "dice": [
      3,
      1,
      1,
      6,
      6
    ],
    "mutagens": [
      "blue",
      "green",
      "red"
    ]
  },
  {
    "id": 16,
    "level": 3,
    "kind": "generic",
    "color": "blue",
    "destination": 17,
    "movement": 4,
    "direction": "down",
    "actions": [
      "attack",
      "highest"
    ],
    "phase2": [
      "meditate",
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 3
    },
    "market": [
      1
    ],
    "damage": 4,
    "shield": 0,
    "monsterAttack": "bite",
    "dice": [
      2,
      2,
      5,
      5,
      5
    ],
    "mutagens": [
      "green"
    ],
    "bomb": {
      "chain": true
    }
  },
  {
    "id": 17,
    "level": 3,
    "kind": "generic",
    "color": "purple",
    "destination": 14,
    "movement": 4,
    "direction": "up",
    "actions": [
      "alchemy",
      "trace"
    ],
    "phase2": [
      "meditate",
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 3
    },
    "market": [
      6
    ],
    "damage": 3,
    "shield": 0,
    "monsterAttack": "charge",
    "dice": [
      1,
      2,
      3,
      3,
      3
    ],
    "mutagens": [
      "blue",
      "red",
      "green"
    ]
  },
  {
    "id": 18,
    "level": 3,
    "kind": "generic",
    "color": "green",
    "destination": 4,
    "movement": 4,
    "direction": "down",
    "actions": [
      "special",
      "highest"
    ],
    "phase2": [
      "meditate",
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 3
    },
    "market": [
      4,
      5
    ],
    "damage": 0,
    "shield": 3,
    "monsterAttack": "charge",
    "dice": [
      4,
      6,
      1,
      3,
      3
    ],
    "mutagens": [
      "blue",
      "red"
    ],
    "potion": {
      "potionDamage": 0
    }
  },
  {
    "id": 19,
    "level": 1,
    "kind": "specific",
    "color": "gray",
    "destination": "monster",
    "movement": "unlimited",
    "direction": "down",
    "actions": [
      "attack",
      "defense"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 0
    },
    "market": [
      1
    ],
    "damage": 3,
    "shield": 0,
    "monsterAttack": "charge",
    "dice": [
      1,
      6,
      6,
      5,
      5
    ],
    "mutagens": [
      "red"
    ],
    "onDamage": {
      "damage": 2
    }
  },
  {
    "id": 20,
    "level": 1,
    "kind": "specific",
    "color": "gray",
    "destination": "monster",
    "movement": "unlimited",
    "direction": "up",
    "actions": [
      "special",
      "defense",
      "trace"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 0
    },
    "market": [
      2,
      3
    ],
    "damage": 1,
    "shield": 2,
    "monsterAttack": "bite",
    "dice": [
      4,
      2,
      6,
      6,
      6
    ],
    "mutagens": [
      "blue"
    ],
    "potion": {
      "damage": 2
    }
  },
  {
    "id": 21,
    "level": 1,
    "kind": "specific",
    "color": "gray",
    "destination": "monster",
    "movement": "unlimited",
    "direction": "down",
    "actions": [
      "attack",
      "alchemy"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 0
    },
    "market": [
      4
    ],
    "damage": 2,
    "shield": 1,
    "monsterAttack": "charge",
    "dice": [
      1,
      2,
      3,
      5,
      5
    ],
    "mutagens": [
      "green"
    ],
    "effect": {
      "discard": 2
    }
  },
  {
    "id": 22,
    "level": 2,
    "kind": "specific",
    "color": "gray",
    "destination": "monster",
    "movement": "unlimited",
    "direction": "up",
    "actions": [
      "highest",
      "bomb"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 2
    },
    "market": [
      3,
      4
    ],
    "damage": 3,
    "shield": 1,
    "monsterAttack": "bite",
    "dice": [
      2,
      3,
      4,
      5,
      6
    ],
    "mutagens": [
      "red",
      "blue"
    ],
    "onDamage": {
      "damage": 2
    }
  },
  {
    "id": 23,
    "level": 2,
    "kind": "specific",
    "color": "gray",
    "destination": "monster",
    "movement": "unlimited",
    "direction": "down",
    "actions": [
      "lowest",
      "potion"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 2
    },
    "market": [
      1
    ],
    "damage": 5,
    "shield": 0,
    "monsterAttack": "charge",
    "dice": [
      1,
      2,
      2,
      5,
      5
    ],
    "mutagens": [
      "red",
      "green"
    ]
  },
  {
    "id": 24,
    "level": 2,
    "kind": "specific",
    "color": "gray",
    "destination": "monster",
    "movement": "unlimited",
    "direction": "up",
    "actions": [
      "potion",
      "bomb",
      "trace"
    ],
    "phase2": [
      "monster"
    ],
    "condition": {
      "operator": "lte",
      "trophies": 2
    },
    "market": [
      2
    ],
    "damage": 2,
    "shield": 2,
    "monsterAttack": "bite",
    "dice": [
      3,
      1,
      1,
      6,
      6
    ],
    "mutagens": [
      "blue",
      "green"
    ],
    "effect": {
      "chain": true
    }
  },
  {
    "id": 25,
    "level": 3,
    "kind": "trophy",
    "color": "gray",
    "destination": "monster",
    "movement": "unlimited",
    "direction": "down",
    "actions": [
      "highest",
      "trace"
    ],
    "phase2": [
      "monster"
    ],
    "market": [
      4
    ],
    "damage": 0,
    "shield": 0,
    "monsterAttack": "bite",
    "dice": [
      2,
      3,
      4,
      5,
      6
    ],
    "mutagens": [
      "red",
      "green"
    ],
    "schoolSpecial": 1
  },
  {
    "id": 26,
    "level": 3,
    "kind": "trophy",
    "color": "gray",
    "destination": "monster",
    "movement": "unlimited",
    "direction": "down",
    "actions": [
      "special",
      "alchemy"
    ],
    "phase2": [
      "monster"
    ],
    "market": [
      3
    ],
    "damage": 0,
    "shield": 0,
    "monsterAttack": "charge",
    "dice": [
      5,
      5,
      6,
      6,
      6
    ],
    "mutagens": [
      "blue",
      "green"
    ],
    "schoolSpecial": 2
  },
  {
    "id": 27,
    "level": 3,
    "kind": "trophy",
    "color": "gray",
    "destination": "monster",
    "movement": "unlimited",
    "direction": "down",
    "actions": [
      "potion",
      "bomb"
    ],
    "phase2": [
      "monster"
    ],
    "market": [
      1,
      2
    ],
    "damage": 0,
    "shield": 0,
    "monsterAttack": "bite",
    "dice": [
      4,
      6,
      6,
      6,
      6
    ],
    "mutagens": [
      "blue",
      "red"
    ],
    "schoolSpecial": 3
  }
];
export const CARDS: readonly Card[] = Object.freeze(specifications.map(c => Object.freeze({ ...c, description: `${c.destination === 'monster' ? 'Avanza hacia el monstruo seleccionado' : 'Avanza hacia la localización ' + c.destination}. ${c.actions.map(a => LABELS[a]).join('; ')}.` })));
export const CARD_BY_ID: Readonly<Record<number, Card>> = Object.freeze(Object.fromEntries(CARDS.map(c => [c.id, c])));
export const SCHOOLS: readonly School[] = [
  {
    id: 'wolf',
    name: 'Lobo',
    subtitle: 'El equilibrio de Kaer Morhen',
    color: '#b96152',
    specials: [
      { damage: 3, shield: 2 },
      { damage: 4, shield: 1 },
      { damage: 3, shield: 1, recover: 1 },
    ],
  },
  {
    id: 'cat',
    name: 'Gato',
    subtitle: 'Precisión desde las sombras',
    color: '#6a9db8',
    specials: [
      { damage: 1, shield: 1, chain: true, recover: 1 },
      { damage: 2, shield: 1, chain: true },
      { damage: 1, shield: 2, chain: true },
    ],
  },
  {
    id: 'bear',
    name: 'Oso',
    subtitle: 'Una defensa implacable',
    color: '#af8c61',
    specials: [{ damage: 2, maxShield: true }, { damage: 2, shield: 3 }, { ignoreNext: true }],
  },
  {
    id: 'viper',
    name: 'Víbora',
    subtitle: 'Un golpe, una sentencia',
    color: '#7caa81',
    specials: [{ damage: 2, nextDamage: 2 }, { damage: 3, chain: true }, { damage: 5 }],
  },
  {
    id: 'griffin',
    name: 'Grifo',
    subtitle: 'El dominio de las señales',
    color: '#c9af67',
    specials: [
      { damage: 2, shield: 1, recover: 2 },
      { damage: 3, recover: 2 },
      { damage: 3, recover: 3 },
    ],
  },
  {
    id: 'manticore',
    name: 'Mantícora',
    subtitle: 'La alquimia como arma',
    color: '#c99260',
    specials: [
      { damage: 2, shield: 1, potions: 1 },
      { damage: 2, shield: 1, potions: 2 },
      { shield: 2, potionDamage: 5 },
    ],
  },
  {
    id: 'ciri',
    name: 'Ciri',
    subtitle: 'La Dama del Espacio y el Tiempo',
    color: '#b0c5bd',
    specials: [{ damage: 4, chain: true }, { damage: 2, ignorePassive: true }, { damage: 7 }],
  },
];
export function cardImage(id: number): string {
  return `cards/${String(id).padStart(2, '0')}.webp`;
}

export function schoolTitle(school: School): string {
  if (school.id === 'ciri') return school.name;
  return `Escuela ${school.id === 'viper' || school.id === 'manticore' ? 'de la' : 'del'} ${school.name}`;
}
