import { parseStoredLessons, validLesson } from './lesson.ts';
import type { Lesson } from './lesson.ts';

export const maxBackupBytes = 5 * 1024 * 1024;

export function makeBackup(lessons: Lesson[]): string {
  return JSON.stringify({ format: 'ebd-jovens-planner', version: 1, lessons }, null, 2);
}

export function readBackup(raw: string): Lesson[] {
  const backup: unknown = JSON.parse(raw);
  if (!backup || typeof backup !== 'object'
      || !('format' in backup) || backup.format !== 'ebd-jovens-planner'
      || !('version' in backup) || backup.version !== 1
      || !('lessons' in backup) || !Array.isArray(backup.lessons)) {
    throw new Error('Formato de backup desconhecido.');
  }
  const lessons = parseStoredLessons(JSON.stringify(backup.lessons));
  if (lessons.some(lesson => validLesson(lesson))) throw new Error('O backup contém lições inválidas.');
  return lessons;
}

export function newBackupLessons(current: Lesson[], incoming: Lesson[]): Lesson[] {
  const existingIds = new Set(current.map(lesson => lesson.id));
  return incoming.filter(lesson => !existingIds.has(lesson.id));
}
