export const expectedScore = (playerRating: number, opponentRating: number): number =>
  1 / (1 + 10 ** ((opponentRating - playerRating) / 400));

export const kFactor = (gamesPlayed: number, rating: number): number => {
  if (gamesPlayed < 30) return 40;
  if (rating >= 2000) return 16;
  return 24;
};

export const calculateElo = (
  playerRating: number,
  opponentRating: number,
  score: 0 | 0.5 | 1,
  gamesPlayed: number,
): number => {
  const k = kFactor(gamesPlayed, playerRating);
  const e = expectedScore(playerRating, opponentRating);
  return Math.round(playerRating + k * (score - e));
};
