import { ReactNotifications, Store } from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'

export const NotificationContainer = ({ children }) => {
  return (
    <>
      <ReactNotifications />
      {children}
    </>
  )
}

const addNotification = (type) => (message, title, duration) => {
  Store.addNotification({
    title,
    message,
    type,
    insert: 'top',
    container: 'top-right',
    animationIn: ['animate__animated', 'animate__fadeIn'],
    animationOut: ['animate__animated', 'animate__fadeOut'],
    dismiss: {
      duration: duration || 3000,
      onScreen: true
    }
  })
}

export const NotificationManager = {
  info: addNotification('info'),
  error: addNotification('danger'),
  warning: addNotification('warning'),
  success: addNotification('success')
}

export default {}
