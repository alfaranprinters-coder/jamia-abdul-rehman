// Hifz Management Module (حفظ القرآن مینجمنٹ سسٹم)
// Madrasah Pro Manager - Offline Version
// Architecture & Implementation by Advanced Agentic Engineer

const HifzModule = {
    currentSubView: 'dashboard',
    selectedHalaqaId: 'all',
    selectedStudentId: null,
    bulkDate: new Date().toISOString().split('T')[0],
    dailyDate: new Date().toISOString().split('T')[0],
    examSubTab: 'list',
    activeExamId: null,
    collectiveSearch: '',
    collectiveStatusFilter: 'all',
    collectiveHalaqaFilter: 'all',
    collectiveSort: 'position',
    showPositions: true,
    awardListActiveExamId: null,
    awardListSelectedClass: 'all',
    awardListSection: null,
    awardListMaxQuran: 100,
    awardListMaxNamaz: 50,
    awardListMaxQaida: 50,

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

        // Filter by section and sort ascending by student ID so new student appears at the end
        const sectionEnrollments = enrollments
            .filter(e => studentMap.has(e.studentId))
            .sort((a, b) => (parseInt(a.studentId || a.id || 0) - parseInt(b.studentId || b.id || 0)));

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
                            <label style="font-weight:bold; color:var(--primary);"><i class="fas fa-book-open"></i> شروع / موجودہ پارہ</label>
                            <select name="currentJuz" id="hifzEnrollJuzSelect" onchange="HifzModule.onEnrollJuzChange(this.value)" required style="font-weight:600;">
                                ${QuranData.paras.map(p => `<option value="${p.id}" ${(existing ? existing.currentJuz === p.id : p.id === 1) ? 'selected' : ''}>پارہ ${p.id} (${p.name})</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group-horizontal">
                            <label style="font-weight:bold; color:var(--primary);"><i class="fas fa-quran"></i> موجودہ سورت (متعلقہ پارہ)</label>
                            <select name="currentSurah" id="hifzEnrollSurahSelect" required style="font-weight:600;">
                                <option value="">سورت کا انتخاب کریں...</option>
                            </select>
                        </div>

                        <div class="form-group-horizontal" style="grid-column:span 2;">
                            <label>موجودہ صفحہ (1 تا 20)</label>
                            <input type="number" name="currentPage" min="1" max="20" value="${existing ? existing.currentPage : 1}">
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

        // Dynamically load surahs matching current Juz
        const initialJuz = existing ? (parseInt(existing.currentJuz) || 1) : 1;
        const initialSurah = existing ? (existing.currentSurah || '') : '';
        this.onEnrollJuzChange(initialJuz, initialSurah);
    },

    onEnrollJuzChange(juzNumber, selectedSurah = '') {
        const surahSelect = document.getElementById('hifzEnrollSurahSelect');
        if (!surahSelect) return;
        const surahs = (typeof QuranData !== 'undefined' && QuranData.getSurahsForPara) 
            ? QuranData.getSurahsForPara(juzNumber) 
            : [];
        
        if (surahs.length > 0) {
            surahSelect.innerHTML = '<option value="">سورت کا انتخاب کریں...</option>' + 
                surahs.map(s => `<option value="${s.name}" ${(selectedSurah && selectedSurah === s.name) || (!selectedSurah && s.name === surahs[0].name && surahs.length === 1) ? 'selected' : ''}>${s.id}. سورة ${s.name} (${s.ayahs} آیات)</option>`).join('');
            if (selectedSurah && surahs.some(s => s.name === selectedSurah)) {
                surahSelect.value = selectedSurah;
            } else if (!selectedSurah && surahs.length > 0) {
                surahSelect.selectedIndex = 1;
            }
        } else {
            surahSelect.innerHTML = '<option value="">کوئی سورت دستیاب نہیں</option>';
        }
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
                    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧۸۹'.indexOf(d));
                const match = normalized.match(/\d+/);
                if (match && QuranData.paras.some(p => p.id === parseInt(match[0]))) {
                    juzSelect.value = match[0];
                    this.onEnrollJuzChange(match[0]);
                }
            } else if (juzSelect && student.hifzTotalParas) {
                const nextJuz = Math.min(30, (parseInt(student.hifzTotalParas) || 0) + 1);
                juzSelect.value = nextJuz;
                this.onEnrollJuzChange(nextJuz);
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
                                <label style="font-weight:600;"><i class="fas fa-book-open"></i> پارہ</label>
                                <select name="sabaqJuz" id="sabaqJuzSelect" onchange="HifzModule.onSabaqJuzChange(this.value)">
                                    ${QuranData.paras.map(p => `<option value="${p.id}" ${currentEnrollment && currentEnrollment.currentJuz === p.id ? 'selected' : ''}>پارہ ${p.id} (${p.name})</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group-horizontal">
                                <label style="font-weight:600;"><i class="fas fa-quran"></i> سورت (متعلقہ پارہ)</label>
                                <select name="sabaqSurah" id="sabaqSurahSelect">
                                    <option value="">انتخاب کریں</option>
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

        // Initialize dynamic Surah dropdown for selected/first Juz
        const initJuz = currentEnrollment ? (parseInt(currentEnrollment.currentJuz) || 1) : 1;
        const initSurah = currentEnrollment ? (currentEnrollment.currentSurah || '') : '';
        setTimeout(() => {
            this.onSabaqJuzChange(initJuz, initSurah);
        }, 30);
    },

    onSabaqJuzChange(juzNumber, selectedSurah = '') {
        const surahSelect = document.getElementById('sabaqSurahSelect');
        if (!surahSelect) return;
        const surahs = (typeof QuranData !== 'undefined' && QuranData.getSurahsForPara) 
            ? QuranData.getSurahsForPara(juzNumber) 
            : [];
        if (surahs.length > 0) {
            surahSelect.innerHTML = '<option value="">انتخاب کریں</option>' + 
                surahs.map(s => `<option value="${s.name}" ${(selectedSurah && selectedSurah === s.name) || (!selectedSurah && s.name === surahs[0].name && surahs.length === 1) ? 'selected' : ''}>${s.id}. سورة ${s.name} (${s.ayahs} آیات)</option>`).join('');
            if (selectedSurah && surahs.some(s => s.name === selectedSurah)) {
                surahSelect.value = selectedSurah;
            } else if (!selectedSurah && surahs.length > 0) {
                surahSelect.selectedIndex = 1;
            }
        } else {
            surahSelect.innerHTML = '<option value="">کوئی سورت دستیاب نہیں</option>';
        }
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
            const currentJuz = enrollment.currentJuz || (juzSel ? juzSel.value : 1);
            this.onSabaqJuzChange(currentJuz, enrollment.currentSurah || '');
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
            if (record.sabaqSurah) enrollment.currentSurah = record.sabaqSurah;
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
    // 8. HIFZ EXAMS & RESULTS MANAGEMENT MODULE
    // ==========================================
    getHifzGrade(percentage, isPass = true) {
        if (!isPass || percentage < 50) {
            return { grade: 'راسب', title: 'راسب / ناکام', color: '#dc2626', bg: '#fee2e2' };
        }
        if (percentage >= 80) return { grade: 'ممتاز', title: 'ممتاز', color: '#15803d', bg: '#dcfce7' };
        if (percentage >= 70) return { grade: 'جید جداً', title: 'جید جداً', color: '#16a34a', bg: '#dcfce7' };
        if (percentage >= 60) return { grade: 'جید', title: 'جید', color: '#0284c7', bg: '#e0f2fe' };
        if (percentage >= 50) return { grade: 'مقبول', title: 'مقبول', color: '#d97706', bg: '#fef3c7' };
        return { grade: 'راسب', title: 'راسب / ناکام', color: '#dc2626', bg: '#fee2e2' };
    },

    getUrduPosition(rank) {
        const titles = {
            1: 'اول (1st)',
            2: 'دوم (2nd)',
            3: 'سوم (3rd)',
            4: 'چہارم (4th)',
            5: 'پنجم (5th)',
            6: 'ششم (6th)',
            7: 'ہفتم (7th)',
            8: 'ہشتم (8th)',
            9: 'نہم (9th)',
            10: 'دہم (10th)'
        };
        return titles[rank] || `${rank}واں`;
    },

    async renderExamsModule(container) {
        if (!container) return;
        const exams = await MadrassahDB.getAllHifzExams();
        
        let activeExam = null;
        if (this.activeExamId) {
            activeExam = exams.find(e => e.id === this.activeExamId);
            if (!activeExam) {
                this.activeExamId = null;
                this.examSubTab = 'list';
            }
        }
        if (!this.activeExamId && this.examSubTab !== 'list') {
            this.examSubTab = 'list';
        }

        container.innerHTML = `
            <div class="hifz-exams-wrapper" style="animation:fadeIn 0.3s ease;">
                <!-- Header Banner -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; flex-wrap:wrap; gap:12px; background:#ffffff; padding:1.2rem 1.5rem; border-radius:16px; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div>
                        <h3 style="color:var(--primary); margin:0; font-size:1.45rem; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-file-signature"></i> نظامِ امتحانات و نتائج حفظ القرآن
                            ${activeExam ? `<span style="background:var(--primary-subtle); color:var(--primary); font-size:0.85rem; padding:3px 12px; border-radius:20px; font-weight:bold; border:1px solid var(--primary-border);">${activeExam.title}</span>` : ''}
                        </h3>
                        <p style="margin:0.25rem 0 0 0; color:var(--text-muted); font-size:0.95rem;">
                            امتحانات کا انعقاد، تفصیلی نمبرات کا اندراج، خودکار نتائج، گزیٹ اور انفرادی رزلٹ کارڈز
                        </p>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                        <button class="btn btn-primary" onclick="HifzModule.showCreateExamModal()" style="display:flex; align-items:center; gap:6px; padding:8px 18px; border-radius:10px; font-weight:bold; box-shadow:0 3px 10px rgba(6,95,70,0.25);">
                            <i class="fas fa-plus-circle"></i> نیا امتحان بنائیں
                        </button>
                    </div>
                </div>

                <!-- Sub Navigation Tabs for Exams -->
                <div style="display:flex; gap:8px; margin-bottom:1.5rem; border-bottom:2px solid #e2e8f0; padding-bottom:4px; flex-wrap:wrap;">
                    <button type="button" class="btn btn-sm" onclick="HifzModule.switchExamSubTab('list')" 
                            style="background:${this.examSubTab === 'list' ? 'var(--primary)' : '#f8fafc'}; color:${this.examSubTab === 'list' ? '#ffffff' : '#475569'}; border:${this.examSubTab === 'list' ? 'none' : '1px solid #cbd5e1'}; border-radius:10px 10px 0 0; padding:8px 18px; font-weight:bold; cursor:pointer;">
                        <i class="fas fa-list-check"></i> تمام امتحانات کی فہرست (${exams.length})
                    </button>
                    ${activeExam ? `
                        <button type="button" class="btn btn-sm" onclick="HifzModule.switchExamSubTab('marks', ${activeExam.id})" 
                                style="background:${(this.examSubTab === 'marks' || this.examSubTab === 'award_list') ? 'var(--primary)' : '#f8fafc'}; color:${(this.examSubTab === 'marks' || this.examSubTab === 'award_list') ? '#ffffff' : '#475569'}; border:${(this.examSubTab === 'marks' || this.examSubTab === 'award_list') ? 'none' : '1px solid #cbd5e1'}; border-radius:10px 10px 0 0; padding:8px 18px; font-weight:bold; cursor:pointer;">
                            <i class="fas fa-file-invoice"></i> تفصیلی نتیجہ و امتحانی فارم (${activeExam.title})
                        </button>
                        <button type="button" class="btn btn-sm" onclick="HifzModule.switchExamSubTab('collective', ${activeExam.id})" 
                                style="background:${this.examSubTab === 'collective' ? 'var(--primary)' : '#f8fafc'}; color:${this.examSubTab === 'collective' ? '#ffffff' : '#475569'}; border:${this.examSubTab === 'collective' ? 'none' : '1px solid #cbd5e1'}; border-radius:10px 10px 0 0; padding:8px 18px; font-weight:bold; cursor:pointer;">
                            <i class="fas fa-chart-column"></i> اجتماعی نتیجہ و گزیٹ
                        </button>
                    ` : ''}
                </div>

                <!-- Subview Container -->
                <div id="hifz-exam-subview-area"></div>
            </div>
        `;

        const subArea = document.getElementById('hifz-exam-subview-area');
        if (!subArea) return;

        if ((this.examSubTab === 'marks' || this.examSubTab === 'award_list') && activeExam) {
            await this.renderExamAwardListModule(subArea);
        } else if (this.examSubTab === 'collective' && activeExam) {
            await this.renderCollectiveResultTab(subArea, activeExam);
        } else {
            await this.renderExamsListTab(subArea, exams);
        }
    },

    async switchExamSubTab(tab, examId = null) {
        this.examSubTab = tab;
        if (examId !== null) {
            this.activeExamId = parseInt(examId);
            this.awardListActiveExamId = parseInt(examId);
        }
        const subContainer = document.getElementById('hifz-subview-container');
        if (subContainer) {
            await this.renderExamsModule(subContainer);
        }
    },

    async renderExamsListTab(container, exams) {
        const teachers = await MadrassahDB.getAllTeachers();
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));

        // Gather statistics across exams
        let totalResultsCount = 0;
        let totalPassedCount = 0;
        const examStats = new Map();

        for (const ex of exams) {
            const results = await MadrassahDB.getHifzExamResults(ex.id);
            const passed = results.filter(r => (r.obtainedMarks || 0) >= (ex.passingMarks || 50)).length;
            examStats.set(ex.id, {
                total: results.length,
                passed,
                rate: results.length > 0 ? Math.round((passed / results.length) * 100) : 0
            });
            totalResultsCount += results.length;
            totalPassedCount += passed;
        }

        const overallPassRate = totalResultsCount > 0 ? Math.round((totalPassedCount / totalResultsCount) * 100) : 0;

        container.innerHTML = `
            <!-- Metric Highlights -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
                <div style="background:#ffffff; padding:1.2rem; border-radius:14px; border:1px solid #e2e8f0; display:flex; align-items:center; gap:14px; box-shadow:0 2px 6px rgba(0,0,0,0.03);">
                    <div style="width:48px; height:48px; border-radius:12px; background:#ecfdf5; color:#059669; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
                        <i class="fas fa-file-signature"></i>
                    </div>
                    <div>
                        <div style="color:#64748b; font-size:0.88rem; font-weight:600;">کل امتحانات</div>
                        <div style="font-size:1.6rem; font-weight:800; color:#0f172a;">${exams.length}</div>
                    </div>
                </div>

                <div style="background:#ffffff; padding:1.2rem; border-radius:14px; border:1px solid #e2e8f0; display:flex; align-items:center; gap:14px; box-shadow:0 2px 6px rgba(0,0,0,0.03);">
                    <div style="width:48px; height:48px; border-radius:12px; background:#e0f2fe; color:#0284c7; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <div>
                        <div style="color:#64748b; font-size:0.88rem; font-weight:600;">شریک حفاظ / نتائج</div>
                        <div style="font-size:1.6rem; font-weight:800; color:#0f172a;">${totalResultsCount}</div>
                    </div>
                </div>

                <div style="background:#ffffff; padding:1.2rem; border-radius:14px; border:1px solid #e2e8f0; display:flex; align-items:center; gap:14px; box-shadow:0 2px 6px rgba(0,0,0,0.03);">
                    <div style="width:48px; height:48px; border-radius:12px; background:#fef3c7; color:#d97706; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div>
                        <div style="color:#64748b; font-size:0.88rem; font-weight:600;">کامیاب امیدواران</div>
                        <div style="font-size:1.6rem; font-weight:800; color:#0f172a;">${totalPassedCount}</div>
                    </div>
                </div>

                <div style="background:#ffffff; padding:1.2rem; border-radius:14px; border:1px solid #e2e8f0; display:flex; align-items:center; gap:14px; box-shadow:0 2px 6px rgba(0,0,0,0.03);">
                    <div style="width:48px; height:48px; border-radius:12px; background:#f3e8ff; color:#7e22ce; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
                        <i class="fas fa-percent"></i>
                    </div>
                    <div>
                        <div style="color:#64748b; font-size:0.88rem; font-weight:600;">مجموعی شرحِ کامیابی</div>
                        <div style="font-size:1.6rem; font-weight:800; color:#0f172a;">${overallPassRate}%</div>
                    </div>
                </div>
            </div>

            <!-- Exams Table Card -->
            <div class="card" style="padding:0; overflow:hidden; border-radius:16px; border:1px solid #e2e8f0;">
                <div style="padding:1rem 1.5rem; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div style="font-weight:bold; color:var(--primary); font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-table-list"></i> منعقدہ امتحانات کی فہرست
                    </div>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="hifz-exams-search" placeholder="امتحان یا نصاب تلاش کریں..." oninput="HifzModule.filterExamsListTable(this.value)"
                               style="padding:6px 14px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.92rem; width:220px;">
                    </div>
                </div>

                <div style="overflow-x:auto;">
                    <table id="hifz-exams-table" style="width:100%; border-collapse:collapse; text-align:right;">
                        <thead>
                            <tr style="background:#f1f5f9; color:#475569; font-size:0.95rem;">
                                <th style="padding:12px; text-align:center; width:40px;">#</th>
                                <th style="padding:12px;">امتحان کا عنوان</th>
                                <th style="padding:12px;">سیشن / سال</th>
                                <th style="padding:12px;">نوعیت</th>
                                <th style="padding:12px;">تاریخِ امتحان</th>
                                <th style="padding:12px;">امتحانی حصہ / نصاب</th>
                                <th style="padding:12px;">حلقہ</th>
                                <th style="padding:12px;">ممتحن</th>
                                <th style="padding:12px; text-align:center;">کل / پاسنگ</th>
                                <th style="padding:12px; text-align:center;">شرکاء و شرح</th>
                                <th style="padding:12px; text-align:center; min-width:200px;">ایکشنز</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${exams.length === 0 ? `
                                <tr>
                                    <td colspan="11" style="text-align:center; padding:3.5rem; color:#64748b;">
                                        <i class="fas fa-folder-open" style="font-size:2.5rem; color:#cbd5e1; margin-bottom:0.8rem; display:block;"></i>
                                        کوئی امتحان درج نہیں ہے۔ نیا امتحان بنانے کے لیے اوپر <b>"نیا امتحان بنائیں"</b> بٹن پر کلک کریں۔
                                    </td>
                                </tr>
                            ` : exams.map((ex, idx) => {
                                const st = examStats.get(ex.id) || { total: 0, passed: 0, rate: 0 };
                                const examinerName = teacherMap.get(ex.examinerTeacherId) || ex.examinerName || '---';
                                return `
                                    <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                        <td style="text-align:center; font-weight:bold; color:#64748b;">${idx + 1}</td>
                                        <td style="font-weight:bold; color:var(--primary);">
                                            <a href="javascript:void(0)" onclick="HifzModule.switchExamSubTab('marks', ${ex.id})" style="text-decoration:none; color:var(--primary);">
                                                ${ex.title}
                                            </a>
                                            ${ex.notes ? `<div style="font-size:0.75rem; color:#64748b; font-weight:normal;">${ex.notes}</div>` : ''}
                                        </td>
                                        <td><span style="background:#f1f5f9; padding:2px 8px; border-radius:6px; font-size:0.85rem; font-weight:600;">${ex.session || '1446-1447ھ'}</span></td>
                                        <td><span style="background:#eff6ff; color:#1d4ed8; padding:2px 8px; border-radius:6px; font-size:0.85rem; font-weight:600;">${ex.examType || 'ماہانہ'}</span></td>
                                        <td style="font-family:monospace; font-weight:600; color:#334155;">${ex.date}</td>
                                        <td><span style="background:#ecfdf5; color:#065f46; padding:3px 10px; border-radius:6px; font-weight:bold; font-size:0.9rem;">${ex.portion}</span></td>
                                        <td><span style="color:#475569; font-weight:600;">${ex.halaqa || 'تمام'}</span></td>
                                        <td><span style="color:#0f172a; font-weight:600;"><i class="fas fa-user-tie" style="color:#64748b; font-size:0.85rem; margin-left:4px;"></i>${examinerName}</span></td>
                                        <td style="text-align:center; font-weight:bold; font-size:0.95rem;">
                                            <span style="color:#0f172a;">${ex.maxMarks || 100}</span> / <span style="color:#b45309;">${ex.passingMarks || 50}</span>
                                        </td>
                                        <td style="text-align:center;">
                                            <div style="font-weight:bold; font-size:0.92rem; color:#0f172a;">${st.total} حفاظ</div>
                                            <div style="font-size:0.78rem; font-weight:bold; color:${st.rate >= 70 ? '#15803d' : (st.rate >= 50 ? '#d97706' : '#dc2626')};">
                                                کامیابی: ${st.rate}%
                                            </div>
                                        </td>
                                        <td style="text-align:center;">
                                            <div style="display:flex; justify-content:center; align-items:center; gap:6px; flex-wrap:wrap;">
                                                <button class="btn btn-sm btn-primary" onclick="HifzModule.switchExamSubTab('marks', ${ex.id})" 
                                                        style="padding:5px 12px; font-size:0.85rem; border-radius:8px; display:inline-flex; align-items:center; gap:4px;" title="تفصیلی نتیجہ و نمبرات درج کریں">
                                                    <i class="fas fa-file-invoice"></i> تفصیلی نتیجہ
                                                </button>

                                                <button class="btn btn-sm" onclick="HifzModule.switchExamSubTab('collective', ${ex.id})" 
                                                        style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; padding:5px 10px; font-size:0.85rem; border-radius:8px; display:inline-flex; align-items:center; gap:4px;" title="اجتماعی رزلٹ گزیٹ">
                                                    <i class="fas fa-chart-column"></i> گزیٹ
                                                </button>
                                                <button class="btn btn-sm" onclick="HifzModule.showCreateExamModal(${ex.id})" 
                                                        style="background:#f8fafc; color:#334155; border:1px solid #cbd5e1; padding:5px 8px; font-size:0.85rem; border-radius:8px;" title="ترمیم کریں">
                                                    <i class="fas fa-pen-to-square"></i>
                                                </button>
                                                <button class="btn btn-sm" onclick="HifzModule.deleteHifzExam(${ex.id})" 
                                                        style="background:#fef2f2; color:#ef4444; border:1px solid #fecaca; padding:5px 8px; font-size:0.85rem; border-radius:8px;" title="امتحان حذف کریں">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
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

    filterExamsListTable(query) {
        const trs = document.querySelectorAll('#hifz-exams-table tbody tr');
        const q = (query || '').toLowerCase().trim();
        trs.forEach(tr => {
            const text = tr.innerText.toLowerCase();
            tr.style.display = text.includes(q) ? '' : 'none';
        });
    },

    getExamSubjects(exam) {
        if (!exam) {
            return [
                { name: 'قرآن', subtitle: 'سبق / پارے', maxMarks: 100 },
                { name: 'نماز / حفظی', subtitle: 'دعائیں / کلمے', maxMarks: 50 },
                { name: 'قاعدہ', subtitle: 'تختی / اسباق', maxMarks: 50 }
            ];
        }
        if (Array.isArray(exam.subjects) && exam.subjects.length > 0) {
            return exam.subjects.map(s => ({
                name: (s.name || '').trim() || 'مضمون',
                subtitle: (s.subtitle || '').trim(),
                maxMarks: s.maxMarks !== undefined && !isNaN(parseInt(s.maxMarks)) ? parseInt(s.maxMarks) : 50
            }));
        }
        const s1 = exam.subj1Name || 'قرآن';
        const s2 = exam.subj2Name || 'نماز / حفظی';
        const s3 = exam.subj3Name || 'قاعدہ';
        const sub1 = exam.subj1Subtitle || 'سبق / پارے';
        const sub2 = exam.subj2Subtitle || 'دعائیں / کلمے';
        const sub3 = exam.subj3Subtitle || 'تختی / اسباق';
        const m1 = exam.maxMarksQuran !== undefined ? exam.maxMarksQuran : 100;
        const m2 = exam.maxMarksNamaz !== undefined ? exam.maxMarksNamaz : 50;
        const m3 = exam.maxMarksQaida !== undefined ? exam.maxMarksQaida : 50;

        return [
            { name: s1, subtitle: sub1, maxMarks: parseInt(m1) || 0 },
            { name: s2, subtitle: sub2, maxMarks: parseInt(m2) || 0 },
            { name: s3, subtitle: sub3, maxMarks: parseInt(m3) || 0 }
        ];
    },

    async showCreateExamModal(examId = null) {
        const teachers = await MadrassahDB.getAllTeachers();
        const halaqas = await MadrassahDB.getAllHifzHalaqas();
        let exam = null;
        if (examId) {
            exam = await MadrassahDB.getHifzExamById(examId);
        }
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
        const initialExaminerName = exam ? (exam.examinerName || teacherMap.get(exam.examinerTeacherId) || '') : '';

        const isEdit = !!exam;
        this.activeModalSubjects = this.getExamSubjects(exam);

        const modalDiv = document.createElement('div');
        modalDiv.id = 'createHifzExamModal';
        modalDiv.className = 'mms-modal-backdrop';

        modalDiv.innerHTML = `
            <div class="mms-modal-box" style="max-width: 650px; width: 95%; max-height: 90vh; overflow-y: auto; border-radius: 20px; padding: 0; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
                <div class="mms-modal-header" style="background:#f8fafc; border-bottom:1px solid #e2e8f0; padding:1.2rem 1.5rem; border-radius:20px 20px 0 0; margin-bottom: 0;">
                    <h3 style="margin:0; color:var(--primary); font-size:1.3rem; display:flex; align-items:center; gap:8px;">
                        <i class="fas ${isEdit ? 'fa-pen-to-square' : 'fa-file-circle-plus'}"></i>
                        ${isEdit ? 'حفظ امتحان میں ترمیم کریں' : 'نیا حفظ امتحان بنائیں'}
                    </h3>
                    <button type="button" onclick="document.getElementById('createHifzExamModal').remove()" class="mms-close-btn" style="background:none; border:none; font-size:1.4rem; cursor:pointer; color:#64748b;">&times;</button>
                </div>

                <form onsubmit="HifzModule.handleCreateExamSubmit(event, ${examId || 'null'})" style="padding:1.5rem;">
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group-horizontal">
                            <label style="font-weight:bold; color:#1e293b;">امتحان کا عنوان <span style="color:#dc2626;">*</span></label>
                            <input type="text" name="title" value="${isEdit ? (exam.title || '') : ''}" placeholder="مثلاً: ششماہی امتحان حفظ القرآن 1446ھ" required
                                   style="padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:1rem;">
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
                            <div class="form-group-horizontal">
                                <label style="font-weight:bold; color:#1e293b;">تاریخِ امتحان <span style="color:#dc2626;">*</span></label>
                                <input type="date" name="date" value="${isEdit ? exam.date : new Date().toISOString().split('T')[0]}" required
                                       style="padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:1rem;">
                            </div>
                            <div class="form-group-horizontal">
                                <label style="font-weight:bold; color:#1e293b;">ماہ (Month)</label>
                                <input type="text" name="month" value="${isEdit ? (exam.month || '') : 'ربیع الثانی / ستمبر'}" placeholder="مثلاً: ربیع الثانی / ستمبر"
                                       style="padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:1rem;">
                            </div>
                            <div class="form-group-horizontal">
                                <label style="font-weight:bold; color:#1e293b;">تعلیمی سال / سیشن</label>
                                <input type="text" name="session" value="${isEdit ? (exam.session || exam.year || '') : '1448ھ / 2026ء'}" placeholder="مثلاً: 1448ھ / 2026ء"
                                       style="padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:1rem;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div class="form-group-horizontal">
                                <label style="font-weight:bold; color:#1e293b;">نوعیتِ امتحان / زمرہ <span style="color:#dc2626;">*</span></label>
                                <select name="examType" id="modal_exam_type_select" onchange="const p=document.getElementById('modal_exam_portion_input'); if(p){ if(this.value.includes('پیش رفت') || this.value.includes('انفرادی')) p.value='حسبِ پیش رفت (انفرادی پارے)'; else if(this.value.includes('وفاق') || this.value.includes('مکمل')) p.value='مکمل قرآن مجید (۳۰ پارے)'; }" style="padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:1rem;">
                                    <option value="ششماہی امتحان" ${!isEdit || (exam.examType && exam.examType.includes('ششماہی')) ? 'selected' : ''}>ششماہی امتحان</option>
                                    <option value="سالانہ امتحان وفاق المدارس (مکمل ۳۰ پارے)" ${isEdit && (exam.examType && (exam.examType.includes('وفاق') || exam.examType.includes('مکمل') || exam.examType.includes('سالانہ'))) ? 'selected' : ''}>سالانہ امتحان وفاق المدارس (مکمل ۳۰ پارے حفظ مع دور)</option>
                                    <option value="حسبِ پیش رفت (انفرادی پارے / جزوی حفظ)" ${isEdit && exam.examType && (exam.examType.includes('پیش رفت') || exam.examType.includes('انفرادی')) ? 'selected' : ''}>حسبِ پیش رفت (انفرادی پارے / جزوی حفظ)</option>
                                    <option value="ماہانہ امتحان" ${isEdit && exam.examType === 'ماہانہ امتحان' ? 'selected' : ''}>ماہانہ امتحانی جائزہ</option>
                                    <option value="سہ ماہی امتحان" ${isEdit && exam.examType === 'سہ ماہی امتحان' ? 'selected' : ''}>سہ ماہی امتحان</option>
                                    <option value="اختتامی جائزہ / تکمیل" ${isEdit && exam.examType === 'اختتامی جائزہ / تکمیل' ? 'selected' : ''}>اختتامی جائزہ / تکمیلِ حفظ</option>
                                </select>
                            </div>
                            <div class="form-group-horizontal">
                                <label style="font-weight:bold; color:#1e293b;">متعلقہ حلقہ / کلاس</label>
                                <select name="halaqa" style="padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:1rem;">
                                    <option value="تمام حلقہ جات" ${!isEdit || exam.halaqa === 'تمام حلقہ جات' ? 'selected' : ''}>تمام حلقہ جات (شعبہ حفظ)</option>
                                    ${halaqas.map(h => `<option value="${h.name}" ${isEdit && exam.halaqa === h.name ? 'selected' : ''}>${h.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-group-horizontal">
                            <label style="font-weight:bold; color:#1e293b;">امتحانی حصہ / عمومی نصاب <span style="color:#dc2626;">*</span></label>
                            <input type="text" name="portion" id="modal_exam_portion_input" value="${isEdit ? (exam.portion || '') : 'حسبِ پیش رفت (انفرادی پارے)'}" placeholder="مثلاً: حسبِ پیش رفت (انفرادی پارے) یا مکمل ۳۰ پارے" required
                                   style="padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:1rem;">
                        </div>

                        <!-- مضامین و کل نمبرات کا تعین (حفظ، تعلیم الاسلام، تجوید، یا خود شامل کردہ مضامین) -->
                        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 14px; margin-top: 4px;">
                            <div style="font-weight: bold; color: #166534; margin-bottom: 10px; font-size: 0.98rem; display: flex; align-items: center; justify-content: space-between; flex-wrap:wrap; gap:8px;">
                                <span><i class="fas fa-sliders" style="color: #059669;"></i> مضامین، مقداری عنوانات اور کل نمبرات کا تعین:</span>
                                <button type="button" class="btn btn-sm" onclick="HifzModule.addExamModalSubjectCard()" style="background:#059669; color:#fff; border:none; padding:5px 14px; border-radius:8px; font-weight:bold; font-size:0.85rem; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 2px 5px rgba(5,150,105,0.25);">
                                    <i class="fas fa-plus-circle"></i> + مزید مضمون شامل کریں
                                </button>
                            </div>

                            <!-- Presets -->
                            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; background:#ffffff; padding:8px 10px; border-radius:8px; border:1px solid #bbf7d0;">
                                <span style="font-size:0.82rem; font-weight:bold; color:#166534; align-self:center;"><i class="fas fa-bolt"></i> فوری پری سیٹس:</span>
                                <button type="button" class="btn btn-sm" onclick="HifzModule.applyExamModalPreset([ {name:'قرآن', subtitle:'سبق / پارے', maxMarks:100}, {name:'نماز / حفظی', subtitle:'دعائیں / کلمے', maxMarks:50}, {name:'قاعدہ', subtitle:'تختی / اسباق', maxMarks:50} ], 200, 100)" style="background:#f0fdf4; border:1px solid #86efac; color:#166534; font-size:0.78rem; padding:3px 8px; border-radius:6px; font-weight:bold; cursor:pointer;">
                                    پری سیٹ ۱: ۳ مضامین (200)
                                </button>
                                <button type="button" class="btn btn-sm" onclick="HifzModule.applyExamModalPreset([ {name:'حفظِ قرآن', subtitle:'سبق / پارے', maxMarks:100}, {name:'تعلیم الاسلام', subtitle:'عقائد و مسائل', maxMarks:50}, {name:'تجوید و ترتیل', subtitle:'مخارج و ترتیل', maxMarks:50} ], 200, 100)" style="background:#f0fdf4; border:1px solid #86efac; color:#166534; font-size:0.78rem; padding:3px 8px; border-radius:6px; font-weight:bold; cursor:pointer;">
                                    پری سیٹ ۲: ۳ مضامین (200)
                                </button>
                                <button type="button" class="btn btn-sm" onclick="HifzModule.applyExamModalPreset([ {name:'حفظِ قرآن', subtitle:'سبق / پارے', maxMarks:100}, {name:'تعلیم الاسلام', subtitle:'عقائد و مسائل', maxMarks:50}, {name:'تجوید و لہجہ', subtitle:'مخارج و قواعد', maxMarks:50}, {name:'حفظی و سنن', subtitle:'دعائیں و مسنونات', maxMarks:50} ], 250, 125)" style="background:#f0fdf4; border:1px solid #86efac; color:#166534; font-size:0.78rem; padding:3px 8px; border-radius:6px; font-weight:bold; cursor:pointer;">
                                    پری سیٹ ۳: ۴ مضامین (250)
                                </button>
                                <button type="button" class="btn btn-sm" onclick="HifzModule.applyExamModalPreset([ {name:'حفظِ قرآن', subtitle:'امتحانی پارہ', maxMarks:60}, {name:'تجوید و ترتیل', subtitle:'تجوید و لہجہ', maxMarks:30}, {name:'دینی مسائل', subtitle:'فرائض و مسائل', maxMarks:5}, {name:'مسنون دعائیں', subtitle:'دعائیں و سنن', maxMarks:5} ], 100, 50)" style="background:#f0fdf4; border:1px solid #86efac; color:#166534; font-size:0.78rem; padding:3px 8px; border-radius:6px; font-weight:bold; cursor:pointer;">
                                    پری سیٹ ۴: وفاق المدارس معیار (100)
                                </button>
                            </div>

                            <!-- Dynamic Subject Cards Container -->
                            <div id="exam_modal_subjects_container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; text-align: right;">
                                <!-- Rendered dynamically -->
                            </div>
                        </div>

                        <div class="form-group-horizontal">
                            <label style="font-weight:bold; color:#1e293b;">ممتحن کا نام (از خود درج کریں یا استاد منتخب کریں) <span style="color:#dc2626;">*</span></label>
                            <div style="display:flex; gap:8px;">
                                <input type="text" name="examinerName" id="modal_examiner_name" list="teachersList" value="${initialExaminerName}" 
                                       placeholder="ممتحن کا نام از خود لکھیں..." required
                                       style="flex:1; padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:1rem; font-weight:600;">
                                <datalist id="teachersList">
                                    ${teachers.map(t => `<option value="${t.name}">`).join('')}
                                </datalist>
                                <select style="width:160px; padding:10px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:0.9rem;" 
                                        onchange="if(this.value) { document.getElementById('modal_examiner_name').value = this.value; }">
                                    <option value="">اساتذہ سے چنیں</option>
                                    ${teachers.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div class="form-group-horizontal">
                                <label style="font-weight:bold; color:#1e293b;">مجموعی کل نمبر (Total Marks)</label>
                                <input type="number" id="m_total_max_marks" name="maxMarks" value="${isEdit ? (exam.maxMarks || 200) : 200}" min="10" required
                                       style="padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:1.05rem; font-weight:bold; color:var(--primary); background:#f8fafc;">
                            </div>
                            <div class="form-group-horizontal">
                                <label style="font-weight:bold; color:#1e293b;">پاسنگ مارکس (Passing Marks) <span style="color:#dc2626;">*</span></label>
                                <input type="number" id="m_passing_marks" name="passingMarks" value="${isEdit ? (exam.passingMarks || 100) : 100}" min="1" required
                                       style="padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:1.05rem; font-weight:bold; color:#b45309;" onchange="this.dataset.userEdited='true'">
                            </div>
                        </div>

                        <div class="form-group-horizontal">
                            <label style="font-weight:bold; color:#1e293b;">ہدایات و نوٹس</label>
                            <textarea name="notes" placeholder="امتحان سے متعلق خصوصی ہدایات..." rows="2"
                                      style="padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:1rem; font-family:inherit;">${isEdit ? (exam.notes || '') : ''}</textarea>
                        </div>
                    </div>

                    <div style="margin-top:1.8rem; display:flex; justify-content:flex-end; gap:10px;">
                        <button type="button" class="btn" style="background:#f1f5f9; color:#475569; padding:8px 20px;" onclick="document.getElementById('createHifzExamModal').remove()">منسوخ کریں</button>
                        <button type="submit" class="btn btn-primary" style="padding:8px 26px; font-weight:bold;">
                            <i class="fas fa-save"></i> ${isEdit ? 'تبدیلیاں محفوظ کریں' : 'امتحان بنائیں و نتیجہ درج کریں'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modalDiv);
        this.renderExamModalSubjectCards();
    },

    renderExamModalSubjectCards() {
        const container = document.getElementById('exam_modal_subjects_container');
        if (!container) return;
        const colors = [
            { border: '#86efac', text: '#166534', numBorder: '#10b981', numBg: '#ecfdf5', numCol: '#065f46' },
            { border: '#bfdbfe', text: '#1e40af', numBorder: '#3b82f6', numBg: '#eff6ff', numCol: '#1d4ed8' },
            { border: '#fde047', text: '#854d0e', numBorder: '#eab308', numBg: '#fefce8', numCol: '#854d0e' },
            { border: '#fbcfe8', text: '#9d174d', numBorder: '#ec4899', numBg: '#fdf2f8', numCol: '#be185d' },
            { border: '#fed7aa', text: '#9a3412', numBorder: '#f97316', numBg: '#fff7ed', numCol: '#c2410c' },
            { border: '#c7d2fe', text: '#4338ca', numBorder: '#6366f1', numBg: '#eef2ff', numCol: '#4338ca' }
        ];
        container.innerHTML = this.activeModalSubjects.map((s, idx) => {
            const theme = colors[idx % colors.length];
            return `
                <div class="exam-modal-subj-card" data-idx="${idx}" style="background: #ffffff; padding: 10px; border-radius: 10px; border: 1.5px solid ${theme.border};">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <label style="font-size: 0.85rem; color: ${theme.text}; font-weight: bold; margin:0;">
                            مضمون ${idx + 1} کا نام
                        </label>
                        ${this.activeModalSubjects.length > 1 ? `
                            <button type="button" onclick="HifzModule.removeExamModalSubjectCard(${idx})" style="background:none; border:none; color:#dc2626; cursor:pointer; font-size:0.85rem; padding:0 4px;" title="یہ مضمون حذف کریں">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                    <input type="text" class="m-subj-name" value="${s.name || ''}" placeholder="نامِ مضمون..." required 
                           style="width: 100%; font-size: 0.92rem; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; font-weight: bold; box-sizing:border-box;"
                           oninput="HifzModule.activeModalSubjects[${idx}].name = this.value">
                    <label style="font-size: 0.8rem; color: #475569; font-weight: 600; display: block; margin-bottom: 3px;">مقدارِ خواندگی (ذیلی عنوان)</label>
                    <input type="text" class="m-subj-sub" value="${s.subtitle || ''}" placeholder="سبق / پارے / کتاب" 
                           style="width: 100%; font-size: 0.85rem; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; margin-bottom: 6px; box-sizing:border-box;"
                           oninput="HifzModule.activeModalSubjects[${idx}].subtitle = this.value">
                    <label style="font-size: 0.8rem; color: ${theme.text}; font-weight: bold; display: block; margin-bottom: 3px;">کل نمبر (Max)</label>
                    <input type="number" class="m-subj-max" value="${s.maxMarks !== undefined ? s.maxMarks : 50}" min="0" required 
                           style="width: 100%; text-align: center; font-weight: bold; border-radius: 6px; border: 1.5px solid ${theme.numBorder}; padding: 6px; font-size: 1.05rem; color: ${theme.numCol}; background: ${theme.numBg}; box-sizing:border-box;" 
                           oninput="HifzModule.activeModalSubjects[${idx}].maxMarks = parseInt(this.value)||0; HifzModule.recalcExamModalTotal();">
                </div>
            `;
        }).join('');
        this.recalcExamModalTotal();
    },

    addExamModalSubjectCard() {
        this.syncCurrentModalSubjectsFromDom();
        const count = this.activeModalSubjects.length + 1;
        this.activeModalSubjects.push({
            name: `مضمون ${count}`,
            subtitle: 'کتاب و اسباق',
            maxMarks: 50
        });
        this.renderExamModalSubjectCards();
    },

    removeExamModalSubjectCard(idx) {
        this.syncCurrentModalSubjectsFromDom();
        if (this.activeModalSubjects.length <= 1) {
            alert('کم از کم ایک مضمون ہونا ضروری ہے!');
            return;
        }
        this.activeModalSubjects.splice(idx, 1);
        this.renderExamModalSubjectCards();
    },

    syncCurrentModalSubjectsFromDom() {
        const cards = document.querySelectorAll('#exam_modal_subjects_container .exam-modal-subj-card');
        cards.forEach((card, idx) => {
            if (this.activeModalSubjects[idx]) {
                const nameEl = card.querySelector('.m-subj-name');
                const subEl = card.querySelector('.m-subj-sub');
                const maxEl = card.querySelector('.m-subj-max');
                if (nameEl) this.activeModalSubjects[idx].name = nameEl.value.trim();
                if (subEl) this.activeModalSubjects[idx].subtitle = subEl.value.trim();
                if (maxEl) this.activeModalSubjects[idx].maxMarks = parseInt(maxEl.value) || 0;
            }
        });
    },

    recalcExamModalTotal() {
        let tot = 0;
        const maxInputs = document.querySelectorAll('#exam_modal_subjects_container .m-subj-max');
        if (maxInputs.length > 0) {
            maxInputs.forEach(inp => tot += (parseInt(inp.value) || 0));
        } else if (this.activeModalSubjects) {
            tot = this.activeModalSubjects.reduce((acc, s) => acc + (parseInt(s.maxMarks) || 0), 0);
        }
        const totEl = document.getElementById('m_total_max_marks');
        if (totEl) totEl.value = tot;
        const passEl = document.getElementById('m_passing_marks');
        if (passEl && !passEl.dataset.userEdited) {
            passEl.value = Math.round(tot * 0.5);
        }
    },

    applyExamModalPreset(subjectsList, tot, pass) {
        this.activeModalSubjects = subjectsList.map(s => ({ ...s }));
        this.renderExamModalSubjectCards();
        const tEl = document.getElementById('m_total_max_marks');
        if (tEl) tEl.value = tot;
        const pEl = document.getElementById('m_passing_marks');
        if (pEl) {
            pEl.value = pass;
            pEl.dataset.userEdited = 'true';
        }
    },

    async handleCreateExamSubmit(e, examId = null) {
        e.preventDefault();
        this.syncCurrentModalSubjectsFromDom();
        const formData = new FormData(e.target);
        const exName = (formData.get('examinerName') || '').trim();

        const subjects = this.activeModalSubjects && this.activeModalSubjects.length > 0 
            ? this.activeModalSubjects 
            : [
                { name: 'قرآن', subtitle: 'سبق / پارے', maxMarks: 100 },
                { name: 'نماز / حفظی', subtitle: 'دعائیں / کلمے', maxMarks: 50 },
                { name: 'قاعدہ', subtitle: 'تختی / اسباق', maxMarks: 50 }
            ];

        const s1Name = subjects[0]?.name || 'قرآن';
        const s2Name = subjects[1]?.name || 'نماز / حفظی';
        const s3Name = subjects[2]?.name || 'قاعدہ';
        const s1Sub = subjects[0]?.subtitle || 'سبق / پارے';
        const s2Sub = subjects[1]?.subtitle || 'دعائیں / کلمے';
        const s3Sub = subjects[2]?.subtitle || 'تختی / اسباق';
        const m1 = parseInt(subjects[0]?.maxMarks) || 0;
        const m2 = parseInt(subjects[1]?.maxMarks) || 0;
        const m3 = parseInt(subjects[2]?.maxMarks) || 0;

        const totMax = parseInt(formData.get('maxMarks')) || subjects.reduce((acc, s) => acc + (parseInt(s.maxMarks) || 0), 0);
        const passMarks = parseInt(formData.get('passingMarks')) || Math.round(totMax * 0.5);

        const data = {
            title: (formData.get('title') || '').trim(),
            date: formData.get('date'),
            session: (formData.get('session') || '').trim(),
            month: (formData.get('month') || '').trim(),
            year: (formData.get('session') || '').trim(),
            examType: formData.get('examType'),
            portion: (formData.get('portion') || '').trim(),
            halaqa: formData.get('halaqa'),
            examinerName: exName,
            examinerTeacherId: 0,
            subjects: subjects,
            subj1Name: s1Name,
            subj2Name: s2Name,
            subj3Name: s3Name,
            subj1Subtitle: s1Sub,
            subj2Subtitle: s2Sub,
            subj3Subtitle: s3Sub,
            maxMarksQuran: m1,
            maxMarksNamaz: m2,
            maxMarksQaida: m3,
            maxMarks: totMax,
            passingMarks: passMarks,
            notes: (formData.get('notes') || '').trim()
        };

        if (examId) {
            data.id = parseInt(examId);
        }

        const savedId = await MadrassahDB.saveHifzExam(data);
        const modal = document.getElementById('createHifzExamModal');
        if (modal) modal.remove();

        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(examId ? 'امتحان کی تفصیلات کامیابی سے اپڈیٹ ہو گئیں۔' : 'نیا امتحان کامیابی سے تیار ہو گیا۔', 'success');
        } else {
            alert('امتحان کامیابی سے محفوظ ہو گیا۔');
        }

        this.activeExamId = examId ? parseInt(examId) : parseInt(savedId);
        this.awardListActiveExamId = this.activeExamId;
        this.awardListSubjects = subjects;
        this.awardListSubj1Name = s1Name;
        this.awardListSubj2Name = s2Name;
        this.awardListSubj3Name = s3Name;
        this.awardListSubj1Subtitle = s1Sub;
        this.awardListSubj2Subtitle = s2Sub;
        this.awardListSubj3Subtitle = s3Sub;
        this.awardListMaxQuran = m1;
        this.awardListMaxNamaz = m2;
        this.awardListMaxQaida = m3;
        this.awardListPassingMarks = passMarks;
        this.examSubTab = 'marks'; // switches directly to award list / detailed result sheet
        const subContainer = document.getElementById('hifz-subview-container');
        if (subContainer) {
            await this.renderExamsModule(subContainer);
        }
    },

    async updateExamExaminerName(examId, val) {
        const name = (val || '').trim();
        const exam = await MadrassahDB.getHifzExamById(examId);
        if (exam) {
            exam.examinerName = name;
            await MadrassahDB.saveHifzExam(exam);
            if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast('ممتحن کا نام اپڈیٹ ہو گیا: ' + name, 'success');
            }
        }
    },

    async deleteHifzExam(id) {
        if (confirm('کیا آپ واقعی یہ امتحان حذف کرنا چاہتے ہیں؟ اس سے منسلک تمام نمبرات و ریکارڈ بھی حذف ہو جائیں گے۔')) {
            await MadrassahDB.deleteHifzExam(id);
            if (this.activeExamId === parseInt(id)) {
                this.activeExamId = null;
                this.examSubTab = 'list';
            }
            if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast('امتحان حذف کر دیا گیا ہے۔', 'info');
            }
            const subContainer = document.getElementById('hifz-subview-container');
            if (subContainer) {
                await this.renderExamsModule(subContainer);
            }
        }
    },

    async renderMarksEntryTab(container, exam) {
        const enrollments = await MadrassahDB.getAllHifzEnrollments();
        const banin = await MadrassahDB.getAllStudents('banin');
        const banat = await MadrassahDB.getAllStudents('banat');
        const allStudents = [...banin, ...banat];
        const studentMap = new Map();
        allStudents.forEach(s => { if (s && s.id && !studentMap.has(s.id)) studentMap.set(s.id, s); });

        const teachers = await MadrassahDB.getAllTeachers();
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
        const examinerName = exam.examinerName || teacherMap.get(exam.examinerTeacherId) || '';

        const examResults = await MadrassahDB.getHifzExamResults(exam.id);
        const resultMap = new Map(examResults.map(r => [r.studentId, r]));

        const targetStudents = [];
        const seenIds = new Set();

        // 1. All enrollments matching halaqa (or all halaqas)
        enrollments.forEach(en => {
            const st = studentMap.get(en.studentId);
            if (st && !seenIds.has(st.id)) {
                if (!exam.halaqa || exam.halaqa === 'تمام حلقہ جات' || en.halaqa === exam.halaqa) {
                    seenIds.add(st.id);
                    targetStudents.push({ student: st, enrollment: en });
                }
            }
        });

        // 2. Any students in Banin/Banat whose department or class includes 'حفظ'
        allStudents.forEach(st => {
            if (st && !seenIds.has(st.id)) {
                const dept = (st.department || '').trim();
                const cls = (st.className || st.class || '').trim();
                if (dept.includes('حفظ') || cls.includes('حفظ')) {
                    if (!exam.halaqa || exam.halaqa === 'تمام حلقہ جات') {
                        seenIds.add(st.id);
                        targetStudents.push({
                            student: st,
                            enrollment: { studentId: st.id, halaqa: st.className || 'عام حلقہ', currentJuz: 1, currentPage: 1 }
                        });
                    }
                }
            }
        });

        targetStudents.sort((a, b) => parseInt(a.student.id || 0) - parseInt(b.student.id || 0));

        container.innerHTML = `
            <!-- Exam Info Top Card -->
            <div class="card" style="padding:1.2rem 1.5rem; margin-bottom:1.5rem; border-top:4px solid var(--primary); border-radius:16px; background:#ffffff; box-shadow:0 2px 10px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                            <h3 style="margin:0; color:var(--primary); font-size:1.35rem;">
                                <i class="fas fa-marker"></i> ${exam.title}
                            </h3>
                            <span style="background:#dcfce7; color:#15803d; font-size:0.85rem; padding:3px 12px; border-radius:20px; font-weight:bold;">
                                کل امیدواران: ${targetStudents.length}
                            </span>
                            <span style="background:#e0f2fe; color:#0369a1; font-size:0.85rem; padding:3px 12px; border-radius:20px; font-weight:bold;">
                                کل نمبر: ${exam.maxMarks || 100} | پاسنگ: ${exam.passingMarks || 50}
                            </span>
                        </div>
                        <div style="font-size:0.9rem; color:#475569; margin-top:6px; display:flex; gap:16px; flex-wrap:wrap; align-items:center;">
                            <span><b>تاریخ:</b> ${exam.date}</span>
                            <span><b>سیشن:</b> ${exam.session || '1446-1447ھ'}</span>
                            <span><b>نوعیت:</b> ${exam.examType || 'ماہانہ'}</span>
                            <span><b>حصہ/نصاب:</b> ${exam.portion}</span>
                            <span><b>حلقہ:</b> ${exam.halaqa || 'تمام'}</span>
                            <span style="display:inline-flex; align-items:center; gap:6px;">
                                <b>ممتحن:</b>
                                <input type="text" value="${examinerName}" placeholder="از خود درج کریں..." title="کلک کر کے ممتحن کا نام از خود تبدیل کریں" 
                                       style="padding:3px 8px; border:1.5px solid #cbd5e1; border-radius:6px; font-weight:bold; font-size:0.9rem; width:160px; background:#fff;" 
                                       onchange="HifzModule.updateExamExaminerName(${exam.id}, this.value)">
                            </span>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="btn btn-sm" onclick="HifzModule.switchExamSubTab('collective', ${exam.id})" 
                                style="background:#f0fdf4; color:#166534; border:1.5px solid #86efac; border-radius:10px; padding:7px 16px; font-weight:bold; display:flex; align-items:center; gap:6px; cursor:pointer;">
                            <i class="fas fa-chart-column"></i> اجتماعی نتیجہ / گزیٹ
                        </button>
                        <button class="btn btn-sm" onclick="HifzModule.switchExamSubTab('list')" 
                                style="background:#f1f5f9; color:#475569; border:none; border-radius:10px; padding:7px 16px; font-weight:bold; cursor:pointer;">
                            <i class="fas fa-arrow-right"></i> تمام امتحانات
                        </button>
                    </div>
                </div>

                <!-- Marks Breakdown Criteria Helper Banner (وفاق المدارس العربیہ پاکستان نصاب) -->
                <div style="margin-top:1rem; background:#ecfdf5; border-radius:12px; padding:10px 16px; border:1.5px solid #a7f3d0; font-size:0.92rem; color:#065f46; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <i class="fas fa-certificate" style="color:#059669; font-size:1.1rem;"></i> <b>وفاق المدارس العربیہ پاکستان معیارِ نمبرات:</b>
                        حفظِ قرآن مجید (60) + تجوید و ترتیل (30) + دینی مسائل (5) + مسنون دعائیں (5) = کل 100 نمبر
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <input type="text" id="marks-candidate-search" placeholder="امیدوار تلاش کریں..." oninput="HifzModule.filterCandidatesMarksTable(this.value)"
                               style="padding:5px 12px; border-radius:8px; border:1px solid #a7f3d0; font-size:0.88rem; width:190px; background:#fff;">
                    </div>
                </div>
            </div>

            <!-- Marks Entry Table Card -->
            <div class="card" style="padding:0; overflow:hidden; border-radius:16px; border:1px solid #e2e8f0;">
                <div style="overflow-x:auto;">
                    <table id="hifz-marks-entry-table" style="width:100%; border-collapse:collapse; font-size:0.92rem; text-align:right;">
                        <thead>
                            <tr style="background:#f1f5f9; color:#334155;">
                                <th style="padding:10px; text-align:center; width:35px;">#</th>
                                <th style="padding:10px; min-width:140px;">طالب علم / رجسٹریشن</th>
                                <th style="padding:10px; min-width:100px;">حلقہ و منزل</th>
                                <th style="padding:10px; background:#ecfdf5; color:#166534; text-align:center; min-width:130px;">امتحانی حصہ / سپارہ (انفرادی)</th>
                                <th style="padding:10px; text-align:center; width:75px; background:#f0fdf4; color:#065f46;">حفظ (60)</th>
                                <th style="padding:10px; text-align:center; width:75px; background:#eff6ff; color:#1e40af;">تجوید (30)</th>
                                <th style="padding:10px; text-align:center; width:65px; background:#fefce8; color:#854d0e;">مسائل (5)</th>
                                <th style="padding:10px; text-align:center; width:65px; background:#fdf2f8; color:#9d174d;">دعائیں (5)</th>
                                <th style="padding:10px; text-align:center; width:60px;">حاصل</th>
                                <th style="padding:10px; text-align:center; width:55px;">فیصد</th>
                                <th style="padding:10px; text-align:center; width:70px;">تقدیر</th>
                                <th style="padding:10px; text-align:center; width:70px;">نتیجہ</th>
                                <th style="padding:10px; min-width:120px;">ریمارکس / کیفیت</th>
                                <th style="padding:10px; text-align:center; min-width:120px;">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${targetStudents.length === 0 ? `
                                <tr>
                                    <td colspan="15" style="text-align:center; padding:3rem; color:#dc2626; font-weight:bold;">
                                        اس حلقے یا شعبے میں کوئی امیدوار طالب علم نہیں ملا۔
                                    </td>
                                </tr>
                            ` : targetStudents.map((item, idx) => {
                                const st = item.student;
                                const en = item.enrollment;
                                const res = resultMap.get(st.id) || {};
                                
                                const m1 = res.hifzMarks !== undefined ? res.hifzMarks : (res.memorizationMarks !== undefined ? Math.min(60, res.memorizationMarks + (res.fluencyMarks || 0)) : 50);
                                const m2 = res.tajweedMarks !== undefined ? res.tajweedMarks : 25;
                                const m3 = res.masailMarks !== undefined ? res.masailMarks : 4;
                                const m4 = res.duaMarks !== undefined ? res.duaMarks : 4;
                                const tot = m1 + m2 + m3 + m4;
                                const maxM = 100;
                                const passM = exam.passingMarks || 50;
                                const pct = Math.round((tot / maxM) * 100 * 10) / 10;
                                const isPass = tot >= passM;
                                const grObj = HifzModule.getHifzGrade(pct, isPass);
                                let defaultPortion = res.portion;
                                if (!defaultPortion) {
                                    if (exam.portion && (exam.portion.includes('مکمل') || exam.portion.includes('30') || exam.portion.includes('۳۰'))) {
                                        defaultPortion = 'مکمل ۳۰ پارے';
                                    } else if (en && en.currentJuz) {
                                        defaultPortion = `پارہ ${en.currentJuz}`;
                                    } else {
                                        defaultPortion = exam.portion || 'حسبِ پیش رفت';
                                    }
                                }
                                const isBanat = st.section === 'banat' || st.section === 'بنات';

                                return `
                                    <tr data-student-id="${st.id}" data-exam-id="${exam.id}" data-max-marks="${maxM}" data-pass-marks="${passM}"
                                        style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                        <td style="text-align:center; font-weight:bold; color:#64748b; padding:8px 4px;">${idx + 1}</td>
                                        <td style="padding:8px;">
                                            <div style="font-weight:bold; color:var(--primary);">${st.name}</div>
                                            <div style="font-size:0.75rem; color:#64748b;">
                                                #${st.id} | ${st.fatherName ? `ولد ${st.fatherName} | ` : ''}${isBanat ? 'بنات' : 'بنین'}
                                            </div>
                                        </td>
                                        <td style="font-size:0.85rem; padding:8px;">
                                            <div><span style="background:#f1f5f9; padding:1px 6px; border-radius:4px; font-weight:600;">${en.halaqa || 'عام'}</span></div>
                                            <div style="color:#065f46; font-weight:600;">پارہ ${en.currentJuz || 1}</div>
                                        </td>
                                        <td style="background:#f0fdf4; text-align:center; padding:8px;">
                                            <input type="text" class="ex-portion" value="${defaultPortion}" placeholder="پارہ 1 تا 3" 
                                                   style="width:115px; text-align:center; padding:5px; font-weight:bold; color:#065f46; border:1.5px solid #10b981; border-radius:6px; background:#ffffff;">
                                        </td>
                                        <td style="text-align:center; padding:8px;">
                                            <input type="number" max="60" min="0" class="ex-m1" value="${m1}" oninput="HifzModule.calcExamRowTotal(this)" 
                                                   style="width:55px; text-align:center; padding:5px; border:1.5px solid #10b981; border-radius:6px; font-weight:bold; color:#065f46;" title="حفظِ قرآن مجید (زیادہ سے زیادہ 60 نمبر)">
                                        </td>
                                        <td style="text-align:center; padding:8px;">
                                            <input type="number" max="30" min="0" class="ex-m2" value="${m2}" oninput="HifzModule.calcExamRowTotal(this)" 
                                                   style="width:52px; text-align:center; padding:5px; border:1.5px solid #3b82f6; border-radius:6px; font-weight:bold; color:#1e40af;" title="تجوید و ترتیل (زیادہ سے زیادہ 30 نمبر)">
                                        </td>
                                        <td style="text-align:center; padding:8px;">
                                            <input type="number" max="5" min="0" class="ex-m3" value="${m3}" oninput="HifzModule.calcExamRowTotal(this)" 
                                                   style="width:48px; text-align:center; padding:5px; border:1.5px solid #eab308; border-radius:6px; font-weight:bold; color:#854d0e;" title="دینی مسائل (زیادہ سے زیادہ 5 نمبر)">
                                        </td>
                                        <td style="text-align:center; padding:8px;">
                                            <input type="number" max="5" min="0" class="ex-m4" value="${m4}" oninput="HifzModule.calcExamRowTotal(this)" 
                                                   style="width:48px; text-align:center; padding:5px; border:1.5px solid #ec4899; border-radius:6px; font-weight:bold; color:#9d174d;" title="مسنون دعائیں (زیادہ سے زیادہ 5 نمبر)">
                                        </td>
                                        <td style="font-weight:bold; font-size:1.05rem; color:var(--primary); text-align:center;" class="ex-total">${tot}</td>
                                        <td style="font-weight:bold; font-size:0.92rem; text-align:center; color:#334155;" class="ex-pct">${pct}%</td>
                                        <td style="text-align:center;" class="ex-grade">
                                            <span class="badge" style="background:${grObj.bg}; color:${grObj.color}; padding:2px 8px; border-radius:6px; font-weight:bold;">
                                                ${grObj.grade}
                                            </span>
                                        </td>
                                        <td style="text-align:center;" class="ex-status">
                                            <span class="badge" style="background:${isPass ? '#dcfce7' : '#fee2e2'}; color:${isPass ? '#15803d' : '#dc2626'}; padding:2px 8px; border-radius:6px; font-weight:bold; font-size:0.85rem;">
                                                ${isPass ? 'کامیاب' : 'ناکام'}
                                            </span>
                                        </td>
                                        <td style="padding:8px;">
                                            <input type="text" class="ex-remarks" value="${res.remarks || ''}" placeholder="کیفیت..." 
                                                   style="width:100%; min-width:110px; padding:4px 8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.85rem;">
                                        </td>
                                        <td style="text-align:center; padding:8px;">
                                            <div style="display:flex; justify-content:center; align-items:center; gap:4px;">
                                                <button type="button" class="btn btn-sm btn-primary" onclick="HifzModule.saveSingleExamResult(this)" 
                                                        style="padding:4px 8px; font-size:0.82rem; border-radius:6px;" title="محفوظ کریں">
                                                    <i class="fas fa-save"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm" onclick="HifzModule.showIndividualResultModal(${st.id}, ${exam.id})" 
                                                        style="padding:4px 8px; font-size:0.82rem; border-radius:6px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;" title="رزلٹ کارڈ دیکھیں">
                                                    <i class="fas fa-id-card"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm" onclick="HifzModule.downloadIndividualResultPDF(${st.id}, ${exam.id})" 
                                                        style="padding:4px 8px; font-size:0.82rem; border-radius:6px; background:#fef2f2; color:#dc2626; border:1px solid #fecaca;" title="پی ڈی ایف ڈاؤن لوڈ">
                                                    <i class="fas fa-file-pdf"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                ${targetStudents.length > 0 ? `
                    <div style="padding:1.2rem; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div style="font-size:0.9rem; color:#64748b;">
                            <i class="fas fa-check-double" style="color:#059669;"></i> نمبرات داخل کرنے کے بعد <b>"تمام طلباء کے نمبرات محفوظ کریں"</b> پر کلک فرمائیں۔
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button type="button" class="btn btn-primary" onclick="HifzModule.saveAllExamResults(${exam.id})" 
                                    style="padding:9px 24px; font-size:1.02rem; border-radius:10px; font-weight:bold; box-shadow:0 3px 10px rgba(6,95,70,0.25);">
                                <i class="fas fa-floppy-disk"></i> تمام طلباء کے نمبرات و نتائج محفوظ کریں
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    filterCandidatesMarksTable(query) {
        const trs = document.querySelectorAll('#hifz-marks-entry-table tbody tr');
        const q = (query || '').toLowerCase().trim();
        trs.forEach(tr => {
            const text = tr.innerText.toLowerCase();
            tr.style.display = text.includes(q) ? '' : 'none';
        });
    },

    calcExamRowTotal(input) {
        const tr = input.closest('tr');
        if (!tr) return;

        const parseVal = (sel, maxVal) => {
            const el = tr.querySelector(sel);
            if (!el) return 0;
            let val = parseInt(el.value);
            if (isNaN(val) || val < 0) val = 0;
            if (val > maxVal) {
                el.style.borderColor = '#ef4444';
                el.style.backgroundColor = '#fef2f2';
                el.title = `زیادہ سے زیادہ اجازت یافتہ نمبر: ${maxVal}`;
            } else {
                el.style.borderColor = '#cbd5e1';
                el.style.backgroundColor = '#ffffff';
                el.title = '';
            }
            return val;
        };

        const m1 = parseVal('.ex-m1', 60);
        const m2 = parseVal('.ex-m2', 30);
        const m3 = parseVal('.ex-m3', 5);
        const m4 = parseVal('.ex-m4', 5);

        const tot = m1 + m2 + m3 + m4;
        const maxMarks = parseInt(tr.getAttribute('data-max-marks')) || 100;
        const passMarks = parseInt(tr.getAttribute('data-pass-marks')) || 50;

        const pct = Math.round((tot / maxMarks) * 100 * 10) / 10;
        const isPass = tot >= passMarks;
        const grObj = this.getHifzGrade(pct, isPass);

        const totalCell = tr.querySelector('.ex-total');
        if (totalCell) totalCell.innerText = tot;

        const pctCell = tr.querySelector('.ex-pct');
        if (pctCell) pctCell.innerText = `${pct}%`;

        const gradeCell = tr.querySelector('.ex-grade');
        if (gradeCell) {
            gradeCell.innerHTML = `
                <span class="badge" style="background:${grObj.bg}; color:${grObj.color}; padding:2px 8px; border-radius:6px; font-weight:bold;">
                    ${grObj.grade}
                </span>
            `;
        }

        const statusCell = tr.querySelector('.ex-status');
        if (statusCell) {
            statusCell.innerHTML = `
                <span class="badge" style="background:${isPass ? '#dcfce7' : '#fee2e2'}; color:${isPass ? '#15803d' : '#dc2626'}; padding:2px 8px; border-radius:6px; font-weight:bold; font-size:0.85rem;">
                    ${isPass ? 'کامیاب' : 'ناکام'}
                </span>
            `;
        }
    },

    async saveSingleExamResult(btn) {
        const tr = btn.closest('tr');
        if (!tr) return;
        const examId = parseInt(tr.getAttribute('data-exam-id'));
        const studentId = parseInt(tr.getAttribute('data-student-id'));
        const maxMarks = parseInt(tr.getAttribute('data-max-marks')) || 100;
        const passMarks = parseInt(tr.getAttribute('data-pass-marks')) || 50;

        const m1 = parseInt(tr.querySelector('.ex-m1')?.value) || 0;
        const m2 = parseInt(tr.querySelector('.ex-m2')?.value) || 0;
        const m3 = parseInt(tr.querySelector('.ex-m3')?.value) || 0;
        const m4 = parseInt(tr.querySelector('.ex-m4')?.value) || 0;
        const portion = (tr.querySelector('.ex-portion')?.value || '').trim();
        const remarks = (tr.querySelector('.ex-remarks')?.value || '').trim();

        const obtainedMarks = m1 + m2 + m3 + m4;
        const percentage = Math.round((obtainedMarks / maxMarks) * 100 * 10) / 10;
        const isPass = obtainedMarks >= passMarks;
        const grObj = this.getHifzGrade(percentage, isPass);

        const origHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        await MadrassahDB.saveHifzExamResult({
            examId,
            studentId,
            portion,
            hifzMarks: m1,
            tajweedMarks: m2,
            masailMarks: m3,
            duaMarks: m4,
            memorizationMarks: m1, // backward compat
            totalMarks: maxMarks,
            passingMarks: passMarks,
            obtainedMarks,
            percentage,
            grade: grObj.grade,
            gradeTitle: grObj.title,
            isPass,
            status: isPass ? 'کامیاب' : 'ناکام',
            remarks,
            updatedAt: new Date().toISOString()
        });

        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }, 1200);

        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('طالب علم کے نمبرات محفوظ ہو گئے ہیں۔', 'success');
        }
    },

    async saveAllExamResults(examId) {
        const rows = document.querySelectorAll('#hifz-marks-entry-table tr[data-student-id]');
        if (rows.length === 0) return;

        for (const tr of rows) {
            const sId = parseInt(tr.getAttribute('data-student-id'));
            const maxMarks = parseInt(tr.getAttribute('data-max-marks')) || 100;
            const passMarks = parseInt(tr.getAttribute('data-pass-marks')) || 50;

            const m1 = parseInt(tr.querySelector('.ex-m1')?.value) || 0;
            const m2 = parseInt(tr.querySelector('.ex-m2')?.value) || 0;
            const m3 = parseInt(tr.querySelector('.ex-m3')?.value) || 0;
            const m4 = parseInt(tr.querySelector('.ex-m4')?.value) || 0;
            const portion = (tr.querySelector('.ex-portion')?.value || '').trim();
            const remarks = (tr.querySelector('.ex-remarks')?.value || '').trim();

            const obtainedMarks = m1 + m2 + m3 + m4;
            const percentage = Math.round((obtainedMarks / maxMarks) * 100 * 10) / 10;
            const isPass = obtainedMarks >= passMarks;
            const grObj = this.getHifzGrade(percentage, isPass);

            await MadrassahDB.saveHifzExamResult({
                examId: parseInt(examId),
                studentId: sId,
                portion,
                hifzMarks: m1,
                tajweedMarks: m2,
                masailMarks: m3,
                duaMarks: m4,
                memorizationMarks: m1, // backward compat
                totalMarks: maxMarks,
                passingMarks: passMarks,
                obtainedMarks,
                percentage,
                grade: grObj.grade,
                gradeTitle: grObj.title,
                isPass,
                status: isPass ? 'کامیاب' : 'ناکام',
                remarks,
                updatedAt: new Date().toISOString()
            });
        }

        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('تمام طلباء کے امتحانی نمبرات و نتائج کامیابی سے محفوظ ہو گئے ہیں۔', 'success');
        } else {
            alert('تمام طلباء کے امتحانی نمبرات و نتائج کامیابی سے محفوظ ہو گئے۔');
        }
    },

    async renderCollectiveResultTab(container, exam) {
        const rawResults = await MadrassahDB.getHifzExamResults(exam.id);
        const banin = await MadrassahDB.getAllStudents('banin');
        const banat = await MadrassahDB.getAllStudents('banat');
        const allStudents = [...banin, ...banat];
        const studentMap = new Map();
        allStudents.forEach(s => { if (s && s.id && !studentMap.has(s.id)) studentMap.set(s.id, s); });

        const halaqas = await MadrassahDB.getAllHifzHalaqas();
        const teachers = await MadrassahDB.getAllTeachers();
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
        const examinerName = teacherMap.get(exam.examinerTeacherId) || '---';

        // Prepare records
        const records = rawResults.map(r => {
            const st = studentMap.get(r.studentId) || { name: `طالب علم #${r.studentId}`, fatherName: '---', className: '---' };
            const m1 = r.hifzMarks !== undefined ? r.hifzMarks : (r.memorizationMarks !== undefined ? Math.min(60, r.memorizationMarks + (r.fluencyMarks || 0)) : 0);
            const m2 = r.tajweedMarks !== undefined ? r.tajweedMarks : 0;
            const m3 = r.masailMarks !== undefined ? r.masailMarks : 0;
            const m4 = r.duaMarks !== undefined ? r.duaMarks : 0;
            const tot = r.obtainedMarks !== undefined ? r.obtainedMarks : (m1 + m2 + m3 + m4);
            const maxM = r.totalMarks || exam.maxMarks || 100;
            const passM = r.passingMarks || exam.passingMarks || 50;
            const pct = r.percentage !== undefined ? r.percentage : (Math.round((tot / maxM) * 100 * 10) / 10);
            const isPass = r.isPass !== undefined ? r.isPass : (tot >= passM);
            const grObj = this.getHifzGrade(pct, isPass);
            return {
                result: r,
                student: st,
                hifzMarks: m1,
                tajweedMarks: m2,
                masailMarks: m3,
                duaMarks: m4,
                obtainedMarks: tot,
                totalMarks: maxM,
                percentage: pct,
                isPass,
                grade: r.grade || grObj.grade,
                gradeTitle: r.gradeTitle || grObj.title,
                portion: r.portion || exam.portion || '---',
                remarks: r.remarks || '---'
            };
        });

        // Compute rankings / positions based on obtained marks (descending)
        records.sort((a, b) => b.obtainedMarks - a.obtainedMarks);
        let currentRank = 0;
        let lastMarks = null;
        records.forEach((rec, i) => {
            if (rec.isPass) {
                if (rec.obtainedMarks !== lastMarks) {
                    currentRank = i + 1;
                    lastMarks = rec.obtainedMarks;
                }
                rec.rank = currentRank;
                rec.positionTitle = this.getUrduPosition(currentRank);
            } else {
                rec.rank = 9999;
                rec.positionTitle = '---';
            }
        });

        // Calculate Collective Statistics
        const totalCandidates = records.length;
        const passedCandidates = records.filter(r => r.isPass).length;
        const failedCandidates = totalCandidates - passedCandidates;
        const passPercentage = totalCandidates > 0 ? Math.round((passedCandidates / totalCandidates) * 100 * 10) / 10 : 0;
        
        let highestMarks = 0;
        let lowestMarks = totalCandidates > 0 ? records[0].obtainedMarks : 0;
        let sumMarks = 0;
        let sumPercentage = 0;

        records.forEach(r => {
            if (r.obtainedMarks > highestMarks) highestMarks = r.obtainedMarks;
            if (r.obtainedMarks < lowestMarks) lowestMarks = r.obtainedMarks;
            sumMarks += r.obtainedMarks;
            sumPercentage += r.percentage;
        });

        const avgMarks = totalCandidates > 0 ? Math.round((sumMarks / totalCandidates) * 10) / 10 : 0;
        const avgPercentage = totalCandidates > 0 ? Math.round((sumPercentage / totalCandidates) * 10) / 10 : 0;

        // Apply Filters
        let filteredRecords = [...records];
        if (this.collectiveStatusFilter === 'pass') {
            filteredRecords = filteredRecords.filter(r => r.isPass);
        } else if (this.collectiveStatusFilter === 'fail') {
            filteredRecords = filteredRecords.filter(r => !r.isPass);
        }

        if (this.collectiveHalaqaFilter && this.collectiveHalaqaFilter !== 'all') {
            filteredRecords = filteredRecords.filter(r => (r.student.className || '').includes(this.collectiveHalaqaFilter));
        }

        if (this.collectiveSearch) {
            const q = this.collectiveSearch.toLowerCase().trim();
            filteredRecords = filteredRecords.filter(r => 
                (r.student.name || '').toLowerCase().includes(q) ||
                (r.student.fatherName || '').toLowerCase().includes(q) ||
                String(r.student.id || '').includes(q)
            );
        }

        // Apply Sorting
        if (this.collectiveSort === 'marks') {
            filteredRecords.sort((a, b) => b.obtainedMarks - a.obtainedMarks);
        } else if (this.collectiveSort === 'name') {
            filteredRecords.sort((a, b) => (a.student.name || '').localeCompare(b.student.name || ''));
        } else if (this.collectiveSort === 'roll') {
            filteredRecords.sort((a, b) => parseInt(a.student.id || 0) - parseInt(b.student.id || 0));
        } else {
            // position
            filteredRecords.sort((a, b) => a.rank - b.rank);
        }

        container.innerHTML = `
            <div id="hifz-collective-report-root">
                <!-- Exam Header Top Card -->
                <div class="card" style="padding:1.2rem 1.5rem; margin-bottom:1.5rem; border-top:4px solid var(--primary); border-radius:16px; background:#ffffff; box-shadow:0 2px 10px rgba(0,0,0,0.03);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                <h3 style="margin:0; color:var(--primary); font-size:1.35rem;">
                                    <i class="fas fa-chart-column"></i> اجتماعی نتیجہ و گزیٹ — ${exam.title}
                                </h3>
                                <span style="background:#dcfce7; color:#15803d; font-size:0.85rem; padding:3px 12px; border-radius:20px; font-weight:bold;">
                                    سیشن: ${exam.session || '1446-1447ھ'}
                                </span>
                            </div>
                            <div style="font-size:0.9rem; color:#475569; margin-top:6px; display:flex; gap:16px; flex-wrap:wrap;">
                                <span><b>تاریخ:</b> ${exam.date}</span>
                                <span><b>نوعیت:</b> ${exam.examType || 'ماہانہ'}</span>
                                <span><b>حصہ / نصاب:</b> ${exam.portion}</span>
                                <span><b>ممتحن:</b> ${examinerName}</span>
                                <span><b>کل نمبر:</b> ${exam.maxMarks || 100} | <b>پاسنگ:</b> ${exam.passingMarks || 50}</span>
                            </div>
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button class="btn btn-sm" onclick="HifzModule.printCollectiveGazette(${exam.id})" 
                                    style="background:#065f46; color:#ffffff; border:none; border-radius:10px; padding:7px 16px; font-weight:bold; display:flex; align-items:center; gap:6px; cursor:pointer;">
                                <i class="fas fa-print"></i> اجتماعی نتیجہ پرنٹ کریں (A4 لینڈ سکیپ)
                            </button>
                            <button class="btn btn-sm btn-pdf-download" onclick="HifzModule.downloadCollectiveResultPDF(${exam.id})" 
                                    style="background:#dc2626; color:#ffffff; border:none; border-radius:10px; padding:7px 16px; font-weight:bold; display:flex; align-items:center; gap:6px; cursor:pointer;">
                                <i class="fas fa-file-pdf"></i> پی ڈی ایف ڈاؤن لوڈ
                            </button>
                            <button class="btn btn-sm" onclick="HifzModule.switchExamSubTab('marks', ${exam.id})" 
                                    style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; border-radius:10px; padding:7px 14px; font-weight:bold; cursor:pointer;">
                                <i class="fas fa-marker"></i> نمبرات میں ترمیم
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 8 Analytic Summary Cards -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(135px, 1fr)); gap:10px; margin-bottom:1.5rem;">
                    <div style="background:#ffffff; padding:1rem; border-radius:12px; border:1px solid #e2e8f0; text-align:center;">
                        <div style="font-size:0.82rem; color:#64748b; font-weight:bold;">کل شریک طلباء</div>
                        <div style="font-size:1.5rem; font-weight:800; color:#0f172a; margin-top:4px;">${totalCandidates}</div>
                    </div>
                    <div style="background:#ffffff; padding:1rem; border-radius:12px; border:1px solid #bbf7d0; text-align:center; background:#f0fdf4;">
                        <div style="font-size:0.82rem; color:#166534; font-weight:bold;">کامیاب حفاظ</div>
                        <div style="font-size:1.5rem; font-weight:800; color:#15803d; margin-top:4px;">${passedCandidates}</div>
                    </div>
                    <div style="background:#ffffff; padding:1rem; border-radius:12px; border:1px solid #fecaca; text-align:center; background:#fef2f2;">
                        <div style="font-size:0.82rem; color:#991b1b; font-weight:bold;">ناکام طلباء</div>
                        <div style="font-size:1.5rem; font-weight:800; color:#dc2626; margin-top:4px;">${failedCandidates}</div>
                    </div>
                    <div style="background:#ffffff; padding:1rem; border-radius:12px; border:1px solid #fed7aa; text-align:center; background:#fff7ed;">
                        <div style="font-size:0.82rem; color:#9a3412; font-weight:bold;">شرحِ کامیابی</div>
                        <div style="font-size:1.5rem; font-weight:800; color:#ea580c; margin-top:4px;">${passPercentage}%</div>
                    </div>
                    <div style="background:#ffffff; padding:1rem; border-radius:12px; border:1px solid #bae6fd; text-align:center; background:#f0f9ff;">
                        <div style="font-size:0.82rem; color:#0369a1; font-weight:bold;">اعلیٰ ترین نمبر</div>
                        <div style="font-size:1.5rem; font-weight:800; color:#0284c7; margin-top:4px;">${highestMarks}</div>
                    </div>
                    <div style="background:#ffffff; padding:1rem; border-radius:12px; border:1px solid #e2e8f0; text-align:center;">
                        <div style="font-size:0.82rem; color:#64748b; font-weight:bold;">کم ترین نمبر</div>
                        <div style="font-size:1.5rem; font-weight:800; color:#475569; margin-top:4px;">${lowestMarks}</div>
                    </div>
                    <div style="background:#ffffff; padding:1rem; border-radius:12px; border:1px solid #e9d5ff; text-align:center; background:#faf5ff;">
                        <div style="font-size:0.82rem; color:#6b21a8; font-weight:bold;">اوسط نمبرات</div>
                        <div style="font-size:1.5rem; font-weight:800; color:#7e22ce; margin-top:4px;">${avgMarks}</div>
                    </div>
                    <div style="background:#ffffff; padding:1rem; border-radius:12px; border:1px solid #ddd6fe; text-align:center; background:#f5f3ff;">
                        <div style="font-size:0.82rem; color:#5b21b6; font-weight:bold;">اوسط فیصد</div>
                        <div style="font-size:1.5rem; font-weight:800; color:#6d28d9; margin-top:4px;">${avgPercentage}%</div>
                    </div>
                </div>

                <!-- Filter & Controls Toolbar -->
                <div class="card" style="padding:1rem 1.2rem; margin-bottom:1.5rem; border-radius:14px; background:#ffffff; border:1px solid #e2e8f0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                            <input type="text" placeholder="نام یا رول نمبر تلاش کریں..." value="${this.collectiveSearch || ''}" 
                                   oninput="HifzModule.collectiveSearch = this.value; HifzModule.renderCollectiveResultTab(document.getElementById('hifz-exam-subview-area'), { id:${exam.id}, title:'${exam.title}', date:'${exam.date}', portion:'${exam.portion}', maxMarks:${exam.maxMarks || 100}, passingMarks:${exam.passingMarks || 50}, session:'${exam.session || ''}', examType:'${exam.examType || ''}', examinerTeacherId:${exam.examinerTeacherId || 0} })"
                                   style="padding:6px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.9rem; width:190px;">

                            <select onchange="HifzModule.collectiveStatusFilter = this.value; HifzModule.renderCollectiveResultTab(document.getElementById('hifz-exam-subview-area'), { id:${exam.id}, title:'${exam.title}', date:'${exam.date}', portion:'${exam.portion}', maxMarks:${exam.maxMarks || 100}, passingMarks:${exam.passingMarks || 50}, session:'${exam.session || ''}', examType:'${exam.examType || ''}', examinerTeacherId:${exam.examinerTeacherId || 0} })"
                                    style="padding:6px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.9rem;">
                                <option value="all" ${this.collectiveStatusFilter === 'all' ? 'selected' : ''}>تمام نتائج</option>
                                <option value="pass" ${this.collectiveStatusFilter === 'pass' ? 'selected' : ''}>صرف کامیاب حفاظ</option>
                                <option value="fail" ${this.collectiveStatusFilter === 'fail' ? 'selected' : ''}>صرف ناکام امیدواران</option>
                            </select>

                            <select onchange="HifzModule.collectiveSort = this.value; HifzModule.renderCollectiveResultTab(document.getElementById('hifz-exam-subview-area'), { id:${exam.id}, title:'${exam.title}', date:'${exam.date}', portion:'${exam.portion}', maxMarks:${exam.maxMarks || 100}, passingMarks:${exam.passingMarks || 50}, session:'${exam.session || ''}', examType:'${exam.examType || ''}', examinerTeacherId:${exam.examinerTeacherId || 0} })"
                                    style="padding:6px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.9rem;">
                                <option value="position" ${this.collectiveSort === 'position' ? 'selected' : ''}>ترتیب: پوزیشن کے لحاظ سے</option>
                                <option value="marks" ${this.collectiveSort === 'marks' ? 'selected' : ''}>ترتیب: نمبرات (زیادہ سے کم)</option>
                                <option value="name" ${this.collectiveSort === 'name' ? 'selected' : ''}>ترتیب: نام طالب علم</option>
                                <option value="roll" ${this.collectiveSort === 'roll' ? 'selected' : ''}>ترتیب: رول نمبر</option>
                            </select>
                        </div>

                        <div style="display:flex; align-items:center; gap:12px;">
                            <label style="display:flex; align-items:center; gap:6px; font-size:0.9rem; font-weight:600; cursor:pointer; color:#334155; user-select:none;">
                                <input type="checkbox" ${this.showPositions !== false ? 'checked' : ''} 
                                       onchange="HifzModule.showPositions = this.checked; HifzModule.renderCollectiveResultTab(document.getElementById('hifz-exam-subview-area'), { id:${exam.id}, title:'${exam.title}', date:'${exam.date}', portion:'${exam.portion}', maxMarks:${exam.maxMarks || 100}, passingMarks:${exam.passingMarks || 50}, session:'${exam.session || ''}', examType:'${exam.examType || ''}', examinerTeacherId:${exam.examinerTeacherId || 0} })">
                                <span>پوزیشن کالم دکھائیں</span>
                            </label>
                            <span style="font-size:0.88rem; color:#64748b; font-weight:bold;">
                                نمائش: <b>${filteredRecords.length}</b> از ${totalCandidates}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Gazette Printable Report Box -->
                <div class="card report-box" id="hifz-gazette-print-target" style="padding:0; overflow:hidden; border-radius:16px; border:1px solid #e2e8f0; background:#ffffff;">
                    <div style="padding:1.2rem 1.5rem; background:#f8fafc; border-bottom:2px solid #e2e8f0; text-align:center;">
                        <h2 style="margin:0; color:var(--primary); font-family:'Aref Ruqaa', 'Amiri', serif; font-size:1.8rem;">
                            مدرسہ عبد الرحمن بن عوف غفوریہ (خانیوال)
                        </h2>
                        <div style="font-size:1.2rem; font-weight:bold; color:#b45309; margin-top:2px;">
                            شعبہ تحفیظ القرآن الکریم — باضابطہ اجتماعی امتحانی گزیٹ و نتیجہ
                        </div>
                        <div style="font-size:0.95rem; color:#475569; margin-top:4px;">
                            امتحان: <b>${exam.title}</b> | سیشن: <b>${exam.session || '1446-1447ھ'}</b> | تاریخ: <b>${exam.date}</b> | ممتحن: <b>${examinerName}</b>
                        </div>
                    </div>

                    <div style="overflow-x:auto;">
                        <table style="width:100%; table-layout:fixed; border-collapse:collapse; font-size:0.86rem; white-space:nowrap;">
                            <thead>
                                <tr style="background:#f1f5f9; color:#334155; border-bottom:2px solid #cbd5e1; white-space:nowrap;">
                                    <th style="padding:7px 2px; text-align:center; width:3%; white-space:nowrap;">#</th>
                                    <th style="padding:7px 2px; text-align:center; width:5%; white-space:nowrap;">رول نمبر</th>
                                    <th style="padding:7px 4px; text-align:right; width:13%; white-space:nowrap;">نام طالب علم</th>
                                    <th style="padding:7px 4px; text-align:right; width:10%; white-space:nowrap;">ولدیت</th>
                                    <th style="padding:7px 2px; text-align:center; width:6%; white-space:nowrap;">حلقہ</th>
                                    <th style="padding:7px 2px; text-align:center; width:7%; white-space:nowrap;">امتحانی حصہ</th>
                                    <th style="padding:7px 2px; text-align:center; width:6%; background:#f0fdf4; color:#065f46; white-space:nowrap;">حفظ (60)</th>
                                    <th style="padding:7px 2px; text-align:center; width:6%; background:#eff6ff; color:#1e40af; white-space:nowrap;">تجوید (30)</th>
                                    <th style="padding:7px 2px; text-align:center; width:5%; background:#fefce8; color:#854d0e; white-space:nowrap;">مسائل (5)</th>
                                    <th style="padding:7px 2px; text-align:center; width:5%; background:#fdf2f8; color:#9d174d; white-space:nowrap;">دعائیں (5)</th>
                                    <th style="padding:7px 2px; text-align:center; width:5%; white-space:nowrap;">کل نمبر</th>
                                    <th style="padding:7px 2px; text-align:center; width:6%; white-space:nowrap;">حاصل کردہ</th>
                                    <th style="padding:7px 2px; text-align:center; width:5%; white-space:nowrap;">فیصد</th>
                                    <th style="padding:7px 2px; text-align:center; width:6%; white-space:nowrap;">تقدیر</th>
                                    <th style="padding:7px 2px; text-align:center; width:5%; white-space:nowrap;">نتیجہ</th>
                                    ${this.showPositions !== false ? `<th style="padding:7px 2px; text-align:center; width:6%; background:#fefce8; color:#854d0e; white-space:nowrap;">پوزیشن</th>` : ''}
                                    <th style="padding:7px 2px; text-align:center; width:9%; white-space:nowrap;" class="no-print">ایکشن</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredRecords.length === 0 ? `
                                    <tr>
                                        <td colspan="${this.showPositions !== false ? 17 : 16}" style="text-align:center; padding:3rem; color:#64748b;">
                                            کوئی نتیجہ دستیاب نہیں ہے۔
                                        </td>
                                    </tr>
                                ` : filteredRecords.map((rec, idx) => {
                                    const st = rec.student;
                                    const isTop3 = rec.rank <= 3 && rec.isPass;
                                    return `
                                        <tr style="border-bottom:1px solid #f1f5f9; background:${isTop3 ? '#fefce8' : 'transparent'}; white-space:nowrap;">
                                            <td style="text-align:center; font-weight:bold; color:#64748b; padding:6px 4px; white-space:nowrap;">${idx + 1}</td>
                                            <td style="text-align:center; font-family:monospace; font-weight:bold; color:#475569; padding:6px 6px; white-space:nowrap;">#${st.id}</td>
                                            <td style="font-weight:bold; color:var(--primary); font-size:0.92rem; text-align:right; padding:6px 6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                                <a href="javascript:void(0)" onclick="HifzModule.showIndividualResultModal(${st.id}, ${exam.id})" style="text-decoration:none; color:var(--primary);">
                                                    ${st.name}
                                                </a>
                                            </td>
                                            <td style="text-align:right; padding:6px 6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${st.fatherName || '---'}</td>
                                            <td style="text-align:center; padding:6px 6px; white-space:nowrap;"><span style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-size:0.85rem; font-weight:600;">${st.className || 'عام'}</span></td>
                                            <td style="text-align:center; padding:6px 6px; white-space:nowrap;"><span style="background:#ecfdf5; color:#065f46; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:0.85rem;">${rec.portion}</span></td>
                                            <td style="text-align:center; font-weight:bold; color:#065f46; padding:6px 6px; white-space:nowrap;">${rec.hifzMarks}</td>
                                            <td style="text-align:center; font-weight:bold; color:#1e40af; padding:6px 6px; white-space:nowrap;">${rec.tajweedMarks}</td>
                                            <td style="text-align:center; font-weight:bold; color:#854d0e; padding:6px 6px; white-space:nowrap;">${rec.masailMarks}</td>
                                            <td style="text-align:center; font-weight:bold; color:#9d174d; padding:6px 6px; white-space:nowrap;">${rec.duaMarks}</td>
                                            <td style="text-align:center; font-weight:bold; color:#475569; padding:6px 6px; white-space:nowrap;">${rec.totalMarks}</td>
                                            <td style="text-align:center; font-weight:bold; font-size:1.05rem; color:${rec.isPass ? '#15803d' : '#dc2626'}; padding:6px 6px; white-space:nowrap;">${rec.obtainedMarks}</td>
                                            <td style="text-align:center; font-weight:bold; color:#334155; padding:6px 6px; white-space:nowrap;">${rec.percentage}%</td>
                                            <td style="text-align:center; padding:6px 6px; white-space:nowrap;">
                                                <span class="badge" style="background:${this.getGradeBg(rec.grade)}; color:${this.getGradeColor(rec.grade)}; padding:2px 8px; border-radius:6px; font-weight:bold; white-space:nowrap; display:inline-block;">
                                                    ${rec.gradeTitle || rec.grade}
                                                </span>
                                            </td>
                                            <td style="text-align:center; padding:6px 6px; white-space:nowrap;">
                                                <span class="badge" style="background:${rec.isPass ? '#dcfce7' : '#fee2e2'}; color:${rec.isPass ? '#15803d' : '#dc2626'}; padding:2px 8px; border-radius:6px; font-weight:bold; white-space:nowrap; display:inline-block;">
                                                    ${rec.isPass ? 'کامیاب' : 'ناکام'}
                                                </span>
                                            </td>
                                            ${this.showPositions !== false ? `
                                                <td style="text-align:center; font-weight:bold; padding:6px 6px; white-space:nowrap;">
                                                    ${rec.isPass ? `
                                                        <span style="display:inline-block; padding:3px 8px; border-radius:6px; font-size:0.85rem; font-weight:bold; background:${rec.rank === 1 ? '#fef08a' : (rec.rank === 2 ? '#e2e8f0' : (rec.rank === 3 ? '#fed7aa' : '#f1f5f9'))}; color:#0f172a; border:1px solid #cbd5e1; white-space:nowrap;">
                                                            ${rec.positionTitle}
                                                        </span>
                                                    ` : '<span style="color:#94a3b8;">---</span>'}
                                                </td>
                                            ` : ''}
                                            <td style="text-align:center; padding:6px 6px; white-space:nowrap;" class="no-print">
                                                <div style="display:flex; justify-content:center; gap:4px;">
                                                    <button type="button" class="btn btn-sm" onclick="HifzModule.showIndividualResultModal(${st.id}, ${exam.id})" 
                                                            style="padding:3px 8px; font-size:0.8rem; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; border-radius:6px; white-space:nowrap;" title="رزلٹ کارڈ دیکھیں">
                                                        <i class="fas fa-id-card"></i> کارڈ
                                                    </button>
                                                    <button type="button" class="btn btn-sm" onclick="HifzModule.downloadIndividualResultPDF(${st.id}, ${exam.id})" 
                                                            style="padding:3px 8px; font-size:0.8rem; background:#fef2f2; color:#dc2626; border:1px solid #fecaca; border-radius:6px; white-space:nowrap;" title="پی ڈی ایف ڈاؤن لوڈ">
                                                        <i class="fas fa-file-pdf"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Gazette Footer Signatures -->
                    <div style="padding:2rem 2rem 1.5rem; display:flex; justify-content:space-between; margin-top:1.5rem; font-weight:bold; color:#334155; border-top:1px dashed #cbd5e1;">
                        <div style="text-align:center; min-width:140px;">
                            <div style="border-top:1.5px solid #64748b; padding-top:6px;">دستخط ممتحن / ناظم امتحان</div>
                        </div>
                        <div style="text-align:center; min-width:140px;">
                            <div style="border-top:1.5px solid #64748b; padding-top:6px;">دستخط نگرانِ شعبہ حفظ</div>
                        </div>
                        <div style="text-align:center; min-width:140px;">
                            <div style="border-top:1.5px solid #64748b; padding-top:6px;">مہر و دستخط مہتمم ادارہ</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async showIndividualResultModal(studentId, examId) {
        const student = await MadrassahDB.getStudentById(studentId);
        const exam = await MadrassahDB.getHifzExamById(examId);
        const results = await MadrassahDB.getHifzExamResults(examId);
        const teachers = await MadrassahDB.getAllTeachers();
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
        const examinerName = exam.examinerName || teacherMap.get(exam.examinerTeacherId) || '---';

        const subjects = this.getExamSubjects(exam);
        const res = results.find(r => r.studentId === studentId) || {};

        const savedMarks = res.subjectMarks || [res.marksQuran, res.marksNamaz, res.marksQaida];
        const savedPortions = res.subjectPortions || [res.portionQuran, res.portionNamaz, res.portionQaida];

        const maxM = exam.maxMarks || subjects.reduce((acc, s) => acc + (parseInt(s.maxMarks) || 0), 0);
        const passM = exam.passingMarks || Math.round(maxM * 0.5);

        let tot = 0;
        if (res.totalObtained !== undefined) {
            tot = res.totalObtained;
        } else if (res.obtainedMarks !== undefined) {
            tot = res.obtainedMarks;
        } else {
            savedMarks.forEach(m => { if (m !== null && m !== undefined && m !== '') tot += parseFloat(m) || 0; });
        }

        const pct = maxM > 0 ? Math.round((tot / maxM) * 100 * 10) / 10 : 0;
        const isPass = tot >= passM;
        const grObj = this.getHifzGrade(pct, isPass);

        // Calculate Position
        const passedSorted = results.filter(r => ((r.totalObtained !== undefined ? r.totalObtained : r.obtainedMarks) || 0) >= passM).sort((a, b) => ((b.totalObtained !== undefined ? b.totalObtained : b.obtainedMarks) || 0) - ((a.totalObtained !== undefined ? a.totalObtained : a.obtainedMarks) || 0));
        let myRank = '---';
        if (isPass) {
            const idx = passedSorted.findIndex(r => r.studentId === studentId);
            if (idx !== -1) {
                myRank = this.getUrduPosition(idx + 1);
            }
        }

        const modalDiv = document.createElement('div');
        modalDiv.id = 'hifzIndividualResultModal';
        modalDiv.className = 'mms-modal-backdrop';

        modalDiv.innerHTML = `
            <div class="mms-modal-box" style="max-width: 720px; max-height:92vh; overflow-y:auto; border-radius:20px; padding:0;">
                <div style="padding:1rem 1.5rem; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; border-radius:20px 20px 0 0;">
                    <div style="font-weight:bold; color:var(--primary); font-size:1.15rem; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-id-card"></i> انفرادی رزلٹ کارڈ پیش منظر (Preview)
                    </div>
                    <button type="button" onclick="document.getElementById('hifzIndividualResultModal').remove()" style="background:none; border:none; font-size:1.4rem; cursor:pointer; color:#64748b;">&times;</button>
                </div>

                <!-- Printable/Downloadable Card Area -->
                <div id="hifz-single-result-card-element" style="padding:25px 30px; background:#ffffff; position:relative; font-family:'Jameel Noori Nastaleeq', 'Noto Sans Urdu', 'Amiri', serif;">
                    <!-- Double Border Frame -->
                    <div style="border:5px double #065f46; border-radius:16px; padding:24px 28px; position:relative; background:#ffffff;">
                        <!-- Subtle Watermark Logo -->
                        <img src="logo.jpg" alt="Watermark" 
                             style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:260px; max-width:80%; opacity:0.06; pointer-events:none; z-index:0;">

                        <div style="position:relative; z-index:1;">
                            <!-- Header -->
                            <div style="text-align:center; border-bottom:2px solid #065f46; padding-bottom:12px; margin-bottom:18px;">
                                <div style="font-size:1.05rem; color:#b45309; font-weight:bold; margin-bottom:2px;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                                <h1 style="margin:0; font-family:'Aref Ruqaa', 'Amiri', serif; font-size:2.2rem; color:#065f46; line-height:1.2;">
                                    مدرسہ عبد الرحمن ؓ بن عوف غفوریہ
                                </h1>
                                <div style="font-size:1rem; color:#b45309; font-weight:bold; margin-top:2px;">
                                    چک نمبر R/28-10 بوسال کالونی ضلع خانیوال (رابطہ: 0302 7440199)
                                </div>
                                <div style="font-size:1.15rem; color:#065f46; font-weight:bold; margin-top:3px;">
                                    شعبہ تحفیظ القرآن الکریم — تفصیلی رزلٹ کارڈ و امتحانی سند
                                </div>
                                <div style="font-size:0.95rem; color:#475569; margin-top:4px;">
                                    امتحان: <b>${exam.title}</b> | سیشن: <b>${exam.session || exam.year || '1448ھ'}</b> | تاریخ: <b>${exam.date}</b>
                                </div>
                            </div>

                            <!-- Student Info Grid -->
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:1.08rem; margin-bottom:18px; background:#f8fafc; padding:12px 16px; border-radius:10px; border:1px solid #e2e8f0;">
                                <div><b>نام طالب علم:</b> <span style="color:#065f46; font-weight:bold; font-size:1.18rem;">${student.name}</span></div>
                                <div><b>رجسٹریشن / رول نمبر:</b> <span style="font-family:monospace; font-weight:bold; color:#0f172a;">#${student.id}</span></div>
                                <div><b>ولدیت:</b> <span>${student.fatherName || '---'}</span></div>
                                <div><b>حلقہ / درجہ:</b> <span>${student.className || exam.halaqa || 'عام'}</span></div>
                                <div><b>ممتحن استاد:</b> <span>${examinerName}</span></div>
                                <div><b>مقدار خواندگی (سبق / پارے):</b> <span style="background:#ecfdf5; color:#065f46; padding:2px 8px; border-radius:4px; font-weight:bold;">${res.portionQuran || res.portion || exam.portion || 'حسبِ پیش رفت'}</span></div>
                            </div>

                            <!-- Detailed Marks Breakdown Table -->
                            <table style="width:100%; border-collapse:collapse; text-align:center; font-size:1rem; margin-bottom:18px;">
                                <thead>
                                    <tr style="background:#ecfdf5; color:#065f46;">
                                        <th style="border:1.5px solid #065f46; padding:8px 12px; text-align:right;">امتحانی مضمون / جائزہ</th>
                                        <th style="border:1.5px solid #065f46; padding:8px; width:110px;">کل نمبر</th>
                                        <th style="border:1.5px solid #065f46; padding:8px; width:130px;">حاصل کردہ نمبر</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subjects.map((s, idx) => {
                                        const sm = (savedMarks && savedMarks[idx] !== undefined && savedMarks[idx] !== null && savedMarks[idx] !== '') ? savedMarks[idx] : 0;
                                        const sp = (savedPortions && savedPortions[idx]) ? savedPortions[idx] : (s.subtitle || '');
                                        return `
                                            <tr>
                                                <td style="border:1px solid #cbd5e1; padding:9px 14px; text-align:right;">
                                                    <strong>${idx + 1}. ${s.name}</strong> ${sp ? `<span style="color:#64748b; font-size:0.88rem;">(${sp})</span>` : ''}
                                                </td>
                                                <td style="border:1px solid #cbd5e1; padding:9px; font-weight:bold;">${s.maxMarks}</td>
                                                <td style="border:1px solid #cbd5e1; padding:9px; font-weight:bold; color:#065f46; font-size:1.1rem;">${sm}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>

                            <!-- Results Summary Box -->
                            <div style="background:#ecfdf5; border:2px solid #065f46; border-radius:10px; padding:12px 18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; font-size:1.15rem; font-weight:bold; margin-bottom:16px;">
                                <div>کل حاصل کردہ نمبر: <span style="color:#065f46; font-size:1.35rem;">${tot}</span> / ${maxM}</div>
                                <div>پاسنگ مارکس: <span style="color:#b45309;">${passM}</span></div>
                                <div>فیصد: <span style="color:#0284c7;">${pct}%</span></div>
                                <div>تقدیر / وفاق گریڈ: <span style="color:${grObj.color};">${grObj.title}</span></div>
                                <div>نتیجہ: <span style="color:${isPass ? '#15803d' : '#dc2626'};">${isPass ? 'کامیاب' : 'راسب / ناکام'}</span></div>
                                <div>پوزیشن: <span style="color:#b45309;">${myRank}</span></div>
                            </div>

                            ${res.remarks ? `
                                <div style="font-size:0.95rem; color:#475569; margin-bottom:16px; background:#f8fafc; padding:8px 12px; border-radius:8px; border-right:4px solid #065f46;">
                                    <b>کیفیت و تاثرات:</b> ${res.remarks}
                                </div>
                            ` : ''}

                            <!-- Official Signatures -->
                            <div style="display:flex; justify-content:space-between; margin-top:40px; font-size:1.05rem; font-weight:bold; color:#334155;">
                                <div style="text-align:center; min-width:130px;">
                                    <div style="border-top:1.5px solid #475569; padding-top:4px;">دستخط ممتحن</div>
                                </div>
                                <div style="text-align:center; min-width:130px;">
                                    <div style="border-top:1.5px solid #475569; padding-top:4px;">دستخط نگرانِ حفظ</div>
                                </div>
                                <div style="text-align:center; min-width:130px;">
                                    <div style="border-top:1.5px solid #475569; padding-top:4px;">مہر و دستخط مہتمم صاحب</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Actions -->
                <div style="padding:1rem 1.5rem; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:center; gap:12px; flex-wrap:wrap; border-radius:0 0 20px 20px;">
                    <button type="button" class="btn" onclick="HifzModule.printExamResultCard(${studentId}, ${examId})" 
                            style="background:#065f46; color:#ffffff; padding:9px 24px; border-radius:10px; font-weight:bold; display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-print"></i> پرنٹ کریں (A4)
                    </button>
                    <button type="button" class="btn btn-pdf-download" onclick="HifzModule.downloadIndividualResultPDF(${studentId}, ${examId})" 
                            style="background:#dc2626; color:#ffffff; padding:9px 24px; border-radius:10px; font-weight:bold; display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-file-pdf"></i> پی ڈی ایف ڈاؤن لوڈ
                    </button>
                    <button type="button" class="btn" onclick="document.getElementById('hifzIndividualResultModal').remove(); HifzModule.switchExamSubTab('marks', ${examId});" 
                            style="background:#f1f5f9; color:#475569; padding:9px 18px; border-radius:10px; font-weight:bold;">
                        <i class="fas fa-marker"></i> نمبرات میں ترمیم
                    </button>
                    <button type="button" class="btn" onclick="document.getElementById('hifzIndividualResultModal').remove()" 
                            style="background:#e2e8f0; color:#334155; padding:9px 18px; border-radius:10px; font-weight:bold;">
                        بند کریں
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);
    },

    async downloadIndividualResultPDF(studentId, examId) {
        const student = await MadrassahDB.getStudentById(studentId);
        const exam = await MadrassahDB.getHifzExamById(examId);
        let cardEl = document.getElementById('hifz-single-result-card-element');

        const btn = (window.event && window.event.currentTarget) ? window.event.currentTarget : document.querySelector('.btn-pdf-download');
        const origHtml = btn ? btn.innerHTML : '';
        if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> پی ڈی ایف بن رہی ہے...'; btn.disabled = true; }

        const safeStudent = (student ? student.name : 'طالب_علم').replace(/['"\\s]+/g, '_');
        const safeExam = (exam ? exam.title : 'امتحان').replace(/['"\\s]+/g, '_');
        const filename = `Hifz-Result-${safeStudent}-${safeExam}.pdf`;

        const doExport = (canvas) => {
            try {
                if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
                    alert('PDF لائبریری لوڈ نہیں ہوئی۔ صفحہ دوبارہ لوڈ کریں۔');
                    return;
                }
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const { jsPDF } = window.jspdf;
                // --- SINGLE PAGE FIX ---
                // Create a PDF page whose dimensions exactly match the image aspect ratio.
                // This guarantees only ONE page regardless of card height.
                const pWidth = 210; // A4 width in mm
                const margin = 8;
                const printableW = pWidth - (margin * 2);
                const imgAspect = canvas.height / canvas.width;
                const printableH = printableW * imgAspect;
                const pHeight = printableH + (margin * 2);

                const pdf = new jsPDF({
                    orientation: pHeight > pWidth ? 'portrait' : 'landscape',
                    unit: 'mm',
                    format: [pWidth, pHeight]
                });
                // Image fills the single page exactly — no overflow, no second page
                pdf.addImage(imgData, 'JPEG', margin, margin, printableW, printableH);
                pdf.save(filename);
            } catch (err) {
                console.error('PDF export error:', err);
                alert('پی ڈی ایف بنانے میں خرابی: ' + (err.message || err));
            } finally {
                if (btn) { btn.innerHTML = origHtml; btn.disabled = false; }
            }
        };

        if (typeof html2canvas !== 'undefined' && cardEl) {
            // --- TAINTED CANVAS FIX ---
            // Local file:// images (like logo.jpg watermark) cause canvas taint
            // which blocks toDataURL(). Hide all imgs before capture, restore after.
            const imgs = Array.from(cardEl.querySelectorAll('img'));
            imgs.forEach(img => { img._savedDisplay = img.style.display; img.style.display = 'none'; });

            html2canvas(cardEl, { scale: 2, useCORS: false, allowTaint: false, logging: false, backgroundColor: '#ffffff' })
                .then(canvas => {
                    // Restore hidden images
                    imgs.forEach(img => { img.style.display = img._savedDisplay || ''; delete img._savedDisplay; });
                    doExport(canvas);
                })
                .catch(err => {
                    // Restore hidden images on error too
                    imgs.forEach(img => { img.style.display = img._savedDisplay || ''; delete img._savedDisplay; });
                    console.error('html2canvas error:', err);
                    if (btn) { btn.innerHTML = origHtml; btn.disabled = false; }
                    alert('PDF بنانے میں خرابی۔ دوبارہ کوشش کریں۔');
                });
        } else {
            if (btn) { btn.innerHTML = origHtml; btn.disabled = false; }
            alert('PDF لائبریری یا رزلٹ کارڈ نہیں ملا۔');
        }
    },



    async printExamResultCard(studentId, examId) {
        const student = await MadrassahDB.getStudentById(studentId);
        const exam = await MadrassahDB.getHifzExamById(examId);
        const results = await MadrassahDB.getHifzExamResults(examId);
        const teachers = await MadrassahDB.getAllTeachers();
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
        const examinerName = teacherMap.get(exam.examinerTeacherId) || '---';

        const res = results.find(r => r.studentId === studentId) || {
            hifzMarks: 50, tajweedMarks: 25, masailMarks: 5, duaMarks: 5,
            obtainedMarks: 85, totalMarks: exam.maxMarks || 100, passingMarks: exam.passingMarks || 50, percentage: 85, grade: 'ممتاز', isPass: true, portion: exam.portion
        };

        const m1 = res.hifzMarks !== undefined ? res.hifzMarks : (res.memorizationMarks !== undefined ? Math.min(60, (res.memorizationMarks || 0) + (res.fluencyMarks || 0) + (res.mistakesMarks || 0) + (res.mutashabihatMarks || 0)) : 0);
        const m2 = res.tajweedMarks !== undefined ? res.tajweedMarks : 0;
        const m3 = res.masailMarks !== undefined ? res.masailMarks : 0;
        const m4 = res.duaMarks !== undefined ? res.duaMarks : 0;

        const maxM = res.totalMarks || exam.maxMarks || 100;
        const passM = res.passingMarks || exam.passingMarks || 50;
        const tot = res.obtainedMarks !== undefined ? res.obtainedMarks : (m1 + m2 + m3 + m4);
        const pct = res.percentage !== undefined ? res.percentage : (Math.round((tot / maxM) * 100 * 10) / 10);
        const isPass = res.isPass !== undefined ? res.isPass : (tot >= passM);
        const grObj = this.getHifzGrade(pct, isPass);

        // Position
        const passedSorted = results.filter(r => (r.obtainedMarks || 0) >= passM).sort((a, b) => (b.obtainedMarks || 0) - (a.obtainedMarks || 0));
        let myRank = '---';
        if (isPass) {
            const idx = passedSorted.findIndex(r => r.studentId === studentId);
            if (idx !== -1) myRank = this.getUrduPosition(idx + 1);
        }

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <!DOCTYPE html>
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>امتحانی رزلٹ کارڈ - ${student.name}</title>
                <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
                <style>
                    body { font-family: 'Jameel Noori Nastaleeq', 'Amiri', serif; padding: 25px; direction: rtl; background:#ffffff; color:#000; }
                    .card-border { border: 6px double #065f46; padding: 25px 30px; max-width: 680px; margin: 0 auto; border-radius: 12px; position: relative; }
                    .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 12px; margin-bottom: 16px; }
                    .title { font-size: 2.1rem; color: #065f46; margin: 0; }
                    .sub { font-size: 1.25rem; color: #b45309; font-weight: bold; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 1.12rem; margin-bottom: 20px; background:#f8fafc; padding:10px 14px; border-radius:8px; border:1px solid #e2e8f0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 1.05rem; }
                    th, td { border: 1px solid #065f46; padding: 8px; text-align: center; }
                    th { background: #ecfdf5; color: #065f46; font-weight: bold; }
                    .total-box { margin-top: 20px; background: #ecfdf5; border: 2px solid #065f46; padding: 10px 16px; font-size: 1.18rem; font-weight: bold; display: flex; justify-content: space-between; border-radius: 8px; flex-wrap:wrap; gap:8px; }
                    .footer { display: flex; justify-content: space-between; margin-top: 45px; font-size: 1.08rem; font-weight: bold; }
                    @media print {
                        .no-print { display: none !important; }
                        body { padding: 0; }
                        .card-border { border: 4px double #065f46; }
                    }
                </style>
            </head>
            <body>
                <div class="card-border">
                    <img src="logo.jpg" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:300px; max-width:85%; opacity:0.08; pointer-events:none; z-index:0;" alt="Watermark">
                    <div style="position:relative; z-index:1;">
                        <div class="header">
                            <div style="font-size:1rem; color:#b45309; font-weight:bold;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                            <h1 class="title">مدرسہ عبد الرحمن بن عوف غفوریہ (خانیوال)</h1>
                            <div class="sub">شعبہ تحفیظ القرآن الکریم — امتحانی رزلٹ کارڈ و سندِ کارکردگی</div>
                            <div style="font-size:0.95rem; color:#475569; margin-top:4px;">امتحان: <b>${exam.title}</b> | سیشن: <b>${exam.session || '1446-1447ھ'}</b> | تاریخ: <b>${exam.date}</b></div>
                        </div>

                        <div class="info-grid">
                            <div><b>نام طالب علم:</b> <span style="color:#065f46; font-weight:bold;">${student.name}</span></div>
                            <div><b>رجسٹریشن / رول نمبر:</b> #${student.id}</div>
                            <div><b>ولدیت:</b> ${student.fatherName || '---'}</div>
                            <div><b>حلقہ / درجہ:</b> ${student.className || exam.halaqa || 'عام'}</div>
                            <div><b>ممتحن استاد:</b> ${examinerName}</div>
                            <div><b>امتحانی حصہ / سبق:</b> <span style="color:#065f46; font-weight:bold;">${res.portion || exam.portion}</span></div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="text-align:right;">معیار جائزہ و امتحان</th>
                                    <th style="width:100px;">کل نمبر</th>
                                    <th style="width:120px;">حاصل کردہ نمبر</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td style="text-align:right;">1. حفظِ قرآن مجید (پختگی، استحضار و روانی)</td><td>60</td><td style="font-weight:bold;">${m1}</td></tr>
                                <tr><td style="text-align:right;">2. تجوید و ترتیل (مخارج و صفات)</td><td>30</td><td style="font-weight:bold;">${m2}</td></tr>
                                <tr><td style="text-align:right;">3. دینی مسائل (نماز و طہارت)</td><td>5</td><td style="font-weight:bold;">${m3}</td></tr>
                                <tr><td style="text-align:right;">4. مسنون دعائیں (یومیہ اذکار)</td><td>5</td><td style="font-weight:bold;">${m4}</td></tr>
                            </tbody>
                        </table>

                        <div class="total-box">
                            <div>حاصل کردہ: ${tot} / ${maxM}</div>
                            <div>فیصد: ${pct}%</div>
                            <div>تقدیر / گریڈ: ${grObj.title}</div>
                            <div>نتیجہ: ${isPass ? 'کامیاب' : 'ناکام'}</div>
                            <div>پوزیشن: ${myRank}</div>
                        </div>

                        ${res.remarks ? `<div style="margin-top:12px; font-size:0.95rem; color:#334155;"><b>کیفیت / تاثرات:</b> ${res.remarks}</div>` : ''}

                        <div class="footer">
                            <div>دستخط ممتحن</div>
                            <div>دستخط نگرانِ حفظ</div>
                            <div>مہر و دستخط مہتمم</div>
                        </div>
                    </div>
                </div>

                <div class="no-print" style="text-align:center; margin-top:20px; display:flex; justify-content:center; gap:12px;">
                    <button onclick="window.print()" style="padding:9px 30px; background:#065f46; color:white; border:none; border-radius:20px; font-size:1.1rem; cursor:pointer; font-weight:bold;">
                        پرنٹ کریں (Print)
                    </button>
                    <button onclick="window.close()" style="padding:9px 24px; background:#f1f5f9; color:#475569; border:none; border-radius:20px; font-size:1.1rem; cursor:pointer;">
                        بند کریں
                    </button>
                </div>
            </body>
            </html>
        `);
        printWin.document.close();
    },

    async downloadCollectiveResultPDF(examId) {
        const exam = await MadrassahDB.getHifzExamById(examId);
        const targetEl = document.getElementById('hifz-gazette-print-target');
        const btn = (window.event && window.event.currentTarget) ? window.event.currentTarget : document.querySelector('.btn-pdf-download');
        const origHtml = btn ? btn.innerHTML : '';
        if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> پی ڈی ایف بن رہی ہے...'; btn.disabled = true; }

        const safeExam = (exam ? exam.title : 'اجتماعی_گزیٹ').replace(/['"\\s]+/g, '_');
        const filename = `اجتماعی_گزیٹ_${safeExam}.pdf`;

        const doExport = (canvas) => {
            try {
                if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
                    window.print();
                    return;
                }
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                const pWidth = 297;
                const pHeight = 210;
                const imgProps = pdf.getImageProperties(imgData);
                const margin = 8;
                const maxW = pWidth - (margin * 2);
                const maxH = pHeight - (margin * 2);
                let finalW = maxW;
                let finalH = (imgProps.height * maxW) / imgProps.width;
                if (finalH > maxH) {
                    finalH = maxH;
                    finalW = (imgProps.width * maxH) / imgProps.height;
                }
                const x = (pWidth - finalW) / 2;
                const y = (pHeight - finalH) / 2;
                pdf.addImage(imgData, 'JPEG', x, y, finalW, finalH);
                pdf.save(filename);
            } catch (err) {
                console.error('Collective PDF export error:', err);
                window.print();
            } finally {
                if (btn) { btn.innerHTML = origHtml; btn.disabled = false; }
            }
        };

        if (typeof html2canvas !== 'undefined' && targetEl) {
            const noPrints = Array.from(targetEl.querySelectorAll('.no-print'));
            noPrints.forEach(el => { el._savedDisp = el.style.display; el.style.display = 'none'; });

            html2canvas(targetEl, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
                .then(canvas => {
                    noPrints.forEach(el => { el.style.display = el._savedDisp || ''; delete el._savedDisp; });
                    doExport(canvas);
                })
                .catch(err => {
                    noPrints.forEach(el => { el.style.display = el._savedDisp || ''; delete el._savedDisp; });
                    console.error('html2canvas error:', err);
                    if (btn) { btn.innerHTML = origHtml; btn.disabled = false; }
                    window.print();
                });
        } else {
            if (btn) { btn.innerHTML = origHtml; btn.disabled = false; }
            window.print();
        }
    },

    async printCollectiveGazette(examId) {
        const exam = await MadrassahDB.getHifzExamById(examId);
        const rawResults = await MadrassahDB.getHifzExamResults(examId);
        const banin = await MadrassahDB.getAllStudents('banin');
        const banat = await MadrassahDB.getAllStudents('banat');
        const allStudents = [...banin, ...banat];
        const studentMap = new Map();
        allStudents.forEach(s => { if (s && s.id && !studentMap.has(s.id)) studentMap.set(s.id, s); });

        const teachers = await MadrassahDB.getAllTeachers();
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
        const examinerName = exam.examinerName || teacherMap.get(exam.examinerTeacherId) || '---';

        const records = rawResults.map(r => {
            const st = studentMap.get(r.studentId) || { name: `طالب علم #${r.studentId}`, fatherName: '---', className: '---' };
            const m1 = r.hifzMarks !== undefined ? r.hifzMarks : (r.memorizationMarks !== undefined ? Math.min(60, r.memorizationMarks + (r.fluencyMarks || 0)) : 0);
            const m2 = r.tajweedMarks !== undefined ? r.tajweedMarks : 0;
            const m3 = r.masailMarks !== undefined ? r.masailMarks : 0;
            const m4 = r.duaMarks !== undefined ? r.duaMarks : 0;
            const tot = r.obtainedMarks !== undefined ? r.obtainedMarks : (m1 + m2 + m3 + m4);
            const maxM = r.totalMarks || exam.maxMarks || 100;
            const passM = r.passingMarks || exam.passingMarks || 50;
            const pct = r.percentage !== undefined ? r.percentage : (Math.round((tot / maxM) * 100 * 10) / 10);
            const isPass = r.isPass !== undefined ? r.isPass : (tot >= passM);
            const grObj = this.getHifzGrade(pct, isPass);
            return {
                result: r,
                student: st,
                hifzMarks: m1,
                tajweedMarks: m2,
                masailMarks: m3,
                duaMarks: m4,
                obtainedMarks: tot,
                totalMarks: maxM,
                percentage: pct,
                isPass,
                grade: r.grade || grObj.grade,
                gradeTitle: r.gradeTitle || grObj.title,
                portion: r.portion || exam.portion || '---'
            };
        });

        records.sort((a, b) => b.obtainedMarks - a.obtainedMarks);
        let rank = 0;
        let lastM = null;
        records.forEach((r, i) => {
            if (r.isPass) {
                if (r.obtainedMarks !== lastM) {
                    rank = i + 1;
                    lastM = r.obtainedMarks;
                }
                r.rank = rank;
                r.positionTitle = this.getUrduPosition(rank);
            } else {
                r.positionTitle = '---';
            }
        });

        const totalC = records.length;
        const passC = records.filter(r => r.isPass).length;
        const failC = totalC - passC;
        const passPct = totalC > 0 ? Math.round((passC / totalC) * 100 * 10) / 10 : 0;

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <!DOCTYPE html>
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>اجتماعی گزیٹ - ${exam.title}</title>
                <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
                <style>
                    * { box-sizing: border-box; }
                    html, body { width: 100%; margin: 0; padding: 0; direction: rtl; background: #ffffff; color: #000; }
                    body { font-family: 'Noto Sans Urdu', 'Segoe UI', Tahoma, 'Amiri', sans-serif; padding: 6mm 8mm; }
                    .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 6px; margin-bottom: 8px; }
                    .title { font-family: 'Jameel Noori Nastaleeq', 'Amiri', serif; font-size: 1.8rem; color: #065f46; margin: 0; line-height: 1.2; }
                    .sub { font-size: 1.05rem; color: #b45309; font-weight: bold; margin-top: 2px; }
                    .stats-bar { display: flex; justify-content: space-around; background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 8px; font-size: 0.88rem; font-weight: bold; white-space: nowrap; }
                    table { width: 100% !important; max-width: 100% !important; table-layout: fixed !important; border-collapse: collapse; font-size: 11px; }
                    th, td { border: 1px solid #475569; padding: 4px 2px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    th { background: #f1f5f9; color: #0f172a; font-weight: bold; font-size: 11px; }
                    .footer { display: flex; justify-content: space-between; margin-top: 25px; font-size: 0.95rem; font-weight: bold; }
                    @page { size: A4 landscape; margin: 6mm; }
                    @media print {
                        .no-print { display: none !important; }
                        html, body { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                        table { width: 100% !important; max-width: 100% !important; table-layout: fixed !important; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">مدرسہ عبد الرحمن بن عوف غفوریہ (خانیوال)</h1>
                    <div class="sub">شعبہ تحفیظ القرآن الکریم — باضابطہ اجتماعی امتحانی گزیٹ و نتیجہ (مطابق نصاب وفاق المدارس العربیہ پاکستان)</div>
                    <div style="font-size:0.9rem; color:#475569; margin-top:4px;">امتحان: <b>${exam.title}</b> | سیشن: <b>${exam.session || '1446-1447ھ'}</b> | تاریخ: <b>${exam.date}</b> | ممتحن: <b>${examinerName}</b></div>
                </div>

                <div class="stats-bar">
                    <div>کل امیدواران: ${totalC}</div>
                    <div style="color:#15803d;">کامیاب: ${passC}</div>
                    <div style="color:#dc2626;">ناکام: ${failC}</div>
                    <div>شرحِ کامیابی: ${passPct}%</div>
                    <div>کل ممکنہ نمبر: ${exam.maxMarks || 100}</div>
                    <div>پاسنگ مارکس: ${exam.passingMarks || 50}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width:3%;">#</th>
                            <th style="width:6%;">رول نمبر</th>
                            <th style="width:14%; text-align:right;">نام طالب علم</th>
                            <th style="width:11%; text-align:right;">ولدیت</th>
                            <th style="width:6%;">حلقہ</th>
                            <th style="width:8%;">امتحانی حصہ</th>
                            <th style="width:6%;">حفظ<br><span style="font-size:9px; font-weight:normal;">(60)</span></th>
                            <th style="width:6%;">تجوید<br><span style="font-size:9px; font-weight:normal;">(30)</span></th>
                            <th style="width:5%;">مسائل<br><span style="font-size:9px; font-weight:normal;">(5)</span></th>
                            <th style="width:5%;">دعائیں<br><span style="font-size:9px; font-weight:normal;">(5)</span></th>
                            <th style="width:5%;">کل نمبر</th>
                            <th style="width:6%;">حاصل کردہ</th>
                            <th style="width:5%;">فیصد</th>
                            <th style="width:5%;">تقدیر</th>
                            <th style="width:5%;">نتیجہ</th>
                            <th style="width:6%; background:#fefce8; color:#854d0e;">پوزیشن</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map((r, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td style="font-family:monospace; font-weight:bold;">#${r.student.id}</td>
                                <td style="text-align:right; font-weight:bold; overflow:hidden; text-overflow:ellipsis;">${r.student.name}</td>
                                <td style="text-align:right; overflow:hidden; text-overflow:ellipsis;">${r.student.fatherName || '---'}</td>
                                <td>${r.student.className || 'عام'}</td>
                                <td style="font-weight:bold; color:#065f46;">${r.portion}</td>
                                <td style="font-weight:bold;">${r.hifzMarks}</td>
                                <td style="font-weight:bold;">${r.tajweedMarks}</td>
                                <td style="font-weight:bold;">${r.masailMarks}</td>
                                <td style="font-weight:bold;">${r.duaMarks}</td>
                                <td>${r.totalMarks}</td>
                                <td style="font-weight:bold; font-size:12px;">${r.obtainedMarks}</td>
                                <td>${r.percentage}%</td>
                                <td style="font-weight:bold;">${r.gradeTitle || r.grade}</td>
                                <td style="font-weight:bold; color:${r.isPass ? '#15803d' : '#dc2626'};">${r.isPass ? 'کامیاب' : 'ناکام'}</td>
                                <td style="font-weight:bold;">${r.positionTitle}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <div>دستخط ممتحن / ناظم امتحان</div>
                    <div>دستخط نگرانِ شعبہ حفظ</div>
                    <div>مہر و دستخط مہتمم ادارہ</div>
                </div>

                <div class="no-print" style="text-align:center; margin-top:20px; display:flex; justify-content:center; gap:10px;">
                    <button onclick="window.print()" style="padding:8px 28px; background:#065f46; color:white; border:none; border-radius:20px; font-size:1.1rem; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-print"></i> پرنٹ کریں / PDF محفوظ کریں (A4 لینڈ سکیپ)
                    </button>
                    <button onclick="window.close()" style="padding:8px 20px; background:#f1f5f9; color:#475569; border:none; border-radius:20px; font-size:1.1rem; cursor:pointer;">
                        بند کریں
                    </button>
                </div>
            </body>
            </html>
        `);
        printWin.document.close();
    },

    // ==========================================
    // 8-B. HIFZ DETAILED EXAM AWARD LIST (تفصیلی نتیجہ)
    // ==========================================
    async renderExamAwardListModule(container) {
        if (!container) return;
        const exams = await MadrassahDB.getAllHifzExams();
        const activeSection = this.awardListSection || (window.app ? window.app.currentSection : 'banat');
        const allStudents = await MadrassahDB.getAllStudents(activeSection);
        const halaqas = await MadrassahDB.getAllHifzHalaqas();
        const teachers = await MadrassahDB.getAllTeachers();
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));

        // Determine active exam
        let activeExam = null;
        if (this.awardListActiveExamId) {
            activeExam = exams.find(e => e.id === this.awardListActiveExamId);
        }
        if (!activeExam && exams.length > 0) {
            activeExam = exams[0];
            this.awardListActiveExamId = activeExam.id;
        }

        // Set max marks and subject names from active exam if available
        this.awardListSubjects = this.getExamSubjects(activeExam);
        if (activeExam && activeExam.passingMarks !== undefined) {
            this.awardListPassingMarks = activeExam.passingMarks;
        } else {
            const tot = this.awardListSubjects.reduce((acc, s) => acc + (parseInt(s.maxMarks) || 0), 0);
            this.awardListPassingMarks = Math.round(tot * 0.5);
        }
        const totalMaxMarks = this.awardListSubjects.reduce((acc, s) => acc + (parseInt(s.maxMarks) || 0), 0);

        // Extract unique classes from students
        const classSet = new Set();
        const standardHifzClasses = [
            'تحفیظ القرآن الکریم (مکمل)',
            'حفظ سال اول (پارہ ۱ تا ۱۰)',
            'حفظ سال دوم (پارہ ۱۱ تا ۲۰)',
            'حفظ سال سوم (پارہ ۲۱ تا ۳۰)',
            'تکمیل حفظ و دور',
            'ناظرہ قرآن'
        ];
        standardHifzClasses.forEach(c => classSet.add(c));
        allStudents.forEach(s => {
            if (s.currentClass) classSet.add(s.currentClass);
        });

        const examinerName = activeExam ? (activeExam.examinerName || teacherMap.get(activeExam.examinerTeacherId) || '') : '';
        const sectionTitle = activeSection === 'banat' ? 'شعبہ بنات' : 'شعبہ بنین';
        const studentLabel = activeSection === 'banat' ? 'نام طالبہ' : 'نام طالب علم';
        const fatherLabel = activeSection === 'banat' ? 'بنت' : 'ولد';
        const allStudentsLabel = activeSection === 'banat' ? 'تمام طالبات' : 'تمام طلبہ';

        // Load saved results if exam is active
        let savedResults = [];
        if (activeExam) {
            savedResults = await MadrassahDB.getHifzExamResults(activeExam.id);
        }
        const resultMap = new Map();
        savedResults.forEach(r => {
            if (r.studentId) resultMap.set(r.studentId, r);
        });

        // Load enrollments and latest daily records for auto-populating student lessons
        const allEnrollments = await MadrassahDB.getAllHifzEnrollments();
        const enrollmentMap = new Map(allEnrollments.map(e => [e.studentId, e]));

        const allDaily = await MadrassahDB.getAllHifzDailyRecords();
        const latestDailyMap = new Map();
        allDaily.forEach(d => {
            if (!latestDailyMap.has(d.studentId) || new Date(d.date) > new Date(latestDailyMap.get(d.studentId).date)) {
                latestDailyMap.set(d.studentId, d);
            }
        });

        // Filter students by selected class/halaqa
        let targetStudents = allStudents;
        if (this.awardListSelectedClass && this.awardListSelectedClass !== 'all') {
            targetStudents = allStudents.filter(s => {
                if (s.currentClass === this.awardListSelectedClass) return true;
                if (s.department === this.awardListSelectedClass) return true;
                return false;
            });
            // If none found by class name, also check halaqas
            if (targetStudents.length === 0) {
                const matchedIds = new Set(allEnrollments.filter(e => e.halaqa === this.awardListSelectedClass).map(e => e.studentId));
                targetStudents = allStudents.filter(s => matchedIds.has(s.id));
            }
        }

        if (targetStudents.length === 0 && this.awardListSelectedClass === 'all') {
            targetStudents = allStudents;
        }

        // Sort ascending by ID so newly admitted students appear at the end (last number)
        targetStudents.sort((a, b) => parseInt(a.id || 0) - parseInt(b.id || 0));

        container.innerHTML = `
            <div class="hifz-award-list-module" style="animation:fadeIn 0.3s ease;">
                <!-- Control Panel / Toolbar (Hidden in print) -->
                <div class="card no-print" style="margin-bottom:1.5rem; background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; padding:1.2rem 1.5rem; box-shadow:0 2px 10px rgba(0,0,0,0.03);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:1.2rem; border-bottom:1px solid #f1f5f9; padding-bottom:1rem;">
                        <div>
                            <h3 style="color:var(--primary); margin:0; font-size:1.4rem; display:flex; align-items:center; gap:8px;">
                                <i class="fas fa-file-invoice"></i> تفصیلی نتیجہ و امتحانی ایوارڈ لسٹ (حفظ القرآن)
                            </h3>
                            <p style="margin:0.25rem 0 0 0; color:var(--text-muted); font-size:0.92rem;">
                                بغیر ڈیٹ شیٹ فوری امتحانی نتیجہ، ہو بہو حوالہ جاتی فارم، مقدارِ خواندگی، اور مکمل مارکس شیٹ
                            </p>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                            <button type="button" class="btn btn-sm btn-primary" onclick="HifzModule.showCreateAwardListExamModal()" style="display:flex; align-items:center; gap:6px; padding:7px 16px; border-radius:10px; font-weight:bold;">
                                <i class="fas fa-plus-circle"></i> نیا امتحان درج کریں
                            </button>
                            <button type="button" class="btn btn-sm" onclick="HifzModule.saveAwardListRecords()" style="background:#059669; color:#fff; border:none; padding:7px 18px; border-radius:10px; font-weight:bold; display:flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(5,150,105,0.25);">
                                <i class="fas fa-save"></i> ریکارڈ محفوظ کریں
                            </button>
                            <button type="button" class="btn btn-sm" onclick="HifzModule.printAwardListSheet()" style="background:#065f46; color:#fff; border:none; padding:7px 18px; border-radius:10px; font-weight:bold; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-print"></i> پرنٹ (A4 لینڈ سکیپ)
                            </button>
                            <button type="button" class="btn btn-sm" onclick="HifzModule.addAwardListManualRow()" style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; padding:7px 14px; border-radius:10px; font-weight:bold;">
                                <i class="fas fa-plus"></i> خالی سطر شامل کریں
                            </button>
                        </div>
                    </div>

                    <!-- Dropdowns Row -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; align-items:end;">
                        <div>
                            <label style="font-weight:bold; font-size:0.9rem; color:#334155; display:block; margin-bottom:4px;">
                                <i class="fas fa-file-signature"></i> امتحان کا انتخاب:
                            </label>
                            <select id="award_exam_select" onchange="HifzModule.onAwardListExamChange(this.value)" style="width:100%; padding:8px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-weight:600; font-size:0.95rem;">
                                ${exams.length === 0 ? '<option value="">کوئی امتحان موجود نہیں - نیا بنائیں</option>' : ''}
                                ${exams.map(e => {
                                    let cleanTitle = (e.title || 'امتحان').replace(/ماہانہ\s+ماہانہ/g, 'ماہانہ').replace(/\(\s*\)/g, '').trim();
                                    const month = (e.month || '').trim();
                                    const year = (e.year || e.session || '').trim();
                                    let extras = [];
                                    if (month && month !== 'ماہانہ' && !cleanTitle.includes(month)) {
                                        extras.push(month);
                                    }
                                    if (year && !cleanTitle.includes(year)) {
                                        extras.push(year);
                                    }
                                    const label = extras.length > 0 ? `${cleanTitle} (${extras.join(' - ')})` : cleanTitle;
                                    return `<option value="${e.id}" ${this.awardListActiveExamId == e.id ? 'selected' : ''}>${label}</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <div>
                            <label style="font-weight:bold; font-size:0.9rem; color:#334155; display:block; margin-bottom:4px;">
                                <i class="fas fa-user-tie"></i> ممتحن کا نام (از خود درج کریں):
                            </label>
                            <input type="text" id="award_ctrl_examiner" value="${examinerName}" placeholder="ممتحن کا نام لکھیں..." 
                                   style="width:100%; padding:8px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-weight:600; font-size:0.95rem;" 
                                   oninput="HifzModule.onExaminerNameChange(this.value)">
                        </div>

                        <div>
                            <label style="font-weight:bold; font-size:0.9rem; color:#334155; display:block; margin-bottom:4px;">
                                <i class="fas fa-graduation-cap"></i> کلاس / درجہ / حلقہ منتخب کریں:
                            </label>
                            <select id="award_class_select" onchange="HifzModule.onAwardListClassChange(this.value)" style="width:100%; padding:8px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-weight:600; font-size:0.95rem;">
                                <option value="all" ${this.awardListSelectedClass === 'all' ? 'selected' : ''}>${allStudentsLabel} (${allStudents.length})</option>
                                <optgroup label="شعبہ حفظ کے باقاعدہ درجات">
                                    ${Array.from(classSet).map(c => `<option value="${c}" ${this.awardListSelectedClass === c ? 'selected' : ''}>${c}</option>`).join('')}
                                </optgroup>
                                ${halaqas.length > 0 ? `
                                    <optgroup label="حلقہ جاتِ حفظ">
                                        ${halaqas.map(h => `<option value="${h.name}" ${this.awardListSelectedClass === h.name ? 'selected' : ''}>حلقہ: ${h.name}</option>`).join('')}
                                    </optgroup>
                                ` : ''}
                            </select>
                        </div>

                        <div>
                            <label style="font-weight:bold; font-size:0.9rem; color:#334155; display:block; margin-bottom:4px;">
                                <i class="fas fa-venus-mars"></i> شعبہ:
                            </label>
                            <div style="display:flex; gap:6px;">
                                <button type="button" class="btn btn-sm" onclick="HifzModule.awardListSection='banat'; HifzModule.renderExamAwardListModule(document.getElementById('hifz-subview-container'))" 
                                        style="flex:1; padding:7px; border-radius:8px; font-weight:bold; ${activeSection === 'banat' ? 'background:var(--primary); color:#fff;' : 'background:#f8fafc; color:#64748b; border:1px solid #cbd5e1;'}">
                                    شعبہ بنات (طالبات)
                                </button>
                                <button type="button" class="btn btn-sm" onclick="HifzModule.awardListSection='banin'; HifzModule.renderExamAwardListModule(document.getElementById('hifz-subview-container'))" 
                                        style="flex:1; padding:7px; border-radius:8px; font-weight:bold; ${activeSection === 'banin' ? 'background:var(--primary); color:#fff;' : 'background:#f8fafc; color:#64748b; border:1px solid #cbd5e1;'}">
                                    شعبہ بنین (طلباء)
                                </button>
                            </div>
                        </div>

                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <label style="font-weight:bold; font-size:0.9rem; color:#334155; margin:0;">
                                    <i class="fas fa-calculator"></i> کل نمبرات، پاس نمبر و مضامین:
                                </label>
                                <button type="button" class="btn btn-sm" onclick="HifzModule.showCustomizeSubjectsModal()" 
                                        style="padding:2px 8px; font-size:0.8rem; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; border-radius:6px; font-weight:bold; cursor:pointer;" title="مضامین تبدیل کریں یا مزید شامل کریں">
                                    <i class="fas fa-sliders"></i> مضامین سیٹنگ / مزید شامل کریں (${this.awardListSubjects.length})
                                </button>
                            </div>
                            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                                ${this.awardListSubjects.map((s, idx) => `
                                    <span style="font-size:0.82rem; font-weight:600;">${s.name}:</span>
                                    <input type="number" value="${s.maxMarks}" style="width:48px; padding:3px; text-align:center; border-radius:6px; border:1px solid #cbd5e1; font-weight:bold;" oninput="HifzModule.syncSubjectMaxMarks(${idx}, this.value)">
                                `).join('')}
                                <span style="font-size:0.82rem; font-weight:700; color:#dc2626; margin-right:4px;">پاس نمبر:</span>
                                <input type="number" id="award_ctrl_passing" value="${this.awardListPassingMarks}" style="width:52px; padding:3px; text-align:center; border-radius:6px; border:1.5px solid #dc2626; font-weight:bold; color:#dc2626; background:#fff1f2;" oninput="HifzModule.syncAwardPassingMarks(this.value)" title="پاسنگ مارکس (وفاق المدارس معیار کے مطابق)">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ======================================================== -->
                <!-- THE OFFICIAL AUTHENTIC EXAM RESULT SHEET (ہو بہو فارم) -->
                <!-- ======================================================== -->
                <div id="hifz-award-sheet-outer" style="background:#ffffff; border-radius:8px; padding:15px; box-shadow:0 4px 20px rgba(0,0,0,0.06); overflow-x:auto;">
                    <div id="hifz-award-sheet-inner" class="award-sheet-frame" style="border:3px solid #000; outline:1.5px solid #000; outline-offset:-5px; padding:16px 20px 24px; background:#ffffff; color:#000; font-family:'Jameel Noori Nastaleeq', 'Amiri', 'Noto Nastaliq Urdu', serif; direction:rtl; min-width:980px;">

                        <!-- Top Main Header (As per reference image) -->
                        <div style="display:grid; grid-template-columns: 200px 1fr 200px; align-items:center; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:8px;">
                            
                            <!-- Right Column: تفصیلی نتیجہ -->
                            <div style="text-align:right;">
                                <div style="font-size:2.2rem; font-weight:bold; line-height:1.1; font-family:'Aref Ruqaa', 'Amiri', serif;">
                                    تفصیلی نتیجہ
                                </div>
                            </div>

                            <!-- Center Column: شعبہ + مدرسہ نام -->
                            <div style="text-align:center; display:flex; align-items:center; justify-content:center; gap:24px;">
                                <div style="font-size:1.6rem; font-weight:bold; border:2px solid #000; border-radius:24px; padding:2px 20px; display:inline-block; font-family:'Aref Ruqaa', 'Amiri', serif; letter-spacing:0.5px;">
                                    ${sectionTitle}
                                </div>
                                <div style="font-size:2.2rem; font-weight:bold; font-family:'Aref Ruqaa', 'Amiri', serif;">
                                    مدرسہ عبد الرحمن ؓ بن عوف غفوریہ
                                </div>
                            </div>

                            <!-- Left Column: پتہ + فون + مونوگرام -->
                            <div style="text-align:left; display:flex; align-items:center; justify-content:flex-end; gap:12px;">
                                <div style="text-align:center; font-size:1.05rem; font-weight:bold; line-height:1.25;">
                                    <div>بوسال کالونی ضلع خانیوال</div>
                                    <div style="direction:ltr; font-family:sans-serif; font-size:0.95rem;">28 / 10 - R چک نمبر</div>
                                    <div style="direction:ltr; font-family:sans-serif; font-size:0.85rem; color:#333;">0302-7440199</div>
                                </div>
                                <img src="logo.png" alt="Logo" style="width:68px; height:68px; object-fit:contain;" onerror="this.src='logo.jpg'">
                            </div>
                        </div>

                        <!-- Sub-Header Information Line (امتحان | ماہ | سال | ممتحن) -->
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 12px 10px; font-size:1.25rem; font-weight:bold; border-bottom:1.5px solid #000; margin-bottom:12px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span>امتحان:</span>
                                <span style="border-bottom:1px dashed #000; min-width:140px; text-align:center; display:inline-block;" id="award_sheet_title">${activeExam ? (activeExam.title || '---').replace(/ماہانہ\s+ماہانہ/g, 'ماہانہ').replace(/\(\s*\)/g, '').trim() : '---'}</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span>ماہ:</span>
                                <span style="border-bottom:1px dashed #000; min-width:100px; text-align:center; display:inline-block;" id="award_sheet_month">${activeExam && activeExam.month && activeExam.month !== 'ماہانہ' ? activeExam.month : (activeExam && activeExam.date ? new Date(activeExam.date).toLocaleDateString('ur-PK', {month: 'long'}) : '---')}</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span>سال:</span>
                                <span style="border-bottom:1px dashed #000; min-width:100px; text-align:center; display:inline-block;" id="award_sheet_year">${activeExam && activeExam.year ? activeExam.year : '1446-1447ھ'}</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span>ممتحن:</span>
                                <input type="text" id="award_sheet_examiner_input" value="${examinerName}" 
                                       placeholder="ممتحن کا نام..." 
                                       title="یہاں کلک کر کے ممتحن کا نام از خود تبدیل کریں"
                                       style="border:none; border-bottom:1.5px dashed #000; min-width:170px; text-align:center; font-family:inherit; font-size:1.25rem; font-weight:bold; background:transparent; outline:none; color:#000;" 
                                       oninput="HifzModule.onExaminerNameChange(this.value)">
                            </div>
                        </div>

                        <!-- Table Grid matching image exactly -->
                        <table id="award-list-table" style="width:100%; border-collapse:collapse; border:2px solid #000; text-align:center; font-size:1.02rem;">
                            <thead>
                                <!-- Header Row 1 -->
                                <tr style="border-bottom:1.5px solid #000; font-weight:bold; background:#fafafa;">
                                    <th rowspan="2" style="border:1.5px solid #000; width:45px; padding:4px; vertical-align:middle;">
                                        نمبر<br>شمار
                                    </th>
                                    <th rowspan="2" style="border:1.5px solid #000; min-width:140px; padding:6px; vertical-align:middle; font-size:1.15rem;">
                                        ${studentLabel}
                                    </th>
                                    <th rowspan="2" style="border:1.5px solid #000; min-width:120px; padding:6px; vertical-align:middle; font-size:1.15rem;">
                                        ${fatherLabel}
                                    </th>
                                    <th colspan="${this.awardListSubjects.length}" style="border:1.5px solid #000; padding:4px; font-size:1.2rem; background:#f5f5f5;">
                                        مقدار خواندگی
                                    </th>
                                    <th colspan="${this.awardListSubjects.length}" style="border:1.5px solid #000; padding:4px; font-size:1.2rem; background:#f5f5f5;">
                                        حاصل کردہ نمبر
                                    </th>
                                    <th rowspan="2" style="border:1.5px solid #000; width:85px; padding:4px; vertical-align:middle; font-size:1.15rem;">
                                        کل نمبر
                                        <div style="font-size:0.85rem; font-weight:normal;" id="award_col_total_max">(${totalMaxMarks})<br><span style="font-size:0.75rem; color:#b91c1c; font-weight:bold;" id="award_col_passing_sub">پاس: ${this.awardListPassingMarks}</span></div>
                                    </th>
                                    <th rowspan="2" style="border:1.5px solid #000; width:95px; padding:4px; vertical-align:middle; font-size:1.15rem;">
                                        کیفیت
                                    </th>
                                    <th rowspan="2" class="no-print" style="border:1.5px solid #000; width:45px; vertical-align:middle; font-size:0.85rem;">
                                        حذف
                                    </th>
                                </tr>

                                <!-- Header Row 2: Sub-columns and Max Marks -->
                                <tr style="border-bottom:1.5px solid #000; font-weight:bold; background:#ffffff;">
                                    <!-- مقدار خواندگی -->
                                    ${this.awardListSubjects.map(s => `
                                        <th style="border:1.5px solid #000; min-width:85px; padding:5px;">${s.name}</th>
                                    `).join('')}
                                    
                                    <!-- حاصل کردہ نمبر مع کل نمبر درج کرنے کی ترتیب -->
                                    ${this.awardListSubjects.map(s => `
                                        <th style="border:1.5px solid #000; min-width:75px; padding:4px;">
                                            <div>${s.name}</div>
                                            <div style="font-size:0.8rem; font-weight:normal; color:#444;">
                                                (کل: <b>${s.maxMarks}</b>)
                                            </div>
                                        </th>
                                    `).join('')}
                                </tr>

                                <!-- Header Row 3: Iconic Rosettes (جیسے حوالہ جاتی فارم میں پھول ہیں) -->
                                <tr style="border-bottom:2px solid #000; background:#fcfcfc; font-size:0.95rem; height:24px;">
                                    <th style="border:1px solid #000; padding:2px;">۞</th>
                                    <th style="border:1px solid #000; padding:2px;">۞ ۞</th>
                                    <th style="border:1px solid #000; padding:2px;">۞ ۞</th>
                                    ${this.awardListSubjects.map(s => `
                                        <th style="border:1px solid #000; padding:2px; font-size:0.8rem; color:#666;">${s.subtitle || '۞'}</th>
                                    `).join('')}
                                    ${this.awardListSubjects.map(() => `
                                        <th style="border:1px solid #000; padding:2px;">۞</th>
                                    `).join('')}
                                    <th style="border:1px solid #000; padding:2px;">۞</th>
                                    <th style="border:1px solid #000; padding:2px;">۞ ۞</th>
                                    <th class="no-print" style="border:1px solid #000; padding:2px;">-</th>
                                </tr>
                            </thead>
                            <tbody id="award-list-table-body">
                                <!-- Student Rows rendered dynamically -->
                            </tbody>
                        </table>

                        <!-- Bottom Signatures (ہو بہو فارم کے مطابق) -->
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:40px; padding:0 35px 10px; font-size:1.3rem; font-weight:bold;">
                            <div style="text-align:center; min-width:200px;">
                                <div style="border-top:1.5px solid #000; padding-top:6px; font-family:'Aref Ruqaa', 'Amiri', serif;">
                                    دستخط ممتحن
                                </div>
                            </div>
                            <div style="text-align:center; min-width:200px;">
                                <div style="border-top:1.5px solid #000; padding-top:6px; font-family:'Aref Ruqaa', 'Amiri', serif;">
                                    دستخط مہتمم
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;

        const tbody = document.getElementById('award-list-table-body');
        if (tbody) {
            this.renderAwardListRows(tbody, targetStudents, resultMap, enrollmentMap, latestDailyMap);
        }
    },

    renderAwardListRows(tbody, students, resultMap, enrollmentMap, latestDailyMap) {
        if (!tbody) return;
        tbody.innerHTML = '';

        const subjects = this.awardListSubjects || [
            { name: 'قرآن', subtitle: 'سبق / پارے', maxMarks: 100 },
            { name: 'نماز حنفی', subtitle: 'دعائیں / کلمے', maxMarks: 50 },
            { name: 'قاعدہ', subtitle: 'تختی / اسباق', maxMarks: 50 }
        ];
        const numSubjects = subjects.length;
        const totalMaxMarks = subjects.reduce((sum, s) => sum + (parseInt(s.maxMarks) || 0), 0);
        const passMarks = parseInt(this.awardListPassingMarks) || Math.round(totalMaxMarks * 0.5);

        if (!students || students.length === 0) {
            // Render 10 blank rows ready for manual writing or data entry
            for (let i = 1; i <= 10; i++) {
                this.appendAwardListSingleRow(tbody, {
                    srNo: i,
                    studentId: '',
                    studentName: '',
                    fatherName: '',
                    portions: Array(numSubjects).fill(''),
                    marks: Array(numSubjects).fill(''),
                    totalObtained: '',
                    remarks: ''
                });
            }
            return;
        }

        students.forEach((st, idx) => {
            const saved = resultMap ? (resultMap.get(st.id) || {}) : {};
            const en = enrollmentMap ? enrollmentMap.get(st.id) : null;
            const daily = latestDailyMap ? latestDailyMap.get(st.id) : null;

            // Build portions array for each subject
            const portions = [];
            for (let sIdx = 0; sIdx < numSubjects; sIdx++) {
                let pVal = '';
                if (saved.subjectPortions && Array.isArray(saved.subjectPortions) && saved.subjectPortions[sIdx] !== undefined) {
                    pVal = saved.subjectPortions[sIdx] || '';
                } else if (sIdx === 0 && saved.portionQuran) {
                    pVal = saved.portionQuran;
                } else if (sIdx === 1 && saved.portionNamaz) {
                    pVal = saved.portionNamaz;
                } else if (sIdx === 2 && saved.portionQaida) {
                    pVal = saved.portionQaida;
                }

                // Auto-populate defaults if empty
                if (!pVal) {
                    if (sIdx === 0) {
                        if (daily && daily.sabaqJuz) {
                            pVal = `پارہ ${daily.sabaqJuz}${daily.sabaqQuantity ? ' (' + daily.sabaqQuantity + ')' : ''}`;
                        } else if (en && en.currentJuz) {
                            pVal = `پارہ ${en.currentJuz}${en.currentSurah ? ' (' + en.currentSurah + ')' : ''}`;
                        } else if (st.currentClass) {
                            pVal = st.currentClass;
                        }
                    } else if (sIdx === 1) {
                        pVal = subjects[1]?.subtitle || 'نماز مع مسنون دعائیں';
                    } else if (sIdx === 2) {
                        if (st.currentClass && (st.currentClass.includes('قاعدہ') || st.currentClass.includes('ناظرہ'))) {
                            pVal = st.currentClass;
                        } else {
                            pVal = subjects[2]?.subtitle || 'تختی و اسباق';
                        }
                    }
                }
                portions.push(pVal);
            }

            // Build marks array for each subject
            const marks = [];
            for (let sIdx = 0; sIdx < numSubjects; sIdx++) {
                let mVal = '';
                if (saved.subjectMarks && Array.isArray(saved.subjectMarks) && saved.subjectMarks[sIdx] !== undefined && saved.subjectMarks[sIdx] !== null) {
                    mVal = saved.subjectMarks[sIdx];
                } else if (sIdx === 0 && saved.marksQuran !== undefined && saved.marksQuran !== null) {
                    mVal = saved.marksQuran;
                } else if (sIdx === 1 && saved.marksNamaz !== undefined && saved.marksNamaz !== null) {
                    mVal = saved.marksNamaz;
                } else if (sIdx === 2 && saved.marksQaida !== undefined && saved.marksQaida !== null) {
                    mVal = saved.marksQaida;
                }
                marks.push(mVal);
            }

            let totalObt = saved.totalObtained !== undefined && saved.totalObtained !== null ? saved.totalObtained : '';
            const hasAnyMark = marks.some(m => m !== '' && m !== null && m !== undefined);
            if (totalObt === '' && hasAnyMark) {
                totalObt = marks.reduce((sum, m) => sum + (parseFloat(m) || 0), 0);
            }

            let remarks = saved.remarks || '';
            if (!remarks && totalObt !== '') {
                const obt = parseFloat(totalObt) || 0;
                const pct = totalMaxMarks > 0 ? (obt / totalMaxMarks) * 100 : 0;
                if (obt < passMarks) remarks = 'راسب (Fail)';
                else if (pct >= 80) remarks = 'ممتاز (Pass)';
                else if (pct >= 70) remarks = 'جید جداً (Pass)';
                else if (pct >= 60) remarks = 'جید (Pass)';
                else if (pct >= 50) remarks = 'مقبول (Pass)';
                else remarks = 'راسب (Fail)';
            }

            this.appendAwardListSingleRow(tbody, {
                srNo: idx + 1,
                studentId: st.id,
                studentName: st.name,
                fatherName: st.fatherName || '',
                portions,
                marks,
                totalObtained: totalObt,
                remarks: remarks
            });
        });

        // Ensure at least 10 rows in the table for print aesthetic
        if (students.length < 10) {
            const startSr = students.length + 1;
            for (let i = startSr; i <= 10; i++) {
                this.appendAwardListSingleRow(tbody, {
                    srNo: i,
                    studentId: '',
                    studentName: '',
                    fatherName: '',
                    portions: Array(numSubjects).fill(''),
                    marks: Array(numSubjects).fill(''),
                    totalObtained: '',
                    remarks: ''
                });
            }
        }
    },

    appendAwardListSingleRow(tbody, data) {
        const isBanat = (this.awardListSection || (window.app ? window.app.currentSection : 'banat')) === 'banat';
        const namePlaceholder = isBanat ? 'نام طالبہ' : 'نام طالب علم';
        const fatherPlaceholder = isBanat ? 'بنت' : 'ولد / ولدیت';
        const tr = document.createElement('tr');
        tr.style.cssText = 'border-bottom:1px solid #000; height:34px;';

        let remColor = '#000';
        const remVal = data.remarks || '';
        if (remVal.includes('ممتاز')) remColor = '#059669';
        else if (remVal.includes('جید جداً') || remVal.includes('جیداََ')) remColor = '#15803d';
        else if (remVal.includes('جید')) remColor = '#0284c7';
        else if (remVal.includes('مقبول')) remColor = '#d97706';
        else if (remVal.includes('راسب')) remColor = '#dc2626';

        const subjects = this.awardListSubjects || [
            { name: 'قرآن', subtitle: 'سبق / پارے', maxMarks: 100 },
            { name: 'نماز حنفی', subtitle: 'دعائیں / کلمے', maxMarks: 50 },
            { name: 'قاعدہ', subtitle: 'تختی / اسباق', maxMarks: 50 }
        ];

        const portionsHtml = subjects.map((s, sIdx) => {
            const pVal = (data.portions && data.portions[sIdx] !== undefined) ? data.portions[sIdx] : '';
            return `
                <td style="border:1px solid #000; padding:2px;">
                    <input type="text" class="award-input award-portion-subj" data-subj-idx="${sIdx}" value="${pVal}" placeholder="${s.subtitle || s.name}" style="width:100%; border:none; text-align:center; font-size:0.9rem; font-family:inherit; background:transparent;">
                </td>
            `;
        }).join('');

        const marksHtml = subjects.map((s, sIdx) => {
            const mVal = (data.marks && data.marks[sIdx] !== undefined && data.marks[sIdx] !== null) ? data.marks[sIdx] : '';
            return `
                <td style="border:1px solid #000; padding:2px;">
                    <input type="number" class="award-input award-marks-subj" data-subj-idx="${sIdx}" value="${mVal}" min="0" max="${s.maxMarks || 100}" oninput="HifzModule.calcAwardListRowTotal(this)" style="width:100%; border:none; text-align:center; font-size:1.05rem; font-weight:bold; font-family:inherit; background:transparent;">
                </td>
            `;
        }).join('');

        tr.innerHTML = `
            <td style="border:1px solid #000; padding:2px; font-weight:bold; font-size:0.95rem;">
                <span class="award-sr-no">${data.srNo}</span>
            </td>
            <td style="border:1px solid #000; padding:2px 4px; text-align:right;">
                <input type="text" class="award-input award-st-name" value="${data.studentName || ''}" data-student-id="${data.studentId || ''}" placeholder="${namePlaceholder}" style="width:100%; border:none; text-align:right; font-weight:bold; font-size:1rem; font-family:inherit; background:transparent;">
            </td>
            <td style="border:1px solid #000; padding:2px 4px; text-align:right;">
                <input type="text" class="award-input award-st-father" value="${data.fatherName || ''}" placeholder="${fatherPlaceholder}" style="width:100%; border:none; text-align:right; font-size:0.95rem; font-family:inherit; background:transparent;">
            </td>
            ${portionsHtml}
            ${marksHtml}
            <td style="border:1px solid #000; padding:2px;">
                <input type="number" class="award-input award-total-obtained" value="${data.totalObtained !== undefined && data.totalObtained !== null ? data.totalObtained : ''}" readonly style="width:100%; border:none; text-align:center; font-size:1.15rem; font-weight:bold; color:#065f46; font-family:inherit; background:transparent;">
            </td>
            <td style="border:1px solid #000; padding:2px;">
                <input type="text" class="award-input award-remarks" value="${data.remarks || ''}" placeholder="پاس / ممتاز" style="width:100%; border:none; text-align:center; font-size:0.95rem; font-weight:bold; color:${remColor}; font-family:inherit; background:transparent;">
            </td>
            <td class="no-print" style="border:1px solid #000; padding:2px; text-align:center;">
                <button type="button" onclick="HifzModule.removeAwardListRow(this)" style="background:none; border:none; color:#dc2626; cursor:pointer; font-size:0.9rem;" title="سطر حذف کریں">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    },

    calcAwardListRowTotal(inputEl) {
        const row = inputEl.closest('tr');
        if (!row) return;
        const markInputs = row.querySelectorAll('.award-marks-subj');
        const totEl = row.querySelector('.award-total-obtained');
        const remEl = row.querySelector('.award-remarks');

        let sum = 0;
        let hasAnyMarks = false;

        markInputs.forEach(inp => {
            if (inp.value !== '') {
                hasAnyMarks = true;
                sum += parseFloat(inp.value) || 0;
            }
        });

        if (hasAnyMarks) {
            if (totEl) totEl.value = sum;
            
            const subjects = this.awardListSubjects || [];
            const totalMax = subjects.reduce((acc, s) => acc + (parseInt(s.maxMarks) || 0), 0);
            const passMarks = parseInt(this.awardListPassingMarks) || Math.round(totalMax * 0.5);
            const pct = totalMax > 0 ? (sum / totalMax) * 100 : 0;

            let grade = '';
            let color = '#000';
            if (sum < passMarks) {
                grade = 'راسب (Fail)';
                color = '#dc2626';
            } else if (pct >= 80) {
                grade = 'ممتاز (Pass)';
                color = '#059669';
            } else if (pct >= 70) {
                grade = 'جید جداً (Pass)';
                color = '#15803d';
            } else if (pct >= 60) {
                grade = 'جید (Pass)';
                color = '#0284c7';
            } else if (pct >= 50) {
                grade = 'مقبول (Pass)';
                color = '#d97706';
            } else {
                grade = 'راسب (Fail)';
                color = '#dc2626';
            }

            if (remEl) {
                remEl.value = grade;
                remEl.style.color = color;
                remEl.style.fontWeight = 'bold';
            }
        } else {
            if (totEl) totEl.value = '';
            if (remEl) {
                remEl.value = '';
                remEl.style.color = 'inherit';
            }
        }
    },

    addAwardListManualRow() {
        const tbody = document.getElementById('award-list-table-body');
        if (!tbody) return;
        const rows = tbody.querySelectorAll('tr');
        const newSr = rows.length + 1;
        const numSubjects = (this.awardListSubjects || []).length;
        this.appendAwardListSingleRow(tbody, {
            srNo: newSr,
            studentId: '',
            studentName: '',
            fatherName: '',
            portions: Array(numSubjects).fill(''),
            marks: Array(numSubjects).fill(''),
            totalObtained: '',
            remarks: ''
        });
    },

    removeAwardListRow(btn) {
        const row = btn.closest('tr');
        if (row) {
            row.remove();
            const tbody = document.getElementById('award-list-table-body');
            if (tbody) {
                const srSpans = tbody.querySelectorAll('.award-sr-no');
                srSpans.forEach((span, idx) => {
                    span.textContent = idx + 1;
                });
            }
        }
    },

    syncAwardPassingMarks(val) {
        this.awardListPassingMarks = parseInt(val) || 0;
        const passSub = document.getElementById('award_col_passing_sub');
        if (passSub) passSub.textContent = `پاس: ${this.awardListPassingMarks}`;

        const ctrlPassing = document.getElementById('award_ctrl_passing');
        if (ctrlPassing && ctrlPassing.value != this.awardListPassingMarks) {
            ctrlPassing.value = this.awardListPassingMarks;
        }

        // Recalculate grades for all rows live
        document.querySelectorAll('#award-list-table-body tr').forEach(row => {
            const markEl = row.querySelector('.award-marks-subj');
            if (markEl) this.calcAwardListRowTotal(markEl);
        });

        const activeId = this.awardListActiveExamId || this.activeExamId;
        if (activeId) {
            MadrassahDB.getHifzExamById(activeId).then(exam => {
                if (exam) {
                    exam.passingMarks = this.awardListPassingMarks;
                    MadrassahDB.saveHifzExam(exam);
                }
            });
        }
    },

    syncSubjectMaxMarks(idx, val) {
        const v = parseInt(val) || 0;
        if (!this.awardListSubjects || !this.awardListSubjects[idx]) return;
        this.awardListSubjects[idx].maxMarks = v;

        const totalMaxMarks = this.awardListSubjects.reduce((acc, s) => acc + (parseInt(s.maxMarks) || 0), 0);
        const colTot = document.getElementById('award_col_total_max');
        if (colTot) {
            colTot.innerHTML = `(${totalMaxMarks})<br><span style="font-size:0.75rem; color:#b91c1c; font-weight:bold;" id="award_col_passing_sub">پاس: ${this.awardListPassingMarks}</span>`;
        }

        // Update inputs max attribute on rows for this subject
        document.querySelectorAll(`.award-marks-subj[data-subj-idx="${idx}"]`).forEach(el => el.max = v);

        // Recalculate grades for all rows live
        document.querySelectorAll('#award-list-table-body tr').forEach(row => {
            const firstMarkEl = row.querySelector('.award-marks-subj');
            if (firstMarkEl) this.calcAwardListRowTotal(firstMarkEl);
        });

        // Persist to DB if exam is active
        const activeId = this.awardListActiveExamId || this.activeExamId;
        if (activeId) {
            MadrassahDB.getHifzExamById(activeId).then(exam => {
                if (exam) {
                    exam.subjects = this.awardListSubjects;
                    exam.maxMarks = totalMaxMarks;
                    MadrassahDB.saveHifzExam(exam);
                }
            });
        }
    },

    async onExaminerNameChange(val) {
        const examinerName = (val || '').trim();
        const headerInput = document.getElementById('award_sheet_examiner_input');
        const ctrlInput = document.getElementById('award_ctrl_examiner');
        if (headerInput && headerInput.value !== val) headerInput.value = val;
        if (ctrlInput && ctrlInput.value !== val) ctrlInput.value = val;

        const targetId = this.awardListActiveExamId || this.activeExamId;
        if (targetId) {
            const exam = await MadrassahDB.getHifzExamById(targetId);
            if (exam) {
                exam.examinerName = examinerName;
                await MadrassahDB.saveHifzExam(exam);
            }
        }
    },

    showCustomizeSubjectsModal() {
        const existing = document.getElementById('customizeSubjectsModal');
        if (existing) existing.remove();

        this.custModalSubjects = (this.awardListSubjects || []).map(s => ({ ...s }));
        if (this.custModalSubjects.length === 0) {
            this.custModalSubjects = [
                { name: 'حفظِ قرآن', subtitle: 'سبق / پارے', maxMarks: 100 },
                { name: 'تعلیم الاسلام', subtitle: 'عقائد و مسائل', maxMarks: 50 },
                { name: 'تجوید و ترتیل', subtitle: 'مخارج و ترتیل', maxMarks: 50 }
            ];
        }

        const total = this.custModalSubjects.reduce((acc, s) => acc + (parseInt(s.maxMarks) || 0), 0);
        const pass = this.awardListPassingMarks !== undefined ? this.awardListPassingMarks : Math.round(total * 0.5);

        const modalDiv = document.createElement('div');
        modalDiv.id = 'customizeSubjectsModal';
        modalDiv.className = 'mms-modal-backdrop';
        modalDiv.innerHTML = `
            <div class="mms-modal-box" style="max-width: 680px; width: 95%; max-height: 92vh; display: flex; flex-direction: column; border-radius: 18px; padding: 0; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
                <div style="padding: 1.1rem 1.4rem; background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                    <div style="font-weight: bold; color: var(--primary); font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-sliders"></i> ترتیبِ مضامین و نمبرات (قرآن، تعلیم الاسلام، لہجہ، کتب وغیرہ)
                    </div>
                    <button type="button" onclick="document.getElementById('customizeSubjectsModal').remove()" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #64748b;">&times;</button>
                </div>
                <div style="padding: 1.3rem 1.5rem; overflow-y: auto; flex: 1;">
                    <!-- Quick Presets -->
                    <div style="margin-bottom: 1.2rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 10px 12px;">
                        <div style="font-size: 0.88rem; font-weight: bold; color: #166534; margin-bottom: 6px;">
                            <i class="fas fa-bolt"></i> فوری پری سیٹس (Quick Presets):
                        </div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button type="button" class="btn btn-sm" onclick="HifzModule.applyCustModalPreset([ {name:'حفظِ قرآن', subtitle:'پارہ / منزل', maxMarks:100}, {name:'تعلیم الاسلام', subtitle:'عقائد و مسائل', maxMarks:50}, {name:'تجوید و ترتیل', subtitle:'مخارج و ترتیل', maxMarks:50} ], 200, 100)" style="background:#fff; border:1px solid #86efac; color:#166534; font-size:0.82rem; padding:4px 8px; border-radius:6px; font-weight:bold; cursor:pointer;">
                                1. قرآن + تعلیم الاسلام + تجوید (200)
                            </button>
                            <button type="button" class="btn btn-sm" onclick="HifzModule.applyCustModalPreset([ {name:'قرآن مجید', subtitle:'سبق / پارے', maxMarks:100}, {name:'نماز حنفی', subtitle:'دعائیں / کلمے', maxMarks:50}, {name:'قاعدہ', subtitle:'تختی / اسباق', maxMarks:50} ], 200, 100)" style="background:#fff; border:1px solid #86efac; color:#166534; font-size:0.82rem; padding:4px 8px; border-radius:6px; font-weight:bold; cursor:pointer;">
                                2. قرآن + نماز + قاعدہ (200)
                            </button>
                            <button type="button" class="btn btn-sm" onclick="HifzModule.applyCustModalPreset([ {name:'حفظ قرآن', subtitle:'پارہ / منزل', maxMarks:100}, {name:'لہجہ و ترتیل', subtitle:'لحن و ترتیل', maxMarks:40}, {name:'دینی مسائل', subtitle:'دعائیں و سنن', maxMarks:30}, {name:'سیرت و اخلاق', subtitle:'سیرت و آداب', maxMarks:30} ], 200, 100)" style="background:#fff; border:1px solid #86efac; color:#166534; font-size:0.82rem; padding:4px 8px; border-radius:6px; font-weight:bold; cursor:pointer;">
                                3. چار مضامین: قرآن + لہجہ + مسائل + سیرت (200)
                            </button>
                            <button type="button" class="btn btn-sm" onclick="HifzModule.applyCustModalPreset([ {name:'حفظ قرآن', subtitle:'امتحانی پارہ', maxMarks:60}, {name:'تجوید و ترتیل', subtitle:'تجوید و لہجہ', maxMarks:30}, {name:'دینی مسائل', subtitle:'فرائض و مسائل', maxMarks:5}, {name:'مسنون دعائیں', subtitle:'دعائیں و سنن', maxMarks:5} ], 100, 50)" style="background:#fff; border:1px solid #86efac; color:#166534; font-size:0.82rem; padding:4px 8px; border-radius:6px; font-weight:bold; cursor:pointer;">
                                4. وفاق المدارس معیار (100)
                            </button>
                        </div>
                    </div>

                    <!-- Custom Form -->
                    <form onsubmit="HifzModule.handleSaveCustomSubjects(event)">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div style="font-weight: bold; color: #1e293b; font-size: 0.95rem;">
                                <i class="fas fa-list-check"></i> امتحانی مضامین کی فہرست:
                            </div>
                            <button type="button" class="btn btn-sm" onclick="HifzModule.addCustModalSubjectCard()" style="background: #ecfdf5; color: #065f46; border: 1.5px solid #10b981; border-radius: 8px; font-weight: bold; font-size: 0.85rem; padding: 4px 12px; cursor: pointer;">
                                <i class="fas fa-plus-circle"></i> + مزید مضمون شامل کریں
                            </button>
                        </div>

                        <!-- Dynamic Cards Container -->
                        <div id="cust_subjects_container" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;">
                            <!-- Rendered dynamically -->
                        </div>

                        <!-- Total & Passing Marks Row -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #eff6ff; padding: 12px; border-radius: 10px; border: 1.5px solid #bfdbfe;">
                            <div>
                                <label style="font-size: 0.9rem; font-weight: bold; color: #1e40af; display: block; margin-bottom: 4px;">
                                    <i class="fas fa-calculator"></i> مجموعی کل نمبرات:
                                </label>
                                <input type="number" id="cust_total_marks" value="${total}" readonly style="width: 100%; padding: 7px; border: 1.5px solid #93c5fd; border-radius: 6px; text-align: center; font-weight: bold; font-size: 1.1rem; background: #ffffff; color: #1e40af;">
                            </div>
                            <div>
                                <label style="font-size: 0.9rem; font-weight: bold; color: #dc2626; display: block; margin-bottom: 4px;">
                                    <i class="fas fa-check-double"></i> پاسنگ مارکس (Passing Marks):
                                </label>
                                <input type="number" id="cust_passing_marks" value="${pass}" min="1" required style="width: 100%; padding: 7px; border: 1.5px solid #dc2626; border-radius: 6px; text-align: center; font-weight: bold; font-size: 1.1rem; background: #fff1f2; color: #dc2626;">
                            </div>
                        </div>

                        <div style="margin-top: 1.4rem; display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" class="btn" style="background: #e2e8f0; color: #475569;" onclick="document.getElementById('customizeSubjectsModal').remove()">منسوخ</button>
                            <button type="submit" class="btn btn-primary" style="font-weight: bold; padding: 8px 24px;">
                                <i class="fas fa-check"></i> تبدیلیاں لاگو کریں
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);
        this.renderCustModalSubjectCards();
    },

    renderCustModalSubjectCards() {
        const container = document.getElementById('cust_subjects_container');
        if (!container) return;
        container.innerHTML = this.custModalSubjects.map((s, idx) => `
            <div class="cust-modal-subj-card" data-idx="${idx}" style="display: grid; grid-template-columns: 2fr 1.3fr 1fr auto; gap: 8px; align-items: end; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div>
                    <label style="font-size: 0.82rem; font-weight: bold; color: #334155; display: block; margin-bottom: 3px;">
                        مضمون ${idx + 1} کا نام
                    </label>
                    <input type="text" class="cust-subj-name" value="${s.name || ''}" placeholder="نامِ مضمون..." required 
                           style="width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; box-sizing: border-box;"
                           oninput="HifzModule.custModalSubjects[${idx}].name = this.value">
                </div>
                <div>
                    <label style="font-size: 0.82rem; font-weight: bold; color: #334155; display: block; margin-bottom: 3px;">
                        ذیلی عنوان (مقدار خواندگی)
                    </label>
                    <input type="text" class="cust-subj-sub" value="${s.subtitle || ''}" placeholder="سبق / پارے / کتب" 
                           style="width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box;"
                           oninput="HifzModule.custModalSubjects[${idx}].subtitle = this.value">
                </div>
                <div>
                    <label style="font-size: 0.82rem; font-weight: bold; color: #334155; display: block; margin-bottom: 3px;">
                        کل نمبر
                    </label>
                    <input type="number" class="cust-subj-max" value="${s.maxMarks !== undefined ? s.maxMarks : 50}" min="0" required 
                           style="width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center; font-weight: bold; box-sizing: border-box;" 
                           oninput="HifzModule.custModalSubjects[${idx}].maxMarks = parseInt(this.value)||0; HifzModule.recalcCustModalTotal();">
                </div>
                <div>
                    ${this.custModalSubjects.length > 1 ? `
                        <button type="button" onclick="HifzModule.removeCustModalSubjectCard(${idx})" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 1.1rem; padding: 6px;" title="مضمون حذف کریں">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    ` : `
                        <div style="width: 24px;"></div>
                    `}
                </div>
            </div>
        `).join('');
        this.recalcCustModalTotal();
    },

    addCustModalSubjectCard() {
        this.syncCustModalSubjectsFromDom();
        const count = this.custModalSubjects.length + 1;
        this.custModalSubjects.push({
            name: `مضمون ${count}`,
            subtitle: 'کتاب و اسباق',
            maxMarks: 50
        });
        this.renderCustModalSubjectCards();
    },

    removeCustModalSubjectCard(idx) {
        this.syncCustModalSubjectsFromDom();
        if (this.custModalSubjects.length <= 1) {
            alert('کم از کم ایک مضمون ہونا ضروری ہے!');
            return;
        }
        this.custModalSubjects.splice(idx, 1);
        this.renderCustModalSubjectCards();
    },

    syncCustModalSubjectsFromDom() {
        const cards = document.querySelectorAll('#cust_subjects_container .cust-modal-subj-card');
        cards.forEach((card, idx) => {
            if (this.custModalSubjects[idx]) {
                const nameEl = card.querySelector('.cust-subj-name');
                const subEl = card.querySelector('.cust-subj-sub');
                const maxEl = card.querySelector('.cust-subj-max');
                if (nameEl) this.custModalSubjects[idx].name = nameEl.value.trim();
                if (subEl) this.custModalSubjects[idx].subtitle = subEl.value.trim();
                if (maxEl) this.custModalSubjects[idx].maxMarks = parseInt(maxEl.value) || 0;
            }
        });
    },

    recalcCustModalTotal() {
        let tot = 0;
        const maxInputs = document.querySelectorAll('#cust_subjects_container .cust-subj-max');
        if (maxInputs.length > 0) {
            maxInputs.forEach(inp => tot += (parseInt(inp.value) || 0));
        } else if (this.custModalSubjects) {
            tot = this.custModalSubjects.reduce((acc, s) => acc + (parseInt(s.maxMarks) || 0), 0);
        }
        const totEl = document.getElementById('cust_total_marks');
        if (totEl) totEl.value = tot;
        const passEl = document.getElementById('cust_passing_marks');
        if (passEl && !passEl.dataset.userEdited) {
            passEl.value = Math.round(tot * 0.5);
        }
    },

    applyCustModalPreset(presetList, tot, pass) {
        this.custModalSubjects = presetList.map(s => ({ ...s }));
        this.renderCustModalSubjectCards();
        const totEl = document.getElementById('cust_total_marks');
        if (totEl) totEl.value = tot;
        const passEl = document.getElementById('cust_passing_marks');
        if (passEl) {
            passEl.value = pass;
            passEl.dataset.userEdited = 'true';
        }
    },

    applySubjectPreset(s1, s2, s3, m1, m2, m3, sub1, sub2, sub3, passMarks) {
        this.applyCustModalPreset([
            { name: s1, subtitle: sub1, maxMarks: m1 },
            { name: s2, subtitle: sub2, maxMarks: m2 },
            { name: s3, subtitle: sub3, maxMarks: m3 }
        ], m1 + m2 + m3, passMarks || Math.round((m1 + m2 + m3) * 0.5));
    },

    async handleSaveCustomSubjects(e) {
        e.preventDefault();
        this.syncCustModalSubjectsFromDom();

        const subjects = this.custModalSubjects && this.custModalSubjects.length > 0 ? this.custModalSubjects : [
            { name: 'حفظِ قرآن', subtitle: 'سبق / پارے', maxMarks: 100 },
            { name: 'تعلیم الاسلام', subtitle: 'عقائد و مسائل', maxMarks: 50 },
            { name: 'تجوید و ترتیل', subtitle: 'مخارج و ترتیل', maxMarks: 50 }
        ];

        const total = subjects.reduce((sum, s) => sum + (parseInt(s.maxMarks) || 0), 0);
        const passing = parseInt(document.getElementById('cust_passing_marks')?.value) || Math.round(total * 0.5);

        this.awardListSubjects = subjects;
        this.awardListPassingMarks = passing;

        // Legacy field mappings for 1st 3 subjects
        this.awardListSubj1Name = subjects[0]?.name || 'قرآن';
        this.awardListSubj2Name = subjects[1]?.name || 'نماز حنفی';
        this.awardListSubj3Name = subjects[2]?.name || 'قاعدہ';
        this.awardListSubj1Subtitle = subjects[0]?.subtitle || 'سبق / پارے';
        this.awardListSubj2Subtitle = subjects[1]?.subtitle || 'دعائیں / کلمے';
        this.awardListSubj3Subtitle = subjects[2]?.subtitle || 'تختی / اسباق';
        this.awardListMaxQuran = subjects[0]?.maxMarks !== undefined ? subjects[0].maxMarks : 100;
        this.awardListMaxNamaz = subjects[1]?.maxMarks !== undefined ? subjects[1].maxMarks : 50;
        this.awardListMaxQaida = subjects[2]?.maxMarks !== undefined ? subjects[2].maxMarks : 50;

        const targetId = this.awardListActiveExamId || this.activeExamId;
        if (targetId) {
            const activeExam = await MadrassahDB.getHifzExamById(targetId);
            if (activeExam) {
                activeExam.subjects = subjects;
                activeExam.maxMarks = total;
                activeExam.passingMarks = passing;
                activeExam.subj1Name = this.awardListSubj1Name;
                activeExam.subj2Name = this.awardListSubj2Name;
                activeExam.subj3Name = this.awardListSubj3Name;
                activeExam.subj1Subtitle = this.awardListSubj1Subtitle;
                activeExam.subj2Subtitle = this.awardListSubj2Subtitle;
                activeExam.subj3Subtitle = this.awardListSubj3Subtitle;
                activeExam.maxMarksQuran = this.awardListMaxQuran;
                activeExam.maxMarksNamaz = this.awardListMaxNamaz;
                activeExam.maxMarksQaida = this.awardListMaxQaida;
                await MadrassahDB.saveHifzExam(activeExam);
            }
        }

        document.getElementById('customizeSubjectsModal')?.remove();
        const subContainer = document.getElementById('hifz-subview-container') || document.getElementById('hifz-exam-subview-area');
        if (subContainer) {
            await this.renderExamAwardListModule(subContainer);
        }
    },

    async onAwardListExamChange(examId) {
        this.awardListActiveExamId = parseInt(examId) || null;
        this.activeExamId = this.awardListActiveExamId; // sync both places
        const subContainer = document.getElementById('hifz-subview-container') || document.getElementById('hifz-exam-subview-area');
        if (subContainer) {
            await this.renderExamAwardListModule(subContainer);
        }
    },

    async onAwardListClassChange(className) {
        this.awardListSelectedClass = className;
        const subContainer = document.getElementById('hifz-subview-container') || document.getElementById('hifz-exam-subview-area');
        if (subContainer) {
            await this.renderExamAwardListModule(subContainer);
        }
    },

    showCreateAwardListExamModal() {
        this.showCreateExamModal();
    },

    recalcCreateModalTotal() {
        this.recalcExamModalTotal();
    },

    applyCreateModalPreset(s1, s2, s3, m1, m2, m3, sub1, sub2, sub3, passMarks) {
        this.applyExamModalPreset([
            { name: s1, subtitle: sub1, maxMarks: m1 },
            { name: s2, subtitle: sub2, maxMarks: m2 },
            { name: s3, subtitle: sub3, maxMarks: m3 }
        ], m1 + m2 + m3, passMarks || Math.round((m1 + m2 + m3) * 0.5));
    },

    async handleCreateAwardListExamSubmit(e) {
        return this.handleCreateExamSubmit(e);
    },

    async saveAwardListRecords() {
        if (!this.awardListActiveExamId) {
            alert('براہِ کرم پہلے کوئی امتحان منتخب یا نیا امتحان درج فرمائیں!');
            return;
        }
        const tbody = document.getElementById('award-list-table-body');
        if (!tbody) return;

        const subjects = this.awardListSubjects || [
            { name: 'قرآن', subtitle: 'سبق / پارے', maxMarks: 100 },
            { name: 'نماز حنفی', subtitle: 'دعائیں / کلمے', maxMarks: 50 },
            { name: 'قاعدہ', subtitle: 'تختی / اسباق', maxMarks: 50 }
        ];
        const numSubjects = subjects.length;
        const totalMaxMarks = subjects.reduce((sum, s) => sum + (parseInt(s.maxMarks) || 0), 0);
        const passMarks = parseInt(this.awardListPassingMarks) || Math.round(totalMaxMarks * 0.5);

        const rows = tbody.querySelectorAll('tr');
        let savedCount = 0;

        for (const row of rows) {
            const nameInput = row.querySelector('.award-st-name');
            const studentName = nameInput ? nameInput.value.trim() : '';
            if (!studentName) continue;

            const studentIdVal = nameInput ? nameInput.getAttribute('data-student-id') : null;
            const studentId = studentIdVal && parseInt(studentIdVal) ? parseInt(studentIdVal) : (10000 + savedCount + 1);

            const fatherName = row.querySelector('.award-st-father')?.value.trim() || '';

            // Dynamic subject portions & marks
            const subjectPortions = [];
            const subjectMarks = [];

            for (let sIdx = 0; sIdx < numSubjects; sIdx++) {
                const portionInp = row.querySelector(`.award-portion-subj[data-subj-idx="${sIdx}"]`);
                const markInp = row.querySelector(`.award-marks-subj[data-subj-idx="${sIdx}"]`);

                subjectPortions.push(portionInp ? portionInp.value.trim() : '');
                subjectMarks.push(markInp && markInp.value !== '' ? parseFloat(markInp.value) : null);
            }

            const totalObt = row.querySelector('.award-total-obtained')?.value !== '' ? parseFloat(row.querySelector('.award-total-obtained')?.value) : 0;
            const remarks = row.querySelector('.award-remarks')?.value.trim() || '';

            const resultObj = {
                examId: this.awardListActiveExamId,
                studentId,
                studentName,
                fatherName,
                subjectPortions,
                subjectMarks,
                // Legacy fields for backwards compatibility with older reports
                portionQuran: subjectPortions[0] || '',
                portionNamaz: subjectPortions[1] || '',
                portionQaida: subjectPortions[2] || '',
                marksQuran: subjectMarks[0] !== undefined ? subjectMarks[0] : null,
                marksNamaz: subjectMarks[1] !== undefined ? subjectMarks[1] : null,
                marksQaida: subjectMarks[2] !== undefined ? subjectMarks[2] : null,
                totalObtained: totalObt,
                obtainedMarks: totalObt,
                totalMarks: totalMaxMarks,
                passingMarks: passMarks,
                percentage: totalMaxMarks > 0 ? ((totalObt / totalMaxMarks) * 100).toFixed(1) : 0,
                grade: remarks,
                remarks,
                date: new Date().toISOString().split('T')[0]
            };

            await MadrassahDB.saveHifzExamResult(resultObj);
            savedCount++;
        }

        const activeExam = await MadrassahDB.getHifzExamById(this.awardListActiveExamId);
        if (activeExam) {
            const exInput = document.getElementById('award_ctrl_examiner') || document.getElementById('award_sheet_examiner_input');
            if (exInput && exInput.value) {
                activeExam.examinerName = exInput.value.trim();
            }
            activeExam.subjects = subjects;
            activeExam.maxMarks = totalMaxMarks;
            activeExam.passingMarks = passMarks;
            activeExam.subj1Name = subjects[0]?.name || 'قرآن';
            activeExam.subj2Name = subjects[1]?.name || 'نماز حنفی';
            activeExam.subj3Name = subjects[2]?.name || 'قاعدہ';
            activeExam.subj1Subtitle = subjects[0]?.subtitle || 'سبق / پارے';
            activeExam.subj2Subtitle = subjects[1]?.subtitle || 'دعائیں / کلمے';
            activeExam.subj3Subtitle = subjects[2]?.subtitle || 'تختی / اسباق';
            activeExam.maxMarksQuran = subjects[0]?.maxMarks || 0;
            activeExam.maxMarksNamaz = subjects[1]?.maxMarks || 0;
            activeExam.maxMarksQaida = subjects[2]?.maxMarks || 0;
            await MadrassahDB.saveHifzExam(activeExam);
        }

        alert(`ماشاءاللہ! کل ${savedCount} طلبہ/طالبات کے امتحانی نمبرات کامیابی سے محفوظ کر لیے گئے ہیں۔`);
    },

    async printAwardListSheet() {
        const exam = this.awardListActiveExamId ? await MadrassahDB.getHifzExamById(this.awardListActiveExamId) : null;
        const sheetInner = document.getElementById('hifz-award-sheet-inner');
        if (!sheetInner) return;

        const clone = sheetInner.cloneNode(true);
        clone.querySelectorAll('.no-print').forEach(el => el.remove());

        // Replace inputs with their text contents for printing
        clone.querySelectorAll('input').forEach(input => {
            const val = input.value || '';
            const span = document.createElement('span');
            span.textContent = val;
            span.style.fontFamily = 'inherit';
            span.style.fontSize = 'inherit';
            span.style.fontWeight = input.style.fontWeight || 'normal';
            span.style.color = '#000';
            input.parentNode.replaceChild(span, input);
        });

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <!DOCTYPE html>
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>تفصیلی نتیجہ - ${exam ? exam.title : 'امتحان حفظ'}</title>
                <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 6mm 8mm;
                    }
                    * {
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Jameel Noori Nastaleeq', 'Amiri', 'Noto Nastaliq Urdu', serif;
                        direction: rtl;
                        background: #ffffff;
                        color: #000000;
                        margin: 0;
                        padding: 0;
                    }
                    .award-sheet-frame {
                        border: 3px solid #000000 !important;
                        outline: 1.5px solid #000000 !important;
                        outline-offset: -5px !important;
                        padding: 12px 16px !important;
                        background: #ffffff !important;
                        width: 100% !important;
                        min-width: 0 !important;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        border: 1.5px solid #000;
                        margin-top: 6px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 3px 4px;
                        text-align: center;
                    }
                    @media print {
                        .no-print { display: none !important; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${clone.outerHTML}
                <div class="no-print" style="text-align:center; margin-top:20px;">
                    <button onclick="window.print()" style="padding:9px 30px; background:#065f46; color:white; border:none; border-radius:20px; font-size:1.1rem; cursor:pointer; font-weight:bold;">
                        پرنٹ کریں (Print)
                    </button>
                    <button onclick="window.close()" style="padding:9px 24px; background:#f1f5f9; color:#475569; border:none; border-radius:20px; font-size:1.1rem; cursor:pointer; margin-right:10px;">
                        بند کریں
                    </button>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                <\/script>
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
        const safeStudentName = (student.name || 'Student').replace(/['"\\s]+/g, '_');
        const reportFileName = `Hifz-Monthly-Report-${safeStudentName}-${month}`;

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>ماہانہ رپورٹ برائے والدین - ${student.name}</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
                <script src="assets/js/html2canvas.min.js"></script>
                <script src="assets/js/jspdf.umd.min.js"></script>
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
                async function downloadPDF(filename) {
                    const btn = document.querySelector('.btn-pdf-download');
                    const origHtml = btn ? btn.innerHTML : '';
                    if (btn) {
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> پی ڈی ایف بن رہی ہے...';
                        btn.disabled = true;
                    }
                    try {
                        const html2canvasLib = window.html2canvas || (window.opener && window.opener.html2canvas);
                        const jspdfLib = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf : (window.opener && window.opener.jspdf && window.opener.jspdf.jsPDF ? window.opener.jspdf : null);

                        if (!html2canvasLib || !jspdfLib) {
                            alert('پی ڈی ایف لائبریری لوڈ نہیں ہو سکی۔ براہ کرم صفحہ دوبارہ لوڈ کریں یا پرنٹ نکالیں کا بٹن استعمال کریں۔');
                            return;
                        }

                        const target = document.querySelector('.report-wrapper') || document.body;
                        const canvas = await html2canvasLib(target, {
                            scale: 2,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff'
                        });

                        const imgData = canvas.toDataURL('image/jpeg', 0.95);
                        const { jsPDF } = jspdfLib;
                        // Calculate page dimensions to exactly fit the image on ONE page
                        // Use A4 width (210mm) and scale height proportionally — guaranteed single page
                        const pWidth = 210;
                        const margin = 8;
                        const printableW = pWidth - (margin * 2);
                        const imgAspect = canvas.height / canvas.width;
                        const printableH = printableW * imgAspect;
                        const pHeight = printableH + (margin * 2);

                        const pdf = new jsPDF({
                            orientation: pHeight > pWidth ? 'portrait' : 'landscape',
                            unit: 'mm',
                            format: [pWidth, pHeight]
                        });
                        // Place image to fill entire single page exactly
                        pdf.addImage(imgData, 'JPEG', margin, margin, printableW, printableH);

                        const safeFilename = (filename || 'Hifz-Monthly-Report').endsWith('.pdf') ? filename : (filename + '.pdf');
                        pdf.save(safeFilename);
                    } catch (err) {
                        console.error('PDF Generation Error:', err);
                        alert('پی ڈی ایف بنانے میں خرابی پیش آگئی: ' + (err.message || err));
                    } finally {
                        if (btn) {
                            btn.innerHTML = origHtml;
                            btn.disabled = false;
                        }
                    }
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
                    <button onclick="window.print()" style="padding:10px 35px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.15rem; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
                        <i class="fas fa-print"></i> پرنٹ نکالیں
                    </button>
                    <button class="btn-pdf-download" onclick="downloadPDF('${reportFileName}')" style="padding:10px 35px; background:#dc2626; color:white; border:none; border-radius:25px; font-size:1.15rem; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 10px rgba(220,38,38,0.25);">
                        <i class="fas fa-file-pdf"></i> پی ڈی ایف ڈاؤن لوڈ کریں
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

        const safeStudentName = (student.name || 'Student').replace(/['"\\s]+/g, '_');
        const pdfFileName = `Hifz-Certificate-${safeStudentName}`;

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <!DOCTYPE html>
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>حفظ القرآن تکمیل سرٹیفکیٹ - ${student.name}</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
                <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet">
                <script src="assets/js/html2canvas.min.js"><\/script>
                <script src="assets/js/jspdf.umd.min.js"><\/script>
                <style>
                    /* ── Single-page landscape print ── */
                    @page {
                        size: A4 landscape;
                        margin: 3mm;
                    }
                    * { box-sizing: border-box; }
                    html, body {
                        margin: 0;
                        padding: 0;
                        background: #fdfbf7;
                        width: 100%;
                    }
                    body {
                        font-family: 'Jameel Noori Nastaleeq', 'Amiri', serif;
                        direction: rtl;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: flex-start;
                        padding: 15px 15px 20px;
                    }
                    .cert-container {
                        border: 12px solid #065f46;
                        outline: 4px solid #b45309;
                        outline-offset: -8px;
                        border-radius: 18px;
                        padding: 18px 40px;
                        background: #ffffff;
                        position: relative;
                        width: 100%;
                        min-height: 180mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        text-align: center;
                        overflow: hidden;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .bismillah {
                        font-family: 'Amiri', serif;
                        font-size: 1.7rem;
                        color: #065f46;
                        margin-bottom: 2px;
                    }
                    .madrsa-title {
                        font-family: 'Aref Ruqaa', serif;
                        font-size: 2.3rem;
                        color: #065f46;
                        margin: 0;
                        line-height: 1.2;
                    }
                    .cert-badge {
                        display: inline-block;
                        background: linear-gradient(135deg, #065f46, #047857);
                        color: #fef08a;
                        padding: 4px 24px;
                        border-radius: 30px;
                        font-size: 1.35rem;
                        font-family: 'Amiri', serif;
                        margin: 8px 0;
                        border: 2px solid #fef08a;
                    }
                    .cert-text {
                        font-size: 1.4rem;
                        line-height: 1.9;
                        color: #1e293b;
                        margin: 6px auto;
                        max-width: 92%;
                    }
                    .highlight-name {
                        color: #065f46;
                        font-weight: bold;
                        font-size: 1.8rem;
                        border-bottom: 2px solid #b45309;
                        padding: 0 10px;
                        display: inline-block;
                    }
                    .sanad-meta {
                        display: flex;
                        justify-content: space-between;
                        font-size: 1.05rem;
                        color: #475569;
                        border-top: 1px solid #e2e8f0;
                        border-bottom: 1px solid #e2e8f0;
                        padding: 5px 16px;
                        margin: 6px 0;
                    }
                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 10px;
                        padding: 0 20px;
                    }
                    .sig-block {
                        border-top: 2px solid #065f46;
                        width: 150px;
                        padding-top: 4px;
                        font-size: 1.05rem;
                        font-weight: bold;
                        color: #065f46;
                    }
                    @media print {
                        .no-print { display: none !important; }
                        html, body {
                            overflow: hidden;
                            padding: 0;
                        }
                        .cert-container {
                            height: 200mm;
                            min-height: unset;
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                    }
                </style>
                <script>
                async function _doDownload(format) {
                    const btn = document.querySelector('.btn-triggered');
                    const origHtml = btn ? btn.innerHTML : '';
                    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> تیاری ہو رہی ہے...'; btn.disabled = true; }
                    try {
                        const html2canvasLib = window.html2canvas || (window.opener && window.opener.html2canvas);
                        const jspdfLib = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf : (window.opener && window.opener.jspdf && window.opener.jspdf.jsPDF ? window.opener.jspdf : null);
                        if (!html2canvasLib) { alert('html2canvas لائبریری لوڈ نہیں ہوئی۔'); return; }

                        const target = document.querySelector('.cert-container');
                        // Hide local images to prevent tainted canvas error on file:// protocol
                        const imgs = Array.from(target.querySelectorAll('img'));
                        imgs.forEach(img => { img._sd = img.style.display; img.style.display = 'none'; });

                        const canvas = await html2canvasLib(target, {
                            scale: 2, useCORS: false, allowTaint: false,
                            logging: false, backgroundColor: '#ffffff'
                        });

                        imgs.forEach(img => { img.style.display = img._sd || ''; delete img._sd; });

                        if (format === 'jpg') {
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                            const a = document.createElement('a');
                            a.href = dataUrl;
                            a.download = '${pdfFileName}.jpg';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        } else {
                            if (!jspdfLib) { alert('jsPDF لائبریری لوڈ نہیں ہوئی۔'); return; }
                            const { jsPDF } = jspdfLib;
                            // Landscape A4 page — fit image in one page exactly
                            const pWidth = 297; // landscape A4 width in mm
                            const margin = 8;
                            const printableW = pWidth - (margin * 2);
                            const imgAspect = canvas.height / canvas.width;
                            const printableH = printableW * imgAspect;
                            const pHeight = printableH + (margin * 2);
                            const pdf = new jsPDF({
                                orientation: pWidth >= pHeight ? 'landscape' : 'portrait',
                                unit: 'mm',
                                format: [pWidth, pHeight]
                            });
                            const imgData = canvas.toDataURL('image/jpeg', 0.95);
                            pdf.addImage(imgData, 'JPEG', margin, margin, printableW, printableH);
                            pdf.save('${pdfFileName}.pdf');
                        }
                    } catch (err) {
                        console.error('Export error:', err);
                        alert('خرابی: ' + (err.message || err));
                    } finally {
                        if (btn) { btn.innerHTML = origHtml; btn.disabled = false; }
                    }
                }
                function dlPDF(el) { el.classList.add('btn-triggered'); _doDownload('pdf').finally(() => el.classList.remove('btn-triggered')); }
                function dlJPG(el) { el.classList.add('btn-triggered'); _doDownload('jpg').finally(() => el.classList.remove('btn-triggered')); }
                <\/script>
            </head>
            <body>
                <div class="cert-container" style="position:relative;">
                    <img src="${typeof LOGO_DATA_URI !== 'undefined' ? LOGO_DATA_URI : ''}" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:340px; max-width:80%; opacity:0.08; pointer-events:none; z-index:0;" alt="Watermark">
                    <div style="position:relative; z-index:1; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
                        <div>
                            <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                            <h1 class="madrsa-title">مدرسہ عبد الرحمن بن عوف غفوریہ</h1>
                            <div style="color:#b45309; font-size:1.1rem;">تحت انتظام: NOVATIX</div>
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

                <div class="no-print" style="text-align:center; margin-top:14px; display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                    <button onclick="window.print()"
                            style="padding:10px 32px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.1rem; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
                        <i class="fas fa-print"></i> پرنٹ نکالیں (Landscape)
                    </button>
                    <button onclick="dlPDF(this)"
                            style="padding:10px 32px; background:#dc2626; color:white; border:none; border-radius:25px; font-size:1.1rem; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 10px rgba(220,38,38,0.25);">
                        <i class="fas fa-file-pdf"></i> پی ڈی ایف ڈاؤن لوڈ کریں
                    </button>
                    <button onclick="dlJPG(this)"
                            style="padding:10px 32px; background:#0284c7; color:white; border:none; border-radius:25px; font-size:1.1rem; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
                        <i class="fas fa-image"></i> JPG ڈاؤن لوڈ کریں
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
