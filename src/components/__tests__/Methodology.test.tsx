import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Methodology } from '../Methodology';

describe('Methodology', () => {
  it('should render without crashing', () => {
    render(<Methodology />);
  });

  it('should display the research question section', () => {
    const { getByText } = render(<Methodology />);
    expect(getByText('Research Question')).toBeInTheDocument();
    expect(getByText(/How do structured participant interactions/)).toBeInTheDocument();
  });

  it('should display the metrics section', () => {
    const { getByText } = render(<Methodology />);
    expect(getByText('Metrics')).toBeInTheDocument();
    expect(getByText(/Grid Complexity/)).toBeInTheDocument();
    expect(getByText(/Contribution Weight/)).toBeInTheDocument();
  });

  it('should display the limitations section', () => {
    const { getByText } = render(<Methodology />);
    expect(getByText('Limitations')).toBeInTheDocument();
    expect(getByText(/observational study of computational patterns/)).toBeInTheDocument();
  });
});
