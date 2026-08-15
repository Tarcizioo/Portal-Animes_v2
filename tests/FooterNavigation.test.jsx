import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Footer } from '../src/components/layout/Footer';

describe('Footer navigation', () => {
  it('sends the seasonal entry to the discovery experience', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'Temporada' })).toHaveAttribute('href', '/discover');
    expect(screen.queryByRole('link', { name: 'Temporada' })).not.toHaveAttribute('href', '/seasonal');
  });
});
