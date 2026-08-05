import { createContext, useContext } from 'react';

const HeroAmbientPublisherContext = createContext(null);

export function HeroAmbientProvider({ publish, children }) {
  return (
    <HeroAmbientPublisherContext.Provider value={publish}>
      {children}
    </HeroAmbientPublisherContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHeroAmbientPublisher() {
  const publish = useContext(HeroAmbientPublisherContext);

  if (!publish) {
    throw new Error('useHeroAmbientPublisher must be used inside HeroAmbientProvider');
  }

  return publish;
}
