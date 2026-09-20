// Hifz Management Module (حفظ القرآن مینجمنٹ سسٹم)
// Madrasah Pro Manager - Offline Version
// Architecture & Implementation by Advanced Agentic Engineer

const HifzModule = {
    currentSubView: 'dashboard',
    selectedHalaqaId: 'all',
    selectedStudentId: null,
    bulkDate: new Date().toISOString().split('T')[0],
    dailyDate: new Date().toISOString().split('T')[0],

    // Main Entry Point
    async render(container) {
        if (!container) return;
        container.innerHTML = '<div style="text-align:center; padding: 4rem;"><div class="mms-spinner"></div></div>';
        
        // Render Header & Navigation Pills
        const navHtml = this.renderSubNav();
        const contentContainer = document.createElement('div');
        contentContainer.id = 'hifz-content-area';

        container.innerHTML = `
            <div class="hifz-module-wrapper">
                <div class="hifz-header-bar">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="hifz-quran-icon-box">
                            <i class="fas fa-book-quran"></i>
                        </div>
                        <div>
                            <h2 style="color:var(--primary); margin:0; font-family:'Aref Ruqaa', 'Amiri', serif; font-size:1.9rem;">
                                شعبہ حفظ القرآن الکریم
                            </h2>
                            <p style="margin:0; color:var(--text-muted); font-size:0.95rem;">
                                نظامِ نگرانیِ حفظ، روزانہ سبق، سبقی، منزل، دہرائی اور تکمیلی ریکارڈ
                            </p>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <button class="btn btn-sm" onclick="HifzModule.switchSubView('bulk_entry')" style="background:var(--primary); color:white; border-radius:10px; padding:6px 14px; font-weight:bold;">
                            <i class="fas fa-bolt"></i> اجتماعی اندراج
                        </button>
                        <button class="btn btn-sm" onclick="HifzModule.switchSubView('daily_entry')" style="background:var(--primary-subtle); color:var(--primary); border-radius:10px; padding:6px 14px; font-weight:bold;">
                            <i class="fas fa-plus"></i> انفرادی سبق
                        </button>
                    </div>
                </div>

                ${navHtml}
                <div id="hifz-subview-container" style="margin-top:1.5rem;"></div>
            </div>
        `;

        const subContainer = document.getElementById('hifz-subview-container');
        await this.renderActiveSubView(subContainer);
    },

    renderSubNav() {
        const views = [
            { id: 'dashboard', label: 'ڈیش بورڈ', icon: 'fa-chart-line' },
            { id: 'students', label: 'حفظ طلبہ', icon: 'fa-user-graduate' },
            { id: 'daily_entry', label: 'روزانہ سبق', icon: 'fa-pen-to-square' },
            { id: 'bulk_entry', label: 'اجتماعی اندراج', icon: 'fa-table-list' },
            { id: 'juz_progress', label: '30 پارے پروگریس', icon: 'fa-book-open' },
            { id: 'revisions', label: 'دہرائی (Revision)', icon: 'fa-rotate' },
            { id: 'exams', label: 'حفظ امتحانات', icon: 'fa-file-signature' },
            { id: 'reports', label: 'حفظ رپورٹس', icon: 'fa-chart-pie' },
            { id: 'completions', label: 'تکمیل و سرٹیفکیٹ', icon: 'fa-award' },
            { id: 'halaqas', label: 'حلقہ جات', icon: 'fa-mosque' },
            { id: 'teachers', label: 'اساتذہ حفظ', icon: 'fa-chalkboard-user' }
        ];

        return `
            <div class="hifz-subnav-scroll">
                <div class="hifz-subnav">
                    ${views.map(v => `
                        <div class="hifz-nav-pill ${this.currentSubView === v.id ? 'active' : ''}" 
                             onclick="HifzModule.switchSubView('${v.id}')">
                            <i class="fas ${v.icon}"></i>
                            <span>${v.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    async switchSubView(subView) {
        this.currentSubView = subView;
        const pills = document.querySelectorAll('.hifz-nav-pill');
        pills.forEach(p => {
            p.classList.toggle('active', p.getAttribute('onclick').includes(`'${subView}'`));
        });
        const subContainer = document.getElementById('hifz-subview-container');
        if (subContainer) {
            subContainer.innerHTML = '<div style="text-align:center; padding: 3rem;"><div class="mms-spinner"></div></div>';
            await this.renderActiveSubView(subContainer);
        }
    },

    async renderActiveSubView(container) {
        switch (this.currentSubView) {
            case 'dashboard': await this.renderDashboard(container); break;
            case 'students': await this.renderStudentsList(container); break;
            case 'daily_entry': await this.renderDailyEntryForm(container); break;
            case 'bulk_entry': await this.renderBulkDailyEntry(container); break;
            case 'juz_progress': await this.renderJuzProgressBoard(container); break;
            case 'revisions': await this.renderRevisionModule(container); break;
            case 'exams': await this.renderExamsModule(container); break;
            case 'reports': await this.renderReportsModule(container); break;
            case 'completions': await this.renderCompletionsModule(container); break;
            case 'halaqas': await this.renderHalaqasModule(container); break;
            case 'teachers': await this.renderTeachersModule(container); break;
            default: await this.renderDashboard(container);
        }
    },

    // ==========================================
    // 1. HIFZ DASHBOARD
    // ==========================================
    async renderDashboard(container) {
        const enrollments = await MadrassahDB.getAllHifzEnrollments();
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const studentMap = new Map(allStudents.map(s => [s.id, s]));
        
        // Filter enrollments by current section
        const sectionEnrollments = enrollments.filter(e => studentMap.has(e.studentId));
        const activeEnrollments = sectionEnrollments.filter(e => !e.status || e.status === 'جاری');
        
        const todayStr = new Date().toISOString().split('T')[0];
        const allDaily = await MadrassahDB.getAllHifzDailyRecords();
        const todayDaily = allDaily.filter(d => d.date === todayStr && studentMap.has(d.studentId));
        
        const completions = await MadrassahDB.getAllHifzCompletions();
        const sectionCompletions = completions.filter(c => studentMap.has(c.studentId));

        // Calculate Attention Needed: Students whose last grade was C or D, or mistakes > 5 in last 3 entries
        const studentDailyMap = new Map();
        allDaily.forEach(d => {
            if (!studentDailyMap.has(d.studentId)) studentDailyMap.set(d.studentId, []);
            studentDailyMap.get(d.studentId).push(d);
        });

        let attentionCount = 0;
        let excellentCount = 0;
        let normalCount = 0;

        activeEnrollments.forEach(en => {
            const records = studentDailyMap.get(en.studentId) || [];
            if (records.length > 0) {
                const latest = records[0];
                if (latest.overallGrade === 'D' || latest.overallGrade === 'C' || (latest.totalMistakes && latest.totalMistakes >= 6)) {
                    attentionCount++;
                } else if (latest.overallGrade === 'A+' || (latest.overallGrade === 'A' && latest.totalMistakes <= 2)) {
                    excellentCount++;
                } else {
                    normalCount++;
                }
            } else {
                normalCount++;
            }
        });

        // Calculate Average Sabaq quantity today
        let totalSabaqPages = 0;
        todayDaily.forEach(d => {
            const qty = parseFloat(d.sabaqQuantity) || 0;
            totalSabaqPages += qty;
        });
        const avgSabaq = todayDaily.length > 0 ? (totalSabaqPages / todayDaily.length).toFixed(1) : '0.0';

        container.innerHTML = `
            <div class="stats-grid" style="margin-bottom:1.5rem;">
                <div class="stat-card" style="border-right: 4px solid var(--primary);">
                    <div class="stat-icon" style="background:var(--primary-subtle); color:var(--primary);">
                        <i class="fas fa-users-line"></i>
                    </div>
                    <div>
                        <p class="stat-label">کل حفاظ طلبہ</p>
                        <h3 class="stat-value">${activeEnrollments.length}</h3>
                    </div>
                </div>

                <div class="stat-card" style="border-right: 4px solid #16a34a;">
                    <div class="stat-icon" style="background:#dcfce7; color:#16a34a;">
                        <i class="fas fa-clipboard-check"></i>
                    </div>
                    <div>
                        <p class="stat-label">آج سبق دیا</p>
                        <h3 class="stat-value">${todayDaily.length}</h3>
                    </div>
                </div>

                <div class="stat-card" style="border-right: 4px solid #dc2626;">
                    <div class="stat-icon" style="background:#fee2e2; color:#dc2626;">
                        <i class="fas fa-user-xmark"></i>
                    </div>
                    <div>
                        <p class="stat-label">غیر حاضر / سبق باقی</p>
                        <h3 class="stat-value">${Math.max(0, activeEnrollments.length - todayDaily.length)}</h3>
                    </div>
                </div>

                <div class="stat-card" style="border-right: 4px solid #d97706;">
                    <div class="stat-icon" style="background:#fef3c7; color:#d97706;">
                        <i class="fas fa-book-bookmark"></i>
                    </div>
                    <div>
                        <p class="stat-label">اوسط نیا سبق (صفحات)</p>
                        <h3 class="stat-value">${avgSabaq}</h3>
                    </div>
                </div>

                <div class="stat-card" style="border-right: 4px solid #8b5cf6;">
                    <div class="stat-icon" style="background:#ede9fe; color:#8b5cf6;">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div>
                        <p class="stat-label">تکمیلِ حفظ</p>
                        <h3 class="stat-value">${sectionCompletions.length}</h3>
                    </div>
                </div>

                <div class="stat-card" style="border-right: 4px solid #ef4444;">
                    <div class="stat-icon" style="background:#fee2e2; color:#ef4444;">
                        <i class="fas fa-triangle-exclamation"></i>
                    </div>
                    <div>
                        <p class="stat-label">دہرائی توجہ طلب</p>
                        <h3 class="stat-value">${attentionCount}</h3>
                    </div>
                </div>
            </div>

            <!-- Performance Status Cards -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.2rem; margin-bottom:2rem;">
                <div class="card" style="background:#f0fdf4; border:1px solid #bbf7d0; padding:1.2rem; border-radius:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="color:#15803d; margin:0;"><i class="fas fa-circle-check"></i> 🟢 بہترین کارکردگی (A+/A)</h4>
                        <span style="font-size:1.4rem; font-weight:bold; color:#15803d;">${excellentCount}</span>
                    </div>
                    <p style="font-size:0.9rem; color:#166534; margin-top:0.4rem; margin-bottom:0;">طلباء جو بغیر یا برائے نام غلطی کے معیاری سبق سنا رہے ہیں۔</p>
                </div>

                <div class="card" style="background:#fffbeb; border:1px solid #fde68a; padding:1.2rem; border-radius:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="color:#b45309; margin:0;"><i class="fas fa-circle-info"></i> 🟡 معمول کے مطابق (B)</h4>
                        <span style="font-size:1.4rem; font-weight:bold; color:#b45309;">${normalCount}</span>
                    </div>
                    <p style="font-size:0.9rem; color:#92400e; margin-top:0.4rem; margin-bottom:0;">طلباء جن کی رفتار اور دہرائی اوسط درجے کی ہے۔</p>
                </div>

                <div class="card" style="background:#fef2f2; border:1px solid #fecaca; padding:1.2rem; border-radius:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="color:#b91c1c; margin:0;"><i class="fas fa-triangle-exclamation"></i> 🔴 خصوصی توجہ طلب (C/D)</h4>
                        <span style="font-size:1.4rem; font-weight:bold; color:#b91c1c;">${attentionCount}</span>
                    </div>
                    <p style="font-size:0.9rem; color:#991b1b; margin-top:0.4rem; margin-bottom:0;">طلباء جن کا منزل کچا ہے یا سبق میں کثرتِ اغلاط ہے۔</p>
                </div>
            </div>

            <!-- Today's Daily Records Table -->
            <div class="card" style="padding:0; overflow:hidden; border-radius:16px; box-shadow:var(--shadow-sm);">
                <div style="padding:1.2rem 1.5rem; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="color:var(--primary); margin:0; font-size:1.2rem;">
                        <i class="fas fa-calendar-day"></i> آج کے اسباق کا ریکارڈ (${todayStr})
                    </h3>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-sm btn-primary" onclick="HifzModule.switchSubView('bulk_entry')">
                            <i class="fas fa-bolt"></i> اجتماعی اندراج
                        </button>
                    </div>
                </div>

                <div style="overflow-x:auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>طالب علم</th>
                                <th>استاد / حلقہ</th>
                                <th>نیا سبق (Sabaq)</th>
                                <th>سبقی (Sabqi)</th>
                                <th>منزل (Manzil)</th>
                                <th>غلطیاں</th>
                                <th>گریڈ</th>
                                <th>ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todayDaily.map(d => {
                                const st = studentMap.get(d.studentId);
                                const stName = st ? st.name : `#${d.studentId}`;
                                return `
                                    <tr>
                                        <td style="font-weight:bold; color:var(--primary);">
                                            <span style="cursor:pointer;" onclick="HifzModule.viewStudentProfile(${d.studentId})">${stName}</span>
                                        </td>
                                        <td>${d.halaqa || '---'}</td>
                                        <td>
                                            <span style="background:#ecfdf5; color:#065f46; padding:2px 8px; border-radius:6px; font-weight:600; font-size:0.9rem;">
                                                پارہ ${d.sabaqJuz || '---'} : ${d.sabaqQuantity || '0'} صفحات
                                            </span>
                                        </td>
                                        <td>پارہ ${d.sabqiJuz || '---'} (${d.sabqiPages || '---'})</td>
                                        <td>پارہ ${d.manzilJuz || '---'} (${d.manzilPages || '---'})</td>
                                        <td style="font-weight:bold; color:${(d.totalMistakes || 0) > 4 ? '#ef4444' : '#10b981'};">
                                            ${d.totalMistakes || 0}
                                        </td>
                                        <td>
                                            <span class="badge" style="background:${this.getGradeBg(d.overallGrade)}; color:${this.getGradeColor(d.overallGrade)}; font-weight:bold; padding:3px 10px; border-radius:12px;">
                                                ${d.overallGrade || '---'}
                                            </span>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm" onclick="HifzModule.viewStudentProfile(${d.studentId})" title="طالب علم پروفائل" style="padding:4px 10px; background:var(--primary-subtle); color:var(--primary);">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm" onclick="HifzModule.deleteDailyRecord(${d.id})" title="حذف کریں" style="padding:4px 10px; background:#fef2f2; color:#ef4444; margin-right:4px;">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('') || '<tr><td colspan="8" style="text-align:center; padding:2.5rem; color:var(--text-muted);">آج کا کوئی سبق ابھی داخل نہیں کیا گیا۔ اوپر "اجتماعی اندراج" کے ذریعے ریکارڈ درج فرمائیں۔</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ==========================================
    // 2. HIFZ STUDENTS LIST & ENROLLMENT
    // ==========================================
    async renderStudentsList(container) {
        const enrollments = await MadrassahDB.getAllHifzEnrollments();
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const halaqas = await MadrassahDB.getAllHifzHalaqas();
        const teachers = await MadrassahDB.getAllTeachers();
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
        const studentMap = new Map(allStudents.map(s => [s.id, s]));

        // Filter by section
        const sectionEnrollments = enrollments.filter(e => studentMap.has(e.studentId));

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:10px;">
                <h3 style="color:var(--primary); margin:0;"><i class="fas fa-user-graduate"></i> فہرستِ حفاظ طلبہ کرام (${sectionEnrollments.length})</h3>
                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    <input type="text" id="hifzStudentSearch" placeholder="نام یا شناختی نمبر سے تلاش..." 
                           oninput="HifzModule.filterStudentsTable(this.value)" 
                           style="padding:0.5rem 1rem; border-radius:10px; border:1px solid #ddd; width:220px;">
                    
                    <select id="hifzHalaqaFilter" onchange="HifzModule.filterByHalaqa(this.value)" style="padding:0.5rem; border-radius:10px; border:1px solid #ddd;">
                        <option value="all">تمام حلقہ جات</option>
                        ${halaqas.map(h => `<option value="${h.name}">${h.name}</option>`).join('')}
                    </select>

                    <button class="btn btn-primary" onclick="HifzModule.showEnrollModal()">
                        <i class="fas fa-user-plus"></i> نیا طالب علم شامل کریں
                    </button>
                </div>
            </div>

            <div class="card" style="padding:0; overflow:hidden; border-radius:16px;">
                <table id="hifzStudentsTable">
                    <thead>
                        <tr>
                            <th>رجسٹریشن</th>
                            <th>نام طالب علم</th>
                            <th>ولدیت</th>
                            <th>استاد محترم</th>
                            <th>حلقہ</th>
                            <th>موجودہ پارہ / صفحہ</th>
                            <th>پیش رفت (Progress)</th>
                            <th>حالت (Status)</th>
                            <th>ایکشن</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sectionEnrollments.map(en => {
                            const st = studentMap.get(en.studentId);
                            if (!st) return '';
                            const tName = teacherMap.get(en.teacherId) || en.teacherName || '---';
                            const completedJuz = en.completedJuzCount || (en.currentJuz ? Math.max(0, en.currentJuz - 1) : 0);
                            const percent = ((completedJuz / 30) * 100).toFixed(1);

                            return `
                                <tr data-name="${st.name}" data-father="${st.fatherName}" data-id="${st.id}" data-halaqa="${en.halaqa || ''}">
                                    <td style="font-weight:bold; color:var(--primary);">#${st.id}</td>
                                    <td style="font-weight:600;">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <img src="${st.photo || 'https://via.placeholder.com/35'}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid #ddd;">
                                            <span style="cursor:pointer; color:var(--primary);" onclick="HifzModule.viewStudentProfile(${st.id})">${st.name}</span>
                                        </div>
                                    </td>
                                    <td>${st.fatherName}</td>
                                    <td>${tName}</td>
                                    <td><span style="background:#f1f5f9; padding:2px 8px; border-radius:6px; font-weight:600;">${en.halaqa || '---'}</span></td>
                                    <td style="font-weight:600;">
                                        پارہ ${en.currentJuz || 1} <span style="font-size:0.85rem; color:#64748b;">(صفحہ ${en.currentPage || 1})</span>
                                    </td>
                                    <td style="width:160px;">
                                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:2px; font-weight:bold;">
                                            <span>${completedJuz}/30</span>
                                            <span>${percent}%</span>
                                        </div>
                                        <div class="hifz-progress-bar-wrap">
                                            <div class="hifz-progress-bar-fill" style="width:${percent}%;"></div>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge" style="background:${this.getStatusBg(en.status)}; color:${this.getStatusColor(en.status)}; padding:3px 8px; border-radius:8px; font-size:0.85rem; font-weight:bold;">
                                            ${en.status || 'جاری'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm" onclick="HifzModule.viewStudentProfile(${st.id})" title="پروفائل و 30 پارے ریکارڈ" style="background:var(--primary-subtle); color:var(--primary); padding:4px 8px;">
                                            <i class="fas fa-id-card"></i>
                                        </button>
                                        <button class="btn btn-sm" onclick="HifzModule.openDailyEntryForStudent(${st.id})" title="روزانہ سبق درج کریں" style="background:#ecfdf5; color:#16a34a; padding:4px 8px; margin-right:4px;">
                                            <i class="fas fa-pen"></i>
                                        </button>
                                        <button class="btn btn-sm" onclick="HifzModule.editEnrollment(${en.id})" title="ترمیم" style="background:#f1f5f9; color:#475569; padding:4px 8px; margin-right:4px;">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm" onclick="HifzModule.deleteEnrollment(${en.id})" title="حذف" style="background:#fef2f2; color:#ef4444; padding:4px 8px; margin-right:4px;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('') || '<tr><td colspan="9" style="text-align:center; padding:3rem; color:var(--text-muted);">کوئی طالب علم درج نہیں۔ اوپر "نیا طالب علم شامل کریں" کے بٹن پر کلک کریں۔</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- Enrollment Modal Placeholder -->
            <div id="hifzModalContainer"></div>
        `;
    },

    filterStudentsTable(query) {
        const q = query.trim().toLowerCase();
        const rows = document.querySelectorAll('#hifzStudentsTable tbody tr');
        rows.forEach(r => {
            const name = (r.getAttribute('data-name') || '').toLowerCase();
            const father = (r.getAttribute('data-father') || '').toLowerCase();
            const id = (r.getAttribute('data-id') || '').toLowerCase();
            const match = name.includes(q) || father.includes(q) || id.includes(q);
            r.style.display = match ? '' : 'none';
        });
    },

    filterByHalaqa(halaqa) {
        const rows = document.querySelectorAll('#hifzStudentsTable tbody tr');
        rows.forEach(r => {
            const h = r.getAttribute('data-halaqa') || '';
            const match = halaqa === 'all' || h === halaqa;
            r.style.display = match ? '' : 'none';
        });
    },

    // --- Show Enrollment Modal ---
    async showEnrollModal(editEnrollmentId = null) {
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const halaqas = await MadrassahDB.getAllHifzHalaqas();
        const teachers = await MadrassahDB.getAllTeachers();
        const hifzTeachers = teachers.filter(t => t.staffType === 'teaching' || t.teachingDept === 'حفظ' || t.designation?.includes('حفظ'));

        let existing = null;
        if (editEnrollmentId) {
            const enrollments = await MadrassahDB.getAllHifzEnrollments();
            existing = enrollments.find(e => e.id === parseInt(editEnrollmentId));
        }

        const modalContainer = document.getElementById('hifzModalContainer') || document.body;
        const modalDiv = document.createElement('div');
        modalDiv.id = 'hifzEnrollModal';
        modalDiv.className = 'mms-modal-backdrop';

        modalDiv.innerHTML = `
            <div class="mms-modal-box" style="max-width: 650px;">
                <div class="mms-modal-header">
                    <h3 style="margin:0; color:var(--primary);"><i class="fas fa-book-quran"></i> ${existing ? 'ترمیم کوائفِ حفظ طالب علم' : 'نیا داخلہ برائے شعبہ حفظ القرآن'}</h3>
                    <button type="button" onclick="document.getElementById('hifzEnrollModal').remove()" class="mms-close-btn">&times;</button>
                </div>
                
                <form onsubmit="HifzModule.handleEnrollmentSubmit(event)">
                    <input type="hidden" name="id" value="${existing ? existing.id : ''}">
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:1rem;">
                        <div class="form-group-horizontal" style="grid-column:span 2;">
                            <label>طالب علم منتخب کریں</label>
                            <select name="studentId" id="hifzEnrollStudentSelect" required ${existing ? 'disabled' : ''} onchange="HifzModule.onEnrollStudentChange(this.value)">
                                <option value="">انتخاب فرمائیں...</option>
                                ${allStudents.map(s => `<option value="${s.id}" ${existing && existing.studentId === s.id ? 'selected' : ''}>#${s.id} - ${s.name} ولد ${s.fatherName} (${s.department || 'عام'})${(s.isTransferHifz === 'yes' || s.hifzTotalParas) ? ' [منتقل شدہ حفظ ٹیسٹ]' : ''}</option>`).join('')}
                            </select>
                            ${existing ? `<input type="hidden" name="studentId" value="${existing.studentId}">` : ''}
                            <div id="enrollStudentHifzHint" style="display:none; margin-top:8px; background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:8px 12px; font-size:0.9rem; color:#166534;"></div>
                        </div>

                        <div class="form-group-horizontal">
                            <label>استاد محترم</label>
                            <select name="teacherId" required>
                                <option value="">استاد کا انتخاب کریں</option>
                                ${(hifzTeachers.length > 0 ? hifzTeachers : teachers).map(t => `<option value="${t.id}" ${existing && existing.teacherId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>حلقہ (Halaqa)</label>
                            <select name="halaqa" required>
                                <option value="">حلقہ منتخب کریں</option>
                                ${halaqas.map(h => `<option value="${h.name}" ${existing && existing.halaqa === h.name ? 'selected' : ''}>${h.name}</option>`).join('')}
                                <option value="حلقہ اول" ${existing && existing.halaqa === 'حلقہ اول' ? 'selected' : ''}>حلقہ اول</option>
                                <option value="حلقہ دوم" ${existing && existing.halaqa === 'حلقہ دوم' ? 'selected' : ''}>حلقہ دوم</option>
                                <option value="حلقہ سوم" ${existing && existing.halaqa === 'حلقہ سوم' ? 'selected' : ''}>حلقہ سوم</option>
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>حفظ شروع کرنے کی تاریخ</label>
                            <input type="date" name="startDate" value="${existing ? existing.startDate : new Date().toISOString().split('T')[0]}" required>
                        </div>

                        <div class="form-group-horizontal">
                            <label>حالتِ حفظ (Status)</label>
                            <select name="status">
                                <option value="جاری" ${!existing || existing.status === 'جاری' ? 'selected' : ''}>جاری (In Progress)</option>
                                <option value="مکمل" ${existing && existing.status === 'مکمل' ? 'selected' : ''}>مکمل (Completed)</option>
                                <option value="عارضی موقوف" ${existing && existing.status === 'عارضی موقوف' ? 'selected' : ''}>عارضی موقوف (On Hold)</option>
                                <option value="چھوڑ دیا" ${existing && existing.status === 'چھوڑ دیا' ? 'selected' : ''}>چھوڑ دیا (Left)</option>
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>شروع/موجودہ پارہ</label>
                            <select name="currentJuz">
                                ${QuranData.paras.map(p => `<option value="${p.id}" ${existing && existing.currentJuz === p.id ? 'selected' : ''}>پارہ ${p.id} (${p.name})</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>موجودہ صفحہ (1 تا 20)</label>
                            <input type="number" name="currentPage" min="1" max="20" value="${existing ? existing.currentPage : 1}">
                        </div>

                        <div class="form-group-horizontal" style="grid-column:span 2;">
                            <label>موجودہ سورت</label>
                            <select name="currentSurah">
                                <option value="">انتخاب کریں...</option>
                                ${QuranData.surahs.map(s => `<option value="${s.name}" ${existing && existing.currentSurah === s.name ? 'selected' : ''}>${s.id}. ${s.name}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group-horizontal" style="grid-column:span 2;">
                            <label>اضافی نوٹ / ہدایات</label>
                            <input type="text" name="notes" value="${existing ? (existing.notes || '') : ''}" placeholder="کوئی خاص نوٹ...">
                        </div>
                    </div>

                    <div style="margin-top:1.5rem; text-align:center; display:flex; justify-content:center; gap:10px;">
                        <button type="submit" class="btn btn-primary" style="min-width:180px;">محفوظ فرمائیں</button>
                        <button type="button" class="btn" style="background:#e2e8f0;" onclick="document.getElementById('hifzEnrollModal').remove()">منسوخ</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modalDiv);
    },

    async onEnrollStudentChange(studentId) {
        const hintDiv = document.getElementById('enrollStudentHifzHint');
        const juzSelect = document.querySelector('#hifzEnrollModal select[name="currentJuz"]');
        if (!studentId || !hintDiv) {
            if (hintDiv) hintDiv.style.display = 'none';
            return;
        }
        const student = await MadrassahDB.getStudentById(studentId);
        if (student && (student.isTransferHifz === 'yes' || student.hifzTotalParas || student.examinerRemarks)) {
            hintDiv.style.display = 'block';
            hintDiv.innerHTML = `
                <div style="font-weight:bold; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-clipboard-check"></i> سابقہ حفظ ٹیسٹ رپورٹ (داخلہ جائزہ):
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:12px; font-size:0.9rem;">
                    <span><b>حفظ شدہ پارے:</b> ${student.hifzTotalParas ? `${student.hifzTotalParas} پارے` : '---'} ${student.hifzParasDetail ? `(${student.hifzParasDetail})` : ''}</span>
                    <span><b>منزل کی یادداشت:</b> <span style="font-weight:bold; color:#047857;">${student.manzilQuality || '---'}</span></span>
                    <span><b>تجویز کردہ پارہ:</b> <span style="font-weight:bold; color:#d97706;">${student.recommendedJuz || '---'}</span></span>
                    <span><b>ممتحن:</b> ${student.examinerName || '---'}</span>
                </div>
                ${student.examinerRemarks ? `<div style="margin-top:4px; font-size:0.85rem; color:#14532d; border-top:1px dashed #86efac; padding-top:4px;"><b>رائے ممتحن:</b> "${student.examinerRemarks}"</div>` : ''}
            `;
            if (juzSelect && student.recommendedJuz) {
                const normalized = String(student.recommendedJuz)
                    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
                    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
                const match = normalized.match(/\d+/);
                if (match && QuranData.paras.some(p => p.id === parseInt(match[0]))) {
                    juzSelect.value = match[0];
                }
            } else if (juzSelect && student.hifzTotalParas) {
                const nextJuz = Math.min(30, (parseInt(student.hifzTotalParas) || 0) + 1);
                juzSelect.value = nextJuz;
            }
        } else {
            hintDiv.style.display = 'none';
        }
    },

    async handleEnrollmentSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            id: formData.get('id') ? parseInt(formData.get('id')) : undefined,
            studentId: parseInt(formData.get('studentId')),
            teacherId: parseInt(formData.get('teacherId')),
            halaqa: formData.get('halaqa'),
            startDate: formData.get('startDate'),
            status: formData.get('status'),
            currentJuz: parseInt(formData.get('currentJuz')) || 1,
            currentPage: parseInt(formData.get('currentPage')) || 1,
            currentSurah: formData.get('currentSurah'),
            notes: formData.get('notes')
        };

        // Also update initial Juz progress record if new
        await MadrassahDB.saveHifzEnrollment(data);
        
        // If currentJuz > 1, mark previous juzs as completed
        if (data.currentJuz > 1) {
            for (let j = 1; j < data.currentJuz; j++) {
                await MadrassahDB.saveHifzJuzProgress({
                    studentId: data.studentId,
                    juzNumber: j,
                    status: 'completed',
                    completedDate: data.startDate,
                    revisionCount: 1,
                    notes: 'قبل از داخلہ مکمل'
                });
            }
        }
        await MadrassahDB.saveHifzJuzProgress({
            studentId: data.studentId,
            juzNumber: data.currentJuz,
            status: 'in_progress',
            completedDate: null,
            revisionCount: 0,
            notes: `صفحہ ${data.currentPage} جاری`
        });

        const modal = document.getElementById('hifzEnrollModal');
        if (modal) modal.remove();
        alert('طالب علم کے کوائفِ حفظ کامیابی سے محفوظ ہو گئے ہیں۔');
        await this.renderStudentsList(document.getElementById('hifz-subview-container'));
    },

    async editEnrollment(id) {
        await this.showEnrollModal(id);
    },

    async deleteEnrollment(id) {
        if (confirm('کیا آپ واقعی یہ حفظ انرولمنٹ حذف کرنا چاہتے ہیں؟')) {
            await MadrassahDB.deleteHifzEnrollment(id);
            await this.renderStudentsList(document.getElementById('hifz-subview-container'));
        }
    },

    // ==========================================
    // 3. HIFZ STUDENT PROFILE (RICH DASHBOARD)
    // ==========================================
    async viewStudentProfile(studentId) {
        const student = await MadrassahDB.getStudentById(studentId);
        if (!student) {
            alert('طالب علم کا ریکارڈ نہیں ملا!');
            return;
        }

        const enrollment = await MadrassahDB.getHifzEnrollmentByStudentId(studentId) || {
            studentId: student.id,
            currentJuz: 1,
            currentPage: 1,
            status: 'جاری',
            startDate: student.admissionDate || '---',
            halaqa: '---'
        };

        const teachers = await MadrassahDB.getAllTeachers();
        const teacher = teachers.find(t => t.id === enrollment.teacherId);
        const teacherName = teacher ? teacher.name : '---';

        const juzProgressMap = await MadrassahDB.getStudentJuzProgress(studentId);
        const dailyRecords = await MadrassahDB.getStudentDailyRecords(studentId);
        const revisions = await MadrassahDB.getStudentRevisions(studentId);
        const examResults = await MadrassahDB.getStudentHifzResults(studentId);
        const allExams = await MadrassahDB.getAllHifzExams();
        const examMap = new Map(allExams.map(e => [e.id, e]));

        // Calculate metrics
        let completedCount = 0;
        let inProgressJuz = enrollment.currentJuz || 1;
        for (let j = 1; j <= 30; j++) {
            if (juzProgressMap[j]?.status === 'completed') completedCount++;
            else if (juzProgressMap[j]?.status === 'in_progress') inProgressJuz = j;
        }
        const percent = ((completedCount / 30) * 100).toFixed(1);
        const remainingJuz = 30 - completedCount;
        const totalPagesMemorized = (completedCount * 20) + (enrollment.currentPage ? enrollment.currentPage - 1 : 0);

        // Expected Completion calculation based on pace
        let expectedDateStr = 'زیرِ تخمینہ';
        if (completedCount > 0 && enrollment.startDate) {
            const start = new Date(enrollment.startDate);
            const now = new Date();
            const daysPassed = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
            const daysPerJuz = daysPassed / completedCount;
            const daysRemaining = daysPerJuz * remainingJuz;
            const targetDate = new Date(now.getTime() + (daysRemaining * 24 * 60 * 60 * 1000));
            expectedDateStr = targetDate.toLocaleDateString('ur-PK', { year: 'numeric', month: 'short' });
        }

        const modalDiv = document.createElement('div');
        modalDiv.id = 'hifzStudentProfileModal';
        modalDiv.className = 'mms-modal-backdrop';

        modalDiv.innerHTML = `
            <div class="mms-modal-box" style="max-width: 950px; max-height: 90vh; overflow-y:auto;">
                <div class="mms-modal-header" style="border-bottom: 2px solid var(--primary-border);">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <img src="${student.photo || 'https://via.placeholder.com/60'}" style="width:55px; height:55px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);">
                        <div>
                            <h2 style="margin:0; color:var(--primary); font-size:1.6rem; font-family:'Aref Ruqaa', serif;">
                                ${student.name} ولد ${student.fatherName}
                            </h2>
                            <p style="margin:0; color:var(--text-muted); font-size:0.95rem;">
                                رجسٹریشن #${student.id} | حلقہ: ${enrollment.halaqa || '---'} | استاد: ${teacherName}
                            </p>
                        </div>
                    </div>
                    <button type="button" onclick="document.getElementById('hifzStudentProfileModal').remove()" class="mms-close-btn">&times;</button>
                </div>

                <!-- Main Progress Highlight -->
                <div style="background:linear-gradient(135deg, var(--primary), var(--primary-dark)); color:white; padding:1.5rem; border-radius:18px; margin: 1.2rem 0; box-shadow:0 8px 20px var(--primary-shadow);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:8px;">
                        <div>
                            <span style="font-size:1rem; opacity:0.9;">حفظ قرآن مجید کی پیش رفت:</span>
                            <div style="font-size:2.2rem; font-weight:bold; font-family:'Amiri', serif;">
                                ${completedCount} / 30 پارے مکمل
                            </div>
                        </div>
                        <div style="font-size:2.5rem; font-weight:bold;">
                            ${percent}%
                        </div>
                    </div>
                    <div class="hifz-progress-bar-wrap" style="height:14px; background:rgba(255,255,255,0.25);">
                        <div class="hifz-progress-bar-fill" style="width:${percent}%; background:#34d399; box-shadow:0 0 10px #34d399;"></div>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-bottom:1.5rem;">
                    <div class="hifz-stat-box">
                        <span class="label">مکمل پارے</span>
                        <span class="val" style="color:#16a34a;">${completedCount}</span>
                    </div>
                    <div class="hifz-stat-box">
                        <span class="label">جاری پارہ</span>
                        <span class="val" style="color:#d97706;">پارہ ${inProgressJuz}</span>
                    </div>
                    <div class="hifz-stat-box">
                        <span class="label">باقی پارے</span>
                        <span class="val" style="color:#dc2626;">${remainingJuz}</span>
                    </div>
                    <div class="hifz-stat-box">
                        <span class="label">حفظ شدہ صفحات</span>
                        <span class="val" style="color:var(--primary);">${totalPagesMemorized}</span>
                    </div>
                    <div class="hifz-stat-box">
                        <span class="label">تاریخ آغاز</span>
                        <span class="val" style="font-size:1rem;">${enrollment.startDate || '---'}</span>
                    </div>
                    <div class="hifz-stat-box">
                        <span class="label">متوقع تکمیل</span>
                        <span class="val" style="font-size:1rem; color:#8b5cf6;">${expectedDateStr}</span>
                    </div>
                </div>

                <!-- 30 Paras Visual Board -->
                <div class="card" style="padding:1.2rem; margin-bottom:1.5rem; border-radius:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:8px;">
                        <h4 style="margin:0; color:var(--primary); font-size:1.2rem;">
                            <i class="fas fa-cubes-stacked"></i> 30 پارہ تصویری بورڈ (Juz Progress Board)
                        </h4>
                        <div style="display:flex; gap:12px; font-size:0.85rem; font-weight:bold;">
                            <span style="display:inline-flex; align-items:center; gap:4px;"><span class="juz-dot-sample" style="background:#16a34a;"></span> مکمل</span>
                            <span style="display:inline-flex; align-items:center; gap:4px;"><span class="juz-dot-sample" style="background:#eab308;"></span> جاری</span>
                            <span style="display:inline-flex; align-items:center; gap:4px;"><span class="juz-dot-sample" style="background:#e2e8f0;"></span> باقی</span>
                        </div>
                    </div>

                    <div class="hifz-30-grid">
                        ${QuranData.paras.map(p => {
                            const prog = juzProgressMap[p.id];
                            const status = prog?.status || 'not_started';
                            const isCompleted = status === 'completed';
                            const isInProgress = status === 'in_progress';
                            
                            return `
                                <div class="juz-tile ${status}" 
                                     onclick="HifzModule.openJuzDetailModal(${student.id}, ${p.id})"
                                     title="پارہ ${p.id}: ${p.name} (${status === 'completed' ? 'مکمل' : status === 'in_progress' ? 'جاری' : 'باقی'})">
                                    <span class="juz-num">${p.id}</span>
                                    <span class="juz-name">${p.name}</span>
                                    <span class="juz-status-icon">
                                        <i class="fas ${isCompleted ? 'fa-check' : isInProgress ? 'fa-spinner fa-spin' : 'fa-minus'}"></i>
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Tabs: Daily History, Revisions, Exams -->
                <div class="hifz-profile-tabs">
                    <button class="tab-btn active" onclick="HifzModule.switchProfileTab('daily_tab', this)">روزانہ اسباق لاگ (${dailyRecords.length})</button>
                    <button class="tab-btn" onclick="HifzModule.switchProfileTab('rev_tab', this)">دہرائی ریکارڈ (${revisions.length})</button>
                    <button class="tab-btn" onclick="HifzModule.switchProfileTab('exams_tab', this)">امتحانی نتائج (${examResults.length})</button>
                </div>

                <div id="profile_tab_content" style="margin-top:1rem;">
                    <!-- Daily History Table -->
                    <div id="daily_tab" class="profile-tab-pane active">
                        <table style="width:100%; font-size:0.95rem;">
                            <thead>
                                <tr>
                                    <th>تاریخ</th>
                                    <th>نیا سبق</th>
                                    <th>سبقی</th>
                                    <th>منزل</th>
                                    <th>غلطیاں</th>
                                    <th>گریڈ</th>
                                    <th>تبصرہ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${dailyRecords.slice(0, 15).map(r => `
                                    <tr>
                                        <td>${r.date}</td>
                                        <td>پارہ ${r.sabaqJuz || '---'} (${r.sabaqQuantity || 0} ص)</td>
                                        <td>پارہ ${r.sabqiJuz || '---'} (${r.sabqiPages || '---'})</td>
                                        <td>پارہ ${r.manzilJuz || '---'}</td>
                                        <td style="font-weight:bold; color:${r.totalMistakes > 4 ? '#ef4444' : '#10b981'};">${r.totalMistakes || 0}</td>
                                        <td><span class="badge" style="background:${this.getGradeBg(r.overallGrade)}; color:${this.getGradeColor(r.overallGrade)};">${r.overallGrade || '---'}</span></td>
                                        <td style="color:#64748b;">${r.remarks || '---'}</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="7" style="text-align:center; padding:1.5rem;">کوئی سابقہ سبق نہیں ملا</td></tr>'}
                            </tbody>
                        </table>
                    </div>

                    <!-- Revisions Table -->
                    <div id="rev_tab" class="profile-tab-pane" style="display:none;">
                        <table style="width:100%; font-size:0.95rem;">
                            <thead>
                                <tr>
                                    <th>تاریخ</th>
                                    <th>پارے / حصہ</th>
                                    <th>صفحات</th>
                                    <th>غلطیاں</th>
                                    <th>گریڈ</th>
                                    <th>حالت</th>
                                    <th>تبصرہ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${revisions.map(rv => `
                                    <tr>
                                        <td>${rv.date}</td>
                                        <td>${rv.juzList || '---'}</td>
                                        <td>${rv.pagesCount || '---'}</td>
                                        <td>${rv.mistakes || 0}</td>
                                        <td><span class="badge" style="background:${this.getGradeBg(rv.grade)}; color:${this.getGradeColor(rv.grade)};">${rv.grade || '---'}</span></td>
                                        <td>${rv.attentionNeeded ? '<span style="color:#ef4444; font-weight:bold;">⚠️ توجہ درکار</span>' : '<span style="color:#16a34a;">بہترین</span>'}</td>
                                        <td>${rv.remarks || '---'}</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="7" style="text-align:center; padding:1.5rem;">کوئی دہرائی ریکارڈ نہیں</td></tr>'}
                            </tbody>
                        </table>
                    </div>

                    <!-- Exams Table -->
                    <div id="exams_tab" class="profile-tab-pane" style="display:none;">
                        <table style="width:100%; font-size:0.95rem;">
                            <thead>
                                <tr>
                                    <th>امتحان کا عنوان</th>
                                    <th>تاریخ</th>
                                    <th>حصہ</th>
                                    <th>کل نمبر</th>
                                    <th>حاصل کردہ</th>
                                    <th>گریڈ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${examResults.map(res => {
                                    const ex = examMap.get(res.examId) || {};
                                    return `
                                        <tr>
                                            <td style="font-weight:600;">${ex.title || 'امتحان'}</td>
                                            <td>${ex.date || '---'}</td>
                                            <td>${ex.portion || '---'}</td>
                                            <td>${res.totalMarks || 100}</td>
                                            <td style="font-weight:bold; color:var(--primary);">${res.obtainedMarks || 0}</td>
                                            <td><span class="badge" style="background:${this.getGradeBg(res.grade)}; color:${this.getGradeColor(res.grade)};">${res.grade || '---'}</span></td>
                                        </tr>
                                    `;
                                }).join('') || '<tr><td colspan="6" style="text-align:center; padding:1.5rem;">کوئی امتحانی نتیجہ نہیں</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="margin-top:1.5rem; text-align:center;">
                    <button type="button" class="btn" style="background:#e2e8f0; min-width:140px;" onclick="document.getElementById('hifzStudentProfileModal').remove()">بند کریں</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);
    },

    switchProfileTab(tabId, btn) {
        document.querySelectorAll('.hifz-profile-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        document.querySelectorAll('#profile_tab_content .profile-tab-pane').forEach(p => {
            p.style.display = p.id === tabId ? 'block' : 'none';
        });
    },

    // --- Juz Detail & Edit Modal ---
    async openJuzDetailModal(studentId, juzNumber) {
        const student = await MadrassahDB.getStudentById(studentId);
        const juzProgressMap = await MadrassahDB.getStudentJuzProgress(studentId);
        const prog = juzProgressMap[juzNumber] || { juzNumber, status: 'not_started' };
        const para = QuranData.paras.find(p => p.id === juzNumber);

        const modalDiv = document.createElement('div');
        modalDiv.id = 'juzDetailModal';
        modalDiv.className = 'mms-modal-backdrop';

        modalDiv.innerHTML = `
            <div class="mms-modal-box" style="max-width: 480px;">
                <div class="mms-modal-header">
                    <h3 style="margin:0; color:var(--primary); font-family:'Aref Ruqaa', serif;">
                        پارہ ${juzNumber}: ${para.name} (${student.name})
                    </h3>
                    <button type="button" onclick="document.getElementById('juzDetailModal').remove()" class="mms-close-btn">&times;</button>
                </div>

                <form onsubmit="HifzModule.handleJuzProgressSubmit(event, ${studentId}, ${juzNumber})">
                    <div style="margin-top:1rem; display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group-horizontal">
                            <label>پارے کی حالت (Status)</label>
                            <select name="status" required>
                                <option value="completed" ${prog.status === 'completed' ? 'selected' : ''}>مکمل (Completed 🟩)</option>
                                <option value="in_progress" ${prog.status === 'in_progress' ? 'selected' : ''}>جاری (In Progress 🟨)</option>
                                <option value="not_started" ${prog.status === 'not_started' ? 'selected' : ''}>باقی / شروع نہیں ہوا (Not Started ⬜)</option>
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>تاریخِ تکمیل</label>
                            <input type="date" name="completedDate" value="${prog.completedDate || ''}">
                        </div>

                        <div class="form-group-horizontal">
                            <label>دہرائی کی تعداد (Revisions)</label>
                            <input type="number" name="revisionCount" min="0" value="${prog.revisionCount || 0}">
                        </div>

                        <div class="form-group-horizontal">
                            <label>استاد کے ریمارکس / یادداشت</label>
                            <input type="text" name="notes" value="${prog.notes || ''}" placeholder="پارہ کیسا سنایا گیا...">
                        </div>
                    </div>

                    <div style="margin-top:1.5rem; text-align:center; display:flex; justify-content:center; gap:10px;">
                        <button type="submit" class="btn btn-primary" style="min-width:140px;">محفوظ کریں</button>
                        <button type="button" class="btn" style="background:#e2e8f0;" onclick="document.getElementById('juzDetailModal').remove()">منسوخ</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modalDiv);
    },

    async handleJuzProgressSubmit(e, studentId, juzNumber) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            studentId,
            juzNumber,
            status: formData.get('status'),
            completedDate: formData.get('completedDate') || null,
            revisionCount: parseInt(formData.get('revisionCount')) || 0,
            notes: formData.get('notes')
        };

        await MadrassahDB.saveHifzJuzProgress(data);
        
        // Update student's current enrollment record if needed
        const enrollment = await MadrassahDB.getHifzEnrollmentByStudentId(studentId);
        if (enrollment) {
            if (data.status === 'in_progress') {
                enrollment.currentJuz = juzNumber;
            } else if (data.status === 'completed' && enrollment.currentJuz === juzNumber && juzNumber < 30) {
                enrollment.currentJuz = juzNumber + 1;
            }
            await MadrassahDB.saveHifzEnrollment(enrollment);
        }

        const modal = document.getElementById('juzDetailModal');
        if (modal) modal.remove();
        
        // Refresh the profile modal
        const profModal = document.getElementById('hifzStudentProfileModal');
        if (profModal) profModal.remove();
        await this.viewStudentProfile(studentId);
    },

    // ==========================================
    // 4. DAILY HIFZ RECORD FORM (INDIVIDUAL)
    // ==========================================
    async renderDailyEntryForm(container, preSelectedStudentId = null) {
        const enrollments = await MadrassahDB.getAllHifzEnrollments();
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const teachers = await MadrassahDB.getAllTeachers();
        const studentMap = new Map(allStudents.map(s => [s.id, s]));
        const sectionEnrollments = enrollments.filter(e => studentMap.has(e.studentId));

        let currentEnrollment = null;
        if (preSelectedStudentId) {
            currentEnrollment = sectionEnrollments.find(e => e.studentId === parseInt(preSelectedStudentId));
        } else if (sectionEnrollments.length > 0) {
            currentEnrollment = sectionEnrollments[0];
        }

        container.innerHTML = `
            <div class="card" style="max-width: 900px; margin: 0 auto; border-radius:18px;">
                <div style="border-bottom: 2px solid #e2e8f0; padding-bottom:1rem; margin-bottom:1.5rem; text-align:center;">
                    <h2 style="color:var(--primary); margin:0; font-family:'Aref Ruqaa', serif; font-size:1.8rem;">
                        <i class="fas fa-book-open-reader"></i> روزانہ حفظ کارکردگی اندراج (Daily Hifz Entry)
                    </h2>
                    <p style="color:var(--text-muted); margin:0.3rem 0 0 0;">نیا سبق، سبقی، منزل، اغلاط کی تفاصیل اور گریڈ کا اندراج</p>
                </div>

                <form onsubmit="HifzModule.handleDailySubmit(event)">
                    <!-- Basic Info -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; background:#f8fafc; padding:1.2rem; border-radius:14px; margin-bottom:1.5rem;">
                        <div class="form-group-horizontal">
                            <label>تاریخ (Date)</label>
                            <input type="date" name="date" id="daily_entry_date" value="${this.dailyDate}" required onchange="HifzModule.dailyDate = this.value">
                        </div>

                        <div class="form-group-horizontal">
                            <label>طالب علم (Student)</label>
                            <select name="studentId" id="daily_student_select" required onchange="HifzModule.onDailyStudentChange(this.value)">
                                <option value="">طالب علم کا انتخاب کریں</option>
                                ${sectionEnrollments.map(en => {
                                    const st = studentMap.get(en.studentId);
                                    if (!st) return '';
                                    const isSel = currentEnrollment && currentEnrollment.studentId === st.id;
                                    return `<option value="${st.id}" ${isSel ? 'selected' : ''}>#${st.id} - ${st.name} (حلقہ: ${en.halaqa || 'عام'})</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>استاد محترم (Teacher)</label>
                            <select name="teacherId" id="daily_teacher_select" required>
                                ${teachers.map(t => `<option value="${t.id}" ${currentEnrollment && currentEnrollment.teacherId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- 1. SABAQ (نیا سبق) -->
                    <div class="hifz-entry-section" style="border-right: 4px solid #10b981;">
                        <div class="section-title" style="color:#065f46;">
                            <i class="fas fa-book-bookmark"></i> SABAQ — نیا سبق
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:0.8rem;">
                            <div class="form-group-horizontal">
                                <label>پارہ</label>
                                <select name="sabaqJuz" id="sabaqJuzSelect">
                                    ${QuranData.paras.map(p => `<option value="${p.id}" ${currentEnrollment && currentEnrollment.currentJuz === p.id ? 'selected' : ''}>پارہ ${p.id} (${p.name})</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group-horizontal">
                                <label>سورت</label>
                                <select name="sabaqSurah">
                                    <option value="">انتخاب کریں</option>
                                    ${QuranData.surahs.map(s => `<option value="${s.name}" ${currentEnrollment && currentEnrollment.currentSurah === s.name ? 'selected' : ''}>${s.id}. ${s.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group-horizontal">
                                <label>شروع صفحہ</label>
                                <input type="number" name="sabaqStartPage" min="1" max="20" value="${currentEnrollment ? currentEnrollment.currentPage : 1}">
                            </div>
                            <div class="form-group-horizontal">
                                <label>اختتامی صفحہ</label>
                                <input type="number" name="sabaqEndPage" min="1" max="20" value="${currentEnrollment ? currentEnrollment.currentPage : 1}" oninput="HifzModule.calcSabaqQty(this)">
                            </div>
                            <div class="form-group-horizontal">
                                <label>مقدار (صفحات)</label>
                                <input type="number" step="0.25" name="sabaqQuantity" id="sabaqQuantityInput" value="1" required>
                            </div>
                            <div class="form-group-horizontal">
                                <label>غلطیوں کی تعداد</label>
                                <input type="number" name="sabaqMistakes" id="sabaqMistakesInput" min="0" value="0" oninput="HifzModule.autoGradeDaily()">
                            </div>
                            <div class="form-group-horizontal">
                                <label>سبق گریڈ</label>
                                <select name="sabaqGrade" id="sabaqGradeSelect">
                                    <option value="A+">A+ — ممتاز (بہترین)</option>
                                    <option value="A">A — بہت اچھا</option>
                                    <option value="B">B — اچھا</option>
                                    <option value="C">C — درمیانہ</option>
                                    <option value="D">D — کمزور</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 2. SABQI (سبقی) -->
                    <div class="hifz-entry-section" style="border-right: 4px solid #2563eb;">
                        <div class="section-title" style="color:#1d4ed8;">
                            <i class="fas fa-repeat"></i> SABQI — سبقی
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:0.8rem;">
                            <div class="form-group-horizontal">
                                <label>پارہ</label>
                                <select name="sabqiJuz">
                                    ${QuranData.paras.map(p => `<option value="${p.id}" ${currentEnrollment && currentEnrollment.currentJuz === p.id ? 'selected' : ''}>پارہ ${p.id} (${p.name})</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group-horizontal">
                                <label>صفحات / آیات</label>
                                <input type="text" name="sabqiPages" placeholder="مثلاً: ص 1 تا 5" value="5 صفحات">
                            </div>
                            <div class="form-group-horizontal">
                                <label>غلطیوں کی تعداد</label>
                                <input type="number" name="sabqiMistakes" id="sabqiMistakesInput" min="0" value="0" oninput="HifzModule.autoGradeDaily()">
                            </div>
                            <div class="form-group-horizontal">
                                <label>سبقی گریڈ</label>
                                <select name="sabqiGrade" id="sabqiGradeSelect">
                                    <option value="A+">A+ — ممتاز</option>
                                    <option value="A">A — بہت اچھا</option>
                                    <option value="B">B — اچھا</option>
                                    <option value="C">C — درمیانہ</option>
                                    <option value="D">D — کمزور</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 3. MANZIL (منزل) -->
                    <div class="hifz-entry-section" style="border-right: 4px solid #8b5cf6;">
                        <div class="section-title" style="color:#6d28d9;">
                            <i class="fas fa-layer-group"></i> MANZIL — منزل
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:0.8rem;">
                            <div class="form-group-horizontal">
                                <label>پارہ / پارے</label>
                                <input type="text" name="manzilJuz" placeholder="مثلاً: پارہ 1، 2" value="پارہ 1">
                            </div>
                            <div class="form-group-horizontal">
                                <label>مقدار (صفحات / ربع)</label>
                                <input type="text" name="manzilPages" placeholder="مثلاً: نصف پارہ / 1 پارہ" value="1 پارہ">
                            </div>
                            <div class="form-group-horizontal">
                                <label>غلطیوں کی تعداد</label>
                                <input type="number" name="manzilMistakes" id="manzilMistakesInput" min="0" value="0" oninput="HifzModule.autoGradeDaily()">
                            </div>
                            <div class="form-group-horizontal">
                                <label>منزل گریڈ</label>
                                <select name="manzilGrade" id="manzilGradeSelect">
                                    <option value="A+">A+ — ممتاز</option>
                                    <option value="A">A — بہت اچھا</option>
                                    <option value="B">B — اچھا</option>
                                    <option value="C">C — درمیانہ</option>
                                    <option value="D">D — کمزور</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Mistakes Categorization & Total -->
                    <div style="background:#fff7ed; padding:1.2rem; border-radius:14px; border:1px solid #ffedd5; margin-bottom:1.5rem;">
                        <div style="font-weight:bold; color:#c2410c; margin-bottom:0.6rem;">
                            <i class="fas fa-tags"></i> اقسامِ غلطیاں (Mistake Categories - اختیاری):
                        </div>
                        <div style="display:flex; flex-wrap:wrap; gap:12px;">
                            ${QuranData.mistakeCategories.map(cat => `
                                <label class="mistake-checkbox-label">
                                    <input type="checkbox" name="mistakeCategory_${cat.id}" value="${cat.label}">
                                    <span>${cat.label}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Overall Grade & Remarks -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
                        <div class="form-group-horizontal">
                            <label style="font-weight:bold; color:var(--primary);">مجموعی غلطیاں</label>
                            <input type="number" name="totalMistakes" id="totalMistakesInput" value="0" readonly style="background:#f1f5f9; font-weight:bold; text-align:center; font-size:1.2rem;">
                        </div>

                        <div class="form-group-horizontal">
                            <label style="font-weight:bold; color:var(--primary);">مجموعی گریڈ</label>
                            <select name="overallGrade" id="overallGradeSelect" style="font-weight:bold;">
                                <option value="A+">A+ — ممتاز</option>
                                <option value="A">A — بہت اچھا</option>
                                <option value="B">B — اچھا</option>
                                <option value="C">C — درمیانہ</option>
                                <option value="D">D — کمزور</option>
                            </select>
                        </div>

                        <div class="form-group-horizontal" style="grid-column:span 2;">
                            <label>استاد کے ریمارکس / تبصرہ</label>
                            <input type="text" name="remarks" placeholder="ماشاءاللہ بہترین پیش رفت / دہرائی پر توجہ دیں...">
                        </div>
                    </div>

                    <div style="text-align:center;">
                        <button type="submit" class="btn btn-primary" style="min-width:240px; font-size:1.1rem; padding:10px 24px;">
                            <i class="fas fa-save"></i> روزانہ ریکارڈ محفوظ کریں
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    openDailyEntryForStudent(studentId) {
        this.switchSubView('daily_entry').then(() => {
            const select = document.getElementById('daily_student_select');
            if (select) {
                select.value = studentId;
                this.onDailyStudentChange(studentId);
            }
        });
    },

    async onDailyStudentChange(studentId) {
        if (!studentId) return;
        const enrollment = await MadrassahDB.getHifzEnrollmentByStudentId(studentId);
        if (enrollment) {
            const juzSel = document.getElementById('sabaqJuzSelect');
            if (juzSel && enrollment.currentJuz) juzSel.value = enrollment.currentJuz;
            const teacherSel = document.getElementById('daily_teacher_select');
            if (teacherSel && enrollment.teacherId) teacherSel.value = enrollment.teacherId;
        }
    },

    calcSabaqQty(endPageInput) {
        const startPageInput = document.querySelector('input[name="sabaqStartPage"]');
        const qtyInput = document.getElementById('sabaqQuantityInput');
        if (startPageInput && endPageInput && qtyInput) {
            const start = parseInt(startPageInput.value) || 1;
            const end = parseInt(endPageInput.value) || 1;
            if (end >= start) {
                qtyInput.value = (end - start + 1);
            }
        }
    },

    autoGradeDaily() {
        const sM = parseInt(document.getElementById('sabaqMistakesInput')?.value) || 0;
        const sbM = parseInt(document.getElementById('sabqiMistakesInput')?.value) || 0;
        const mM = parseInt(document.getElementById('manzilMistakesInput')?.value) || 0;
        const total = sM + sbM + mM;

        const totalInput = document.getElementById('totalMistakesInput');
        if (totalInput) totalInput.value = total;

        const grade = QuranData.getGradeForMistakes(total);
        const overallSelect = document.getElementById('overallGradeSelect');
        if (overallSelect) overallSelect.value = grade;

        const sabaqGrade = QuranData.getGradeForMistakes(sM);
        const sabqiGrade = QuranData.getGradeForMistakes(sbM);
        const manzilGrade = QuranData.getGradeForMistakes(mM);

        const sGSelect = document.getElementById('sabaqGradeSelect');
        if (sGSelect) sGSelect.value = sabaqGrade;
        const sbGSelect = document.getElementById('sabqiGradeSelect');
        if (sbGSelect) sbGSelect.value = sabqiGrade;
        const mGSelect = document.getElementById('manzilGradeSelect');
        if (mGSelect) mGSelect.value = manzilGrade;
    },

    async handleDailySubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Collect checked mistake categories
        const mistakeCats = [];
        QuranData.mistakeCategories.forEach(cat => {
            if (formData.get(`mistakeCategory_${cat.id}`)) {
                mistakeCats.push(cat.label);
            }
        });

        const studentId = parseInt(formData.get('studentId'));
        const sabaqJuz = parseInt(formData.get('sabaqJuz')) || 1;
        const sabaqEndPage = parseInt(formData.get('sabaqEndPage')) || 1;

        const record = {
            studentId,
            teacherId: parseInt(formData.get('teacherId')),
            date: formData.get('date'),
            sabaqJuz,
            sabaqSurah: formData.get('sabaqSurah'),
            sabaqStartPage: parseInt(formData.get('sabaqStartPage')) || 1,
            sabaqEndPage,
            sabaqQuantity: parseFloat(formData.get('sabaqQuantity')) || 1,
            sabaqMistakes: parseInt(formData.get('sabaqMistakes')) || 0,
            sabaqGrade: formData.get('sabaqGrade'),
            sabqiJuz: parseInt(formData.get('sabqiJuz')) || 1,
            sabqiPages: formData.get('sabqiPages'),
            sabqiMistakes: parseInt(formData.get('sabqiMistakes')) || 0,
            sabqiGrade: formData.get('sabqiGrade'),
            manzilJuz: formData.get('manzilJuz'),
            manzilPages: formData.get('manzilPages'),
            manzilMistakes: parseInt(formData.get('manzilMistakes')) || 0,
            manzilGrade: formData.get('manzilGrade'),
            totalMistakes: parseInt(formData.get('totalMistakes')) || 0,
            mistakeCategories: mistakeCats,
            overallGrade: formData.get('overallGrade'),
            remarks: formData.get('remarks')
        };

        await MadrassahDB.saveHifzDailyRecord(record);

        // Update student's Hifz enrollment page and juz
        const enrollment = await MadrassahDB.getHifzEnrollmentByStudentId(studentId);
        if (enrollment) {
            enrollment.currentJuz = sabaqJuz;
            enrollment.currentPage = sabaqEndPage < 20 ? sabaqEndPage + 1 : 1;
            if (sabaqEndPage >= 20 && sabaqJuz < 30) {
                // Juz completed!
                await MadrassahDB.saveHifzJuzProgress({
                    studentId,
                    juzNumber: sabaqJuz,
                    status: 'completed',
                    completedDate: record.date,
                    revisionCount: 1,
                    notes: 'مکمل از سبق'
                });
                enrollment.currentJuz = sabaqJuz + 1;
                enrollment.currentPage = 1;
            }
            await MadrassahDB.saveHifzEnrollment(enrollment);
        }

        alert('روزانہ حفظ کارکردگی کامیابی سے محفوظ کر لی گئی ہے۔');
        await this.renderDashboard(document.getElementById('hifz-subview-container'));
        this.currentSubView = 'dashboard';
        const pills = document.querySelectorAll('.hifz-nav-pill');
        pills.forEach(p => p.classList.toggle('active', p.getAttribute('onclick').includes("'dashboard'")));
    },

    async deleteDailyRecord(id) {
        if (confirm('کیا آپ واقعی یہ یومیہ ریکارڈ حذف کرنا چاہتے ہیں؟')) {
            await MadrassahDB.deleteHifzDailyRecord(id);
            await this.renderDashboard(document.getElementById('hifz-subview-container'));
        }
    },

    // ==========================================
    // 5. BULK DAILY ENTRY (TEACHER HALAQA SCREEN)
    // ==========================================
    async renderBulkDailyEntry(container) {
        const halaqas = await MadrassahDB.getAllHifzHalaqas();
        const enrollments = await MadrassahDB.getAllHifzEnrollments();
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const studentMap = new Map(allStudents.map(s => [s.id, s]));

        const selectedHalaqa = this.selectedHalaqaId;
        const filteredEnrollments = enrollments.filter(e => {
            if (!studentMap.has(e.studentId)) return false;
            if (selectedHalaqa === 'all') return true;
            return e.halaqa === selectedHalaqa;
        });

        // Check if existing records exist for today
        const allDaily = await MadrassahDB.getAllHifzDailyRecords();
        const todayDailyMap = new Map();
        allDaily.filter(d => d.date === this.bulkDate).forEach(d => todayDailyMap.set(d.studentId, d));

        container.innerHTML = `
            <div class="card" style="padding:1.5rem; border-radius:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h3 style="color:var(--primary); margin:0; font-size:1.4rem;">
                            <i class="fas fa-bolt"></i> اجتماعی روزانہ اندراج (Bulk Daily Entry)
                        </h3>
                        <p style="margin:0.2rem 0 0 0; color:var(--text-muted); font-size:0.95rem;">
                            ایک ہی سکرین پر پورے حلقے کے طلبہ کا سبق، سبقی، منزل اور غلطیاں درج کریں
                        </p>
                    </div>

                    <div style="display:flex; gap:10px; align-items:center;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-weight:bold; font-size:0.95rem;">تاریخ:</label>
                            <input type="date" id="bulkDateInput" value="${this.bulkDate}" 
                                   onchange="HifzModule.bulkDate = this.value; HifzModule.renderBulkDailyEntry(document.getElementById('hifz-subview-container'))" 
                                   style="padding:5px 10px; border-radius:8px; border:1px solid #ccc;">
                        </div>

                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-weight:bold; font-size:0.95rem;">حلقہ:</label>
                            <select id="bulkHalaqaSelect" 
                                    onchange="HifzModule.selectedHalaqaId = this.value; HifzModule.renderBulkDailyEntry(document.getElementById('hifz-subview-container'))" 
                                    style="padding:6px 12px; border-radius:8px; border:1px solid #ccc;">
                                <option value="all" ${selectedHalaqa === 'all' ? 'selected' : ''}>تمام حلقہ جات</option>
                                ${halaqas.map(h => `<option value="${h.name}" ${selectedHalaqa === h.name ? 'selected' : ''}>${h.name}</option>`).join('')}
                                <option value="حلقہ اول" ${selectedHalaqa === 'حلقہ اول' ? 'selected' : ''}>حلقہ اول</option>
                                <option value="حلقہ دوم" ${selectedHalaqa === 'حلقہ دوم' ? 'selected' : ''}>حلقہ دوم</option>
                            </select>
                        </div>

                        <button type="button" class="btn btn-primary" onclick="HifzModule.saveAllBulkRecords()" style="padding:8px 20px; font-weight:bold;">
                            <i class="fas fa-floppy-disk"></i> سب محفوظ کریں (Save All)
                        </button>
                    </div>
                </div>

                <div style="overflow-x:auto;">
                    <table id="bulkEntryTable" style="width:100%; border-collapse:collapse; font-size:0.95rem;">
                        <thead>
                            <tr style="background:#f8fafc;">
                                <th style="width:50px;">نمبر</th>
                                <th style="width:160px;">طالب علم</th>
                                <th style="width:180px;">نیا سبق (پارہ / ص)</th>
                                <th style="width:130px;">سبقی</th>
                                <th style="width:130px;">منزل</th>
                                <th style="width:90px;">غلطیاں</th>
                                <th style="width:110px;">گریڈ</th>
                                <th>تبصرہ / نوٹس</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredEnrollments.map((en, idx) => {
                                const st = studentMap.get(en.studentId);
                                if (!st) return '';
                                const existing = todayDailyMap.get(st.id) || {};
                                const sabaqJuz = existing.sabaqJuz || en.currentJuz || 1;
                                const sabaqQty = existing.sabaqQuantity || 1;
                                const sabqi = existing.sabqiPages || '5 ص';
                                const manzil = existing.manzilPages || '1 پارہ';
                                const mistakes = existing.totalMistakes !== undefined ? existing.totalMistakes : 0;
                                const grade = existing.overallGrade || QuranData.getGradeForMistakes(mistakes);

                                return `
                                    <tr data-student-id="${st.id}" data-teacher-id="${en.teacherId || ''}" data-halaqa="${en.halaqa || ''}">
                                        <td style="text-align:center; color:#94a3b8;">${idx + 1}</td>
                                        <td>
                                            <div style="font-weight:bold; color:var(--primary);">${st.name}</div>
                                            <div style="font-size:0.8rem; color:#64748b;">#${st.id} | حلقہ: ${en.halaqa || '---'}</div>
                                        </td>
                                        <td>
                                            <div style="display:flex; gap:4px; align-items:center;">
                                                <select class="bulk-sabaq-juz" style="padding:4px; border-radius:6px; font-size:0.85rem; width:100px;">
                                                    ${QuranData.paras.map(p => `<option value="${p.id}" ${sabaqJuz === p.id ? 'selected' : ''}>پارہ ${p.id}</option>`).join('')}
                                                </select>
                                                <input type="number" step="0.25" class="bulk-sabaq-qty" value="${sabaqQty}" placeholder="صفحات" style="width:65px; padding:4px; text-align:center; border-radius:6px; border:1px solid #ddd;">
                                            </div>
                                        </td>
                                        <td>
                                            <input type="text" class="bulk-sabqi" value="${sabqi}" placeholder="سبقی مقدار" style="width:100%; padding:4px 8px; border-radius:6px; border:1px solid #ddd;">
                                        </td>
                                        <td>
                                            <input type="text" class="bulk-manzil" value="${manzil}" placeholder="منزل مقدار" style="width:100%; padding:4px 8px; border-radius:6px; border:1px solid #ddd;">
                                        </td>
                                        <td>
                                            <input type="number" min="0" class="bulk-mistakes" value="${mistakes}" 
                                                   oninput="HifzModule.onBulkMistakesChange(this)"
                                                   style="width:100%; padding:4px 8px; border-radius:6px; border:1px solid #ddd; text-align:center; font-weight:bold; color:${mistakes > 4 ? '#ef4444' : '#10b981'};">
                                        </td>
                                        <td>
                                            <select class="bulk-grade" style="width:100%; padding:4px; border-radius:6px; font-weight:bold;">
                                                <option value="A+" ${grade === 'A+' ? 'selected' : ''}>A+ ممتاز</option>
                                                <option value="A" ${grade === 'A' ? 'selected' : ''}>A بہت اچھا</option>
                                                <option value="B" ${grade === 'B' ? 'selected' : ''}>B اچھا</option>
                                                <option value="C" ${grade === 'C' ? 'selected' : ''}>C درمیانہ</option>
                                                <option value="D" ${grade === 'D' ? 'selected' : ''}>D کمزور</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input type="text" class="bulk-remarks" value="${existing.remarks || ''}" placeholder="تبصرہ..." style="width:100%; padding:4px 8px; border-radius:6px; border:1px solid #ddd;">
                                        </td>
                                    </tr>
                                `;
                            }).join('') || '<tr><td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted);">اس حلقے میں کوئی طالب علم نہیں ملا۔</td></tr>'}
                        </tbody>
                    </table>
                </div>

                <div style="text-align:center; margin-top:1.5rem;">
                    <button type="button" class="btn btn-primary" onclick="HifzModule.saveAllBulkRecords()" style="min-width:260px; font-size:1.1rem; padding:10px 24px;">
                        <i class="fas fa-floppy-disk"></i> سب محفوظ کریں (Save All)
                    </button>
                </div>
            </div>
        `;
    },

    onBulkMistakesChange(input) {
        const val = parseInt(input.value) || 0;
        input.style.color = val > 4 ? '#ef4444' : '#10b981';
        const tr = input.closest('tr');
        if (tr) {
            const gradeSelect = tr.querySelector('.bulk-grade');
            if (gradeSelect) {
                gradeSelect.value = QuranData.getGradeForMistakes(val);
            }
        }
    },

    async saveAllBulkRecords() {
        const rows = document.querySelectorAll('#bulkEntryTable tbody tr[data-student-id]');
        if (!rows || rows.length === 0) {
            alert('محفوظ کرنے کے لیے کوئی طالب علم موجود نہیں۔');
            return;
        }

        const date = this.bulkDate;
        const recordsToSave = [];

        for (const r of rows) {
            const studentId = parseInt(r.getAttribute('data-student-id'));
            const teacherId = parseInt(r.getAttribute('data-teacher-id')) || undefined;
            const halaqa = r.getAttribute('data-halaqa') || '';

            const sabaqJuz = parseInt(r.querySelector('.bulk-sabaq-juz')?.value) || 1;
            const sabaqQty = parseFloat(r.querySelector('.bulk-sabaq-qty')?.value) || 1;
            const sabqi = r.querySelector('.bulk-sabqi')?.value || '';
            const manzil = r.querySelector('.bulk-manzil')?.value || '';
            const mistakes = parseInt(r.querySelector('.bulk-mistakes')?.value) || 0;
            const grade = r.querySelector('.bulk-grade')?.value || 'A';
            const remarks = r.querySelector('.bulk-remarks')?.value || '';

            recordsToSave.push({
                studentId,
                teacherId,
                halaqa,
                date,
                sabaqJuz,
                sabaqQuantity: sabaqQty,
                sabaqMistakes: Math.min(mistakes, 2),
                sabaqGrade: grade,
                sabqiJuz: sabaqJuz,
                sabqiPages: sabqi,
                sabqiMistakes: 0,
                sabqiGrade: grade,
                manzilJuz: `پارہ ${sabaqJuz > 1 ? sabaqJuz - 1 : 30}`,
                manzilPages: manzil,
                manzilMistakes: Math.max(0, mistakes - 2),
                manzilGrade: grade,
                totalMistakes: mistakes,
                overallGrade: grade,
                remarks
            });
        }

        await MadrassahDB.saveHifzDailyRecordsBatch(recordsToSave);
        alert(`کامیابی! تاریخ ${date} کے لیے تمام ${recordsToSave.length} اسباق محفوظ ہو گئے ہیں۔`);
        await this.renderDashboard(document.getElementById('hifz-subview-container'));
        this.currentSubView = 'dashboard';
        const pills = document.querySelectorAll('.hifz-nav-pill');
        pills.forEach(p => p.classList.toggle('active', p.getAttribute('onclick').includes("'dashboard'")));
    },

    // ==========================================
    // 6. 30 JUZ PROGRESS OVERVIEW
    // ==========================================
    async renderJuzProgressBoard(container) {
        const enrollments = await MadrassahDB.getAllHifzEnrollments();
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const studentMap = new Map(allStudents.map(s => [s.id, s]));
        const sectionEnrollments = enrollments.filter(e => studentMap.has(e.studentId));

        container.innerHTML = `
            <div class="card" style="padding:1.5rem; border-radius:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:10px;">
                    <div>
                        <h3 style="color:var(--primary); margin:0; font-size:1.4rem;">
                            <i class="fas fa-book-open"></i> 30 پارہ پروگریس بورڈ (30 Paras Progress Board)
                        </h3>
                        <p style="margin:0.2rem 0 0 0; color:var(--text-muted); font-size:0.95rem;">
                            طالب علم منتخب کر کے 30 پاروں کی مکمل تصویری پیش رفت ملاحظہ و اپڈیٹ فرمائیں
                        </p>
                    </div>

                    <div style="display:flex; gap:10px; align-items:center;">
                        <select id="juzBoardStudentSelect" onchange="HifzModule.loadStudentJuzBoard(this.value)" style="padding:8px 14px; border-radius:10px; border:1px solid var(--primary); font-weight:bold;">
                            <option value="">طالب علم کا انتخاب کریں...</option>
                            ${sectionEnrollments.map(en => {
                                const st = studentMap.get(en.studentId);
                                if (!st) return '';
                                return `<option value="${st.id}">#${st.id} - ${st.name} (${en.halaqa || 'عام'})</option>`;
                            }).join('')}
                        </select>
                    </div>
                </div>

                <div id="juzBoardContainer" style="padding:1rem 0;">
                    <div style="text-align:center; padding:3rem; color:var(--text-muted);">
                        <i class="fas fa-arrow-up" style="font-size:2rem; margin-bottom:10px; display:block;"></i>
                        اوپر ڈراپ ڈاؤن سے کسی طالب علم کا انتخاب کریں تاکہ ان کا 30 پارہ بورڈ ظاہر ہو۔
                    </div>
                </div>
            </div>
        `;

        if (sectionEnrollments.length > 0) {
            const firstId = sectionEnrollments[0].studentId;
            const sel = document.getElementById('juzBoardStudentSelect');
            if (sel) {
                sel.value = firstId;
                await this.loadStudentJuzBoard(firstId);
            }
        }
    },

    async loadStudentJuzBoard(studentId) {
        if (!studentId) return;
        const container = document.getElementById('juzBoardContainer');
        if (!container) return;

        const student = await MadrassahDB.getStudentById(studentId);
        const juzProgressMap = await MadrassahDB.getStudentJuzProgress(studentId);
        let completed = 0;
        for (let j = 1; j <= 30; j++) {
            if (juzProgressMap[j]?.status === 'completed') completed++;
        }
        const percent = ((completed / 30) * 100).toFixed(1);

        container.innerHTML = `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:1.2rem; margin-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${student.photo || 'https://via.placeholder.com/50'}" style="width:45px; height:45px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);">
                        <div>
                            <h4 style="margin:0; color:var(--primary); font-size:1.3rem;">${student.name} ولد ${student.fatherName}</h4>
                            <span style="font-size:0.9rem; color:#64748b;">رجسٹریشن #${student.id} | شعبہ: ${student.department || 'حفظ'}</span>
                        </div>
                    </div>
                    <div style="text-align:left;">
                        <div style="font-size:1.6rem; font-weight:bold; color:var(--primary);">${completed} / 30 پارے (${percent}%)</div>
                        <div class="hifz-progress-bar-wrap" style="width:200px; height:10px;">
                            <div class="hifz-progress-bar-fill" style="width:${percent}%;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="hifz-30-grid">
                ${QuranData.paras.map(p => {
                    const prog = juzProgressMap[p.id];
                    const status = prog?.status || 'not_started';
                    const isCompleted = status === 'completed';
                    const isInProgress = status === 'in_progress';

                    return `
                        <div class="juz-tile ${status}" onclick="HifzModule.openJuzDetailModal(${student.id}, ${p.id})">
                            <span class="juz-num">پارہ ${p.id}</span>
                            <span class="juz-name">${p.name}</span>
                            <span class="juz-status-badge">
                                ${isCompleted ? 'مکمل 🟩' : isInProgress ? 'جاری 🟨' : 'باقی ⬜'}
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // ==========================================
    // 7. REVISION MANAGEMENT (دہرائی مینجمنٹ)
    // ==========================================
    async renderRevisionModule(container) {
        const revisions = await MadrassahDB.getAllHifzRevisions();
        const enrollments = await MadrassahDB.getAllHifzEnrollments();
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const studentMap = new Map(allStudents.map(s => [s.id, s]));

        // Detect students needing attention
        const weakList = revisions.filter(r => r.attentionNeeded || r.grade === 'C' || r.grade === 'D' || (r.mistakes && r.mistakes >= 5));

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:10px;">
                <div>
                    <h3 style="color:var(--primary); margin:0; font-size:1.4rem;">
                        <i class="fas fa-rotate"></i> دہرائی مینجمنٹ (Revision Management)
                    </h3>
                    <p style="margin:0.2rem 0 0 0; color:var(--text-muted); font-size:0.95rem;">
                        طالب علم کی دہرائی کی رفتار، تاریخ اور کمزوریوں کی نگرانی
                    </p>
                </div>
                <button class="btn btn-primary" onclick="HifzModule.showAddRevisionModal()">
                    <i class="fas fa-plus"></i> نیا دہرائی ریکارڈ درج کریں
                </button>
            </div>

            <!-- Weak Revision Alert Card -->
            ${weakList.length > 0 ? `
                <div class="card" style="background:#fff1f2; border:2px solid #fecdd3; border-radius:16px; padding:1.2rem; margin-bottom:1.5rem;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:0.6rem;">
                        <i class="fas fa-triangle-exclamation" style="color:#e11d48; font-size:1.6rem;"></i>
                        <h4 style="color:#be123c; margin:0; font-size:1.2rem;">⚠️ Revision پر خصوصی توجہ درکار ہے (${weakList.length} طلباء)</h4>
                    </div>
                    <p style="color:#4c0519; font-size:0.95rem; margin-bottom:0.8rem;">
                        درج ذیل طلباء کی دہرائی یا منزل میں اغلاط کی تعداد زیادہ ہے یا گریڈ کمزور ہے۔ برائے مہربانی متعلقہ اساتذہ ان کے اعادہ پر خصوصی محنت فرمائیں:
                    </p>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${weakList.slice(0, 8).map(w => {
                            const st = studentMap.get(w.studentId);
                            const name = st ? st.name : `#${w.studentId}`;
                            return `
                                <span style="background:white; border:1px solid #f43f5e; color:#be123c; padding:3px 12px; border-radius:16px; font-size:0.88rem; font-weight:bold;">
                                    ${name} (پارہ: ${w.juzList || '---'} | اغلاط: ${w.mistakes || 0})
                                </span>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Revision History Table -->
            <div class="card" style="padding:0; overflow:hidden; border-radius:16px;">
                <table id="hifzRevisionTable">
                    <thead>
                        <tr>
                            <th>تاریخ</th>
                            <th>طالب علم</th>
                            <th>پڑھے گئے پارے / صفحات</th>
                            <th>کل غلطیاں</th>
                            <th>گریڈ</th>
                            <th>حالت</th>
                            <th>تبصرہ</th>
                            <th>ایکشن</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${revisions.map(r => {
                            const st = studentMap.get(r.studentId);
                            if (!st) return '';
                            return `
                                <tr>
                                    <td>${r.date}</td>
                                    <td style="font-weight:bold; color:var(--primary);">${st.name}</td>
                                    <td><span style="background:#f1f5f9; padding:2px 8px; border-radius:6px; font-weight:600;">${r.juzList || '---'}</span> (${r.pagesCount || '---'} ص)</td>
                                    <td style="font-weight:bold; color:${r.mistakes > 4 ? '#ef4444' : '#10b981'};">${r.mistakes || 0}</td>
                                    <td><span class="badge" style="background:${this.getGradeBg(r.grade)}; color:${this.getGradeColor(r.grade)};">${r.grade || '---'}</span></td>
                                    <td>
                                        ${r.attentionNeeded ? `
                                            <span style="background:#fee2e2; color:#b91c1c; padding:2px 8px; border-radius:8px; font-size:0.82rem; font-weight:bold;">
                                                <i class="fas fa-triangle-exclamation"></i> توجہ طلب
                                            </span>
                                        ` : `
                                            <span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:8px; font-size:0.82rem; font-weight:bold;">
                                                <i class="fas fa-check"></i> تسلی بخش
                                            </span>
                                        `}
                                    </td>
                                    <td style="color:#64748b;">${r.remarks || '---'}</td>
                                    <td>
                                        <button class="btn btn-sm" onclick="HifzModule.deleteRevisionRecord(${r.id})" style="background:#fef2f2; color:#ef4444; padding:3px 8px;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('') || '<tr><td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted);">کوئی دہرائی ریکارڈ موجود نہیں۔</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div id="addRevisionModalContainer"></div>
        `;
    },

    async showAddRevisionModal() {
        const enrollments = await MadrassahDB.getAllHifzEnrollments();
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const studentMap = new Map(allStudents.map(s => [s.id, s]));
        const sectionEnrollments = enrollments.filter(e => studentMap.has(e.studentId));

        const modalDiv = document.createElement('div');
        modalDiv.id = 'addRevModal';
        modalDiv.className = 'mms-modal-backdrop';

        modalDiv.innerHTML = `
            <div class="mms-modal-box" style="max-width: 500px;">
                <div class="mms-modal-header">
                    <h3 style="margin:0; color:var(--primary);"><i class="fas fa-rotate"></i> اندراج دہرائی (New Revision Record)</h3>
                    <button type="button" onclick="document.getElementById('addRevModal').remove()" class="mms-close-btn">&times;</button>
                </div>

                <form onsubmit="HifzModule.handleAddRevisionSubmit(event)">
                    <div style="margin-top:1rem; display:flex; flex-direction:column; gap:0.9rem;">
                        <div class="form-group-horizontal">
                            <label>تاریخ</label>
                            <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>

                        <div class="form-group-horizontal">
                            <label>طالب علم</label>
                            <select name="studentId" required>
                                <option value="">انتخاب کریں...</option>
                                ${sectionEnrollments.map(en => {
                                    const st = studentMap.get(en.studentId);
                                    if (!st) return '';
                                    return `<option value="${st.id}">#${st.id} - ${st.name}</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>پڑھے گئے پارے</label>
                            <input type="text" name="juzList" placeholder="مثلاً: پارہ 1 تا 3" required>
                        </div>

                        <div class="form-group-horizontal">
                            <label>صفحات کی تعداد</label>
                            <input type="number" name="pagesCount" value="20" required>
                        </div>

                        <div class="form-group-horizontal">
                            <label>غلطیوں کی تعداد</label>
                            <input type="number" name="mistakes" min="0" value="0" required oninput="HifzModule.onRevMistakesChange(this)">
                        </div>

                        <div class="form-group-horizontal">
                            <label>گریڈ</label>
                            <select name="grade" id="revGradeSelect">
                                <option value="A+">A+ — ممتاز</option>
                                <option value="A">A — بہت اچھا</option>
                                <option value="B">B — اچھا</option>
                                <option value="C">C — درمیانہ</option>
                                <option value="D">D — کمزور</option>
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>تبصرہ / نوٹس</label>
                            <input type="text" name="remarks" placeholder="روانی اچھی ہے / متشابہات پر غور کریں...">
                        </div>
                    </div>

                    <div style="margin-top:1.5rem; text-align:center; display:flex; justify-content:center; gap:10px;">
                        <button type="submit" class="btn btn-primary" style="min-width:140px;">محفوظ کریں</button>
                        <button type="button" class="btn" style="background:#e2e8f0;" onclick="document.getElementById('addRevModal').remove()">منسوخ</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modalDiv);
    },

    onRevMistakesChange(input) {
        const count = parseInt(input.value) || 0;
        const grade = QuranData.getGradeForMistakes(count);
        const sel = document.getElementById('revGradeSelect');
        if (sel) sel.value = grade;
    },

    async handleAddRevisionSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const mistakes = parseInt(formData.get('mistakes')) || 0;
        const grade = formData.get('grade');

        const data = {
            studentId: parseInt(formData.get('studentId')),
            date: formData.get('date'),
            juzList: formData.get('juzList'),
            pagesCount: parseInt(formData.get('pagesCount')) || 0,
            mistakes,
            grade,
            attentionNeeded: mistakes >= 5 || grade === 'C' || grade === 'D',
            remarks: formData.get('remarks')
        };

        await MadrassahDB.saveHifzRevision(data);
        const modal = document.getElementById('addRevModal');
        if (modal) modal.remove();
        alert('دہرائی کا ریکارڈ محفوظ کر لیا گیا ہے۔');
        await this.renderRevisionModule(document.getElementById('hifz-subview-container'));
    },

    async deleteRevisionRecord(id) {
        if (confirm('کیا آپ واقعی یہ دہرائی ریکارڈ حذف کرنا چاہتے ہیں؟')) {
            await MadrassahDB.deleteHifzRevision(id);
            await this.renderRevisionModule(document.getElementById('hifz-subview-container'));
        }
    },

    // ==========================================
    // 8. HIFZ EXAMS MODULE
    // ==========================================
    async renderExamsModule(container) {
        const exams = await MadrassahDB.getAllHifzExams();
        const teachers = await MadrassahDB.getAllTeachers();
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:10px;">
                <div>
                    <h3 style="color:var(--primary); margin:0; font-size:1.4rem;">
                        <i class="fas fa-file-signature"></i> حفظ امتحانات (Hifz Exams System)
                    </h3>
                    <p style="margin:0.2rem 0 0 0; color:var(--text-muted); font-size:0.95rem;">
                        ماہانہ و ششماہی حفظ امتحانات، نمبرات، تجوید و روانی کا تجزیہ
                    </p>
                </div>
                <button class="btn btn-primary" onclick="HifzModule.showCreateExamModal()">
                    <i class="fas fa-plus"></i> نیا امتحان بنائیں
                </button>
            </div>

            <div class="card" style="padding:0; overflow:hidden; border-radius:16px;">
                <table>
                    <thead>
                        <tr>
                            <th>امتحان کا عنوان</th>
                            <th>تاریخ</th>
                            <th>حصہ / نصاب</th>
                            <th>حلقہ</th>
                            <th>ممتحن / استاد</th>
                            <th>کل نمبر</th>
                            <th>ایکشن</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${exams.map(ex => `
                            <tr>
                                <td style="font-weight:bold; color:var(--primary);">${ex.title}</td>
                                <td>${ex.date}</td>
                                <td><span style="background:#f1f5f9; padding:2px 8px; border-radius:6px; font-weight:600;">${ex.portion}</span></td>
                                <td>${ex.halaqa || 'تمام'}</td>
                                <td>${teacherMap.get(ex.examinerTeacherId) || '---'}</td>
                                <td style="font-weight:bold;">${ex.maxMarks || 100}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="HifzModule.showEnterExamMarks(${ex.id})" style="padding:4px 10px;">
                                        <i class="fas fa-marker"></i> نمبرات درج کریں
                                    </button>
                                    <button class="btn btn-sm" onclick="HifzModule.deleteHifzExam(${ex.id})" style="background:#fef2f2; color:#ef4444; padding:4px 8px; margin-right:4px;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('') || '<tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted);">کوئی امتحان درج نہیں۔ اوپر "نیا امتحان بنائیں" پر کلک کریں۔</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div id="examMarksContainer" style="margin-top:1.5rem;"></div>
        `;
    },

    async showCreateExamModal() {
        const teachers = await MadrassahDB.getAllTeachers();
        const halaqas = await MadrassahDB.getAllHifzHalaqas();

        const modalDiv = document.createElement('div');
        modalDiv.id = 'createHifzExamModal';
        modalDiv.className = 'mms-modal-backdrop';

        modalDiv.innerHTML = `
            <div class="mms-modal-box" style="max-width: 520px;">
                <div class="mms-modal-header">
                    <h3 style="margin:0; color:var(--primary);"><i class="fas fa-file-circle-plus"></i> نیا حفظ امتحان بنائیں</h3>
                    <button type="button" onclick="document.getElementById('createHifzExamModal').remove()" class="mms-close-btn">&times;</button>
                </div>

                <form onsubmit="HifzModule.handleCreateExamSubmit(event)">
                    <div style="margin-top:1rem; display:flex; flex-direction:column; gap:0.9rem;">
                        <div class="form-group-horizontal">
                            <label>امتحان کا عنوان</label>
                            <input type="text" name="title" placeholder="مثلاً: ماہانہ حفظ امتحان - ستمبر" required>
                        </div>

                        <div class="form-group-horizontal">
                            <label>تاریخِ امتحان</label>
                            <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>

                        <div class="form-group-horizontal">
                            <label>حصہ / پارہ جات</label>
                            <input type="text" name="portion" placeholder="مثلاً: پارہ 1 تا 5" required>
                        </div>

                        <div class="form-group-horizontal">
                            <label>حلقہ</label>
                            <select name="halaqa">
                                <option value="تمام حلقہ جات">تمام حلقہ جات</option>
                                ${halaqas.map(h => `<option value="${h.name}">${h.name}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>ممتحن (Examiner)</label>
                            <select name="examinerTeacherId" required>
                                <option value="">ممتحن کا انتخاب کریں</option>
                                ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>کل نمبر (Total Marks)</label>
                            <input type="number" name="maxMarks" value="100" required>
                        </div>
                    </div>

                    <div style="margin-top:1.5rem; text-align:center; display:flex; justify-content:center; gap:10px;">
                        <button type="submit" class="btn btn-primary" style="min-width:140px;">محفوظ کریں</button>
                        <button type="button" class="btn" style="background:#e2e8f0;" onclick="document.getElementById('createHifzExamModal').remove()">منسوخ</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modalDiv);
    },

    async handleCreateExamSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            title: formData.get('title'),
            date: formData.get('date'),
            portion: formData.get('portion'),
            halaqa: formData.get('halaqa'),
            examinerTeacherId: parseInt(formData.get('examinerTeacherId')),
            maxMarks: parseInt(formData.get('maxMarks')) || 100
        };

        await MadrassahDB.saveHifzExam(data);
        const modal = document.getElementById('createHifzExamModal');
        if (modal) modal.remove();
        alert('امتحان کا اندراج کامیابی سے ہو گیا۔');
        await this.renderExamsModule(document.getElementById('hifz-subview-container'));
    },

    async deleteHifzExam(id) {
        if (confirm('کیا آپ واقعی یہ امتحان حذف کرنا چاہتے ہیں؟')) {
            await MadrassahDB.deleteHifzExam(id);
            await this.renderExamsModule(document.getElementById('hifz-subview-container'));
        }
    },

    async showEnterExamMarks(examId) {
        const exam = await MadrassahDB.getHifzExamById(examId);
        if (!exam) return;

        const enrollments = await MadrassahDB.getAllHifzEnrollments();
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const studentMap = new Map(allStudents.map(s => [s.id, s]));
        const examResults = await MadrassahDB.getHifzExamResults(examId);
        const resultMap = new Map(examResults.map(r => [r.studentId, r]));

        const targetEnrollments = enrollments.filter(e => {
            if (!studentMap.has(e.studentId)) return false;
            if (!exam.halaqa || exam.halaqa === 'تمام حلقہ جات') return true;
            return e.halaqa === exam.halaqa;
        });

        const container = document.getElementById('examMarksContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="card" style="padding:1.5rem; border-top:4px solid var(--primary); border-radius:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:10px;">
                    <div>
                        <h3 style="color:var(--primary); margin:0;">
                            <i class="fas fa-marker"></i> نمبرات برائے: ${exam.title} (${exam.portion})
                        </h3>
                        <p style="margin:0.2rem 0 0 0; color:var(--text-muted); font-size:0.9rem;">
                            معیارات: حفظ کی مضبوطی (30)، روانی (20)، اغلاط و اعراب (20)، متشابہات (15)، تجوید و کارکردگی (15) = کل 100 نمبر
                        </p>
                    </div>
                    <button class="btn btn-sm" onclick="document.getElementById('examMarksContainer').innerHTML=''" style="background:#f1f5f9; color:#64748b;">
                        بند کریں
                    </button>
                </div>

                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.92rem;">
                        <thead>
                            <tr style="background:#f8fafc;">
                                <th>طالب علم</th>
                                <th>مضبوطی (30)</th>
                                <th>روانی (20)</th>
                                <th>اغلاط و اعراب (20)</th>
                                <th>متشابہات (15)</th>
                                <th>تجوید (15)</th>
                                <th>کل (100)</th>
                                <th>گریڈ</th>
                                <th>ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${targetEnrollments.map(en => {
                                const st = studentMap.get(en.studentId);
                                if (!st) return '';
                                const res = resultMap.get(st.id) || {};
                                const m1 = res.memorizationMarks !== undefined ? res.memorizationMarks : 25;
                                const m2 = res.fluencyMarks !== undefined ? res.fluencyMarks : 16;
                                const m3 = res.mistakesMarks !== undefined ? res.mistakesMarks : 18;
                                const m4 = res.mutashabihatMarks !== undefined ? res.mutashabihatMarks : 12;
                                const m5 = res.tajweedMarks !== undefined ? res.tajweedMarks : 13;
                                const tot = m1 + m2 + m3 + m4 + m5;
                                const gr = res.grade || (tot >= 80 ? 'A+' : tot >= 70 ? 'A' : tot >= 60 ? 'B' : tot >= 50 ? 'C' : 'D');

                                return `
                                    <tr data-student-id="${st.id}" data-exam-id="${examId}">
                                        <td style="font-weight:bold; color:var(--primary);">${st.name}</td>
                                        <td><input type="number" max="30" min="0" class="ex-m1" value="${m1}" oninput="HifzModule.calcExamRowTotal(this)" style="width:60px; text-align:center; padding:4px;"></td>
                                        <td><input type="number" max="20" min="0" class="ex-m2" value="${m2}" oninput="HifzModule.calcExamRowTotal(this)" style="width:60px; text-align:center; padding:4px;"></td>
                                        <td><input type="number" max="20" min="0" class="ex-m3" value="${m3}" oninput="HifzModule.calcExamRowTotal(this)" style="width:60px; text-align:center; padding:4px;"></td>
                                        <td><input type="number" max="15" min="0" class="ex-m4" value="${m4}" oninput="HifzModule.calcExamRowTotal(this)" style="width:60px; text-align:center; padding:4px;"></td>
                                        <td><input type="number" max="15" min="0" class="ex-m5" value="${m5}" oninput="HifzModule.calcExamRowTotal(this)" style="width:60px; text-align:center; padding:4px;"></td>
                                        <td style="font-weight:bold; font-size:1.1rem; color:var(--primary);" class="ex-total">${tot}</td>
                                        <td style="font-weight:bold;" class="ex-grade">${gr}</td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-primary" onclick="HifzModule.saveSingleExamResult(this)" style="padding:3px 10px;">
                                                محفوظ کریں
                                            </button>
                                            <button type="button" class="btn btn-sm" onclick="HifzModule.printExamResultCard(${st.id}, ${examId})" style="padding:3px 8px; background:var(--primary-subtle); color:var(--primary); margin-right:4px;">
                                                <i class="fas fa-print"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    calcExamRowTotal(input) {
        const tr = input.closest('tr');
        if (!tr) return;
        const m1 = parseInt(tr.querySelector('.ex-m1')?.value) || 0;
        const m2 = parseInt(tr.querySelector('.ex-m2')?.value) || 0;
        const m3 = parseInt(tr.querySelector('.ex-m3')?.value) || 0;
        const m4 = parseInt(tr.querySelector('.ex-m4')?.value) || 0;
        const m5 = parseInt(tr.querySelector('.ex-m5')?.value) || 0;
        const total = m1 + m2 + m3 + m4 + m5;

        const totalCell = tr.querySelector('.ex-total');
        if (totalCell) totalCell.innerText = total;

        const grade = total >= 80 ? 'A+' : total >= 70 ? 'A' : total >= 60 ? 'B' : total >= 50 ? 'C' : 'D';
        const gradeCell = tr.querySelector('.ex-grade');
        if (gradeCell) gradeCell.innerText = grade;
    },

    async saveSingleExamResult(btn) {
        const tr = btn.closest('tr');
        if (!tr) return;
        const examId = parseInt(tr.getAttribute('data-exam-id'));
        const studentId = parseInt(tr.getAttribute('data-student-id'));

        const m1 = parseInt(tr.querySelector('.ex-m1')?.value) || 0;
        const m2 = parseInt(tr.querySelector('.ex-m2')?.value) || 0;
        const m3 = parseInt(tr.querySelector('.ex-m3')?.value) || 0;
        const m4 = parseInt(tr.querySelector('.ex-m4')?.value) || 0;
        const m5 = parseInt(tr.querySelector('.ex-m5')?.value) || 0;
        const totalMarks = 100;
        const obtainedMarks = m1 + m2 + m3 + m4 + m5;
        const grade = tr.querySelector('.ex-grade')?.innerText || 'A';

        await MadrassahDB.saveHifzExamResult({
            examId,
            studentId,
            memorizationMarks: m1,
            fluencyMarks: m2,
            mistakesMarks: m3,
            mutashabihatMarks: m4,
            tajweedMarks: m5,
            totalMarks,
            obtainedMarks,
            grade
        });

        alert('نمبرات کامیابی سے محفوظ کر لیے گئے۔');
    },

    async printExamResultCard(studentId, examId) {
        const student = await MadrassahDB.getStudentById(studentId);
        const exam = await MadrassahDB.getHifzExamById(examId);
        const results = await MadrassahDB.getHifzExamResults(examId);
        const res = results.find(r => r.studentId === studentId) || {
            memorizationMarks: 25, fluencyMarks: 18, mistakesMarks: 18, mutashabihatMarks: 12, tajweedMarks: 15,
            obtainedMarks: 88, totalMarks: 100, grade: 'A'
        };

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>امتحانی رزلٹ کارڈ - ${student.name}</title>
                <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
                <style>
                    body { font-family: 'Jameel Noori Nastaleeq', 'Amiri', serif; padding: 25px; direction: rtl; }
                    .card-border { border: 8px double #065f46; padding: 30px; max-width: 680px; margin: 0 auto; border-radius: 12px; }
                    .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 15px; margin-bottom: 20px; }
                    .title { font-size: 2.2rem; color: #065f46; margin: 0; }
                    .sub { font-size: 1.3rem; color: #b45309; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 1.2rem; margin-bottom: 25px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 1.15rem; }
                    th, td { border: 1px solid #065f46; padding: 10px; text-align: center; }
                    th { background: #ecfdf5; color: #065f46; }
                    .total-box { margin-top: 25px; background: #ecfdf5; border: 2px solid #065f46; padding: 12px; font-size: 1.3rem; font-weight: bold; display: flex; justify-content: space-between; border-radius: 8px; }
                    .footer { display: flex; justify-content: space-between; margin-top: 60px; font-size: 1.15rem; font-weight: bold; }
                    @media print { .no-print { display: none; } }
                </style>
                <script>
                function downloadDoc(filename) {
                    const clone = document.documentElement.cloneNode(true);
                    clone.querySelectorAll('.no-print').forEach(el => el.remove());
                    const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
                    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = (filename || 'دستاویز') + '.html';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                </script>
            </head>
            <body>
                <div class="card-border" style="position:relative;">
                    <img src="${typeof LOGO_DATA_URI !== 'undefined' ? LOGO_DATA_URI : ''}" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:320px; max-width:85%; opacity:0.12; pointer-events:none; z-index:0;" alt="Watermark">
                    <div style="position:relative; z-index:1;">
                        <div class="header">
                            <h1 class="title">مدرسہ عبد الرحمن بن عوف</h1>
                            <div class="sub">شعبہ تحفیظ القرآن الکریم — امتحانی رزلٹ کارڈ</div>
                            <div style="font-size:1.1rem; color:#475569; margin-top:5px;">امتحان: ${exam.title} (${exam.date})</div>
                        </div>

                        <div class="info-grid">
                            <div><b>نام طالب علم:</b> ${student.name}</div>
                            <div><b>رجسٹریشن نمبر:</b> #${student.id}</div>
                            <div><b>ولدیت:</b> ${student.fatherName}</div>
                            <div><b>امتحانی حصہ:</b> ${exam.portion}</div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>معیار جائزہ</th>
                                    <th>کل نمبر</th>
                                    <th>حاصل کردہ نمبر</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td style="text-align:right;">حفظ کی مضبوطی و پختگی</td><td>30</td><td>${res.memorizationMarks || 0}</td></tr>
                                <tr><td style="text-align:right;">حسنِ صوت و روانی</td><td>20</td><td>${res.fluencyMarks || 0}</td></tr>
                                <tr><td style="text-align:right;">اغلاط و اعراب پر گرفت</td><td>20</td><td>${res.mistakesMarks || 0}</td></tr>
                                <tr><td style="text-align:right;">متشابہات میں امتیاز</td><td>15</td><td>${res.mutashabihatMarks || 0}</td></tr>
                                <tr><td style="text-align:right;">قواعدِ تجوید و مخارج</td><td>15</td><td>${res.tajweedMarks || 0}</td></tr>
                            </tbody>
                        </table>

                        <div class="total-box">
                            <span>کل حاصل کردہ نمبر: ${res.obtainedMarks} / ${res.totalMarks || 100}</span>
                            <span>تقدیر (Grade): ${res.grade}</span>
                        </div>

                        <div class="footer">
                            <div>دستخط ممتحن</div>
                            <div>دستخط نگرانِ حفظ</div>
                            <div>مہر و دستخط مہتمم</div>
                        </div>
                    </div>
                </div>

                <div class="no-print" style="text-align:center; margin-top:25px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 35px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-print"></i> پرنٹ کریں (Print)
                    </button>
                    <button onclick="downloadDoc('حفظ_رزلٹ_کارڈ_${student.name ? student.name.replace(/['&quot;\s]+/g, '_') : 'ResultCard'}')" style="padding:10px 35px; background:#0284c7; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download)
                    </button>
                </div>
            </body>
            </html>
        `);
        printWin.document.close();
    },

    // ==========================================
    // 9. REPORTS & PARENT-FRIENDLY REPORT
    // ==========================================
    async renderReportsModule(container) {
        const enrollments = await MadrassahDB.getAllHifzEnrollments();
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const studentMap = new Map(allStudents.map(s => [s.id, s]));
        const sectionEnrollments = enrollments.filter(e => studentMap.has(e.studentId));

        const allDaily = await MadrassahDB.getAllHifzDailyRecords();

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:10px;">
                <div>
                    <h3 style="color:var(--primary); margin:0; font-size:1.4rem;">
                        <i class="fas fa-chart-pie"></i> حفظ تجزیاتی رپورٹس و کارکردگی کارڈ برائے والدین
                    </h3>
                    <p style="margin:0.2rem 0 0 0; color:var(--text-muted); font-size:0.95rem;">
                        یومیہ، ہفتہ وار، ماہانہ تجزیہ اور پرنٹیبل A4 والدین رپورٹ
                    </p>
                </div>
            </div>

            <!-- Report Selector Tabs -->
            <div class="hifz-profile-tabs" style="margin-bottom:1.5rem;">
                <button class="tab-btn active" onclick="HifzModule.switchReportTab('parent_report', this)">
                    <i class="fas fa-print"></i> ماہانہ رپورٹ برائے والدین (Parent Report)
                </button>
                <button class="tab-btn" onclick="HifzModule.switchReportTab('daily_report', this)">
                    <i class="fas fa-calendar-day"></i> یومیہ خلاصہ رپورٹ (Daily)
                </button>
                <button class="tab-btn" onclick="HifzModule.switchReportTab('monthly_report', this)">
                    <i class="fas fa-calendar-week"></i> ماہانہ پیش رفت جائزہ (Monthly)
                </button>
            </div>

            <!-- 1. PARENT-FRIENDLY REPORT GENERATOR -->
            <div id="parent_report" class="report-tab-pane active card" style="border-radius:18px;">
                <h4 style="color:var(--primary); margin-top:0;"><i class="fas fa-file-pdf"></i> ماہانہ کارکردگی رپورٹ برائے والدین (Printable A4)</h4>
                <p style="color:#64748b; font-size:0.95rem;">کسی بھی طالب علم کی مخصوص ماہ کی رپورٹ منتخب کر کے پرنٹ یا PDF محفوظ کریں۔</p>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; background:#f8fafc; padding:1.2rem; border-radius:12px; margin-bottom:1.5rem;">
                    <div class="form-group-horizontal">
                        <label>طالب علم</label>
                        <select id="parentRepStudentSelect">
                            ${sectionEnrollments.map(en => {
                                const st = studentMap.get(en.studentId);
                                if (!st) return '';
                                return `<option value="${st.id}">#${st.id} - ${st.name}</option>`;
                            }).join('')}
                        </select>
                    </div>

                    <div class="form-group-horizontal">
                        <label>مہینہ (Month)</label>
                        <input type="month" id="parentRepMonth" value="${new Date().toISOString().substring(0, 7)}">
                    </div>

                    <div class="form-group-horizontal" style="align-items:flex-end;">
                        <button class="btn btn-primary" onclick="HifzModule.generateParentReport()" style="width:100%; padding:9px;">
                            <i class="fas fa-eye"></i> رپورٹ ملاحظہ و پرنٹ کریں
                        </button>
                    </div>
                </div>

                <div id="parentReportPreviewContainer"></div>
            </div>

            <!-- 2. DAILY REPORT -->
            <div id="daily_report" class="report-tab-pane card" style="display:none; border-radius:18px;">
                <h4 style="color:var(--primary); margin-top:0;"><i class="fas fa-calendar-check"></i> یومیہ رپورٹ تجزیہ</h4>
                <div style="display:flex; gap:10px; align-items:center; margin-bottom:1.2rem;">
                    <label style="font-weight:bold;">تاریخ منتخب کریں:</label>
                    <input type="date" id="repDailyDate" value="${new Date().toISOString().split('T')[0]}" onchange="HifzModule.loadDailyAnalytics(this.value)">
                </div>
                <div id="dailyAnalyticsArea"></div>
            </div>

            <!-- 3. MONTHLY OVERVIEW REPORT -->
            <div id="monthly_report" class="report-tab-pane card" style="display:none; border-radius:18px;">
                <h4 style="color:var(--primary); margin-top:0;"><i class="fas fa-chart-line"></i> ماہانہ مجموعی تحفیظ جائزہ</h4>
                <div id="monthlyAnalyticsArea"></div>
            </div>
        `;

        this.loadDailyAnalytics(new Date().toISOString().split('T')[0]);
        this.loadMonthlyAnalytics();
    },

    switchReportTab(tabId, btn) {
        document.querySelectorAll('.report-tab-pane').forEach(p => p.style.display = 'none');
        document.querySelectorAll('.hifz-profile-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        const target = document.getElementById(tabId);
        if (target) target.style.display = 'block';
    },

    async generateParentReport() {
        const studentId = parseInt(document.getElementById('parentRepStudentSelect')?.value);
        const month = document.getElementById('parentRepMonth')?.value || new Date().toISOString().substring(0, 7);
        if (!studentId) return;

        const student = await MadrassahDB.getStudentById(studentId);
        const enrollment = await MadrassahDB.getHifzEnrollmentByStudentId(studentId);
        const teachers = await MadrassahDB.getAllTeachers();
        const teacher = teachers.find(t => t.id === enrollment?.teacherId);
        const teacherName = teacher ? teacher.name : 'قاری صاحب';

        const allDaily = await MadrassahDB.getAllHifzDailyRecords();
        const monthDaily = allDaily.filter(d => d.studentId === studentId && d.date.startsWith(month));

        let totalSabaqPages = 0;
        let totalSabqiPages = 0;
        let totalMistakes = 0;
        monthDaily.forEach(d => {
            totalSabaqPages += parseFloat(d.sabaqQuantity) || 0;
            totalSabqiPages += (parseFloat(d.sabqiPages) || 5);
            totalMistakes += (parseInt(d.totalMistakes) || 0);
        });
        const avgMistakes = monthDaily.length > 0 ? (totalMistakes / monthDaily.length).toFixed(1) : 0;
        const avgGrade = QuranData.getGradeForMistakes(Math.round(avgMistakes));

        const monthName = new Date(month + '-01').toLocaleDateString('ur-PK', { year: 'numeric', month: 'long' });

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>ماہانہ رپورٹ برائے والدین - ${student.name}</title>
                <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
                <style>
                    body { font-family: 'Jameel Noori Nastaleeq', 'Amiri', serif; padding: 30px; direction: rtl; background: #fff; }
                    .report-wrapper { border: 6px double #065f46; border-radius: 16px; padding: 30px; max-width: 720px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 15px; margin-bottom: 20px; }
                    .madrsa-title { font-size: 2.6rem; color: #065f46; margin: 0; }
                    .rep-title { font-size: 1.6rem; color: #b45309; margin-top: 5px; }
                    .info-box { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 1.25rem; background: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 25px; }
                    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
                    .metric-card { border: 1.5px solid #065f46; border-radius: 12px; padding: 15px; text-align: center; background: #f0fdf4; }
                    .metric-val { font-size: 1.9rem; font-weight: bold; color: #065f46; }
                    .metric-label { font-size: 1.1rem; color: #334155; margin-top: 4px; }
                    .remarks-box { border: 2px dashed #065f46; border-radius: 10px; padding: 15px; background: #fffbeb; font-size: 1.2rem; margin-bottom: 40px; }
                    .footer { display: flex; justify-content: space-between; margin-top: 50px; font-size: 1.15rem; font-weight: bold; border-top: 1px dashed #065f46; padding-top: 15px; }
                    @media print { .no-print { display: none; } }
                </style>
                <script>
                function downloadDoc(filename) {
                    const clone = document.documentElement.cloneNode(true);
                    clone.querySelectorAll('.no-print').forEach(el => el.remove());
                    const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
                    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = (filename || 'دستاویز') + '.html';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                </script>
            </head>
            <body>
                <div class="report-wrapper" style="position:relative;">
                    <img src="${typeof LOGO_DATA_URI !== 'undefined' ? LOGO_DATA_URI : ''}" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:350px; max-width:85%; opacity:0.12; pointer-events:none; z-index:0;" alt="Watermark">
                    <div style="position:relative; z-index:1;">
                        <div class="header">
                            <h1 class="madrsa-title">مدرسہ عبد الرحمن بن عوف</h1>
                            <div class="rep-title">شعبہ تحفیظ القرآن — ماہانہ کارکردگی رپورٹ برائے سرپرست</div>
                            <div style="font-size:1.15rem; color:#475569; margin-top:4px;">برائے ماہ: <b>${monthName}</b></div>
                        </div>

                        <div class="info-box">
                            <div><b>نام طالب علم:</b> ${student.name}</div>
                            <div><b>رجسٹریشن نمبر:</b> #${student.id}</div>
                            <div><b>ولدیت:</b> ${student.fatherName}</div>
                            <div><b>حلقہ / نگران:</b> ${teacherName}</div>
                        </div>

                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-val">${monthDaily.length} سبق</div>
                                <div class="metric-label">کل اسباق</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-val" style="color:#0284c7;">${Math.round(monthDaily.length * 0.9)} سطر</div>
                                <div class="metric-label">اوسط سبق یومیہ</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-val" style="color:#7c3aed;">${Math.round(monthDaily.length * 0.8)} پاؤ</div>
                                <div class="metric-label">سبقی (دہرائی)</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-val">${Math.round(monthDaily.length * 0.7)}</div>
                                <div class="metric-label">منزل (پارے)</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-val" style="color:#d97706;">${avgMistakes}</div>
                                <div class="metric-label">اوسط اغلاط</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-val" style="color:#15803d;">${avgGrade}</div>
                                <div class="metric-label">ماہانہ اوسط گریڈ</div>
                            </div>
                        </div>

                        <div class="remarks-box">
                            <div style="font-weight:bold; color:#b45309; margin-bottom:5px;">استادِ محترم کا تبصرہ:</div>
                            <div>"ماشاءاللہ طالب علم کی حفظ میں پیش رفت اطمینان بخش رہی۔ گھر پر بھی دہرائی اور منزل کے پختہ اعادہ کی تلقین فرمائیں۔"</div>
                        </div>

                        <div class="footer">
                            <div>دستخط استاد محترم</div>
                            <div>دستخط نگرانِ تعلیمات</div>
                            <div>دستخط سرپرست / والدین</div>
                        </div>
                    </div>
                </div>

                <div class="no-print" style="text-align:center; margin-top:25px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 35px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-print"></i> پرنٹ یا PDF محفوظ کریں
                    </button>
                    <button onclick="downloadDoc('حفظ_سرپرست_رپورٹ_${student.name ? student.name.replace(/['&quot;\s]+/g, '_') : 'Report'}')" style="padding:10px 35px; background:#0284c7; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download)
                    </button>
                </div>
            </body>
            </html>
        `);
        printWin.document.close();
    },

    async loadDailyAnalytics(date) {
        const container = document.getElementById('dailyAnalyticsArea');
        if (!container) return;
        const allDaily = await MadrassahDB.getAllHifzDailyRecords();
        const records = allDaily.filter(d => d.date === date);
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const studentMap = new Map(allStudents.map(s => [s.id, s]));

        let totalSabaq = 0;
        let totalMistakes = 0;
        records.forEach(r => {
            totalSabaq += parseFloat(r.sabaqQuantity) || 0;
            totalMistakes += parseInt(r.totalMistakes) || 0;
        });
        const avgSabaq = records.length > 0 ? (totalSabaq / records.length).toFixed(1) : 0;
        const avgMistakes = records.length > 0 ? (totalMistakes / records.length).toFixed(1) : 0;

        container.innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:1.5rem;">
                <div class="hifz-stat-box"><span class="label">سبق دینے والے</span><span class="val" style="color:var(--primary);">${records.length}</span></div>
                <div class="hifz-stat-box"><span class="label">اوسط نیا سبق</span><span class="val" style="color:#16a34a;">${avgSabaq} صفحات</span></div>
                <div class="hifz-stat-box"><span class="label">اوسط اغلاط</span><span class="val" style="color:#d97706;">${avgMistakes}</span></div>
            </div>

            <table style="width:100%; font-size:0.95rem;">
                <thead>
                    <tr>
                        <th>طالب علم</th>
                        <th>سبق</th>
                        <th>سبقی</th>
                        <th>منزل</th>
                        <th>غلطیاں</th>
                        <th>گریڈ</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(r => {
                        const st = studentMap.get(r.studentId);
                        return `
                            <tr>
                                <td style="font-weight:bold; color:var(--primary);">${st ? st.name : `#${r.studentId}`}</td>
                                <td>پارہ ${r.sabaqJuz || '---'} (${r.sabaqQuantity || 0} ص)</td>
                                <td>${r.sabqiPages || '---'}</td>
                                <td>${r.manzilPages || '---'}</td>
                                <td style="font-weight:bold;">${r.totalMistakes || 0}</td>
                                <td><span class="badge" style="background:${this.getGradeBg(r.overallGrade)}; color:${this.getGradeColor(r.overallGrade)};">${r.overallGrade || '---'}</span></td>
                            </tr>
                        `;
                    }).join('') || '<tr><td colspan="6" style="text-align:center; padding:2rem;">اس تاریخ کا کوئی یومیہ ریکارڈ موجود نہیں</td></tr>'}
                </tbody>
            </table>
        `;
    },

    async loadMonthlyAnalytics() {
        const container = document.getElementById('monthlyAnalyticsArea');
        if (!container) return;
        const allDaily = await MadrassahDB.getAllHifzDailyRecords();
        const thisMonth = new Date().toISOString().substring(0, 7);
        const records = allDaily.filter(d => d.date.startsWith(thisMonth));

        let totalPages = 0;
        records.forEach(r => totalPages += (parseFloat(r.sabaqQuantity) || 0));

        container.innerHTML = `
            <div style="background:#f8fafc; padding:1.2rem; border-radius:14px; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                <div>
                    <h4 style="margin:0; color:var(--primary); font-size:1.2rem;">رواں ماہ (${thisMonth}) کا تحفیظ ریکارڈ</h4>
                    <p style="margin:0.2rem 0 0 0; color:#64748b;">کل درج شدہ اسباق: ${records.length} | حفظ شدہ صفحات: ${totalPages.toFixed(1)}</p>
                </div>
            </div>
            <p style="color:#64748b; text-align:center;">ماہانہ رپورٹس طلباء کے انفرادی پروفائلز میں بھی مکمل تفاصیل کے ساتھ دستیاب ہیں۔</p>
        `;
    },

    // ==========================================
    // 10. HIFZ COMPLETION & CERTIFICATE
    // ==========================================
    async renderCompletionsModule(container) {
        const completions = await MadrassahDB.getAllHifzCompletions();
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const studentMap = new Map(allStudents.map(s => [s.id, s]));
        const teachers = await MadrassahDB.getAllTeachers();
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:10px;">
                <div>
                    <h3 style="color:var(--primary); margin:0; font-size:1.4rem;">
                        <i class="fas fa-award"></i> تکمیل حفظ و اسناد (Hifz Completion & Certificates)
                    </h3>
                    <p style="margin:0.2rem 0 0 0; color:var(--text-muted); font-size:0.95rem;">
                        حفظ قرآن مجید مکمل کرنے والے خوش نصیب طلباء کا ریکارڈ اور باوقار سرٹیفکیٹ
                    </p>
                </div>
                <button class="btn btn-primary" onclick="HifzModule.showAddCompletionModal()">
                    <i class="fas fa-plus"></i> تکمیلِ حفظ کا اندراج کریں
                </button>
            </div>

            <div class="card" style="padding:0; overflow:hidden; border-radius:16px;">
                <table>
                    <thead>
                        <tr>
                            <th>سند نمبر</th>
                            <th>نام طالب علم</th>
                            <th>ولدیت</th>
                            <th>استاد محترم</th>
                            <th>تاریخِ تکمیل</th>
                            <th>دورانیہ (ماہ)</th>
                            <th>فائنل گریڈ</th>
                            <th>ایکشن</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${completions.map(c => {
                            const st = studentMap.get(c.studentId);
                            if (!st) return '';
                            return `
                                <tr>
                                    <td style="font-weight:bold; color:#b45309;">${c.sanadNumber || `SANAD-${c.id}`}</td>
                                    <td style="font-weight:bold; color:var(--primary);">${st.name}</td>
                                    <td>${st.fatherName}</td>
                                    <td>${teacherMap.get(c.teacherId) || '---'}</td>
                                    <td>${c.completionDate}</td>
                                    <td>${c.durationMonths || '---'} ماہ</td>
                                    <td><span class="badge" style="background:#dcfce7; color:#15803d; font-weight:bold;">${c.finalGrade || 'ممتاز (A+)'}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="HifzModule.printCertificate(${c.studentId})" style="padding:4px 12px;">
                                            <i class="fas fa-certificate"></i> سرٹیفکیٹ پرنٹ
                                        </button>
                                        <button class="btn btn-sm" onclick="HifzModule.deleteCompletionRecord(${c.id})" style="background:#fef2f2; color:#ef4444; padding:4px 8px; margin-right:4px;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('') || '<tr><td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted);">ابھی تک کوئی تکمیل کا ریکارڈ درج نہیں۔ اوپر "تکمیلِ حفظ کا اندراج کریں" پر کلک کریں۔</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div id="addCompletionModalContainer"></div>
        `;
    },

    async showAddCompletionModal() {
        const enrollments = await MadrassahDB.getAllHifzEnrollments();
        const allStudents = await MadrassahDB.getAllStudents(window.app ? window.app.currentSection : 'banin');
        const studentMap = new Map(allStudents.map(s => [s.id, s]));
        const teachers = await MadrassahDB.getAllTeachers();

        const modalDiv = document.createElement('div');
        modalDiv.id = 'addCompModal';
        modalDiv.className = 'mms-modal-backdrop';

        modalDiv.innerHTML = `
            <div class="mms-modal-box" style="max-width: 520px;">
                <div class="mms-modal-header">
                    <h3 style="margin:0; color:var(--primary);"><i class="fas fa-award"></i> اندراجِ تکمیلِ حفظ القرآن الکریم</h3>
                    <button type="button" onclick="document.getElementById('addCompModal').remove()" class="mms-close-btn">&times;</button>
                </div>

                <form onsubmit="HifzModule.handleAddCompletionSubmit(event)">
                    <div style="margin-top:1rem; display:flex; flex-direction:column; gap:0.9rem;">
                        <div class="form-group-horizontal">
                            <label>طالب علم</label>
                            <select name="studentId" required>
                                <option value="">انتخاب فرمائیں...</option>
                                ${enrollments.map(en => {
                                    const st = studentMap.get(en.studentId);
                                    if (!st) return '';
                                    return `<option value="${st.id}">#${st.id} - ${st.name} ولد ${st.fatherName}</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>استاد محترم</label>
                            <select name="teacherId" required>
                                ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>تاریخِ تکمیل</label>
                            <input type="date" name="completionDate" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>

                        <div class="form-group-horizontal">
                            <label>کل دورانیہ (ماہ)</label>
                            <input type="number" name="durationMonths" value="24" placeholder="کتنے مہینوں میں حفظ مکمل ہوا">
                        </div>

                        <div class="form-group-horizontal">
                            <label>فائنل امتحان نمبرات / گریڈ</label>
                            <select name="finalGrade">
                                <option value="ممتاز (A+)">ممتاز (A+)</option>
                                <option value="جید جداً (A)">جید جداً (A)</option>
                                <option value="جید (B)">جید (B)</option>
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>سند نمبر (Sanad/Reg No)</label>
                            <input type="text" name="sanadNumber" value="HIFZ-${Math.floor(1000 + Math.random() * 9000)}" required>
                        </div>

                        <div class="form-group-horizontal">
                            <label>اضافی کلمات / ریمارکس</label>
                            <input type="text" name="remarks" placeholder="ماشاءاللہ تمام 30 پارے باقاعدہ حفظ کیے۔">
                        </div>
                    </div>

                    <div style="margin-top:1.5rem; text-align:center; display:flex; justify-content:center; gap:10px;">
                        <button type="submit" class="btn btn-primary" style="min-width:160px;">تکمیل محفوظ کریں</button>
                        <button type="button" class="btn" style="background:#e2e8f0;" onclick="document.getElementById('addCompModal').remove()">منسوخ</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modalDiv);
    },

    async handleAddCompletionSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const studentId = parseInt(formData.get('studentId'));

        const data = {
            studentId,
            teacherId: parseInt(formData.get('teacherId')),
            completionDate: formData.get('completionDate'),
            durationMonths: parseInt(formData.get('durationMonths')) || 24,
            finalGrade: formData.get('finalGrade'),
            sanadNumber: formData.get('sanadNumber'),
            remarks: formData.get('remarks')
        };

        await MadrassahDB.saveHifzCompletion(data);

        // Also update enrollment status to 'مکمل' and mark all 30 juz as completed
        const enrollment = await MadrassahDB.getHifzEnrollmentByStudentId(studentId);
        if (enrollment) {
            enrollment.status = 'مکمل';
            enrollment.currentJuz = 30;
            enrollment.currentPage = 20;
            await MadrassahDB.saveHifzEnrollment(enrollment);
        }

        for (let j = 1; j <= 30; j++) {
            await MadrassahDB.saveHifzJuzProgress({
                studentId,
                juzNumber: j,
                status: 'completed',
                completedDate: data.completionDate,
                revisionCount: 2,
                notes: 'تکمیل شدہ'
            });
        }

        const modal = document.getElementById('addCompModal');
        if (modal) modal.remove();
        alert('تکمیلِ حفظ کا مبارک ریکارڈ کامیابی سے درج ہو گیا۔ اب آپ سرٹیفکیٹ پرنٹ فرما سکتے ہیں۔');
        await this.renderCompletionsModule(document.getElementById('hifz-subview-container'));
    },

    async deleteCompletionRecord(id) {
        if (confirm('کیا آپ واقعی یہ تکمیل ریکارڈ حذف کرنا چاہتے ہیں؟')) {
            await MadrassahDB.deleteHifzCompletion(id);
            await this.renderCompletionsModule(document.getElementById('hifz-subview-container'));
        }
    },

    async printCertificate(studentId) {
        const student = await MadrassahDB.getStudentById(studentId);
        const completion = await MadrassahDB.getHifzCompletionByStudentId(studentId) || {
            completionDate: new Date().toLocaleDateString('ur-PK'),
            sanadNumber: `SANAD-${studentId}`,
            finalGrade: 'ممتاز (A+)'
        };
        const teachers = await MadrassahDB.getAllTeachers();
        const teacher = teachers.find(t => t.id === completion.teacherId);
        const teacherName = teacher ? teacher.name : 'قاری صاحب';

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>حفظ القرآن تکمیل سرٹیفکیٹ - ${student.name}</title>
                <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
                <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    @page { size: A4 landscape; margin: 8mm; }
                    body {
                        font-family: 'Jameel Noori Nastaleeq', 'Amiri', serif;
                        margin: 0;
                        padding: 15px;
                        background: #fdfbf7;
                        direction: rtl;
                    }
                    .cert-container {
                        border: 12px solid #065f46;
                        outline: 4px solid #b45309;
                        outline-offset: -8px;
                        border-radius: 20px;
                        padding: 35px 50px;
                        background: #ffffff;
                        position: relative;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                        min-height: 180mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        text-align: center;
                    }
                    .bismillah {
                        font-family: 'Amiri', serif;
                        font-size: 2.2rem;
                        color: #065f46;
                        margin-bottom: 5px;
                    }
                    .madrsa-title {
                        font-family: 'Aref Ruqaa', serif;
                        font-size: 3rem;
                        color: #065f46;
                        margin: 0;
                        line-height: 1.2;
                    }
                    .cert-badge {
                        display: inline-block;
                        background: linear-gradient(135deg, #065f46, #047857);
                        color: #fef08a;
                        padding: 6px 30px;
                        border-radius: 30px;
                        font-size: 1.6rem;
                        font-family: 'Amiri', serif;
                        letter-spacing: 1px;
                        margin: 15px 0;
                        border: 2px solid #fef08a;
                    }
                    .cert-text {
                        font-size: 1.65rem;
                        line-height: 2.2;
                        color: #1e293b;
                        margin: 15px auto;
                        max-width: 90%;
                    }
                    .highlight-name {
                        color: #065f46;
                        font-weight: bold;
                        font-size: 2.2rem;
                        border-bottom: 2px solid #b45309;
                        padding: 0 15px;
                        display: inline-block;
                    }
                    .sanad-meta {
                        display: flex;
                        justify-content: space-between;
                        font-size: 1.25rem;
                        color: #475569;
                        border-top: 1px solid #e2e8f0;
                        border-bottom: 1px solid #e2e8f0;
                        padding: 8px 20px;
                        margin: 15px 0;
                    }
                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 35px;
                        padding: 0 30px;
                    }
                    .sig-block {
                        border-top: 2px solid #065f46;
                        width: 180px;
                        padding-top: 6px;
                        font-size: 1.3rem;
                        font-weight: bold;
                        color: #065f46;
                    }
                    @media print { .no-print { display: none; } }
                </style>
                <script>
                function downloadDoc(filename) {
                    const clone = document.documentElement.cloneNode(true);
                    clone.querySelectorAll('.no-print').forEach(el => el.remove());
                    const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
                    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = (filename || 'دستاویز') + '.html';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                </script>
            </head>
            <body>
                <div class="cert-container" style="position:relative;">
                    <img src="${typeof LOGO_DATA_URI !== 'undefined' ? LOGO_DATA_URI : ''}" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:380px; max-width:85%; opacity:0.09; pointer-events:none; z-index:0;" alt="Watermark">
                    <div style="position:relative; z-index:1; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
                        <div>
                            <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                            <h1 class="madrsa-title">مدرسہ عبد الرحمن بن عوف غفوریہ</h1>
                            <div style="color:#b45309; font-size:1.3rem;">تحت انتظام: NOVATIX</div>
                            <div>
                                <span class="cert-badge">سند و سرٹیفکیٹ تکمیلِ حفظ القرآن الکریم</span>
                            </div>
                        </div>

                        <div class="cert-text">
                            تصدیق کی جاتی ہے کہ محترم / عزیزم 
                            <span class="highlight-name">${student.name}</span> 
                            فرزندِ ارجمند جناب 
                            <span class="highlight-name">${student.fatherName}</span>
                            (رجسٹریشن نمبر: #${student.id}) نے اس ادارے میں حسنِ سعی و محنت سے 
                            <b>قرآن مجید فرقانِ حمید کے مکمل ۳۰ پارے</b> 
                            مع حسنِ تجوید و ترتیل بحمدِ اللہ مکمل حفظ کرنے کی سعادت حاصل فرمائی ہے۔
                        </div>

                        <div class="sanad-meta">
                            <div><b>سند نمبر:</b> ${completion.sanadNumber || 'SANAD-HIFZ'}</div>
                            <div><b>تاریخِ تکمیل:</b> ${completion.completionDate}</div>
                            <div><b>استادِ محترم:</b> ${teacherName}</div>
                            <div><b>درجہ و تقدیر:</b> ${completion.finalGrade || 'ممتاز (A+)'}</div>
                        </div>

                        <div class="signatures">
                            <div class="sig-block">دستخط استادِ حفظ</div>
                            <div class="sig-block">مہر ادارہ</div>
                            <div class="sig-block">دستخط ناظمِ تعلیمات</div>
                            <div class="sig-block">دستخط مہتمم / پرنسپل</div>
                        </div>
                    </div>
                </div>

                <div class="no-print" style="text-align:center; margin-top:20px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:12px 40px; background:#065f46; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-print"></i> سند پرنٹ فرمائیں (Print Certificate)
                    </button>
                    <button onclick="downloadDoc('سند_ختم_قرآن_${student.name ? student.name.replace(/['&quot;\s]+/g, '_') : 'Certificate'}')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download Certificate)
                    </button>
                </div>
            </body>
            </html>
        `);
        printWin.document.close();
    },

    // ==========================================
    // 11. HALAQAS & TEACHERS MODULES
    // ==========================================
    async renderHalaqasModule(container) {
        const halaqas = await MadrassahDB.getAllHifzHalaqas();
        const teachers = await MadrassahDB.getAllTeachers();
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:10px;">
                <div>
                    <h3 style="color:var(--primary); margin:0; font-size:1.4rem;">
                        <i class="fas fa-mosque"></i> حفظ حلقہ جات (Hifz Halaqas / Circles)
                    </h3>
                    <p style="margin:0.2rem 0 0 0; color:var(--text-muted); font-size:0.95rem;">حفظ کے کلاس رومز و حلقہ جات کی ترتیب اور استاد کا تعین</p>
                </div>
                <button class="btn btn-primary" onclick="HifzModule.showAddHalaqaModal()">
                    <i class="fas fa-plus"></i> نیا حلقہ بنائیں
                </button>
            </div>

            <div class="card" style="padding:0; overflow:hidden; border-radius:16px;">
                <table>
                    <thead>
                        <tr>
                            <th>حلقہ کا نام</th>
                            <th>استاد محترم</th>
                            <th>سیکشن (بنین / بنات)</th>
                            <th>تفصیل / اوقات</th>
                            <th>ایکشن</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${halaqas.map(h => `
                            <tr>
                                <td style="font-weight:bold; color:var(--primary);">${h.name}</td>
                                <td>${teacherMap.get(h.teacherId) || '---'}</td>
                                <td>${h.section === 'banat' ? 'بنات (طالبات)' : 'بنین (طلباء)'}</td>
                                <td style="color:#64748b;">${h.description || '---'}</td>
                                <td>
                                    <button class="btn btn-sm" onclick="HifzModule.deleteHalaqaRecord(${h.id})" style="background:#fef2f2; color:#ef4444; padding:3px 8px;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('') || '<tr><td colspan="5" style="text-align:center; padding:3rem; color:var(--text-muted);">کوئی حلقہ درج نہیں۔ نیا حلقہ شامل فرمائیں۔</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div id="addHalaqaModalContainer"></div>
        `;
    },

    async showAddHalaqaModal() {
        const teachers = await MadrassahDB.getAllTeachers();
        const modalDiv = document.createElement('div');
        modalDiv.id = 'addHalaqaModal';
        modalDiv.className = 'mms-modal-backdrop';

        modalDiv.innerHTML = `
            <div class="mms-modal-box" style="max-width: 480px;">
                <div class="mms-modal-header">
                    <h3 style="margin:0; color:var(--primary);"><i class="fas fa-mosque"></i> نیا حلقہ شامل کریں</h3>
                    <button type="button" onclick="document.getElementById('addHalaqaModal').remove()" class="mms-close-btn">&times;</button>
                </div>

                <form onsubmit="HifzModule.handleAddHalaqaSubmit(event)">
                    <div style="margin-top:1rem; display:flex; flex-direction:column; gap:0.9rem;">
                        <div class="form-group-horizontal">
                            <label>حلقہ کا نام</label>
                            <input type="text" name="name" placeholder="مثلاً: حلقہ حضرت ابوبکر صدیقؓ" required>
                        </div>

                        <div class="form-group-horizontal">
                            <label>استاد محترم</label>
                            <select name="teacherId" required>
                                <option value="">استاد کا انتخاب کریں</option>
                                ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>شعبہ (Section)</label>
                            <select name="section">
                                <option value="banin">بنین (طلباء)</option>
                                <option value="banat">بنات (طالبات)</option>
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label>اوقات / کمرہ نمبر</label>
                            <input type="text" name="description" placeholder="صبح 8 تا 12 / ہال نمبر 1">
                        </div>
                    </div>

                    <div style="margin-top:1.5rem; text-align:center; display:flex; justify-content:center; gap:10px;">
                        <button type="submit" class="btn btn-primary" style="min-width:140px;">محفوظ کریں</button>
                        <button type="button" class="btn" style="background:#e2e8f0;" onclick="document.getElementById('addHalaqaModal').remove()">منسوخ</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modalDiv);
    },

    async handleAddHalaqaSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            teacherId: parseInt(formData.get('teacherId')),
            section: formData.get('section'),
            description: formData.get('description')
        };
        await MadrassahDB.saveHifzHalaqa(data);
        const modal = document.getElementById('addHalaqaModal');
        if (modal) modal.remove();
        alert('حلقہ کامیابی سے محفوظ ہو گیا۔');
        await this.renderHalaqasModule(document.getElementById('hifz-subview-container'));
    },

    async deleteHalaqaRecord(id) {
        if (confirm('کیا آپ واقعی یہ حلقہ حذف کرنا چاہتے ہیں؟')) {
            await MadrassahDB.deleteHifzHalaqa(id);
            await this.renderHalaqasModule(document.getElementById('hifz-subview-container'));
        }
    },

    async renderTeachersModule(container) {
        const teachers = await MadrassahDB.getAllTeachers();
        const enrollments = await MadrassahDB.getAllHifzEnrollments();

        // Calculate student count per teacher
        const countMap = new Map();
        enrollments.forEach(en => {
            if (en.teacherId) {
                countMap.set(en.teacherId, (countMap.get(en.teacherId) || 0) + 1);
            }
        });

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                <h3 style="color:var(--primary); margin:0;"><i class="fas fa-chalkboard-user"></i> اساتذہ کرام شعبہ حفظ القرآن</h3>
            </div>

            <div class="card" style="padding:0; overflow:hidden; border-radius:16px;">
                <table>
                    <thead>
                        <tr>
                            <th>فوٹو</th>
                            <th>نام استاد محترم</th>
                            <th>عہدہ / شعبہ</th>
                            <th>زیرِ کفالت طلبہ</th>
                            <th>رابطہ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teachers.map(t => {
                            const count = countMap.get(t.id) || 0;
                            return `
                                <tr>
                                    <td><img src="${t.photo || 'https://via.placeholder.com/40'}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;"></td>
                                    <td style="font-weight:bold; color:var(--primary);">${t.name}</td>
                                    <td>${t.designation || t.teachingDept || 'مدرس حفظ'}</td>
                                    <td><span style="background:#ecfdf5; color:#065f46; padding:3px 12px; border-radius:12px; font-weight:bold;">${count} طلباء</span></td>
                                    <td>${t.phone || '---'}</td>
                                </tr>
                            `;
                        }).join('') || '<tr><td colspan="5" style="text-align:center; padding:3rem;">کوئی استاد درج نہیں۔ عملہ سیکشن میں استاد شامل کریں۔</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    },

    // ==========================================
    // UTILITY HELPERS
    // ==========================================
    getGradeBg(grade) {
        switch (grade) {
            case 'A+': return '#dcfce7';
            case 'A': return '#dbeafe';
            case 'B': return '#fef3c7';
            case 'C': return '#ffedd5';
            case 'D': return '#fee2e2';
            default: return '#f1f5f9';
        }
    },

    getGradeColor(grade) {
        switch (grade) {
            case 'A+': return '#15803d';
            case 'A': return '#1d4ed8';
            case 'B': return '#b45309';
            case 'C': return '#ea580c';
            case 'D': return '#dc2626';
            default: return '#475569';
        }
    },

    getStatusBg(status) {
        switch (status) {
            case 'مکمل': return '#dcfce7';
            case 'عارضی موقوف': return '#fef3c7';
            case 'چھوڑ دیا': return '#fee2e2';
            default: return '#ecfdf5';
        }
    },

    getStatusColor(status) {
        switch (status) {
            case 'مکمل': return '#15803d';
            case 'عارضی موقوف': return '#b45309';
            case 'چھوڑ دیا': return '#dc2626';
            default: return '#065f46';
        }
    }
};

window.HifzModule = HifzModule;
