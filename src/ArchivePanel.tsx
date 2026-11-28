import { useRef, useState } from 'react';
import type { Lesson } from './lesson.ts';
import { listArchivedLessons, saveArchivedLesson } from './archive.ts';
import type { ArchivePage } from './archive.ts';

type Props = { lessons: Lesson[]; quarter: string; onImport: (lesson: Lesson) => void };

export default function ArchivePanel({ lessons, quarter, onImport }: Props) {
  const [token, setToken] = useState('');
  const [page, setPage] = useState<ArchivePage | null>(null);
  const [loadedQuarter, setLoadedQuarter] = useState('');
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const generation = useRef(0);
  const active = page && loadedQuarter === quarter ? page : null;

  async function load(number = 1) {
    const current = ++generation.current;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await listArchivedLessons(token, quarter, number);
      if (current !== generation.current) return;
      setPage(response); setLoadedQuarter(quarter);
    } catch (reason) {
      if (current === generation.current) setError(reason instanceof Error ? reason.message : 'Falha ao consultar o arquivo.');
    } finally { if (current === generation.current) setBusy(false); }
  }

  async function save() {
    const lesson = lessons.find(item => item.id === selected);
    if (!lesson || !active) return;
    const current = ++generation.current;
    setBusy(true); setError(''); setMessage('');
    try {
      const known = active.data.find(item => item.lesson.id === lesson.id);
      await saveArchivedLesson(token, lesson, known?.revision ?? 0);
      const response = await listArchivedLessons(token, quarter, active.meta.current_page);
      if (current !== generation.current) return;
      setPage(response); setMessage('Lição salva no arquivo do servidor.');
    } catch (reason) {
      if (current === generation.current) setError(reason instanceof Error ? reason.message : 'Falha ao salvar a lição.');
    } finally { if (current === generation.current) setBusy(false); }
  }

  function disconnect() {
    generation.current++; setToken(''); setPage(null); setBusy(false); setError(''); setMessage('');
  }

  return <section className="panel stack" aria-labelledby="archive-title">
    <h2 id="archive-title">Arquivo no servidor <span className="muted">(opcional)</span></h2>
    <p>Guarde uma cópia das lições no seu servidor. As lições deste navegador continuam disponíveis e o envio é feito somente ao clicar em salvar.</p>
    <label>Token de acesso<input type="password" value={token} autoComplete="off" spellCheck={false} disabled={busy}
      onChange={event => { generation.current++; setToken(event.target.value); setPage(null); setMessage(''); setError(''); }} /></label>
    <p className="muted">O token fica apenas nesta sessão e é apagado ao desconectar ou fechar a página.</p>
    <div className="row">
      <button type="button" disabled={busy || token.length < 32} onClick={() => void load()}>Consultar trimestre</button>
      <button type="button" onClick={disconnect} disabled={!token}>Desconectar</button>
    </div>
    {active && <>
      <p role="status">{active.meta.total} lição(ões) no arquivo deste trimestre.</p>
      <label>Lição local para arquivar<select value={selected} onChange={event => setSelected(event.target.value)} disabled={busy}>
        <option value="">Selecione uma lição salva</option>
        {lessons.filter(lesson => lesson.quarter === quarter).map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
      </select></label>
      <button type="button" disabled={busy || !lessons.some(lesson => lesson.id === selected && lesson.quarter === quarter)} onClick={() => void save()}>Salvar cópia no servidor</button>
      <ul className="list">{active.data.map(record => <li key={record.lesson.id} className="subtle stack">
        <strong>{record.lesson.title}</strong><span className="muted">{record.lesson.date} · versão {record.revision}</span>
        <button type="button" disabled={busy || lessons.some(lesson => lesson.id === record.lesson.id)} onClick={() => {
          onImport(record.lesson); setMessage('Lição adicionada neste navegador.');
        }}>{lessons.some(lesson => lesson.id === record.lesson.id) ? 'Já existe neste navegador' : 'Adicionar neste navegador'}</button>
      </li>)}</ul>
      <div className="row">
        <button type="button" disabled={busy || active.meta.current_page <= 1} onClick={() => void load(active.meta.current_page - 1)}>Anterior</button>
        <span>{active.meta.current_page} de {active.meta.last_page}</span>
        <button type="button" disabled={busy || active.meta.current_page >= active.meta.last_page} onClick={() => void load(active.meta.current_page + 1)}>Próxima</button>
      </div>
    </>}
    {busy && <p role="status">Acessando o arquivo…</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
