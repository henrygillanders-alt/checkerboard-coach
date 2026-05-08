export const sessionGroups = [
  { id: 'atl-btl', title: 'ATL / BTL', subtitle: 'Above & below line', color: 'blue', filter: 'all' },
  { id: 't-zone', title: 'T-Zone', subtitle: 'T-Zone games', color: 'gold', filter: 'tzone' },
  { id: 'classic', title: 'Classic Conditioned', subtitle: 'Classic conditioned', color: 'green', filter: 'classic' },
  { id: 'tactical', title: 'Tactical Games', subtitle: 'Tactical formats', color: 'orange', filter: 'tactical' },
  { id: 'cb-tactical', title: 'CB Tactical', subtitle: 'Tactical patterns', color: 'green', filter: 'pair' },
  { id: 'cb-volleys', title: 'CB Volleys', subtitle: 'Volley games', color: 'blue', filter: 'volley' },
  { id: 'cb-blind', title: 'CB Blind', subtitle: 'Blind challenges', color: 'purple', filter: 'blind' },
  { id: 'double-bounce', title: 'Double Bounce', subtitle: 'Double bounce', color: 'green', filter: 'classic' },
  { id: 'all', title: 'All Games', subtitle: 'Browse everything', color: 'purple', filter: 'all' }
];

export const quickStarts = [
  { id: 'singles', title: 'CB Singles', subtitle: 'Single shot challenges', color: 'green', filter: 'single' },
  { id: 'pairs', title: 'CB Pairs', subtitle: 'Pair challenges', color: 'blue', filter: 'pair' },
  { id: 'custom', title: 'Custom Session', subtitle: 'Build your own', color: 'purple', filter: 'all' },
  { id: 'main', title: 'Main Menu', subtitle: 'All features & tabs', color: 'solid', filter: 'all' }
];

export const challengeDeck = [
  { id: 'single-5-4', type: 'single', name: 'Single Shot: 5–4', code: '[5-4]', description: 'Front-wall top left into back-left floor zone. Train straight length quality from a high wall target.' },
  { id: 'single-6-3', type: 'single', name: 'Single Shot: 6–3', code: '[6-3]', description: 'Front-wall top right into back-right floor zone. Train right-side straight length.' },
  { id: 'pair-5-4-8-1', type: 'pair', name: 'Pair: 5–4 + 8–1', code: '[5-4] + [8-1]', description: 'Move opponent deep, then use lower-left wall to front-left floor zone. Length then front finish.' },
  { id: 'pair-6-3-7-2', type: 'pair', name: 'Pair: 6–3 + 7–2', code: '[6-3] + [7-2]', description: 'Move opponent deep on right, then low-right front-wall target into front-right floor zone.' },
  { id: 'triple-5-4-6-3-8-1', type: 'triple', name: 'Triple: Deep switch then finish', code: '[5-4] + [6-3] + [8-1]', description: 'Stretch deep left, switch deep right, then finish front left when the opponent is late or off T.' },
  { id: 'blind-pair', type: 'blind', name: 'Blind Pair Challenge', code: 'Card draw → hidden pair', description: 'Each player receives a hidden pair. Rally plays normally; player scores challenge points when their secret pair is completed.' },
  { id: 'volley-intercept', type: 'volley', name: 'Volley Intercept', code: 'Volley contact + target zone', description: 'Player must intercept on the volley and send ball into the nominated checkerboard zone.' },
  { id: 't-zone-off', type: 'tzone', name: 'Opponent Off T', code: 'Opponent outside marked T', description: 'Bonus window opens only when opponent is not inside the marked T-zone at player contact.' },
  { id: 'classic-route-breaker', type: 'classic', name: 'Route Breaker', code: 'No repeat pattern', description: 'Player must break the opponent’s preferred route by changing height, side, pace, or depth.' },
  { id: 'tactical-clean-finish', type: 'tactical', name: 'Clean Finish Conversion', code: 'Challenge → clean winner', description: 'Complete the tactical challenge, then convert with a shot the opponent cannot reach with the racquet.' }
];
