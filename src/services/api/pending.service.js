// Screens listen to this to reload after a change saved on the server (review, photos, targets).
export const pendingEvents = new EventTarget()
export const notifyChange = () => pendingEvents.dispatchEvent(new Event('change'))
