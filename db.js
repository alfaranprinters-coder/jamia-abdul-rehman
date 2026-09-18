// IndexedDB Handler for Madrassah Pro Manager
// Global namespace to avoid module issues on file:// protocol

const MadrassahDB = {
    dbName: 'MadrassahProDB',
    dbVersion: 14, // Added resilient index migration for Hifz Module object stores

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const txn = event.target.transaction;
                
                if (!db.objectStoreNames.contains('students')) {
                    db.createObjectStore('students', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('teachers')) {
                    db.createObjectStore('teachers', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('books')) {
                    db.createObjectStore('books', { keyPath: 'id', autoIncrement: true });
                }
                // Syllabus Store
                if (!db.objectStoreNames.contains('syllabus')) {
                    db.createObjectStore('syllabus', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('fees')) {
                    const feeStore = db.createObjectStore('fees', { keyPath: 'id', autoIncrement: true });
                    feeStore.createIndex('studentId', 'studentId', { unique: false });
                } else {
                    const feeStore = txn.objectStore('fees');
                    if (!feeStore.indexNames.contains('studentId')) {
                        feeStore.createIndex('studentId', 'studentId', { unique: false });
                    }
                }
                // Salary Store
                if (!db.objectStoreNames.contains('salaries')) {
                    db.createObjectStore('salaries', { keyPath: 'id', autoIncrement: true });
                }
                // Advances Store
                if (!db.objectStoreNames.contains('advances')) {
                    db.createObjectStore('advances', { keyPath: 'id', autoIncrement: true });
                }
                // Accounts Store
                if (!db.objectStoreNames.contains('accounts')) {
                    db.createObjectStore('accounts', { keyPath: 'id', autoIncrement: true });
                }
                // Attendance Store
                if (!db.objectStoreNames.contains('attendance')) {
                    const attStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
                    attStore.createIndex('date', 'date', { unique: false });
                }
                // Exams Store
                if (!db.objectStoreNames.contains('exams')) {
                    db.createObjectStore('exams', { keyPath: 'id', autoIncrement: true });
                }
                // Results Store
                if (!db.objectStoreNames.contains('results')) {
                    const resStore = db.createObjectStore('results', { keyPath: 'id', autoIncrement: true });
                    resStore.createIndex('examId', 'examId', { unique: false });
                    resStore.createIndex('studentId', 'studentId', { unique: false });
                }
                // Settings Store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // --- Hifz Module Stores (Version 13/14) ---
                if (!db.objectStoreNames.contains('hifz_enrollments')) {
                    const hEnroll = db.createObjectStore('hifz_enrollments', { keyPath: 'id', autoIncrement: true });
                    hEnroll.createIndex('studentId', 'studentId', { unique: true });
                    hEnroll.createIndex('teacherId', 'teacherId', { unique: false });
                    hEnroll.createIndex('halaqa', 'halaqa', { unique: false });
                    hEnroll.createIndex('status', 'status', { unique: false });
                } else {
                    const hEnroll = txn.objectStore('hifz_enrollments');
                    if (!hEnroll.indexNames.contains('studentId')) hEnroll.createIndex('studentId', 'studentId', { unique: false });
                }
                if (!db.objectStoreNames.contains('hifz_halaqas')) {
                    const hHalaqa = db.createObjectStore('hifz_halaqas', { keyPath: 'id', autoIncrement: true });
                    hHalaqa.createIndex('name', 'name', { unique: false });
                }
                if (!db.objectStoreNames.contains('hifz_daily_records')) {
                    const hDaily = db.createObjectStore('hifz_daily_records', { keyPath: 'id', autoIncrement: true });
                    hDaily.createIndex('studentId', 'studentId', { unique: false });
                    hDaily.createIndex('date', 'date', { unique: false });
                    hDaily.createIndex('teacherId', 'teacherId', { unique: false });
                    hDaily.createIndex('halaqa', 'halaqa', { unique: false });
                } else {
                    const hDaily = txn.objectStore('hifz_daily_records');
                    if (!hDaily.indexNames.contains('studentId')) hDaily.createIndex('studentId', 'studentId', { unique: false });
                }
                if (!db.objectStoreNames.contains('hifz_revisions')) {
                    const hRev = db.createObjectStore('hifz_revisions', { keyPath: 'id', autoIncrement: true });
                    hRev.createIndex('studentId', 'studentId', { unique: false });
                    hRev.createIndex('date', 'date', { unique: false });
                } else {
                    const hRev = txn.objectStore('hifz_revisions');
                    if (!hRev.indexNames.contains('studentId')) hRev.createIndex('studentId', 'studentId', { unique: false });
                }
                if (!db.objectStoreNames.contains('hifz_exams')) {
                    const hExam = db.createObjectStore('hifz_exams', { keyPath: 'id', autoIncrement: true });
                    hExam.createIndex('date', 'date', { unique: false });
                }
                if (!db.objectStoreNames.contains('hifz_exam_results')) {
                    const hRes = db.createObjectStore('hifz_exam_results', { keyPath: 'id', autoIncrement: true });
                    hRes.createIndex('examId', 'examId', { unique: false });
                    hRes.createIndex('studentId', 'studentId', { unique: false });
                } else {
                    const hRes = txn.objectStore('hifz_exam_results');
                    if (!hRes.indexNames.contains('examId')) hRes.createIndex('examId', 'examId', { unique: false });
                    if (!hRes.indexNames.contains('studentId')) hRes.createIndex('studentId', 'studentId', { unique: false });
                }
                if (!db.objectStoreNames.contains('hifz_juz_progress')) {
                    const hJuz = db.createObjectStore('hifz_juz_progress', { keyPath: 'id', autoIncrement: true });
                    hJuz.createIndex('studentId', 'studentId', { unique: false });
                    hJuz.createIndex('studentJuz', ['studentId', 'juzNumber'], { unique: true });
                } else {
                    const hJuz = txn.objectStore('hifz_juz_progress');
                    if (!hJuz.indexNames.contains('studentId')) hJuz.createIndex('studentId', 'studentId', { unique: false });
                }
                if (!db.objectStoreNames.contains('hifz_completions')) {
                    const hComp = db.createObjectStore('hifz_completions', { keyPath: 'id', autoIncrement: true });
                    hComp.createIndex('studentId', 'studentId', { unique: true });
                } else {
                    const hComp = txn.objectStore('hifz_completions');
                    if (!hComp.indexNames.contains('studentId')) hComp.createIndex('studentId', 'studentId', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => reject(event.target.error);
        });
    },

    // Standard CRUD for syllabus
    saveSyllabusBook(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syllabus'], 'readwrite');
            const store = transaction.objectStore('syllabus');
            const request = data.id ? store.put(data) : store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    getAllSyllabusBooks() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syllabus'], 'readonly');
            const store = transaction.objectStore('syllabus');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    deleteSyllabusBook(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syllabus'], 'readwrite');
            const store = transaction.objectStore('syllabus');
            const request = store.delete(parseInt(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.target.error);
        });
    },

    // Existing methods kept...
    saveStudent(data) { 
        return new Promise((resolve, reject) => { 
            const transaction = this.db.transaction(['students'], 'readwrite'); 
            const store = transaction.objectStore('students'); 
            if (data.id && !data.uniqueCode) {
                data.uniqueCode = 'STU-' + (1000 + parseInt(data.id));
            }
            const request = data.id ? store.put(data) : store.add(data); 
            request.onsuccess = () => {
                const insertedId = request.result;
                if (!data.id && insertedId) {
                    data.id = insertedId;
                    if (!data.uniqueCode) {
                        data.uniqueCode = 'STU-' + (1000 + parseInt(insertedId));
                        try {
                            const updateTx = this.db.transaction(['students'], 'readwrite');
                            updateTx.objectStore('students').put(data);
                        } catch(err) { console.warn('Could not update student uniqueCode immediately', err); }
                    }
                }
                resolve(insertedId);
            }; 
            request.onerror = () => reject(request.target.error); 
        }); 
    },
    getAllStudents(section) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['students'], 'readonly'); const store = transaction.objectStore('students'); const request = store.getAll(); request.onsuccess = () => { const students = request.result.filter(s => s.section === section); resolve(students); }; request.onerror = () => reject(request.target.error); }); },
    getAllStudentsAllSections() { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['students'], 'readonly'); const store = transaction.objectStore('students'); const request = store.getAll(); request.onsuccess = () => resolve(request.result || []); request.onerror = () => reject(request.target.error); }); },
    getStudentById(id) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['students'], 'readonly'); const store = transaction.objectStore('students'); const request = store.get(parseInt(id)); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.target.error); }); },
    deleteStudent(id) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['students'], 'readwrite'); const store = transaction.objectStore('students'); const request = store.delete(parseInt(id)); request.onsuccess = () => resolve(); request.onerror = () => reject(request.target.error); }); },
    saveTeacher(data) { 
        return new Promise((resolve, reject) => { 
            const transaction = this.db.transaction(['teachers'], 'readwrite'); 
            const store = transaction.objectStore('teachers'); 
            if (data.id && !data.uniqueCode) {
                data.uniqueCode = 'EMP-' + (100 + parseInt(data.id));
            }
            const request = data.id ? store.put(data) : store.add(data); 
            request.onsuccess = () => {
                const insertedId = request.result;
                if (!data.id && insertedId) {
                    data.id = insertedId;
                    if (!data.uniqueCode) {
                        data.uniqueCode = 'EMP-' + (100 + parseInt(insertedId));
                        try {
                            const updateTx = this.db.transaction(['teachers'], 'readwrite');
                            updateTx.objectStore('teachers').put(data);
                        } catch(err) { console.warn('Could not update teacher uniqueCode immediately', err); }
                    }
                }
                resolve(insertedId);
            }; 
            request.onerror = () => reject(request.target.error); 
        }); 
    },
    getAllTeachers() { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['teachers'], 'readonly'); const store = transaction.objectStore('teachers'); const request = store.getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.target.error); }); },
    getTeacherById(id) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['teachers'], 'readonly'); const store = transaction.objectStore('teachers'); const request = store.get(parseInt(id)); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.target.error); }); },
    deleteTeacher(id) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['teachers'], 'readwrite'); const store = transaction.objectStore('teachers'); const request = store.delete(parseInt(id)); request.onsuccess = () => resolve(); request.onerror = () => reject(request.target.error); }); },
    saveBook(data) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['books'], 'readwrite'); const store = transaction.objectStore('books'); const request = data.id ? store.put(data) : store.add(data); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.target.error); }); },
    getAllBooks() { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['books'], 'readonly'); const store = transaction.objectStore('books'); const request = store.getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.target.error); }); },
    deleteBook(id) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['books'], 'readwrite'); const store = transaction.objectStore('books'); const request = store.delete(parseInt(id)); request.onsuccess = () => resolve(); request.onerror = () => reject(request.target.error); }); },

    // Fee Methods
    saveFee(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['fees'], 'readwrite');
            const store = transaction.objectStore('fees');
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    getFeeById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['fees'], 'readonly');
            const store = transaction.objectStore('fees');
            const request = store.get(parseInt(id));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    deleteFee(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['fees'], 'readwrite');
            const store = transaction.objectStore('fees');
            const request = store.delete(parseInt(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.target.error);
        });
    },

    getStudentFees(studentId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['fees'], 'readonly');
            const store = transaction.objectStore('fees');
            const index = store.index('studentId');
            const request = index.getAll(parseInt(studentId));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },
    
    // --- Payroll Methods ---
    saveSalary(data) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['salaries'], 'readwrite'); const store = transaction.objectStore('salaries'); const request = store.add(data); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.target.error); }); },
    getAllSalaries() { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['salaries'], 'readonly'); const store = transaction.objectStore('salaries'); const request = store.getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.target.error); }); },
    getSalariesByMonth(month, year) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['salaries'], 'readonly'); const store = transaction.objectStore('salaries'); const request = store.getAll(); request.onsuccess = () => resolve(request.result.filter(s => s.month === month && s.year === parseInt(year))); request.onerror = () => reject(request.target.error); }); },
    
    saveAdvance(data) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['advances'], 'readwrite'); const store = transaction.objectStore('advances'); const request = store.add(data); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.target.error); }); },
    getStaffAdvances(staffId) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['advances'], 'readonly'); const store = transaction.objectStore('advances'); const request = store.getAll(); request.onsuccess = () => resolve(request.result.filter(a => a.staffId === parseInt(staffId))); request.onerror = () => reject(request.target.error); }); },
    updateAdvanceStatus(id, status) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['advances'], 'readwrite');
            const store = transaction.objectStore('advances');
            const getRequest = store.get(parseInt(id));
            getRequest.onsuccess = () => {
                const data = getRequest.result;
                if (data) {
                    data.status = status;
                    store.put(data).onsuccess = () => resolve();
                } else reject('Advance not found');
            };
        });
    },

    // --- Accounts Methods ---
    saveTransaction(data) { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['accounts'], 'readwrite'); const store = transaction.objectStore('accounts'); const request = data.id ? store.put(data) : store.add(data); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.target.error); }); },
    getAllTransactions() { return new Promise((resolve, reject) => { const transaction = this.db.transaction(['accounts'], 'readonly'); const store = transaction.objectStore('accounts'); const request = store.getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.target.error); }); },

    deleteTransaction(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['accounts'], 'readwrite');
            const store = transaction.objectStore('accounts');
            const request = store.delete(parseInt(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.target.error);
        });
    },

    deleteTransactionByReceipt(receiptNo) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['accounts'], 'readwrite');
            const store = transaction.objectStore('accounts');
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result.filter(t => t.receiptNo === receiptNo);
                const deletePromises = results.map(t => {
                    const req = store.delete(t.id);
                    return new Promise((res) => req.onsuccess = res);
                });
                Promise.all(deletePromises).then(() => resolve()).catch(err => reject(err));
            };
            request.onerror = () => reject(request.target.error);
        });
    },

    // --- Attendance Methods ---
    saveAttendance(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readwrite');
            const store = transaction.objectStore('attendance');
            // Check if record exists for this person/date/type and section
            const request = store.getAll();
            request.onsuccess = () => {
                const existing = request.result.find(r => 
                    r.personId === data.personId && 
                    r.date === data.date && 
                    r.type === data.type &&
                    (r.type !== 'student' || !data.section || !r.section || r.section === data.section)
                );
                if (existing) data.id = existing.id;
                const saveReq = data.id ? store.put(data) : store.add(data);
                saveReq.onsuccess = () => resolve(saveReq.result);
                saveReq.onerror = () => reject(saveReq.target.error);
            };
        });
    },

    getAttendance(type, date, section) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const index = store.index('date');
            const request = index.getAll(date);
            request.onsuccess = () => {
                let results = request.result.filter(r => r.type === type);
                if (type === 'student' && section) {
                    results = results.filter(r => r.section === section || !r.section);
                }
                resolve(results);
            };
            request.onerror = () => reject(request.target.error);
        });
    },

    getAttendanceByMonth(type, month, section) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const request = store.getAll();
            request.onsuccess = () => {
                let results = request.result.filter(r => r.type === type && r.date.startsWith(month));
                if (type === 'student' && section) {
                    results = results.filter(r => r.section === section || !r.section);
                }
                resolve(results);
            };
            request.onerror = () => reject(request.target.error);
        });
    },

    getPersonAttendance(personId, type) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const request = store.getAll();
            request.onsuccess = () => {
                const pid = parseInt(personId);
                let results = request.result.filter(r => 
                    parseInt(r.personId) === pid && 
                    (!type || r.type === type)
                );
                results.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                resolve(results);
            };
            request.onerror = () => reject(request.target.error);
        });
    },

    async ensureUniqueCodes() {
        try {
            const allStudents = await this.getAllStudentsAllSections();
            if (allStudents && allStudents.length > 0) {
                const tx = this.db.transaction(['students'], 'readwrite');
                const store = tx.objectStore('students');
                for (const s of allStudents) {
                    if (!s.uniqueCode && s.id) {
                        s.uniqueCode = 'STU-' + (1000 + parseInt(s.id));
                        store.put(s);
                    }
                }
            }
        } catch (e) {
            console.warn('ensureUniqueCodes students error:', e);
        }

        try {
            const allTeachers = await this.getAllTeachers();
            if (allTeachers && allTeachers.length > 0) {
                const tx = this.db.transaction(['teachers'], 'readwrite');
                const store = tx.objectStore('teachers');
                for (const t of allTeachers) {
                    if (!t.uniqueCode && t.id) {
                        t.uniqueCode = 'EMP-' + (100 + parseInt(t.id));
                        store.put(t);
                    }
                }
            }
        } catch (e) {
            console.warn('ensureUniqueCodes teachers error:', e);
        }
    },

    // --- Exam & Results Methods ---
    saveExam(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['exams'], 'readwrite');
            const store = transaction.objectStore('exams');
            const request = data.id ? store.put(data) : store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    getAllExams() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['exams'], 'readonly');
            const store = transaction.objectStore('exams');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    getExamById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['exams'], 'readonly');
            const store = transaction.objectStore('exams');
            const request = store.get(parseInt(id));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    deleteExam(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['exams'], 'readwrite');
            const store = transaction.objectStore('exams');
            const request = store.delete(parseInt(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.target.error);
        });
    },

    saveResult(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['results'], 'readwrite');
            const store = transaction.objectStore('results');
            // Check if result exists for this student/exam and update if so
            const index = store.index('examId');
            const request = index.getAll(parseInt(data.examId));
            request.onsuccess = () => {
                const existing = request.result.find(r => r.studentId === parseInt(data.studentId));
                if (existing) data.id = existing.id;
                const saveReq = data.id ? store.put(data) : store.add(data);
                saveReq.onsuccess = () => resolve(saveReq.result);
                saveReq.onerror = () => reject(saveReq.target.error);
            };
        });
    },

    getExamResults(examId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['results'], 'readonly');
            const store = transaction.objectStore('results');
            const index = store.index('examId');
            const request = index.getAll(parseInt(examId));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    getStudentResults(studentId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['results'], 'readonly');
            const store = transaction.objectStore('results');
            const index = store.index('studentId');
            const request = index.getAll(parseInt(studentId));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    saveSetting(key, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            const request = store.put({ key, value });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.target.error);
        });
    },

    getSetting(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result ? request.result.value : null);
            request.onerror = () => reject(request.target.error);
        });
    },

    // ==========================================
    // --- HIFZ MANAGEMENT MODULE METHODS ---
    // ==========================================

    // --- Hifz Enrollments ---
    saveHifzEnrollment(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_enrollments'], 'readwrite');
            const store = transaction.objectStore('hifz_enrollments');
            if (data.studentId) data.studentId = parseInt(data.studentId);
            if (data.teacherId) data.teacherId = parseInt(data.teacherId);
            if (data.currentJuz) data.currentJuz = parseInt(data.currentJuz);
            if (data.currentPage) data.currentPage = parseInt(data.currentPage);
            if (!data.id) delete data.id;

            const processSave = (existing) => {
                if (existing && !data.id) {
                    data.id = existing.id;
                }
                const saveReq = data.id ? store.put(data) : store.add(data);
                saveReq.onsuccess = () => resolve(saveReq.result);
                saveReq.onerror = () => reject(saveReq.target.error);
            };

            if (store.indexNames && store.indexNames.contains('studentId')) {
                const index = store.index('studentId');
                const checkReq = index.get(data.studentId);
                checkReq.onsuccess = () => processSave(checkReq.result);
                checkReq.onerror = () => reject(checkReq.target.error);
            } else {
                const checkReq = store.getAll();
                checkReq.onsuccess = () => {
                    const existing = (checkReq.result || []).find(r => r.studentId === data.studentId);
                    processSave(existing);
                };
                checkReq.onerror = () => reject(checkReq.target.error);
            }
        });
    },

    getAllHifzEnrollments() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_enrollments'], 'readonly');
            const store = transaction.objectStore('hifz_enrollments');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.target.error);
        });
    },

    getHifzEnrollmentByStudentId(studentId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_enrollments'], 'readonly');
            const store = transaction.objectStore('hifz_enrollments');
            const targetId = parseInt(studentId);
            if (store.indexNames && store.indexNames.contains('studentId')) {
                const index = store.index('studentId');
                const request = index.get(targetId);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.target.error);
            } else {
                const request = store.getAll();
                request.onsuccess = () => {
                    const match = (request.result || []).find(r => r.studentId === targetId);
                    resolve(match || null);
                };
                request.onerror = () => reject(request.target.error);
            }
        });
    },

    deleteHifzEnrollment(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_enrollments'], 'readwrite');
            const store = transaction.objectStore('hifz_enrollments');
            const request = store.delete(parseInt(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.target.error);
        });
    },

    // --- Hifz Halaqas ---
    saveHifzHalaqa(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_halaqas'], 'readwrite');
            const store = transaction.objectStore('hifz_halaqas');
            if (data.teacherId) data.teacherId = parseInt(data.teacherId);
            const request = data.id ? store.put(data) : store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    getAllHifzHalaqas() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_halaqas'], 'readonly');
            const store = transaction.objectStore('hifz_halaqas');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.target.error);
        });
    },

    deleteHifzHalaqa(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_halaqas'], 'readwrite');
            const store = transaction.objectStore('hifz_halaqas');
            const request = store.delete(parseInt(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.target.error);
        });
    },

    // --- Hifz Daily Records (Sabaq, Sabqi, Manzil) ---
    saveHifzDailyRecord(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_daily_records'], 'readwrite');
            const store = transaction.objectStore('hifz_daily_records');
            if (data.studentId) data.studentId = parseInt(data.studentId);
            if (data.teacherId) data.teacherId = parseInt(data.teacherId);
            if (!data.id) delete data.id;

            const processSave = (records) => {
                const existing = (records || []).find(r => r.date === data.date && r.studentId === data.studentId);
                if (existing && !data.id) {
                    data.id = existing.id;
                }
                const saveReq = data.id ? store.put(data) : store.add(data);
                saveReq.onsuccess = () => resolve(saveReq.result);
                saveReq.onerror = () => reject(saveReq.target.error);
            };

            if (store.indexNames && store.indexNames.contains('studentId')) {
                const index = store.index('studentId');
                const req = index.getAll(data.studentId);
                req.onsuccess = () => processSave(req.result);
                req.onerror = () => reject(req.target.error);
            } else {
                const req = store.getAll();
                req.onsuccess = () => processSave(req.result);
                req.onerror = () => reject(req.target.error);
            }
        });
    },

    saveHifzDailyRecordsBatch(records) {
        return new Promise((resolve, reject) => {
            if (!records || records.length === 0) return resolve([]);
            const transaction = this.db.transaction(['hifz_daily_records'], 'readwrite');
            const store = transaction.objectStore('hifz_daily_records');
            const getReq = store.getAll();

            getReq.onsuccess = () => {
                const existingAll = getReq.result || [];
                const promises = records.map(r => {
                    if (r.studentId) r.studentId = parseInt(r.studentId);
                    if (r.teacherId) r.teacherId = parseInt(r.teacherId);
                    if (!r.id) delete r.id;
                    const match = existingAll.find(ex => ex.studentId === r.studentId && ex.date === r.date);
                    if (match && !r.id) r.id = match.id;
                    return new Promise((res, rej) => {
                        const req = r.id ? store.put(r) : store.add(r);
                        req.onsuccess = () => res(req.result);
                        req.onerror = () => rej(req.target.error);
                    });
                });
                Promise.all(promises).then(resolve).catch(reject);
            };
            getReq.onerror = () => reject(getReq.target.error);
        });
    },

    getAllHifzDailyRecords() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_daily_records'], 'readonly');
            const store = transaction.objectStore('hifz_daily_records');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.target.error);
        });
    },

    getStudentDailyRecords(studentId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_daily_records'], 'readonly');
            const store = transaction.objectStore('hifz_daily_records');
            const targetId = parseInt(studentId);
            const processRecords = (allRecords) => {
                const records = (allRecords || []).filter(r => r.studentId === targetId);
                records.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(records);
            };

            if (store.indexNames && store.indexNames.contains('studentId')) {
                const index = store.index('studentId');
                const request = index.getAll(targetId);
                request.onsuccess = () => processRecords(request.result);
                request.onerror = () => reject(request.target.error);
            } else {
                const request = store.getAll();
                request.onsuccess = () => processRecords(request.result);
                request.onerror = () => reject(request.target.error);
            }
        });
    },

    deleteHifzDailyRecord(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_daily_records'], 'readwrite');
            const store = transaction.objectStore('hifz_daily_records');
            const request = store.delete(parseInt(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.target.error);
        });
    },

    // --- Hifz Revisions ---
    saveHifzRevision(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_revisions'], 'readwrite');
            const store = transaction.objectStore('hifz_revisions');
            if (data.studentId) data.studentId = parseInt(data.studentId);
            if (!data.id) delete data.id;
            const request = data.id ? store.put(data) : store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    getAllHifzRevisions() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_revisions'], 'readonly');
            const store = transaction.objectStore('hifz_revisions');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.target.error);
        });
    },

    getStudentRevisions(studentId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_revisions'], 'readonly');
            const store = transaction.objectStore('hifz_revisions');
            const targetId = parseInt(studentId);
            const processRevs = (allRevs) => {
                const revs = (allRevs || []).filter(r => r.studentId === targetId);
                revs.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(revs);
            };

            if (store.indexNames && store.indexNames.contains('studentId')) {
                const index = store.index('studentId');
                const request = index.getAll(targetId);
                request.onsuccess = () => processRevs(request.result);
                request.onerror = () => reject(request.target.error);
            } else {
                const request = store.getAll();
                request.onsuccess = () => processRevs(request.result);
                request.onerror = () => reject(request.target.error);
            }
        });
    },

    deleteHifzRevision(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_revisions'], 'readwrite');
            const store = transaction.objectStore('hifz_revisions');
            const request = store.delete(parseInt(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.target.error);
        });
    },

    // --- 30 Juz Progress Tracking ---
    saveHifzJuzProgress(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_juz_progress'], 'readwrite');
            const store = transaction.objectStore('hifz_juz_progress');
            if (data.studentId) data.studentId = parseInt(data.studentId);
            if (data.juzNumber) data.juzNumber = parseInt(data.juzNumber);
            if (!data.id) delete data.id;

            const processSave = (list) => {
                const existing = (list || []).find(r => r.studentId === data.studentId && r.juzNumber === data.juzNumber);
                if (existing && !data.id) {
                    data.id = existing.id;
                }
                const saveReq = data.id ? store.put(data) : store.add(data);
                saveReq.onsuccess = () => resolve(saveReq.result);
                saveReq.onerror = () => reject(saveReq.target.error);
            };

            if (store.indexNames && store.indexNames.contains('studentId')) {
                const index = store.index('studentId');
                const req = index.getAll(data.studentId);
                req.onsuccess = () => processSave(req.result);
                req.onerror = () => reject(req.target.error);
            } else {
                const req = store.getAll();
                req.onsuccess = () => processSave(req.result);
                req.onerror = () => reject(req.target.error);
            }
        });
    },

    getStudentJuzProgress(studentId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_juz_progress'], 'readonly');
            const store = transaction.objectStore('hifz_juz_progress');
            const targetId = parseInt(studentId);

            const processList = (list) => {
                const progressMap = {};
                const studentList = (list || []).filter(r => r.studentId === targetId);
                for (let j = 1; j <= 30; j++) {
                    const match = studentList.find(item => item.juzNumber === j);
                    progressMap[j] = match || {
                        studentId: targetId,
                        juzNumber: j,
                        status: 'not_started',
                        completedDate: null,
                        revisionCount: 0,
                        notes: ''
                    };
                }
                resolve(progressMap);
            };

            if (store.indexNames && store.indexNames.contains('studentId')) {
                const index = store.index('studentId');
                const request = index.getAll(targetId);
                request.onsuccess = () => processList(request.result);
                request.onerror = () => reject(request.target.error);
            } else {
                const request = store.getAll();
                request.onsuccess = () => processList(request.result);
                request.onerror = () => reject(request.target.error);
            }
        });
    },

    // --- Hifz Exams & Results ---
    saveHifzExam(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_exams'], 'readwrite');
            const store = transaction.objectStore('hifz_exams');
            if (data.examinerTeacherId) data.examinerTeacherId = parseInt(data.examinerTeacherId);
            if (!data.id) delete data.id;
            const request = data.id ? store.put(data) : store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    getAllHifzExams() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_exams'], 'readonly');
            const store = transaction.objectStore('hifz_exams');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.target.error);
        });
    },

    getHifzExamById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_exams'], 'readonly');
            const store = transaction.objectStore('hifz_exams');
            const request = store.get(parseInt(id));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.target.error);
        });
    },

    deleteHifzExam(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_exams'], 'readwrite');
            const store = transaction.objectStore('hifz_exams');
            const request = store.delete(parseInt(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.target.error);
        });
    },

    saveHifzExamResult(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_exam_results'], 'readwrite');
            const store = transaction.objectStore('hifz_exam_results');
            if (data.examId) data.examId = parseInt(data.examId);
            if (data.studentId) data.studentId = parseInt(data.studentId);
            if (!data.id) delete data.id;

            const processSave = (list) => {
                const existing = (list || []).find(r => r.studentId === data.studentId && r.examId === data.examId);
                if (existing && !data.id) data.id = existing.id;
                const saveReq = data.id ? store.put(data) : store.add(data);
                saveReq.onsuccess = () => resolve(saveReq.result);
                saveReq.onerror = () => reject(saveReq.target.error);
            };

            if (store.indexNames && store.indexNames.contains('examId')) {
                const index = store.index('examId');
                const req = index.getAll(data.examId);
                req.onsuccess = () => processSave(req.result);
                req.onerror = () => reject(req.target.error);
            } else {
                const req = store.getAll();
                req.onsuccess = () => processSave(req.result);
                req.onerror = () => reject(req.target.error);
            }
        });
    },

    getHifzExamResults(examId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_exam_results'], 'readonly');
            const store = transaction.objectStore('hifz_exam_results');
            const targetId = parseInt(examId);

            if (store.indexNames && store.indexNames.contains('examId')) {
                const index = store.index('examId');
                const request = index.getAll(targetId);
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.target.error);
            } else {
                const request = store.getAll();
                request.onsuccess = () => {
                    const list = (request.result || []).filter(r => r.examId === targetId);
                    resolve(list);
                };
                request.onerror = () => reject(request.target.error);
            }
        });
    },

    getStudentHifzResults(studentId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_exam_results'], 'readonly');
            const store = transaction.objectStore('hifz_exam_results');
            const targetId = parseInt(studentId);

            if (store.indexNames && store.indexNames.contains('studentId')) {
                const index = store.index('studentId');
                const request = index.getAll(targetId);
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.target.error);
            } else {
                const request = store.getAll();
                request.onsuccess = () => {
                    const list = (request.result || []).filter(r => r.studentId === targetId);
                    resolve(list);
                };
                request.onerror = () => reject(request.target.error);
            }
        });
    },

    // --- Hifz Completion & Certificates ---
    saveHifzCompletion(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_completions'], 'readwrite');
            const store = transaction.objectStore('hifz_completions');
            if (data.studentId) data.studentId = parseInt(data.studentId);
            if (data.teacherId) data.teacherId = parseInt(data.teacherId);
            if (!data.id) delete data.id;

            const processSave = (existing) => {
                if (existing && !data.id) data.id = existing.id;
                const saveReq = data.id ? store.put(data) : store.add(data);
                saveReq.onsuccess = () => resolve(saveReq.result);
                saveReq.onerror = () => reject(saveReq.target.error);
            };

            if (store.indexNames && store.indexNames.contains('studentId')) {
                const index = store.index('studentId');
                const req = index.get(data.studentId);
                req.onsuccess = () => processSave(req.result);
                req.onerror = () => reject(req.target.error);
            } else {
                const req = store.getAll();
                req.onsuccess = () => {
                    const existing = (req.result || []).find(r => r.studentId === data.studentId);
                    processSave(existing);
                };
                req.onerror = () => reject(req.target.error);
            }
        });
    },

    getAllHifzCompletions() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_completions'], 'readonly');
            const store = transaction.objectStore('hifz_completions');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.target.error);
        });
    },

    getHifzCompletionByStudentId(studentId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_completions'], 'readonly');
            const store = transaction.objectStore('hifz_completions');
            const targetId = parseInt(studentId);

            if (store.indexNames && store.indexNames.contains('studentId')) {
                const index = store.index('studentId');
                const request = index.get(targetId);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.target.error);
            } else {
                const request = store.getAll();
                request.onsuccess = () => {
                    const match = (request.result || []).find(r => r.studentId === targetId);
                    resolve(match || null);
                };
                request.onerror = () => reject(request.target.error);
            }
        });
    },

    deleteHifzCompletion(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['hifz_completions'], 'readwrite');
            const store = transaction.objectStore('hifz_completions');
            const request = store.delete(parseInt(id));
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.target.error);
        });
    },

    // ==========================================
    // --- FULL DATABASE BACKUP & RESTORE ---
    // ==========================================
    async exportDatabaseBackup() {
        const storeNames = Array.from(this.db.objectStoreNames);
        const backup = {
            appName: 'Madrassah Pro Manager',
            exportedAt: new Date().toISOString(),
            dbVersion: this.dbVersion,
            data: {}
        };

        for (const storeName of storeNames) {
            backup.data[storeName] = await new Promise((resolve, reject) => {
                const tx = this.db.transaction([storeName], 'readonly');
                const store = tx.objectStore(storeName);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.target.error);
            });
        }
        return backup;
    },

    async importDatabaseBackup(backup) {
        if (!backup || !backup.data) throw new Error('ناموزوں بیک اپ فائل (Invalid backup file)');
        const storeNames = Object.keys(backup.data);

        for (const storeName of storeNames) {
            if (!this.db.objectStoreNames.contains(storeName)) continue;
            const records = backup.data[storeName];
            if (!Array.isArray(records)) continue;

            await new Promise((resolve, reject) => {
                const tx = this.db.transaction([storeName], 'readwrite');
                const store = tx.objectStore(storeName);
                store.clear().onsuccess = () => {
                    let count = 0;
                    if (records.length === 0) return resolve();
                    records.forEach(item => {
                        store.put(item).onsuccess = () => {
                            count++;
                            if (count === records.length) resolve();
                        };
                    });
                };
                tx.onerror = () => reject(tx.error);
            });
        }
        return true;
    },

    async getBackupLogs() {
        const logs = await this.getSetting('backup_history_log');
        return Array.isArray(logs) ? logs : [];
    },

    async addBackupLog(entry) {
        const logs = await this.getBackupLogs();
        logs.unshift(entry);
        if (logs.length > 15) logs.length = 15;
        await this.saveSetting('backup_history_log', logs);
        return logs;
    }
};

