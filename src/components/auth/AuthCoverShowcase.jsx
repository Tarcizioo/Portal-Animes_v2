import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Pause, Play } from 'lucide-react';
import { PortalAnimesLogo, PortalCatMark } from '@/components/brand/PortalAnimesLogo';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { popularAnimeQueryOptions } from '@/hooks/useAnimeDiscovery';

const PLACEHOLDER_COLORS = [
  '#172554',
  '#3f1d2e',
  '#12372a',
  '#3b1d50',
  '#4a2615',
  '#12314b',
  '#40202b',
  '#18343a',
  '#28214a',
  '#493417',
  '#202f26',
  '#35213b',
  '#173b4a',
  '#42251c',
  '#212b45',
  '#3d2432',
  '#18352f',
  '#322449',
];

const PLACEHOLDER_COVERS = PLACEHOLDER_COLORS.map((color, index) => ({
  id: 'placeholder-' + index,
  title: '',
  image: '',
  smallImage: '',
  color,
}));

const AUTH_COVER_COUNT = PLACEHOLDER_COVERS.length;

const JOURNEY_STEPS = [
  'Descubra novos mundos',
  'Monte a sua biblioteca',
  'Continue do epis\u00f3dio certo',
];

const selectAuthCovers = (animes = []) => animes
  .filter((anime) => anime.image || anime.smallImage)
  .slice(0, 18);

const authCoverQueryOptions = {
  ...popularAnimeQueryOptions,
  select: selectAuthCovers,
};

function splitIntoColumns(covers) {
  return covers.reduce((columns, cover, index) => {
    columns[index % columns.length].push(cover);
    return columns;
  }, [[], [], []]);
}

function completeCoverSet(remoteCovers) {
  const realCovers = remoteCovers.slice(0, AUTH_COVER_COUNT);
  const missingCount = AUTH_COVER_COUNT - realCovers.length;
  if (missingCount <= 0) return realCovers;
  return [...realCovers, ...PLACEHOLDER_COVERS.slice(0, missingCount)];
}

function CoverCard({ cover, eager }) {
  return (
    <div
      className="auth-cover-card"
      data-auth-cover-kind={cover.image || cover.smallImage ? 'real' : 'brand-fallback'}
      style={{ '--auth-cover-placeholder': cover.color || '#191919' }}
    >
      {cover.image || cover.smallImage ? (
        <ResponsiveImage
          src={cover.image || cover.smallImage}
          fallbackSrc={cover.smallImage}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          width={240}
          height={360}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center" aria-hidden="true">
          <PortalCatMark className="h-10 w-10 text-white/10" />
        </div>
      )}
    </div>
  );
}

function CoverSequence({ covers, copy }) {
  return (
    <div className="auth-cover-sequence">
      {covers.map((cover, index) => (
        <CoverCard
          key={cover.id + '-' + copy}
          cover={cover}
          eager={copy === 0 && index < 2}
        />
      ))}
    </div>
  );
}

export function AuthCoverShowcase() {
  const { data: remoteCovers = [] } = useQuery(authCoverQueryOptions);
  const [isPaused, setIsPaused] = useState(false);
  const covers = completeCoverSet(remoteCovers);
  const columns = splitIntoColumns(covers);

  return (
    <aside className={'auth-cover-showcase ' + (isPaused ? 'is-paused' : '')}>
      <div className="auth-cover-grid" aria-hidden="true">
        {columns.map((column, index) => (
          <div className="auth-cover-rail" key={'column-' + index}>
            <div className={'auth-cover-track auth-cover-track--' + (index + 1)}>
              <CoverSequence covers={column} copy={0} />
              <CoverSequence covers={column} copy={1} />
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/95" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/45" />

      <button
        type="button"
        onClick={() => setIsPaused((current) => !current)}
        aria-pressed={isPaused}
        aria-label={isPaused ? 'Retomar capas' : 'Pausar capas'}
        className="auth-cover-toggle absolute right-5 top-5 z-20 inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 text-[11px] font-bold text-white/80 backdrop-blur-md transition-colors hover:border-white/30 hover:bg-black/65 hover:text-white"
      >
        {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{isPaused ? 'Retomar capas' : 'Pausar capas'}</span>
      </button>

      <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8 lg:p-10 xl:p-12">
        <PortalAnimesLogo
          className="text-white"
          markClassName="h-8 w-8"
          wordmarkClassName="ml-2 text-lg"
        />
        <h2 className="mt-4 max-w-lg text-2xl font-black leading-tight text-white sm:text-3xl lg:mt-7 lg:text-4xl xl:text-5xl">
          Sua pr&oacute;xima hist&oacute;ria come&ccedil;a aqui.
        </h2>
        <p className="mt-3 max-w-lg text-xs leading-6 text-white/65 sm:text-sm lg:text-base">
          Descubra, acompanhe e guarde cada anime que fizer parte da sua jornada.
        </p>

        <ol className="mt-7 hidden max-w-lg space-y-2.5 lg:block">
          {JOURNEY_STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-xs font-bold text-white/75 backdrop-blur-md">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] font-black text-black">
                {index + 1}
              </span>
              <span className="flex-1">{step}</span>
              <Check className="h-3.5 w-3.5 text-white/45" />
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
