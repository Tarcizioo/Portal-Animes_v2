import { useEffect } from 'react';

export function usePageTitle(title) {
    useEffect(() => {
        document.title = `PortalAnimes | ${title}`;
    }, [title]);
}
