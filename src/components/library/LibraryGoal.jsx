import { useEffect, useMemo, useState } from 'react';
import { Check, LoaderCircle, Pencil, Target, X } from 'lucide-react';
import { calculateWeeklyGoal, DEFAULT_WEEKLY_GOAL, normalizeWeeklyGoal } from '@/utils/libraryGoal';

export function LibraryGoal({ activityLog = {}, goal = DEFAULT_WEEKLY_GOAL, onSave }) {
  const normalizedGoal = normalizeWeeklyGoal(goal);
  const [isEditing, setIsEditing] = useState(false);
  const [draftGoal, setDraftGoal] = useState(normalizedGoal);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) setDraftGoal(normalizedGoal);
  }, [isEditing, normalizedGoal]);

  const weeklyGoal = useMemo(
    () => calculateWeeklyGoal(activityLog, normalizedGoal),
    [activityLog, normalizedGoal],
  );

  const handleSave = async () => {
    const nextGoal = normalizeWeeklyGoal(draftGoal);
    setIsSaving(true);
    try {
      await onSave(nextGoal);
      setDraftGoal(nextGoal);
      setIsEditing(false);
    } catch {
      // The profile hook already provides the error toast.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-bg-secondary to-bg-secondary p-5 shadow-lg shadow-black/5 sm:p-6" aria-labelledby="weekly-goal-title">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-primary/15 p-3 text-primary" aria-hidden="true">
            <Target className="h-6 w-6" />
          </span>
          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-primary">Ritmo da semana</p>
            <h2 id="weekly-goal-title" className="text-xl font-black text-text-primary">Meta semanal de episodios</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {weeklyGoal.remaining === 0 ? 'Meta concluida. Excelente ritmo!' : `Faltam ${weeklyGoal.remaining} episodios para concluir sua meta.`}
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <label htmlFor="weekly-episode-goal" className="sr-only">Nova meta semanal</label>
            <input
              id="weekly-episode-goal"
              type="number"
              min="1"
              max="100"
              value={draftGoal}
              onChange={(event) => setDraftGoal(event.target.value)}
              className="w-20 rounded-xl border border-border-color bg-bg-tertiary px-3 py-2 text-center font-bold text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button type="button" onClick={handleSave} disabled={isSaving} aria-label="Salvar meta" className="rounded-xl bg-primary p-2.5 text-white transition-transform hover:scale-105 disabled:opacity-60">
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving} aria-label="Cancelar edicao da meta" className="rounded-xl border border-border-color bg-bg-tertiary p-2.5 text-text-secondary hover:text-text-primary disabled:opacity-60">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-color bg-bg-tertiary/70 px-4 py-2.5 text-sm font-bold text-text-primary transition-colors hover:border-primary/50 hover:text-primary">
            <Pencil className="h-4 w-4" /> Ajustar meta
          </button>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-text-primary">{weeklyGoal.watched} de {normalizedGoal} episodios</span>
          <span className="font-black text-primary">{weeklyGoal.progress}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-bg-tertiary" role="progressbar" aria-label="Progresso da meta semanal" aria-valuemin="0" aria-valuemax="100" aria-valuenow={weeklyGoal.progress}>
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-[width] duration-700" style={{ width: `${weeklyGoal.progress}%` }} />
        </div>
      </div>
    </section>
  );
}