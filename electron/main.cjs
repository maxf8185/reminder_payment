const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const { initDb } = require('./db.cjs');
const repo = require('./repositories.cjs');
const isDev = !app.isPackaged;

let mainWindow;
let currentUser = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: true,
      contextIsolation: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDb();
  
  // Basic native notification check on start
  const notifications = repo.getNotifications();
  const unreadPayments = notifications.filter(n => n.status === 'UNREAD' && n.type === 'PAYMENT_REQUIRED').length;
  
  if (unreadPayments > 0) {
    new Notification({
      title: 'Reminder Payment',
      body: `There are ${unreadPayments} students requiring payment!`,
    }).show();
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function checkAuth() {
  if (!currentUser) throw new Error('Unauthorized');
}

function checkAdmin() {
  if (!currentUser || currentUser.role !== 'ADMIN') throw new Error('Forbidden: Admins only');
}

// IPC Example
ipcMain.handle('ping', () => 'pong');

// Auth IPC
ipcMain.handle('login', (event, username, password) => {
  const user = repo.login(username, password);
  if (user) {
    currentUser = user;
    return user;
  }
  throw new Error('Invalid credentials');
});

ipcMain.handle('logout', () => {
  currentUser = null;
});

ipcMain.handle('get-current-user', () => {
  return currentUser;
});

// Users IPC
ipcMain.handle('get-users', () => {
  checkAdmin();
  return repo.getUsers();
});
ipcMain.handle('create-user', (event, data) => {
  checkAdmin();
  return repo.createUser(data);
});
ipcMain.handle('update-user', (event, id, data) => {
  checkAdmin();
  return repo.updateUser(id, data);
});

// Repositories IPC
ipcMain.handle('get-students', () => {
  checkAuth();
  return repo.getStudents(currentUser.id, currentUser.role);
});
ipcMain.handle('get-student', (event, id) => {
  checkAuth();
  return repo.getStudent(id, currentUser.id, currentUser.role);
});
ipcMain.handle('create-student', (event, data) => {
  checkAdmin();
  return repo.createStudent(data);
});
ipcMain.handle('update-student', (event, id, data) => {
  checkAdmin();
  return repo.updateStudent(id, data);
});

ipcMain.handle('create-package', (event, data) => {
  checkAdmin();
  return repo.createPackage(data);
});
ipcMain.handle('complete-lesson', (event, {studentId, packageId, date, startTime, endTime, comment}) => {
  checkAuth();
  return repo.completeLesson(studentId, packageId, date, startTime, endTime, comment, currentUser.id, currentUser.role);
});
ipcMain.handle('calculate-next-payment', (event, studentId) => {
  checkAuth();
  return repo.calculateNextPaymentDate(studentId);
});
ipcMain.handle('get-all-packages', () => {
  checkAdmin();
  return repo.getAllPackages();
});
ipcMain.handle('get-all-lessons', () => {
  checkAuth();
  return repo.getAllLessons();
});
ipcMain.handle('get-global-payment-required-list', () => {
  checkAdmin();
  return repo.getGlobalPaymentRequiredList();
});

ipcMain.handle('get-notifications', () => {
  checkAdmin();
  return repo.getNotifications();
});
ipcMain.handle('mark-notification-read', (event, id) => {
  checkAdmin();
  return repo.markNotificationRead(id);
});
ipcMain.handle('get-stats', () => {
  checkAdmin();
  return repo.getStats();
});
