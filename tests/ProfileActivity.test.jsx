import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProfileActivity } from '../src/components/profile/ProfileActivity';

vi.mock('@/components/ui/ResponsiveImage', () => ({
  ResponsiveImage: ({ src, alt, className }) => <img src={src} alt={alt} className={className} />,
}));

describe('ProfileActivity', () => {
  it('uses the same user-facing watching label as the library', () => {
    render(
      <MemoryRouter>
        <ProfileActivity
          library={[{
            id: '1',
            title: 'Cowboy Bebop',
            image: '/cowboy-bebop.jpg',
            status: 'watching',
            currentEp: 4,
            totalEp: 26,
            lastUpdated: { seconds: 10 },
          }]}
          libraryPath="/library"
          isOwnProfile
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Assistindo')).toBeInTheDocument();
    expect(screen.queryByText('Em andamento')).not.toBeInTheDocument();
  });
});
