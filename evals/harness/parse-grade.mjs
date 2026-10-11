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
