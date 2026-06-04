/**
 * Answer matching and scoring engine for Pointless.
 * Handles both simple (answer: score) and extended (answer: {score, aliases}) formats.
 */
class Scorer {
    constructor() {
        this.answers = new Map();   // normalised key → entry { original, score, aliases }
        this.claimed = new Set();   // original answer strings already given
    }

    /**
     * Load answers from question data. Supports both formats:
     *   "python": 95
     *   "javascript": { "score": 88, "aliases": ["js", "ecmascript"] }
     */
    loadAnswers(answersData) {
        this.answers.clear();
        this.claimed.clear();

        for (const [answer, value] of Object.entries(answersData)) {
            let score, aliases;
            if (typeof value === 'object' && value !== null) {
                score = value.score;
                aliases = (value.aliases || []).map(a => this.normalise(a));
            } else {
                score = value;
                aliases = [];
            }

            const entry = { original: answer, score, aliases };
            const normKey = this.normalise(answer);

            this.answers.set(normKey, entry);
            for (const alias of aliases) {
                this.answers.set(alias, entry);
            }
        }
    }

    /**
     * Normalise an input string for matching:
     * lowercase, trim, collapse whitespace, strip most punctuation (keep +#).
     */
    normalise(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9+#\s]/g, '')
            .replace(/\s+/g, ' ');
    }

    /**
     * Try to match user input against the answer bank.
     * Returns { matched, claimed, original, score }.
     */
    match(input) {
        const norm = this.normalise(input);
        const entry = this.answers.get(norm);

        if (!entry) {
            return { matched: false, claimed: false, original: input, score: 100 };
        }

        return {
            matched: true,
            claimed: this.claimed.has(entry.original),
            original: entry.original,
            score: entry.score,
        };
    }

    /**
     * Mark an answer as claimed (cannot be given again).
     */
    claim(originalAnswer) {
        this.claimed.add(originalAnswer);
    }

    /**
     * Get all unique answers sorted by score descending, with claimed status.
     */
    getAll() {
        const seen = new Set();
        const result = [];

        for (const entry of this.answers.values()) {
            if (seen.has(entry.original)) continue;
            seen.add(entry.original);
            result.push({
                answer: entry.original,
                score: entry.score,
                claimed: this.claimed.has(entry.original),
            });
        }

        return result.sort((a, b) => b.score - a.score);
    }
}
