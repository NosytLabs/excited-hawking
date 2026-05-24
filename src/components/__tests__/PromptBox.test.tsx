import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PromptBox } from '../PromptBox';

describe('PromptBox', () => {
  it('has prompt id and prompt-box class', () => {
    const { container } = render(<PromptBox />);
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section?.id).toBe('prompt');
    expect(section?.classList.contains('prompt-box')).toBe(true);
  });
});
