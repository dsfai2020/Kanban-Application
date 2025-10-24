import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Badge from '../components/Badge';
import type { Achievement } from '../types/achievements';

// Mock touch detection
Object.defineProperty(window.navigator, 'maxTouchPoints', {
  writable: true,
  value: 5
});

const mockAchievement: Achievement = {
  id: 'test-achievement',
  type: 'cards_completed',
  name: 'Test Achievement',
  description: 'A test achievement for mobile interactions',
  icon: 'trophy',
  tier: 'bronze',
  requirement: 10,
  color: '#CD7F32'
};

const mockLockedAchievement: Achievement = {
  id: 'locked-achievement',
  type: 'cards_created',
  name: 'Locked Achievement',
  description: 'A locked achievement',
  icon: 'medal',
  tier: 'bronze',
  requirement: 5,
  color: '#CD7F32'
};

describe('Mobile Badge Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show tooltip on touch/tap for unlocked achievement', () => {
    render(<Badge achievement={mockAchievement} isUnlocked={true} currentProgress={10} />);
    
    const badge = screen.getByText('Bronze').closest('.badge') as HTMLElement;
    expect(badge).toBeInTheDocument();
    
    // Simulate click to trigger tooltip (onClick should call handleInteraction)
    fireEvent.click(badge);
    
    // Wait for tooltip to appear and check for tooltip content
    const tooltip = screen.queryByText('Test Achievement');
    if (!tooltip) {
      // Debug: Let's see what's actually rendered
      screen.debug();
    }
    expect(tooltip).toBeInTheDocument();
  });

  it('should hide tooltip on second tap', () => {
    render(<Badge achievement={mockAchievement} isUnlocked={true} currentProgress={10} />);
    
    const badge = screen.getByText('Bronze').closest('.badge') as HTMLElement;
    
    // First tap - show tooltip
    fireEvent.touchStart(badge);
    fireEvent.click(badge);
    
    let tooltip = screen.queryByText('Test Achievement');
    expect(tooltip).toBeInTheDocument();
    
    // Second tap - hide tooltip
    fireEvent.touchStart(badge);
    fireEvent.click(badge);
    
    tooltip = screen.queryByText('Test Achievement');
    expect(tooltip).not.toBeInTheDocument();
  });

  it('should show locked achievement tooltip on mobile tap', () => {
    render(<Badge achievement={mockLockedAchievement} isUnlocked={false} currentProgress={2} />);
    
    const badge = screen.getByText('Bronze').closest('.badge') as HTMLElement;
    
    fireEvent.touchStart(badge);
    fireEvent.click(badge);
    
    const tooltip = screen.getByText('Locked Achievement');
    expect(tooltip).toBeInTheDocument();
  });

  it('should handle touch events without interfering with mouse events', () => {
    render(<Badge achievement={mockAchievement} isUnlocked={true} currentProgress={10} />);
    
    const badge = screen.getByText('Bronze').closest('.badge') as HTMLElement;
    
    // Test that touch events work
    fireEvent.touchStart(badge);
    fireEvent.click(badge);
    
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    
    // Test that mouse events still work (for desktop with touch capability)
    fireEvent.mouseEnter(badge);
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    
    fireEvent.mouseLeave(badge);
    // Tooltip should still be visible due to tap
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
  });

  it('should hide tooltip when tapping outside (simulated)', () => {
    render(<Badge achievement={mockAchievement} isUnlocked={true} currentProgress={10} />);
    
    const badge = screen.getByText('Bronze').closest('.badge') as HTMLElement;
    
    // Show tooltip
    fireEvent.touchStart(badge);
    fireEvent.click(badge);
    
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    
    // Simulate tapping outside by clicking document
    fireEvent.touchStart(document.body);
    fireEvent.click(document.body);
    
    expect(screen.queryByText('Test Achievement')).not.toBeInTheDocument();
  });

  it('should apply correct CSS classes for mobile optimization', () => {
    render(<Badge achievement={mockAchievement} isUnlocked={true} currentProgress={10} />);
    
    const badge = screen.getByText('Bronze').closest('.badge') as HTMLElement;
    expect(badge).toHaveClass('badge');
    expect(badge).toHaveClass('unlocked');
    
    // Show tooltip
    fireEvent.touchStart(badge);
    fireEvent.click(badge);
    
    const tooltip = screen.getByText('Test Achievement').closest('.badge-tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('should handle rapid taps without breaking', () => {
    render(<Badge achievement={mockAchievement} isUnlocked={true} currentProgress={10} />);
    
    const badge = screen.getByText('Bronze').closest('.badge') as HTMLElement;
    
    // Rapid taps
    for (let i = 0; i < 5; i++) {
      fireEvent.touchStart(badge);
      fireEvent.click(badge);
    }
    
    // Should end with tooltip visible (odd number of taps)
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    
    // One more tap to hide
    fireEvent.touchStart(badge);
    fireEvent.click(badge);
    
    expect(screen.queryByText('Test Achievement')).not.toBeInTheDocument();
  });
});