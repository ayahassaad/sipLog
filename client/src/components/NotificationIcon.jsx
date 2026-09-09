// Shared between NotificationBell (the dropdown) and NotificationsPage
// (the full history) so both render a notification's icon exactly the
// same way -- one place to add a new notification type's icon, not two.
// (The text/target helpers live in utils/notificationDisplay.js instead
// of here, since mixing component and non-component exports in one file
// breaks fast refresh.)

const TYPE_ICON = {
  follow: (
    <>
      <circle cx="10" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.6 3-5.7 6.5-5.7s6.5 2.1 6.5 5.7" />
      <path d="M17.5 8h4M19.5 6v4" />
    </>
  ),
  unfollow: (
    <>
      <circle cx="10" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.6 3-5.7 6.5-5.7s6.5 2.1 6.5 5.7" />
      <path d="M17.5 8h4" />
    </>
  ),
  favorite: (
    <path d="M12 20s-7-4.4-9.5-8.8C.8 8 2.3 4.5 5.6 4c2-.3 3.7.7 4.9 2.4L12 8l1.5-1.6C14.7 4.7 16.4 3.7 18.4 4c3.3.5 4.8 4 3.1 7.2C19 15.6 12 20 12 20Z" />
  ),
  message: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  comment: <path d="M4 4h16v11H9l-5 4V4Z" />,
};

function NotificationIcon({ type }) {
  return (
    <svg className="notification-icon" viewBox="0 0 24 24" aria-hidden="true">
      {TYPE_ICON[type] || TYPE_ICON.follow}
    </svg>
  );
}

export default NotificationIcon;
