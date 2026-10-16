// The grader sometimes wraps its JSON in a code fence or adds a sentence around it.
export function parseGrade(reply) {
  const text = reply.replace(/```(?:json)?/g, '');
  const start = text.indexOf('{');
  for (
    let end = text.lastIndexOf('}');
    end > start && start !== -1;
    end = text.lastIndexOf('}', end - 1)
  ) {
    try {
      const grade = JSON.parse(text.slice(start, end + 1));
      if (grade.scores) return grade;
    } catch {}
  }
  return { error: `unparseable grade: ${reply.slice(0, 300)}` };
}

// One grader is noisy: in round 1 it scored identical two-line fixes 2 and 3. Each run gets
// several independent grades. Scores are averaged per dimension, and a serious flaw counts
// only when every grader flagged one, because one grader alone has flagged a false one.
export function combineGrades(grades) {
  const ok = grades.filter((g) => g.scores);
  if (!ok.length) return grades[0] ?? { error: 'no grades' };
  const scores = {};
  for (const dim of Object.keys(ok[0].scores)) {
    const values = ok
      .map((g) => g.scores[dim])
      .filter((v) => typeof v === 'number');
    scores[dim] = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;
  }
  const allFlagged = ok.every((g) => (g.serious_flaws ?? []).length > 0);
  return {
    scores,
    serious_flaws: allFlagged ? ok[0].serious_flaws : [],
    reasons: ok[0].reasons,
    graders: ok.length,
    disputedFlaws: allFlagged ? [] : ok.flatMap((g) => g.serious_flaws ?? []),
    each: ok.map((g) => g.scores),
  };
}
