const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  
  // Auth
  login: (username, password) => ipcRenderer.invoke('login', username, password),
  logout: () => ipcRenderer.invoke('logout'),
  getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
  
  // Users (Teachers)
  getUsers: () => ipcRenderer.invoke('get-users'),
  createUser: (data) => ipcRenderer.invoke('create-user', data),
  updateUser: (id, data) => ipcRenderer.invoke('update-user', id, data),

  // Students
  getStudents: () => ipcRenderer.invoke('get-students'),
  getStudent: (id) => ipcRenderer.invoke('get-student', id),
  createStudent: (data) => ipcRenderer.invoke('create-student', data),
  updateStudent: (id, data) => ipcRenderer.invoke('update-student', id, data),
  
  // Packages & Lessons
  createPackage: (data) => ipcRenderer.invoke('create-package', data),
  completeLesson: (data) => ipcRenderer.invoke('complete-lesson', data),
  calculateNextPayment: (studentId) => ipcRenderer.invoke('calculate-next-payment', studentId),
  getAllPackages: () => ipcRenderer.invoke('get-all-packages'),
  getAllLessons: () => ipcRenderer.invoke('get-all-lessons'),
  getGlobalPaymentRequiredList: () => ipcRenderer.invoke('get-global-payment-required-list'),
  
  // Notifications & Stats
  getNotifications: () => ipcRenderer.invoke('get-notifications'),
  markNotificationRead: (id) => ipcRenderer.invoke('mark-notification-read', id),
  getStats: () => ipcRenderer.invoke('get-stats')
});
