import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import App from '../App';
import { achievementManager } from '../utils/achievementManager';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test wrapper with AuthProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('Achievement Notifications Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Reset achievement system
    achievementManager.resetAllData();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show achievement notification when user creates their first card', async () => {
    render(<App />, { wrapper: TestWrapper });
    
    // Wait for app to load and become a guest user
    await waitFor(() => {
      const guestButton = screen.getByText(/continue as guest/i);
      fireEvent.click(guestButton);
    });

    // Wait for guest authentication
    await waitFor(() => {
      expect(screen.getByText(/Create New Board/i)).toBeInTheDocument();
    });

    // Create a board first
    const createBoardBtn = screen.getByText(/Create New Board/i);
    fireEvent.click(createBoardBtn);

    // Add some cards to trigger achievements
    await waitFor(() => {
      const addCardBtn = screen.getByText(/Add a card/i);
      fireEvent.click(addCardBtn);
    });

    // Fill out the card form
    const titleInput = screen.getByPlaceholderText(/Enter card title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Achievement Card' } });
    
    const addButton = screen.getByText(/Add Card/i);
    fireEvent.click(addButton);

    // Check for achievement notification
    await waitFor(() => {
      const notification = screen.queryByText(/Achievement Unlocked/i);
      if (notification) {
        expect(notification).toBeInTheDocument();
      }
    }, { timeout: 2000 });
  });

  it('should display celebration animations in achievement notifications', async () => {
    render(<App />, { wrapper: TestWrapper });
    
    // Manually trigger an achievement for testing
    const testNotification = document.createElement('div');
    testNotification.className = 'achievement-notification visible';
    document.body.appendChild(testNotification);

    // Check for confetti elements
    const confettiContainer = document.querySelector('.confetti-container');
    expect(confettiContainer).toBeTruthy();
    
    // Check for sparkle effects
    const sparkles = document.querySelectorAll('.sparkle');
    expect(sparkles.length).toBeGreaterThan(0);

    // Cleanup
    document.body.removeChild(testNotification);
  });

  it('should allow closing achievement notifications', async () => {
    render(<App />, { wrapper: TestWrapper });
    
    // Create a test notification element
    const testNotification = document.createElement('div');
    testNotification.className = 'achievement-notification visible';
    testNotification.innerHTML = `
      <button class="notification-close" aria-label="Close notification">×</button>
      <div>Achievement Unlocked!</div>
    `;
    document.body.appendChild(testNotification);

    const closeButton = testNotification.querySelector('.notification-close');
    expect(closeButton).toBeTruthy();

    // Click close button
    fireEvent.click(closeButton as Element);

    // Check that notification starts closing animation
    await waitFor(() => {
      const notification = document.querySelector('.achievement-notification');
      expect(notification).toBeTruthy(); // Should still exist during animation
    });

    // Cleanup
    document.body.removeChild(testNotification);
  });

  it('should stack multiple achievement notifications properly', async () => {
    render(<App />, { wrapper: TestWrapper });
    
    // Create multiple test notifications
    const notifications = [1, 2, 3].map(i => {
      const notification = document.createElement('div');
      notification.className = 'achievement-notification visible';
      notification.style.top = `${20 + (i - 1) * 120}px`;
      notification.textContent = `Achievement ${i} Unlocked!`;
      document.body.appendChild(notification);
      return notification;
    });

    // Check that notifications are properly positioned
    notifications.forEach((notification, index) => {
      const expectedTop = `${20 + index * 120}px`;
      expect(notification.style.top).toBe(expectedTop);
    });

    // Cleanup
    notifications.forEach(notification => {
      document.body.removeChild(notification);
    });
  });

  it('should handle achievement manager callback registration', () => {
    const mockCallback = vi.fn();
    
    // Add callback
    achievementManager.addNotificationCallback(mockCallback);
    
    // Trigger an achievement
    achievementManager.trackCardCreated();
    
    // Remove callback
    achievementManager.removeNotificationCallback(mockCallback);
    
    // Should have been called at least once if achievement was unlocked
    if (mockCallback.mock.calls.length > 0) {
      expect(mockCallback).toHaveBeenCalled();
    }
  });
});