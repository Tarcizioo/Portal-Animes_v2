import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { StudioCard } from '../src/components/ui/StudioCard';
import { StudioListItem } from '../src/components/ui/StudioListItem';

describe('studio artwork fallbacks', () => {
  it('uses a local accessible state in cards and lists when artwork is missing', () => {
    const studio = { id: 7, name: 'Kyoto Animation' };
    const { container } = render(
      <MemoryRouter>
        <StudioCard studio={studio} />
        <StudioListItem studio={studio} />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('img', { name: 'Sem imagem para Kyoto Animation' })).toHaveLength(2);
    expect(screen.getAllByText('Imagem indisponível')).toHaveLength(2);
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(container.innerHTML).not.toMatch(/placeholder-studio|via\.placeholder/i);
  });

  it('switches a failed studio image to the same local state', () => {
    render(
      <MemoryRouter>
        <StudioCard studio={{ id: 8, name: 'Bones', image: 'https://images.example.com/bones.jpg' }} />
      </MemoryRouter>,
    );

    fireEvent.error(screen.getByRole('img', { name: 'Bones' }));
    expect(screen.getByRole('img', { name: 'Sem imagem para Bones' })).toBeInTheDocument();
  });
});
