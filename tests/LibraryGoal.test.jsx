import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LibraryGoal } from '../src/components/library/LibraryGoal';

describe('LibraryGoal', () => {
  it('allows the user to update the weekly goal', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<LibraryGoal goal={12} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: /ajustar meta/i }));
    const input = screen.getByRole('spinbutton', { name: /nova meta semanal/i });
    await user.clear(input);
    await user.type(input, '20');
    await user.click(screen.getByRole('button', { name: /salvar meta/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(20));
    rerender(<LibraryGoal goal={20} onSave={onSave} />);
    expect(screen.getByText(/0 de 20 episodios/i)).toBeInTheDocument();
  });
});
