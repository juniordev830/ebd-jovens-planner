export type Lesson = {
  id: string; title: string; theme: string; quarter: string; date: string; duration: number;
  objectives: string; references: string; questions: string;
  opening: number; development: number; discussion: number; closing: number;
  outline: string; taught: boolean;
};

export const stages = [
  ['opening', 'Abertura'], ['development', 'Desenvolvimento'], ['discussion', 'Discussão'], ['closing', 'Encerramento'],
] as const;

export function newLesson(day: string, quarter: string): Lesson {
  return {
    id: '', title: '', theme: '', quarter, date: day, duration: 60,
    objectives: '', references: '', questions: '', opening: 10, development: 25,
    discussion: 20, closing: 5, outline: '', taught: false,
  };
}

export function timeUsed(lesson: Lesson) {
  return stages.reduce((sum, [key]) => sum + lesson[key], 0);
}

export function validLesson(lesson: Lesson) {
  if (!lesson.title.trim() || !lesson.theme.trim() || !lesson.objectives.trim() || !lesson.references.trim()) {
    return 'Preencha o título, o tema, os objetivos e as referências.';
  }
  if (!/^\d{4}-0[1-4]$/.test(lesson.quarter)) return 'Informe o trimestre no formato AAAA-01 a AAAA-04.';
  const date = new Date(lesson.date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lesson.date) || Number.isNaN(+date) || date.toISOString().slice(0, 10) !== lesson.date) {
    return 'Informe uma data de aula válida.';
  }
  if (!Number.isInteger(lesson.duration) || lesson.duration < 15 || lesson.duration > 240) {
    return 'A duração total deve estar entre 15 e 240 minutos.';
  }
  if (stages.some(([key]) => !Number.isInteger(lesson[key]) || lesson[key] < 0) || timeUsed(lesson) > lesson.duration) {
    return 'Distribua minutos inteiros entre as etapas sem exceder a duração da aula.';
  }
  return '';
}

function isStoredLesson(value: unknown): value is Lesson {
  if (!value || typeof value !== 'object') return false;
  const lesson = value as Record<string, unknown>;
  return typeof lesson.id === 'string' && lesson.id.length > 0
    && ['title', 'theme', 'quarter', 'date', 'objectives', 'references', 'questions', 'outline']
      .every(field => typeof lesson[field] === 'string')
    && typeof lesson.duration === 'number'
    && stages.every(([field]) => typeof lesson[field] === 'number')
    && typeof lesson.taught === 'boolean';
}

export function parseStoredLessons(raw: string): Lesson[] {
  const lessons: unknown = JSON.parse(raw);
  if (!Array.isArray(lessons) || !lessons.every(isStoredLesson)
      || new Set(lessons.map(lesson => lesson.id)).size !== lessons.length) {
    throw new Error('Formato inválido no armazenamento de lições.');
  }
  return lessons;
}

export function quarterSummary(lessons: Lesson[], quarter: string) {
  const matching = lessons.filter(lesson => lesson.quarter === quarter);
  return {
    planned: matching.length,
    taught: matching.filter(lesson => lesson.taught).length,
    minutes: matching.reduce((sum, lesson) => sum + lesson.duration, 0),
    lessons: matching.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'pt-BR')),
  };
}

export function printSections(lesson: Lesson): [string, string][] {
  return [
    ['Tema', lesson.theme], ['Data e trimestre', lesson.date + ' · ' + lesson.quarter],
    ['Objetivos pedagógicos', lesson.objectives], ['Referências bíblicas', lesson.references],
    ['Distribuição do tempo', stages.map(([key, label]) => label + ' — ' + lesson[key] + ' min').join('\n')
      + '\nTotal planejado: ' + timeUsed(lesson) + ' de ' + lesson.duration + ' min'],
    ['Roteiro', lesson.outline], ['Perguntas para discussão', lesson.questions],
  ].filter((entry): entry is [string, string] => Boolean(entry[1].trim()));
}
