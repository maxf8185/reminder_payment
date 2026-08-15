const { app, BrowserWindow, ipcMain, Notification, dialog } = require('electron');
const fs = require('fs');
const xlsx = require('xlsx');
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
  
  // Bypass login for now (auto-login as admin)
  currentUser = repo.login('admin', 'admin');
  
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
ipcMain.handle('delete-lesson', (event, lessonId) => {
  checkAdmin();
  return repo.deleteLesson(lessonId, currentUser.role);
});
ipcMain.handle('mark-invoice-sent', (event, packageId) => {
  checkAdmin();
  return repo.markInvoiceSent(packageId, currentUser.role);
});
ipcMain.handle('calculate-next-payment', (event, studentId) => {
  checkAuth();
  return repo.calculateNextPaymentDate(studentId);
});

// Schedules IPC
ipcMain.handle('get-schedules', (event, studentId) => {
  checkAuth();
  return repo.getSchedules(studentId);
});
ipcMain.handle('set-schedules', (event, studentId, schedules) => {
  checkAdmin();
  return repo.setSchedules(studentId, schedules);
});
ipcMain.handle('get-all-schedules', () => {
  checkAuth();
  return repo.getAllSchedules();
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

// Excel IPC
ipcMain.handle('export-excel', async () => {
  checkAdmin();
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Students',
    defaultPath: 'students.xlsx',
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });
  
  if (filePath) {
    const students = repo.getStudents(currentUser.id, 'ADMIN');
    const ws = xlsx.utils.json_to_sheet(students);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Students");
    xlsx.writeFile(wb, filePath);
    return { success: true, filePath };
  }
  return { success: false };
});

ipcMain.handle('import-excel', async () => {
  checkAdmin();
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Import Students',
    properties: ['openFile'],
    filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const wb = xlsx.readFile(filePaths[0]);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws);
    
    let imported = 0;
    for (const row of data) {
      if (row.first_name && row.last_name) {
        repo.createStudent({
          firstName: row.first_name,
          lastName: row.last_name,
          phone: row.phone || '',
          email: row.email || '',
          comment: row.comment || '',
          teacherId: row.teacher_id || null,
          studentPhone: row.student_phone || '',
          parentPhone: row.parent_phone || '',
          level: row.level || '',
          contractNumber: row.contract_number || ''
        });
        imported++;
      }
    }
    return { success: true, imported };
  }
  return { success: false };
});
