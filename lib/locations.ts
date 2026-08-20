export type LocationKey = 'hospital' | 'school' | 'supermarket' | 'police' | 'gasstation'
export type ItemType = 'food' | 'water' | 'medkit' | 'ammo' | 'scrap'

export interface LootDefinition {
  itemType: ItemType
  label: string
  icon: string
}

export interface LocationDefinition {
  key: LocationKey
  name: string
  icon: string
  tagline: string
  gradient: string
  sceneEmojis: string[]
  lootPool: LootDefinition[]
}

export const LOCATIONS: LocationDefinition[] = [
  {
    key: 'hospital',
    name: 'St. Mercy Hospital',
    icon: '🏥',
    tagline: 'Abandoned wards, rattling gurneys, and the smell of antiseptic.',
    gradient: 'from-red-950 via-slate-900 to-slate-800',
    sceneEmojis: ['🚑', '💊', '🩹', '🧬'],
    lootPool: [
      { itemType: 'medkit', label: 'Medkit', icon: '💊' },
      { itemType: 'medkit', label: 'Medkit', icon: '💊' },
      { itemType: 'medkit', label: 'Bandages', icon: '🩹' },
      { itemType: 'water', label: 'IV Saline Bag', icon: '💧' },
      { itemType: 'water', label: 'Bottled Water', icon: '💧' },
      { itemType: 'scrap', label: 'Spare Gurney Parts', icon: '🔩' },
    ],
  },
  {
    key: 'school',
    name: 'Lincoln Elementary',
    icon: '🏫',
    tagline: 'Chalk dust, overturned desks, and a cafeteria gone quiet.',
    gradient: 'from-yellow-950 via-slate-900 to-slate-800',
    sceneEmojis: ['🎒', '📚', '🖍️', '🍎'],
    lootPool: [
      { itemType: 'food', label: 'Cafeteria Rations', icon: '🍞' },
      { itemType: 'food', label: 'Canned Peaches', icon: '🥫' },
      { itemType: 'water', label: 'Water Cooler Jug', icon: '💧' },
      { itemType: 'scrap', label: 'Craft Supplies', icon: '🔩' },
      { itemType: 'scrap', label: 'Metal Chair Legs', icon: '🔩' },
      { itemType: 'medkit', label: 'Nurse\'s Office Kit', icon: '💊' },
    ],
  },
  {
    key: 'supermarket',
    name: 'Fresh Mart',
    icon: '🏪',
    tagline: 'Toppled shelves and the low hum of a dead freezer.',
    gradient: 'from-green-950 via-slate-900 to-slate-800',
    sceneEmojis: ['🛒', '🥫', '🍞', '🧴'],
    lootPool: [
      { itemType: 'food', label: 'Canned Beans', icon: '🥫' },
      { itemType: 'food', label: 'Dried Jerky', icon: '🍖' },
      { itemType: 'food', label: 'Cereal Box', icon: '🥣' },
      { itemType: 'water', label: 'Case of Water Bottles', icon: '💧' },
      { itemType: 'water', label: 'Water Jug', icon: '💧' },
      { itemType: 'scrap', label: 'Shopping Cart Metal', icon: '🔩' },
    ],
  },
  {
    key: 'police',
    name: 'Precinct 12',
    icon: '👮',
    tagline: 'Busted lockers, an empty armory, evidence tape everywhere.',
    gradient: 'from-blue-950 via-slate-900 to-slate-800',
    sceneEmojis: ['🚔', '🔦', '🗝️', '📻'],
    lootPool: [
      { itemType: 'ammo', label: 'Ammo Box', icon: '🔫' },
      { itemType: 'ammo', label: 'Loose Rounds', icon: '🔫' },
      { itemType: 'scrap', label: 'Riot Gear Parts', icon: '🔩' },
      { itemType: 'scrap', label: 'Radio Components', icon: '🔩' },
      { itemType: 'medkit', label: 'Trauma Kit', icon: '💊' },
      { itemType: 'water', label: 'Break Room Water', icon: '💧' },
    ],
  },
  {
    key: 'gasstation',
    name: 'Route 9 Fuel Stop',
    icon: '⛽',
    tagline: 'Rusted pumps and a convenience store picked over — mostly.',
    gradient: 'from-orange-950 via-slate-900 to-slate-800',
    sceneEmojis: ['⛽', '🚗', '🥤', '🔧'],
    lootPool: [
      { itemType: 'scrap', label: 'Engine Parts', icon: '🔩' },
      { itemType: 'scrap', label: 'Toolbox Scrap', icon: '🔩' },
      { itemType: 'ammo', label: 'Hunting Shells', icon: '🔫' },
      { itemType: 'food', label: 'Snack Rack Leftovers', icon: '🍫' },
      { itemType: 'water', label: 'Slushie Machine Water', icon: '💧' },
      { itemType: 'food', label: 'Beef Jerky Strip', icon: '🍖' },
    ],
  },
]

export function getLocation(key: string) {
  return LOCATIONS.find((l) => l.key === key)
}