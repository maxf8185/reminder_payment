const { db } = require('./db.cjs');
const { addDays, startOfDay, getDay, format } = require('date-fns');
const { v4: uuidv4 } = require('uuid');

// Auth & Users
function login(username, password) {
  const user = db.prepare('SELECT id, username, role, name FROM User WHERE username = ? AND password = ?').get(username, password);
  return user || null;
}

function getUsers() {
  return db.prepare('SELECT id, username, role, name FROM User ORDER BY name').all();
}

function createUser(data) {
  const id = uuidv4();
  db.prepare('INSERT INTO User (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)').run(
    id, data.username, data.password, data.role || 'TEACHER', data.name
  );
  return id;
}

function updateUser(id, data) {
  if (data.password) {
    db.prepare('UPDATE User SET username = ?, password = ?, role = ?, name = ? WHERE id = ?').run(
      data.username, data.password, data.role, data.name, id
    );
  } else {
    db.prepare('UPDATE User SET username = ?, role = ?, name = ? WHERE id = ?').run(
      data.username, data.role, data.name, id
    );
  }
}

// Students
function getStudents(userId, role) {
  if (role === 'ADMIN') {
    return db.prepare(`
      SELECT s.*, u.name as teacher_name 
      FROM Student s 
      LEFT JOIN User u ON s.teacher_id = u.id 
      ORDER BY s.start_date DESC
    `).all();
  } else {
    return db.prepare(`
      SELECT s.*, u.name as teacher_name 
      FROM Student s 
      LEFT JOIN User u ON s.teacher_id = u.id 
      WHERE s.teacher_id = ? 
      ORDER BY s.start_date DESC
    `).all(userId);
  }
}

function getStudent(id, userId, role) {
  const student = db.prepare('SELECT * FROM Student WHERE id = ?').get(id);
  if (!student) return null;
  
  if (role !== 'ADMIN' && student.teacher_id !== userId) {
    throw new Error('Access Denied: You do not have permission to view this student.');
  }

  student.schedules = db.prepare('SELECT * FROM Schedule WHERE student_id = ? ORDER BY day_of_week').all(id);
  student.packages = db.prepare('SELECT * FROM LessonPackage WHERE student_id = ? ORDER BY payment_date DESC').all(id);
  student.lessons = db.prepare('SELECT * FROM Lesson WHERE student_id = ? ORDER BY date DESC').all(id);
  
  if (student.teacher_id) {
    const teacher = db.prepare('SELECT name FROM User WHERE id = ?').get(student.teacher_id);
    student.teacher_name = teacher ? teacher.name : 'Unknown';
  }
  
  return student;
}

function createStudent(data) {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO Student (id, first_name, last_name, phone, email, comment, status, start_date, teacher_id, student_phone, parent_phone, level, contract_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id, 
    data.firstName, 
    data.lastName, 
    data.phone || '', 
    data.email || '', 
    data.comment || '', 
    data.status || 'Active', 
    data.startDate || new Date().toISOString().split('T')[0],
    data.teacherId || null,
    data.studentPhone || '',
    data.parentPhone || '',
    data.level || '',
    data.contractNumber || ''
  );
  
  if (data.schedules && data.schedules.length > 0) {
    const schedStmt = db.prepare('INSERT INTO Schedule (id, student_id, day_of_week, time) VALUES (?, ?, ?, ?)');
    for (const sched of data.schedules) {
      schedStmt.run(uuidv4(), id, sched.dayOfWeek, sched.time);
    }
  }
  return id;
}

