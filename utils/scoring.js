 export function scoreRally() {

  return 1;

}

export function levelWindowText(level) {

  if (level === 4) return 'Win within 4 shots';

  if (level === 5) return 'Win within 2 shots';

  return 'Challenge active';

}
