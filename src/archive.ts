import type { Lesson } from './lesson.ts';
import { parseStoredLessons, validLesson } from './lesson.ts';

export type ArchivedLesson = { lesson: Lesson; revision: number; updatedAt: string };
export type ArchivePage = { data: ArchivedLesson[]; meta: { current_page: number; last_page: number; total: number } };
export class ArchiveError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export function readArchivedLesson(value: unknown): ArchivedLesson {
  if (!value || typeof value !== 'object') throw new Error('Resposta inválida do arquivo.');
  const record = value as Record<string, unknown>;
  const lessons = parseStoredLessons(JSON.stringify([record.lesson]));
  if (validLesson(lessons[0]) || !Number.isInteger(record.revision) || Number(record.revision) < 1
      || typeof record.updatedAt !== 'string') throw new Error('Resposta inválida do arquivo.');
  return { lesson: lessons[0], revision: Number(record.revision), updatedAt: record.updatedAt };
}

async function request(token: string, path: string, method = 'GET', body?: unknown): Promise<unknown> {
  if (token.length < 32) throw new Error('Informe o token de acesso ao arquivo.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch('/archive-api' + path, {
      method, signal: controller.signal, redirect: 'error', cache: 'no-store', credentials: 'omit',
      headers: { Accept: 'application/json', Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const messages: Record<number, string> = {
        401: 'Token de acesso inválido.', 409: 'A lição mudou no servidor. Atualize a lista antes de salvar novamente.',
        422: 'Confira os campos da lição.', 429: 'Limite de consultas atingido. Aguarde um minuto.',
        503: 'O arquivo ainda não foi configurado no servidor.',
      };
      throw new ArchiveError(messages[response.status] || 'Não foi possível acessar o arquivo de lições.', response.status);
    }
    return await response.json();
  } finally { clearTimeout(timer); }
}

export async function listArchivedLessons(token: string, quarter: string, page = 1): Promise<ArchivePage> {
  const raw = await request(token, '/lessons?' + new URLSearchParams({ quarter, page: String(page), limit: '20' }));
  if (!raw || typeof raw !== 'object') throw new Error('Resposta inválida do arquivo.');
  const result = raw as { data?: unknown; meta?: ArchivePage['meta'] };
  if (!Array.isArray(result.data) || !result.meta || !Number.isInteger(result.meta.current_page)
      || !Number.isInteger(result.meta.last_page) || !Number.isInteger(result.meta.total)) throw new Error('Resposta inválida do arquivo.');
  return { data: result.data.map(readArchivedLesson), meta: result.meta };
}

export async function saveArchivedLesson(token: string, lesson: Lesson, revision: number): Promise<ArchivedLesson> {
  if (!/^[0-9a-f-]{36}$/i.test(lesson.id) || validLesson(lesson) || !Number.isInteger(revision) || revision < 0) {
    throw new Error('Salve uma lição válida antes de enviá-la ao arquivo.');
  }
  const raw = await request(token, '/lessons/' + encodeURIComponent(lesson.id), 'PUT', { lesson, revision });
  if (!raw || typeof raw !== 'object' || !('data' in raw)) throw new Error('Resposta inválida do arquivo.');
  return readArchivedLesson(raw.data);
}