function updateStudent(id, data) {
  const stmt = db.prepare(`
    UPDATE Student SET 
      first_name = ?, last_name = ?, phone = ?, email = ?, comment = ?, 
      status = ?, teacher_id = ?, student_phone = ?, parent_phone = ?, 
      level = ?, contract_number = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(
    data.firstName, data.lastName, data.phone || '', data.email || '', data.comment || '', 
    data.status, data.teacherId || null, data.studentPhone || '', data.parentPhone || '', 
    data.level || '', data.contractNumber || '', id
  );
}

// Packages (Cycles)
function createPackage(data) {
  const id = uuidv4();
  // Using 5 as default total_lessons for the cycle
  const totalLessons = data.totalLessons || 5; 
  
  // Close existing active packages for this student
  db.prepare("UPDATE LessonPackage SET status = 'Completed' WHERE student_id = ? AND status = 'Active'").run(data.studentId);
  db.prepare("UPDATE LessonPackage SET status = 'Completed' WHERE student_id = ? AND status = 'PAYMENT_REQUIRED'").run(data.studentId);

  const stmt = db.prepare(`
    INSERT INTO LessonPackage (id, student_id, total_lessons, price, payment_date, start_date, status, used_lessons)
    VALUES (?, ?, ?, ?, ?, ?, 'Active', 0)
  `);
  stmt.run(id, data.studentId, totalLessons, data.price, data.paymentDate, data.startDate);
  
  // Resolve any existing notifications for this student
  db.prepare("UPDATE Notification SET status = 'RESOLVED' WHERE reference_id = ? AND status = 'UNREAD' AND type = 'PAYMENT_REQUIRED'").run(data.studentId);

  return id;
}

// Lessons
function completeLesson(studentId, packageId, date, startTime, endTime, comment, userId, role) {
  // Check permission
  const student = db.prepare('SELECT teacher_id FROM Student WHERE id = ?').get(studentId);
  if (role !== 'ADMIN' && student.teacher_id !== userId) {
    throw new Error('Access Denied: Cannot mark lesson for another teacher\'s student.');
  }

  // Double-count protection
  const existingLesson = db.prepare('SELECT id FROM Lesson WHERE student_id = ? AND date = ?').get(studentId, date);
  if (existingLesson) {
    throw new Error('A lesson is already recorded for this student on this date.');
  }

  // Package status check
  const pkgCheck = db.prepare('SELECT status FROM LessonPackage WHERE id = ?').get(packageId);
  if (!pkgCheck || pkgCheck.status !== 'Active') {
    throw new Error('Access Denied: Payment cycle is not active.');
  }

  const id = uuidv4();
  
  const insertLesson = db.prepare(`
    INSERT INTO Lesson (id, student_id, package_id, date, start_time, end_time, status, comment)
    VALUES (?, ?, ?, ?, ?, ?, 'Completed', ?)
  `);
  
  const updatePackage = db.prepare(`
    UPDATE LessonPackage SET used_lessons = used_lessons + 1 WHERE id = ?
  `);
  
  const getPackage = db.prepare(`SELECT * FROM LessonPackage WHERE id = ?`);
  
  const createNotification = db.prepare(`
    INSERT INTO Notification (id, type, message, reference_id) VALUES (?, 'PAYMENT_REQUIRED', ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertLesson.run(id, studentId, packageId, date, startTime || '', endTime || '', comment || '');
    updatePackage.run(packageId);
    
    const pkg = getPackage.get(packageId);
    if (pkg && pkg.used_lessons >= pkg.total_lessons && pkg.status === 'Active') {
      db.prepare("UPDATE LessonPackage SET status = 'PAYMENT_REQUIRED' WHERE id = ?").run(packageId);
      
      // Check if notification already exists to avoid duplicates
      const existingNotif = db.prepare("SELECT id FROM Notification WHERE reference_id = ? AND status = 'UNREAD' AND type = 'PAYMENT_REQUIRED'").get(studentId);
      if (!existingNotif) {
        const studentInfo = db.prepare("SELECT first_name, last_name FROM Student WHERE id = ?").get(studentId);
        const msg = `${studentInfo.first_name} ${studentInfo.last_name} has completed ${pkg.total_lessons} lessons.`;
        createNotification.run(uuidv4(), msg, studentId);
      }
    }
  });
  
  transaction();
  return id;
}

function deleteLesson(lessonId, role) {
  if (role !== 'ADMIN') {
    throw new Error('Access Denied: Only administrators can delete recorded lessons.');
  }

  const lesson = db.prepare('SELECT student_id, package_id FROM Lesson WHERE id = ?').get(lessonId);
  if (!lesson) return;

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM Lesson WHERE id = ?').run(lessonId);
    if (lesson.package_id) {
      db.prepare('UPDATE LessonPackage SET used_lessons = MAX(0, used_lessons - 1) WHERE id = ?').run(lesson.package_id);
      
      // If dropping below total lessons, revert PAYMENT_REQUIRED back to Active
      const pkg = db.prepare('SELECT total_lessons, used_lessons, status FROM LessonPackage WHERE id = ?').get(lesson.package_id);
      if (pkg && pkg.status === 'PAYMENT_REQUIRED' && pkg.used_lessons < pkg.total_lessons) {
        db.prepare("UPDATE LessonPackage SET status = 'Active' WHERE id = ?").run(lesson.package_id);
        db.prepare("UPDATE Notification SET status = 'RESOLVED' WHERE reference_id = ? AND type = 'PAYMENT_REQUIRED' AND status = 'UNREAD'").run(lesson.student_id);
      }
    }
  });

  transaction();
}

