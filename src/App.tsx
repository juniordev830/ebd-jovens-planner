import { useState } from 'react';
import type { FormEvent } from 'react';
import { newLesson, parseStoredLessons, quarterSummary, stages, timeUsed, validLesson } from './lesson.ts';
import type { Lesson } from './lesson.ts';
import { useLocalState } from './storage.ts';

const now = new Date();
const thisQuarter = now.getFullYear() + '-0' + (Math.floor(now.getMonth() / 3) + 1);
const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map(value => String(value).padStart(2, '0')).join('-');
const quarterLabel = (code: string) => Number(code.slice(5)) + 'º trimestre de ' + code.slice(0, 4);

export default function App() {
  const [lessons, setLessons, storageError] = useLocalState<Lesson[]>('ebd-v1', [], parseStoredLessons);
  const [quarter, setQuarter] = useState(thisQuarter);
  const [draft, setDraft] = useState(() => newLesson(today, thisQuarter));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [removeId, setRemoveId] = useState('');
  const summary = quarterSummary(lessons, quarter);
  const remaining = draft.duration - timeUsed(draft);

  function change<K extends keyof Lesson>(key: K, value: Lesson[K]) {
    setDraft(previous => ({ ...previous, [key]: value }));
    setError('');
    setMessage('');
  }

  function edit(lesson: Lesson) {
    setDraft(lesson);
    setError('');
    setMessage('');
    setRemoveId('');
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const validation = validLesson(draft);
    if (validation) {
      setError(validation);
      return;
    }
    const saved = { ...draft, title: draft.title.trim(), theme: draft.theme.trim(), id: draft.id || crypto.randomUUID() };
    setLessons(previous => [...previous.filter(lesson => lesson.id !== saved.id), saved]);
    setDraft(saved);
    setQuarter(saved.quarter);
    setMessage('Lição salva.');
  }

  async function exportPdf(lesson: Lesson) {
    setExporting(true);
    setError('');
    try {
      const { lessonPdf } = await import('./pdf.ts');
      lessonPdf(lesson).save('plano-ebd-' + lesson.date + '.pdf');
    } catch {
      setError('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }

  return <div className="split">
    <section className="panel stack" id="planejar" tabIndex={-1}>
      <div className="row between"><h2>{draft.id ? 'Editar lição' : 'Nova lição'}</h2>
        {draft.id && <button onClick={() => edit(newLesson(today, quarter))}>Nova lição</button>}
      </div>
      <form onSubmit={save} className="form">
        <div className="two collapse">
          <label>Título<input required maxLength={100} value={draft.title} onChange={e => change('title', e.target.value)} /></label>
          <label>Tema<input required maxLength={110} value={draft.theme} onChange={e => change('theme', e.target.value)} /></label>
          <label>Trimestre<input required pattern="[0-9]{4}-0[1-4]" placeholder="2026-04" value={draft.quarter} onChange={e => change('quarter', e.target.value)} /></label>
          <label>Data da aula<input required type="date" value={draft.date} onChange={e => change('date', e.target.value)} /></label>
        </div>
        <label>Objetivos pedagógicos<textarea required maxLength={4000} value={draft.objectives} onChange={e => change('objectives', e.target.value)} /></label>
        <label>Referências bíblicas<input required maxLength={400} placeholder="Ex.: João 15:1–8" value={draft.references} onChange={e => change('references', e.target.value)} /></label>
        <fieldset className="panel form lesson-time">
          <legend>Distribuição do tempo</legend>
          <label>Duração total (min)<input required type="number" min={15} max={240} value={draft.duration} onChange={e => change('duration', Number(e.target.value))} /></label>
          <div className="two">
            {stages.map(([key, label]) => <label key={key}>{label} (min)<input required type="number" min={0} max={240} value={draft[key]} onChange={e => change(key, Number(e.target.value))} /></label>)}
          </div>
          <p className={remaining < 0 ? 'error' : 'muted'} aria-live="polite">{remaining < 0 ? 'Excesso de ' + -remaining : remaining + ' livre(s) de ' + draft.duration} min.</p>
        </fieldset>
        <label>Roteiro<textarea maxLength={8000} value={draft.outline} onChange={e => change('outline', e.target.value)} /></label>
        <label>Perguntas para discussão<textarea maxLength={4000} value={draft.questions} onChange={e => change('questions', e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={draft.taught} onChange={e => change('taught', e.target.checked)} /> Aula ministrada</label>
        {(error || storageError) && <p className="error" role="alert">{error || storageError}</p>}
        {message && <p role="status">{storageError ? 'Lição atualizada nesta sessão.' : message}</p>}
        <button className="primary">Salvar lição</button>
      </form>
    </section>
    <aside className="stack">
      <section className="panel stack" id="acompanhamento" tabIndex={-1}>
        <h2>Acompanhamento</h2>
        <label>Filtrar trimestre<select value={quarter} onChange={e => setQuarter(e.target.value)}>
          {[...new Set([thisQuarter, ...lessons.map(lesson => lesson.quarter)])].sort().reverse().map(code => <option key={code} value={code}>{quarterLabel(code)}</option>)}
        </select></label>
        <div className="three">
          <div className="stat">Lições<strong>{summary.planned}</strong></div>
          <div className="stat">Ministradas<strong>{summary.taught}</strong></div>
          <div className="stat">Minutos<strong>{summary.minutes}</strong></div>
        </div>
      </section>
      <section className="panel stack" id="licoes" tabIndex={-1}>
        <h2>Lições do trimestre</h2>
        {!summary.lessons.length && <p className="muted">Cadastre a primeira lição para iniciar o planejamento.</p>}
        <ul className="list">{summary.lessons.map(lesson => <li className="subtle stack" key={lesson.id}>
          <div><strong>{lesson.title}</strong><p className="muted">{lesson.date.split('-').reverse().join('/')} · {lesson.taught ? 'Ministrada' : 'Planejada'}</p></div>
          <div className="row">
            <button onClick={() => edit(lesson)}>Editar</button>
            <button disabled={exporting} onClick={() => void exportPdf(lesson)}>{exporting ? 'Gerando…' : 'Baixar PDF'}</button>
            {removeId === lesson.id ? <>
              <button className="danger" onClick={() => {
                setLessons(previous => previous.filter(item => item.id !== lesson.id));
                if (draft.id === lesson.id) edit(newLesson(today, quarter));
                setRemoveId('');
                if (!summary.lessons.some(item => item.id !== lesson.id)) setQuarter(thisQuarter);
              }}>Confirmar exclusão</button>
              <button onClick={() => setRemoveId('')}>Cancelar</button>
            </> : <button className="quiet danger" onClick={() => setRemoveId(lesson.id)}>Excluir</button>}
          </div>
        </li>)}</ul>
      </section>
    </aside>
  </div>;
}
