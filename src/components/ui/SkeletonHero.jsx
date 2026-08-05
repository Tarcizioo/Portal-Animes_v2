export function SkeletonHero() {
  return (
    <div className="hero-card hero-frame hero-loading relative w-full animate-pulse overflow-hidden rounded-[2rem] bg-gray-200 dark:bg-gray-800 sm:rounded-[2.5rem]" aria-hidden="true">

      {/* Simulação do conteúdo interno */}
      <div className="absolute bottom-0 left-0 p-8 lg:p-12 w-full max-w-4xl space-y-4">

        {/* Badges */}
        <div className="flex gap-3">
          <div className="w-16 h-6 bg-gray-300 dark:bg-gray-700 rounded-md" />
          <div className="w-12 h-6 bg-gray-300 dark:bg-gray-700 rounded-md" />
        </div>

        {/* Título Grande */}
        <div className="h-10 lg:h-14 bg-gray-300 dark:bg-gray-600 rounded-lg w-3/4 lg:w-1/2" />

        {/* Gêneros */}
        <div className="flex gap-2">
          <div className="w-20 h-6 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="w-20 h-6 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Sinopse */}
        <div className="space-y-2 max-w-2xl pt-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6" />
        </div>

        {/* Botões */}
        <div className="flex gap-4 pt-4">
          <div className="w-40 h-12 bg-gray-300 dark:bg-gray-600 rounded-xl" />
          <div className="w-32 h-12 bg-gray-300 dark:bg-gray-700/50 rounded-xl" />
        </div>
      </div>
    </div>
  );
}