const { db } = require('./db.cjs');
const { parse, addDays, isBefore, startOfDay, getDay, format } = require('date-fns');
const { v4: uuidv4 } = require('uuid');

// Students
function getStudents() {
  return db.prepare('SELECT * FROM Student ORDER BY start_date DESC').all();
}

function getStudent(id) {
  const student = db.prepare('SELECT * FROM Student WHERE id = ?').get(id);
  if (!student) return null;
  student.schedules = db.prepare('SELECT * FROM Schedule WHERE student_id = ? ORDER BY day_of_week').all(id);
  student.packages = db.prepare('SELECT * FROM LessonPackage WHERE student_id = ? ORDER BY payment_date DESC').all(id);
  student.lessons = db.prepare('SELECT * FROM Lesson WHERE student_id = ? ORDER BY date DESC').all(id);
  return student;
}

function createStudent(data) {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO Student (id, first_name, last_name, phone, email, comment, status, start_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.firstName, data.lastName, data.phone || '', data.email || '', data.comment || '', data.status || 'Active', data.startDate || new Date().toISOString().split('T')[0]);
  
  if (data.schedules && data.schedules.length > 0) {
    const schedStmt = db.prepare('INSERT INTO Schedule (id, student_id, day_of_week, time) VALUES (?, ?, ?, ?)');
    for (const sched of data.schedules) {
      schedStmt.run(uuidv4(), id, sched.dayOfWeek, sched.time);
    }
  }
  return id;
}

// Packages
function createPackage(data) {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO LessonPackage (id, student_id, total_lessons, price, payment_date, start_date, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Active')
  `);
  stmt.run(id, data.studentId, data.totalLessons, data.price, data.paymentDate, data.startDate);
  
  // Mark older active packages as Completed or leave them alone based on business logic
  // For now, if a new package is created, we don't strictly auto-close old ones unless they are 0
  return id;
}

// Lessons
function completeLesson(studentId, packageId, date, startTime, endTime, comment) {
  const id = uuidv4();
  
  const insertLesson = db.prepare(`
    INSERT INTO Lesson (id, student_id, package_id, date, start_time, end_time, status, comment)
    VALUES (?, ?, ?, ?, ?, ?, 'Completed', ?)
  `);
  
  const updatePackage = db.prepare(`
    UPDATE LessonPackage SET used_lessons = used_lessons + 1 WHERE id = ?
  `);
  
  const transaction = db.transaction(() => {
    insertLesson.run(id, studentId, packageId, date, startTime, endTime, comment);
    updatePackage.run(packageId);
  });
  
  transaction();
  return id;
}

function calculateNextPaymentDate(studentId) {
  // Get active package
  const activePackage = db.prepare("SELECT * FROM LessonPackage WHERE student_id = ? AND status = 'Active' ORDER BY start_date DESC LIMIT 1").get(studentId);
  if (!activePackage) return null;
  
  const remaining = activePackage.total_lessons - activePackage.used_lessons;
  if (remaining <= 0) {
    return { status: 'OVERDUE', remaining, expectedDate: format(new Date(), 'yyyy-MM-dd') }; // Expected today or earlier
  }
  
  // Get schedules
  const schedules = db.prepare('SELECT * FROM Schedule WHERE student_id = ?').all(studentId);
  if (schedules.length === 0) {
    // No schedule, cannot predict
    return { status: 'UNKNOWN_SCHEDULE', remaining, expectedDate: null };
  }
  
  // Find next N dates matching the schedule
  let current = startOfDay(new Date());
  let count = 0;
  let expectedDate = null;
  
  // Sanity limit to avoid infinite loops
  let daysLookAhead = 0;
  
  // JavaScript getDay(): 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  // Convert our DB schedule day_of_week to match JS getDay (e.g. if we store 1=Monday...7=Sunday)
  // Let's assume DB: 1=Monday, 2=Tuesday ... 7=Sunday
  const scheduleDays = schedules.map(s => s.day_of_week === 7 ? 0 : s.day_of_week);
  
  while (count < remaining && daysLookAhead < 365) {
    current = addDays(current, 1);
    daysLookAhead++;
    
    if (scheduleDays.includes(getDay(current))) {
      count++;
      if (count === remaining) {
        expectedDate = current;
      }
    }
  }
  
  if (expectedDate) {
    return { 
      status: remaining <= 2 ? 'DUE_SOON' : 'ACTIVE', 
      remaining, 
      expectedDate: format(expectedDate, 'yyyy-MM-dd') 
    };
  }
  
  return null;
}

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  createPackage,
  completeLesson,
  calculateNextPaymentDate
};
