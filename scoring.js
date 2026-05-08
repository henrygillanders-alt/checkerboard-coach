export function scoreRally({ win = false, challenge = 'none', clean = false } = {}) {
  let score = 0;
  if (win) score += 1;
  if (challenge === 'single') score += 1;
  if (challenge === 'pair') score += 2;
  if (challenge === 'triple') score += 3;
  if (win && challenge !== 'none') score += 3;
  if (win && clean) score += 2;
  return score;
}

export function levelWindowText(level) {
  if (level === 4) return 'Level 4: challenge must convert within 4 shots or reset.';
  if (level === 5) return 'Level 5: challenge must convert within 2 shots or reset.';
  return 'Levels 1–3: challenge is banked until rally ends.';
}
