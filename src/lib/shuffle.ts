import { questions } from '../data/questions.ts';

// Fisher–Yates, followed by small, random, locally safe swaps. Retry if a
// final cluster cannot be repaired. No category cycle or repeating pattern.
export function shuffleQuestions(random: () => number = Math.random): number[] {
  const category = new Map(questions.map(question => [question.id, question.category]));
  const hasTripleAt = (order: number[], index: number) => index >= 2 &&
    category.get(order[index]) === category.get(order[index - 1]) &&
    category.get(order[index]) === category.get(order[index - 2]);

  for (let attempt = 0; attempt < 50; attempt++) {
    const order = questions.map(question => question.id);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (let i = 2; i < order.length; i++) {
      if (!hasTripleAt(order, i)) continue;
      const start = Math.floor(random() * order.length);
      for (let offset = 0; offset < order.length; offset++) {
        const j = (start + offset) % order.length;
        if (category.get(order[i]) === category.get(order[j])) continue;
        [order[i], order[j]] = [order[j], order[i]];
        const safe = [i, i + 1, i + 2, j, j + 1, j + 2]
          .filter(index => index < order.length).every(index => !hasTripleAt(order, index));
        if (safe) break;
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
    if (order.every((_, index) => !hasTripleAt(order, index))) return order;
  }
  throw new Error('Could not create a balanced question order. Please try again.');
}
