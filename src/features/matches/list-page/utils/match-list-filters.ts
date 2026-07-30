type MatchWithScore = {
  score?: { red?: number | string | null; blue?: number | string | null } | null;
};

export function isScorelessMatch(match: MatchWithScore) {
  const red = match.score?.red;
  const blue = match.score?.blue;

  return red !== null && red !== undefined && blue !== null && blue !== undefined
    ? Number(red) === 0 && Number(blue) === 0
    : false;
}
