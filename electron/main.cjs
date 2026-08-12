const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const { initDb } = require('./db.cjs');
const repo = require('./repositories.cjs');
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: true, // Need to be careful here, usually better to use preload
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
  
  // Check for notifications
  const students = repo.getStudents();
  let overdueCount = 0;
  let dueSoonCount = 0;
  
  students.forEach(s => {
    const status = repo.calculateNextPaymentDate(s.id);
    if (status?.status === 'OVERDUE') overdueCount++;
    if (status?.status === 'DUE_SOON') dueSoonCount++;
  });
  
  if (overdueCount > 0 || dueSoonCount > 0) {
    new Notification({
      title: 'Reminder Payment',
      body: `You have ${overdueCount} overdue and ${dueSoonCount} upcoming payments!`,
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

// IPC Example
ipcMain.handle('ping', () => 'pong');

// Repositories IPC
ipcMain.handle('get-students', () => repo.getStudents());
ipcMain.handle('get-student', (event, id) => repo.getStudent(id));
ipcMain.handle('create-student', (event, data) => repo.createStudent(data));
ipcMain.handle('create-package', (event, data) => repo.createPackage(data));
ipcMain.handle('complete-lesson', (event, {studentId, packageId, date, startTime, endTime, comment}) => 
  repo.completeLesson(studentId, packageId, date, startTime, endTime, comment)
);
ipcMain.handle('calculate-next-payment', (event, studentId) => repo.calculateNextPaymentDate(studentId));

