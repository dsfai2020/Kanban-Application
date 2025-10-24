import AchievementNotification from './AchievementNotification'
import { useAchievementNotifications, type AchievementNotificationData } from '../hooks/useAchievementNotifications'

interface AchievementNotificationsContainerProps {
  notifications: AchievementNotificationData[]
  onRemoveNotification: (id: string) => void
}

export default function AchievementNotificationsContainer({
  notifications,
  onRemoveNotification
}: AchievementNotificationsContainerProps) {
  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: 'fixed',
            top: `${20 + index * 120}px`, // Stack notifications vertically
            right: '20px',
            zIndex: 10000 - index // Ensure newest is on top
          }}
        >
          <AchievementNotification
            achievement={notification.achievement}
            tier={notification.tier}
            isVisible={true}
            onClose={() => onRemoveNotification(notification.id)}
          />
        </div>
      ))}
    </>
  )
}

// Export the hook for use in other components
export { useAchievementNotifications }