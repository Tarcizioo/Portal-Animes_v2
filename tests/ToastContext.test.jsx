import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from '../src/context/ToastContext';

function ToastHarness() {
  const { toast } = useToast();
  return <button type="button" onClick={() => toast.success('Biblioteca atualizada')}>Mostrar toast</button>;
}

describe('ToastProvider', () => {
  afterEach(() => vi.useRealTimers());

  it('announces and dismisses a toast with its exit transition', () => {
    vi.useFakeTimers();
    render(<ToastProvider><ToastHarness /></ToastProvider>);

    fireEvent.click(screen.getByRole('button', { name: /mostrar toast/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Biblioteca atualizada');

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole('status')).toHaveClass('toast-exit');

    act(() => vi.advanceTimersByTime(220));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
