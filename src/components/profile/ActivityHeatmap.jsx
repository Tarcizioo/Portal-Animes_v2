import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { buildActivityWeeks } from '@/components/profile/activityHeatmapUtils';

const EMPTY_ACTIVITY_LOG = {};
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAY_LABELS = ['Dom', '', 'Ter', '', 'Qui', '', 'Sáb'];
const CELL_GAP = 2;
const LABEL_WIDTH = 22;

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getActivityLevel(count) {
  if (!count || count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function getInitialWeeksCount() {
  if (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 639px)').matches) return 26;
  return 52;
}

export function ActivityHeatmap({ activityLog = EMPTY_ACTIVITY_LOG }) {
  const [weeksCount, setWeeksCount] = useState(getInitialWeeksCount);
  const [cellSize, setCellSize] = useState(8);
  const wrapRef = useRef(null);
  const userSelectedPeriod = useRef(false);
  const weeks = useMemo(() => buildActivityWeeks(weeksCount), [weeksCount]);

  const totalEpisodes = useMemo(
    () => Object.values(activityLog).reduce((total, value) => total + Number(value || 0), 0),
    [activityLog],
  );

  const monthLabels = useMemo(() => weeks.map((week, weekIndex) => {
    const firstRealDay = week.find(Boolean);
    if (!firstRealDay) return null;
    const previousRealDay = weeks[weekIndex - 1]?.find(Boolean);
    if (previousRealDay && previousRealDay.getMonth() === firstRealDay.getMonth()) return null;
    return { weekIndex, name: MONTH_NAMES[firstRealDay.getMonth()] };
  }).filter(Boolean), [weeks]);

  useEffect(() => {
    const container = wrapRef.current;
    if (!container) return undefined;

    const computeLayout = () => {
      const availableWidth = Math.max(0, container.clientWidth - LABEL_WIDTH - CELL_GAP);
      if (!userSelectedPeriod.current && container.clientWidth > 0) {
        const responsiveWeeks = container.clientWidth < 540 ? 26 : 52;
        setWeeksCount((current) => (current === responsiveWeeks ? current : responsiveWeeks));
      }

      const proposedSize = Math.floor(
        (availableWidth - (CELL_GAP * (weeks.length - 1))) / weeks.length,
      );
      const minimumSize = weeksCount === 26 ? 7 : 8;
      const nextSize = Math.max(minimumSize, Math.min(13, proposedSize || minimumSize));
      setCellSize((current) => (current === nextSize ? current : nextSize));
    };

    computeLayout();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(computeLayout);
      observer.observe(container);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', computeLayout);
    return () => window.removeEventListener('resize', computeLayout);
  }, [weeks.length, weeksCount]);

  const selectPeriod = (count) => {
    userSelectedPeriod.current = true;
    setWeeksCount(count);
  };

  const gridWidth = (weeks.length * cellSize) + ((weeks.length - 1) * CELL_GAP);
  const step = cellSize + CELL_GAP;

  return (
    <section className="min-w-0 max-w-full select-none overflow-hidden rounded-2xl border border-border-color bg-bg-secondary p-4 md:p-6" aria-labelledby="activity-heatmap-title">
      <div className="mb-4 grid min-w-0 gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 id="activity-heatmap-title" className="flex items-center gap-2 text-sm font-bold text-text-primary md:text-base">
            <CalendarDays className="h-4 w-4 shrink-0 text-button-accent" aria-hidden="true" /> Atividade de episódios
          </h3>
          <p className="mt-1 text-[10px] font-semibold text-text-secondary">
            {totalEpisodes.toLocaleString('pt-BR')} {totalEpisodes === 1 ? 'episódio registrado' : 'episódios registrados'}
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-xl border border-border-color bg-bg-tertiary p-1" aria-label="Período do mapa de atividade">
          <button
            type="button"
            onClick={() => selectPeriod(26)}
            aria-pressed={weeksCount === 26}
            className={`min-h-11 rounded-lg px-3 text-xs font-bold transition-colors ${weeksCount === 26 ? 'bg-button-accent text-text-on-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            6 meses
          </button>
          <button
            type="button"
            onClick={() => selectPeriod(52)}
            aria-pressed={weeksCount === 52}
            className={`min-h-11 rounded-lg px-3 text-xs font-bold transition-colors ${weeksCount === 52 ? 'bg-button-accent text-text-on-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            12 meses
          </button>
        </div>
      </div>

      <div ref={wrapRef} data-testid="activity-heatmap-scroll" className="max-w-full overflow-x-auto overscroll-x-contain pb-1">
        <div className="flex items-start" style={{ width: LABEL_WIDTH + CELL_GAP + gridWidth }}>
          <div className="flex shrink-0 flex-col" style={{ gap: CELL_GAP, marginRight: CELL_GAP, paddingTop: 22, width: LABEL_WIDTH }}>
            {WEEKDAY_LABELS.map((label, index) => (
              <div key={index} className="pr-1 text-right text-[8px] text-text-secondary" style={{ height: cellSize, lineHeight: `${cellSize}px` }}>
                {label}
              </div>
            ))}
          </div>

          <div className="min-w-0" style={{ width: gridWidth }}>
            <div className="relative mb-0.5 h-5 overflow-hidden">
              {monthLabels.map((month) => (
                <span key={`${month.weekIndex}-${month.name}`} className="absolute whitespace-nowrap text-[9px] leading-5 text-text-secondary" style={{ left: month.weekIndex * step }}>
                  {month.name}
                </span>
              ))}
            </div>

            <div className="flex" style={{ gap: CELL_GAP }} aria-label={`Mapa dos últimos ${weeksCount === 26 ? '6' : '12'} meses`}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex shrink-0 flex-col" style={{ gap: CELL_GAP, width: cellSize }}>
                  {week.map((day, dayIndex) => {
                    if (!day) return <span key={dayIndex} aria-hidden="true" style={{ width: cellSize, height: cellSize }} />;
                    const dateKey = toKey(day);
                    const count = Number(activityLog[dateKey] || 0);
                    const activityLevel = getActivityLevel(count);
                    const label = count
                      ? `${count} ${count === 1 ? 'episódio registrado' : 'episódios registrados'} em ${day.toLocaleDateString('pt-BR')}`
                      : `Nenhuma atividade em ${day.toLocaleDateString('pt-BR')}`;

                    return (
                      <span
                        key={dayIndex}
                        title={label}
                        aria-label={label}
                        className="shrink-0 rounded-[3px] transition-opacity hover:opacity-75"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: `var(--heatmap-${activityLevel})`,
                          border: activityLevel > 0
                            ? '1px solid color-mix(in srgb, var(--button-accent) 40%, transparent)'
                            : '1px solid var(--border-color)',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-text-secondary">{weeksCount === 52 ? 'Deslize o mapa para consultar o ano completo.' : 'Seis meses priorizados para melhor leitura.'}</p>
        <div className="flex items-center gap-1.5" aria-label="Intensidade da atividade">
          <span className="text-[10px] text-text-secondary">Menos</span>
          {[0, 1, 2, 3, 4].map((activityLevel) => (
            <span
              key={activityLevel}
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-[3px]"
              style={{
                backgroundColor: `var(--heatmap-${activityLevel})`,
                border: activityLevel > 0
                  ? '1px solid color-mix(in srgb, var(--button-accent) 40%, transparent)'
                  : '1px solid var(--border-color)',
              }}
            />
          ))}
          <span className="text-[10px] text-text-secondary">Mais</span>
        </div>
      </div>
    </section>
  );
}