function markInvoiceSent(packageId, role) {
  if (role !== 'ADMIN') {
    throw new Error('Access Denied: Only administrators can manage invoices.');
  }
  db.prepare("UPDATE LessonPackage SET status = 'INVOICE_SENT' WHERE id = ?").run(packageId);
}

function calculateNextPaymentDate(studentId) {
  // Get active package
  const activePackage = db.prepare("SELECT * FROM LessonPackage WHERE student_id = ? AND status IN ('Active', 'PAYMENT_REQUIRED') ORDER BY start_date DESC LIMIT 1").get(studentId);
  if (!activePackage) return null;
  
  const remaining = activePackage.total_lessons - activePackage.used_lessons;
  if (remaining <= 0 || activePackage.status === 'PAYMENT_REQUIRED') {
    return { status: 'PAYMENT_REQUIRED', remaining: 0, expectedDate: format(new Date(), 'yyyy-MM-dd') };
  }
  
  // Predict using schedules
  const schedules = db.prepare('SELECT * FROM Schedule WHERE student_id = ?').all(studentId);
  if (schedules.length === 0) return { status: 'UNKNOWN_SCHEDULE', remaining, expectedDate: null };
  
  let current = startOfDay(new Date());
  let count = 0;
  let expectedDate = null;
  let daysLookAhead = 0;
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

function getAllPackages() {
  return db.prepare(`
    SELECT lp.*, s.first_name, s.last_name 
    FROM LessonPackage lp 
    JOIN Student s ON lp.student_id = s.id 
    ORDER BY lp.payment_date DESC
  `).all();
}

function getAllLessons() {
  return db.prepare(`
    SELECT l.*, s.first_name, s.last_name 
    FROM Lesson l 
    JOIN Student s ON l.student_id = s.id 
    ORDER BY l.date DESC
  `).all();
}
// Schedules
function getSchedules(studentId, userId, role) {
  const student = db.prepare('SELECT teacher_id FROM Student WHERE id = ?').get(studentId);
  if (role !== 'ADMIN' && student && student.teacher_id !== userId) {
    throw new Error('Access Denied: Cannot view schedules of another teacher\'s student.');
  }
  return db.prepare("SELECT * FROM Schedule WHERE student_id = ? ORDER BY day_of_week ASC").all(studentId);
}

function setSchedules(studentId, schedules) {
  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM Schedule WHERE student_id = ?").run(studentId);
    const insert = db.prepare("INSERT INTO Schedule (id, student_id, day_of_week, time) VALUES (?, ?, ?, ?)");
    for (const sch of schedules) {
      insert.run(uuidv4(), studentId, sch.day_of_week, sch.time);
    }
  });
  transaction();
}

function getAllSchedules() {
  return db.prepare(`
    SELECT sch.*, s.first_name, s.last_name, s.teacher_id
    FROM Schedule sch
    JOIN Student s ON sch.student_id = s.id
    WHERE s.status = 'Active'
  `).all();
}

function getGlobalPaymentRequiredList() {
  return db.prepare(`
    SELECT s.id, s.first_name, s.last_name, s.contract_number, u.name as teacher_name, lp.used_lessons
    FROM Student s
    JOIN LessonPackage lp ON lp.student_id = s.id
    LEFT JOIN User u ON s.teacher_id = u.id
    WHERE lp.status = 'PAYMENT_REQUIRED'
    ORDER BY s.last_name
  `).all();
}

// Notifications
function getNotifications() {
  return db.prepare("SELECT * FROM Notification ORDER BY created_at DESC").all();
}

function markNotificationRead(id) {
  db.prepare("UPDATE Notification SET status = 'READ' WHERE id = ?").run(id);
}

function getStats() {
  const teachersCount = db.prepare("SELECT COUNT(*) as count FROM User WHERE role = 'TEACHER'").get().count;
  const studentsCount = db.prepare("SELECT COUNT(*) as count FROM Student").get().count;
  
  const today = new Date().toISOString().split('T')[0];
  const lessonsToday = db.prepare("SELECT COUNT(*) as count FROM Lesson WHERE date = ?").get(today).count;
  const paymentsRequired = db.prepare("SELECT COUNT(*) as count FROM LessonPackage WHERE status = 'PAYMENT_REQUIRED'").get().count;

  return { teachersCount, studentsCount, lessonsToday, paymentsRequired };
}

module.exports = {
  login,
  getUsers,
  createUser,
  updateUser,
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  createPackage,
  completeLesson,
  deleteLesson,
  markInvoiceSent,
  calculateNextPaymentDate,
  getAllPackages,
  getAllLessons,
  getSchedules,
  setSchedules,
  getAllSchedules,
  getGlobalPaymentRequiredList,
  getNotifications,
  markNotificationRead,
  getStats
};
