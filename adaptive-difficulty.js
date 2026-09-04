// Performance-based adaptive difficulty: a gradual game setting, not a medical AI diagnosis.
export const ADAPTIVE_RESULTS_TO_REVIEW = 7;
export const STRONG_SCORE = 80;
export const WEAK_SCORE = 50;

export function clampDifficulty(value, levels) {
    return levels.reduce((closest, level) => (
        Math.abs(level - value) < Math.abs(closest - value) ? level : closest
    ), levels[0]);
}

export function calculateAdaptiveDifficulty(results, levels) {
    const safeLevels = [...levels].sort((a, b) => a - b);
    const latest = results[results.length - 1];
    let levelIndex = safeLevels.indexOf(
        clampDifficulty(Number(latest?.difficulty) || safeLevels[0], safeLevels)
    );
    const recent = results.slice(-ADAPTIVE_RESULTS_TO_REVIEW);

    if (recent.length < ADAPTIVE_RESULTS_TO_REVIEW) {
        return safeLevels[levelIndex];
    }

    const scores = recent.map((result) => Number(result.score) || 0);
    const consistentlyStrong = scores.every((score) => score >= STRONG_SCORE);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    if (consistentlyStrong && levelIndex < safeLevels.length - 1) {
        levelIndex += 1;
    } else if (average < WEAK_SCORE && levelIndex > 0) {
        levelIndex -= 1;
    }

    return safeLevels[levelIndex];
}
