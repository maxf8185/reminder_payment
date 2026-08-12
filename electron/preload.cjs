const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  getStudents: () => ipcRenderer.invoke('get-students'),
  getStudent: (id) => ipcRenderer.invoke('get-student', id),
  createStudent: (data) => ipcRenderer.invoke('create-student', data),
  createPackage: (data) => ipcRenderer.invoke('create-package', data),
  completeLesson: (data) => ipcRenderer.invoke('complete-lesson', data),
  calculateNextPayment: (studentId) => ipcRenderer.invoke('calculate-next-payment', studentId)
});
