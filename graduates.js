// Graduates & Alumni Management Module (فارغ التحصیل طلباء و طالبات)
// Madrasah Pro Manager - Offline Version
// Architecture & Implementation for Madrasa Abdul Rehman Bin Auf

const GraduatesModule = {
    searchQuery: '',
    filterYear: 'all',
    filterType: 'all',
    filterGrade: 'all',
    activeView: 'cards', // 'cards' | 'table'

    // Main Render Function
    async render(container) {
        if (!container) container = document.getElementById('main-content');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center; padding: 4rem;"><div class="mms-spinner"></div></div>';

        const section = (window.app && window.app.currentSection) ? window.app.currentSection : 'banin';
        const isBanat = section === 'banat';
        const sectionTitle = isBanat ? 'فارغ التحصیل طالبات (سجل الفاضلات)' : 'فارغ التحصیل طلباء (سجل الفضلاء و حفاظ)';
        const sectionSub = isBanat ? 'طالبات کی فراغت، وفاق رزلٹ کارڈز اور اسنادِ حفظ کا ریکارڈ' : 'حفاظِ کرام و فضلاء عظام کی فراغت، وفاق رزلٹ کارڈز اور اسنادِ حفظ کا ریکارڈ';

        let graduates = [];
        let students = [];
        let teachers = [];

        try {
            graduates = await MadrassahDB.getAllGraduates(section);
            students = await MadrassahDB.getAllStudents(section);
            teachers = await MadrassahDB.getAllTeachers();
        } catch (err) {
            console.error('Error fetching graduates data:', err);
        }

        // Summary Calculations
        const totalGraduates = graduates.length;
        const huffazCount = graduates.filter(g => g.graduationType === 'حفظِ قرآن کریم' || !g.graduationType).length;
        const mumtazCount = graduates.filter(g => g.wafaqGrade && (g.wafaqGrade.includes('ممتاز') || g.wafaqGrade.includes('A+'))).length;
        const docsUploadedCount = graduates.filter(g => g.wafaqResultCardDoc || g.hifzSanadDoc).length;

        // Distinct Years for Dropdown
        const yearsSet = new Set();
        graduates.forEach(g => {
            if (g.graduationYear) yearsSet.add(String(g.graduationYear));
        });
        const distinctYears = Array.from(yearsSet).sort().reverse();

        // Apply Filters
        const filtered = graduates.filter(g => {
            const matchesSearch = !this.searchQuery || 
                (g.name && g.name.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (g.fatherName && g.fatherName.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (g.wafaqRollNo && String(g.wafaqRollNo).includes(this.searchQuery)) ||
                (g.sanadNumber && String(g.sanadNumber).toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (g.city && g.city.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (g.currentOccupation && g.currentOccupation.toLowerCase().includes(this.searchQuery.toLowerCase()));

            const matchesYear = this.filterYear === 'all' || String(g.graduationYear) === String(this.filterYear);
            const matchesType = this.filterType === 'all' || g.graduationType === this.filterType;
            const matchesGrade = this.filterGrade === 'all' || (g.wafaqGrade && g.wafaqGrade.includes(this.filterGrade));

            return matchesSearch && matchesYear && matchesType && matchesGrade;
        });

        container.innerHTML = `
            <div class="graduates-module-wrapper" style="padding-bottom: 2.5rem;">
                <!-- Header Banner -->
                <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); color: white; border-radius: 16px; padding: 1.5rem 2rem; box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.4);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.2rem;">
                        <div style="display:flex; align-items:center; gap:16px;">
                            <div style="width:58px; height:58px; background:rgba(255,255,255,0.18); backdrop-filter:blur(6px); border:2px solid rgba(255,255,255,0.3); border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:2rem; color:#fde047;">
                                <i class="fas fa-user-graduate"></i>
                            </div>
                            <div>
                                <h2 style="margin:0; font-family:'Aref Ruqaa', 'Amiri', serif; font-size:2rem; letter-spacing:0.5px; color:#ffffff;">
                                    ${sectionTitle}
                                </h2>
                                <p style="margin:4px 0 0 0; color:#c7d2fe; font-size:1rem;">
                                    ${sectionSub}
                                </p>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                            <button onclick="GraduatesModule.showGraduateModal()" class="btn" style="background:#fde047; color:#1e1b4b; font-weight:bold; font-size:1.05rem; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                                <i class="fas fa-plus-circle"></i> نیا فارغ التحصیل شامل کریں
                            </button>
                            <button onclick="GraduatesModule.printGraduatesDirectoryReport()" class="btn" style="background:#ffffff; color:#312e81; font-weight:bold; font-size:1.05rem; padding:10px 18px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                                <i class="fas fa-print"></i> سجل الفضلاء پرنٹ کریں
                            </button>
                        </div>
                    </div>
                </div>

                <!-- KPI Stats Cards -->
                <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1.2rem; margin-bottom: 1.5rem;">
                    <div class="stat-card" style="border-right: 5px solid #4338ca; background:white; padding:1.2rem 1.4rem; border-radius:12px; box-shadow:var(--shadow-sm);">
                        <div class="stat-icon" style="background:#eef2ff; color:#4338ca; width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.4rem;"><i class="fas fa-graduation-cap"></i></div>
                        <div class="stat-info">
                            <h4 style="margin:0; color:#64748b; font-size:0.95rem;">کل فارغین و فضلاء</h4>
                            <p style="margin:4px 0 0 0; font-size:1.6rem; font-weight:bold; color:#0f172a;">${totalGraduates}</p>
                        </div>
                    </div>

                    <div class="stat-card" style="border-right: 5px solid #059669; background:white; padding:1.2rem 1.4rem; border-radius:12px; box-shadow:var(--shadow-sm);">
                        <div class="stat-icon" style="background:#ecfdf5; color:#059669; width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.4rem;"><i class="fas fa-book-quran"></i></div>
                        <div class="stat-info">
                            <h4 style="margin:0; color:#64748b; font-size:0.95rem;">حفاظِ قرآن الکریم</h4>
                            <p style="margin:4px 0 0 0; font-size:1.6rem; font-weight:bold; color:#059669;">${huffazCount}</p>
                        </div>
                    </div>

                    <div class="stat-card" style="border-right: 5px solid #d97706; background:white; padding:1.2rem 1.4rem; border-radius:12px; box-shadow:var(--shadow-sm);">
                        <div class="stat-icon" style="background:#fffbeb; color:#d97706; width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.4rem;"><i class="fas fa-star"></i></div>
                        <div class="stat-info">
                            <h4 style="margin:0; color:#64748b; font-size:0.95rem;">وفاق میں ممتاز پوزیشن</h4>
                            <p style="margin:4px 0 0 0; font-size:1.6rem; font-weight:bold; color:#d97706;">${mumtazCount}</p>
                        </div>
                    </div>

                    <div class="stat-card" style="border-right: 5px solid #0284c7; background:white; padding:1.2rem 1.4rem; border-radius:12px; box-shadow:var(--shadow-sm);">
                        <div class="stat-icon" style="background:#f0f9ff; color:#0284c7; width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.4rem;"><i class="fas fa-file-shield"></i></div>
                        <div class="stat-info">
                            <h4 style="margin:0; color:#64748b; font-size:0.95rem;">محفوظ شدہ رزلٹ کارڈز و اسناد</h4>
                            <p style="margin:4px 0 0 0; font-size:1.6rem; font-weight:bold; color:#0284c7;">${docsUploadedCount}</p>
                        </div>
                    </div>
                </div>

                <!-- Search & Filters Control Bar -->
                <div class="card" style="margin-bottom: 1.5rem; padding: 1.2rem 1.5rem; background:white; border-radius:14px; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                        <!-- Search Box -->
                        <div style="flex:1; min-width:260px; position:relative;">
                            <input type="text" placeholder="نام، ولدیت، وفاق رول نمبر، سند نمبر یا موجودہ خدمت سے تلاش کریں..." value="${this.searchQuery}" oninput="GraduatesModule.onSearch(this.value)" style="width:100%; padding:10px 40px 10px 14px; border-radius:10px; border:1.5px solid #cbd5e1; font-size:1rem; outline:none;">
                            <i class="fas fa-search" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); color:#94a3b8;"></i>
                        </div>

                        <!-- Dropdown Filters -->
                        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                            <select onchange="GraduatesModule.onYearFilter(this.value)" style="padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; background:white; font-size:0.95rem; cursor:pointer;">
                                <option value="all" ${this.filterYear === 'all' ? 'selected' : ''}>تمام سالِ فراغت</option>
                                ${distinctYears.map(yr => `<option value="${yr}" ${this.filterYear === yr ? 'selected' : ''}>سال ${yr}ء</option>`).join('')}
                            </select>

                            <select onchange="GraduatesModule.onTypeFilter(this.value)" style="padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; background:white; font-size:0.95rem; cursor:pointer;">
                                <option value="all" ${this.filterType === 'all' ? 'selected' : ''}>تمام شعبہ جات</option>
                                <option value="حفظِ قرآن کریم" ${this.filterType === 'حفظِ قرآن کریم' ? 'selected' : ''}>حفظِ قرآن کریم</option>
                                <option value="درسِ نظامی (عالم کورس)" ${this.filterType === 'درسِ نظامی (عالم کورس)' ? 'selected' : ''}>درسِ نظامی (عالم کورس)</option>
                                <option value="تجوید و قرأت" ${this.filterType === 'تجوید و قرأت' ? 'selected' : ''}>تجوید و قرأت</option>
                                <option value="ناظرہ قرآن" ${this.filterType === 'ناظرہ قرآن' ? 'selected' : ''}>ناظرہ قرآن</option>
                            </select>

                            <select onchange="GraduatesModule.onGradeFilter(this.value)" style="padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; background:white; font-size:0.95rem; cursor:pointer;">
                                <option value="all" ${this.filterGrade === 'all' ? 'selected' : ''}>تمام درجات</option>
                                <option value="ممتاز" ${this.filterGrade === 'ممتاز' ? 'selected' : ''}>درجہ ممتاز (A+)</option>
                                <option value="جید جدا" ${this.filterGrade === 'جید جدا' ? 'selected' : ''}>درجہ جید جداً (A)</option>
                                <option value="جید" ${this.filterGrade === 'جید' ? 'selected' : ''}>درجہ جید (B)</option>
                                <option value="مقبول" ${this.filterGrade === 'مقبول' ? 'selected' : ''}>درجہ مقبول (C)</option>
                            </select>

                            <!-- View Mode Toggle -->
                            <div style="display:flex; background:#f1f5f9; padding:3px; border-radius:8px;">
                                <button onclick="GraduatesModule.toggleView('cards')" style="border:none; cursor:pointer; padding:6px 12px; border-radius:6px; font-size:0.9rem; ${this.activeView === 'cards' ? 'background:white; color:#4338ca; font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.1);' : 'background:transparent; color:#64748b;'}" title="کارڈز ویو">
                                    <i class="fas fa-th-large"></i>
                                </button>
                                <button onclick="GraduatesModule.toggleView('table')" style="border:none; cursor:pointer; padding:6px 12px; border-radius:6px; font-size:0.9rem; ${this.activeView === 'table' ? 'background:white; color:#4338ca; font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.1);' : 'background:transparent; color:#64748b;'}" title="ٹیبل ویو">
                                    <i class="fas fa-list"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content (Cards or Table) -->
                <div id="graduates-list-area">
                    ${filtered.length === 0 ? this.renderEmptyState() : (this.activeView === 'cards' ? this.renderCardsView(filtered) : this.renderTableView(filtered))}
                </div>
            </div>
        `;
    },

    renderEmptyState() {
        return `
            <div class="card" style="text-align:center; padding:3.5rem 2rem; background:white; border-radius:14px;">
                <div style="font-size:3.5rem; color:#cbd5e1; margin-bottom:1rem;"><i class="fas fa-user-graduate"></i></div>
                <h3 style="color:#475569; margin-bottom:0.5rem;">کوئی فارغ التحصیل ریکارڈ دستیاب نہیں ہے</h3>
                <p style="color:#94a3b8; font-size:0.95rem; margin-bottom:1.5rem;">مدرسہ سے فارغ ہونے والے حفاظ اور فضلاء کا ریکارڈ مع وفاق رزلٹ کارڈ اور سند محفوظ کرنے کے لیے نیا اندراج فرمائیں۔</p>
                <button onclick="GraduatesModule.showGraduateModal()" class="btn btn-primary" style="background:#4338ca; font-weight:bold; padding:10px 24px; border-radius:10px;">
                    <i class="fas fa-plus-circle"></i> نیا فارغ التحصیل شامل کریں
                </button>
            </div>
        `;
    },

    // 1. CARDS VIEW
    renderCardsView(graduates) {
        return `
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap:1.4rem;">
                ${graduates.map(g => {
                    // WhatsApp link
                    const rawWa = g.whatsapp || g.phone || '';
                    const cleanWa = rawWa.replace(/[^0-9]/g, '');
                    const formattedWa = cleanWa.startsWith('0') ? '92' + cleanWa.slice(1) : cleanWa;

                    const gradeColor = (g.wafaqGrade && (g.wafaqGrade.includes('ممتاز') || g.wafaqGrade.includes('A+'))) ? '#15803d' : '#0369a1';
                    const gradeBg = (g.wafaqGrade && (g.wafaqGrade.includes('ممتاز') || g.wafaqGrade.includes('A+'))) ? '#dcfce7' : '#e0f2fe';

                    return `
                        <div class="card graduate-card" style="background:white; border-radius:16px; border:1px solid #e2e8f0; padding:1.4rem; box-shadow:0 4px 14px rgba(0,0,0,0.05); display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;">
                            <!-- Top Info -->
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; border-bottom:1px solid #f1f5f9; padding-bottom:0.8rem;">
                                    <div style="display:flex; gap:12px; align-items:center;">
                                        <div style="width:48px; height:48px; border-radius:12px; background:#eef2ff; color:#4338ca; display:flex; align-items:center; justify-content:center; font-size:1.5rem; border:1.5px solid #c7d2fe;">
                                            <i class="fas fa-graduation-cap"></i>
                                        </div>
                                        <div>
                                            <h3 style="margin:0; font-size:1.25rem; color:#0f172a; font-family:'Aref Ruqaa', 'Amiri', serif;">
                                                ${g.name}
                                            </h3>
                                            <div style="font-size:0.9rem; color:#64748b;">
                                                ${g.fatherName ? `ولد ${g.fatherName}` : ''} ${g.studentCode ? `[${g.studentCode}]` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div style="text-align:left;">
                                        <span style="background:#fef3c7; color:#92400e; padding:3px 10px; border-radius:20px; font-size:0.82rem; font-weight:bold; display:inline-block;">
                                            سال ${g.graduationYear || '---'}ء
                                        </span>
                                    </div>
                                </div>

                                <!-- Department & Completion Details -->
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.9rem; margin-bottom:1rem; background:#f8fafc; padding:10px; border-radius:10px;">
                                    <div>
                                        <span style="color:#64748b; display:block; font-size:0.8rem;">شعبہ فراغت:</span>
                                        <b style="color:#312e81;">${g.graduationType || 'حفظِ قرآن کریم'}</b>
                                    </div>
                                    <div>
                                        <span style="color:#64748b; display:block; font-size:0.8rem;">استاد محترم:</span>
                                        <b style="color:#334155;">${g.ustadName || '---'}</b>
                                    </div>
                                    <div>
                                        <span style="color:#64748b; display:block; font-size:0.8rem;">تاریخ فراغت / دستار:</span>
                                        <b style="color:#334155;">${g.completionDate ? g.completionDate.split('-').reverse().join('/') : '---'}</b>
                                    </div>
                                    <div>
                                        <span style="color:#64748b; display:block; font-size:0.8rem;">دورانیہ:</span>
                                        <b style="color:#334155;">${g.durationMonths ? `${g.durationMonths} ماہ` : '---'}</b>
                                    </div>
                                </div>

                                <!-- Wafaq Exam Card Summary -->
                                <div style="border:1.5px solid #e0e7ff; background:#f5f3ff; border-radius:10px; padding:10px 12px; margin-bottom:1rem;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                        <span style="font-weight:bold; color:#4338ca; font-size:0.92rem;">
                                            <i class="fas fa-landmark"></i> وفاق المدارس امتحانی کوائف
                                        </span>
                                        ${g.wafaqGrade ? `<span style="background:${gradeBg}; color:${gradeColor}; font-weight:bold; padding:2px 8px; border-radius:6px; font-size:0.8rem;">${g.wafaqGrade}</span>` : ''}
                                    </div>
                                    <div style="display:flex; justify-content:space-between; font-size:0.88rem; color:#475569;">
                                        <span>رول نمبر: <b style="font-family:monospace; color:#0f172a;">${g.wafaqRollNo || '---'}</b></span>
                                        <span>نمبرات: <b style="font-family:monospace; color:#15803d;">${g.wafaqObtainedMarks ? `${g.wafaqObtainedMarks} / ${g.wafaqTotalMarks || 100}` : '---'}</b></span>
                                    </div>
                                </div>

                                <!-- UPLOADED DOCUMENTS THUMBNAILS (رزلٹ کارڈ اور سند) -->
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:1.2rem;">
                                    <!-- Wafaq Result Card -->
                                    <div style="border:1.5px dashed ${g.wafaqResultCardDoc ? '#10b981' : '#cbd5e1'}; border-radius:10px; padding:8px; text-align:center; background:${g.wafaqResultCardDoc ? '#ecfdf5' : '#f8fafc'};">
                                        <div style="font-size:0.8rem; font-weight:bold; color:${g.wafaqResultCardDoc ? '#065f46' : '#64748b'}; margin-bottom:4px;">
                                            <i class="fas fa-file-invoice"></i> وفاق رزلٹ کارڈ
                                        </div>
                                        ${g.wafaqResultCardDoc ? `
                                            <div onclick="GraduatesModule.viewDocument('${g.id}', 'wafaq')" style="position:relative; width:100%; height:75px; border-radius:6px; overflow:hidden; cursor:pointer; border:1px solid #a7f3d0;" title="دیکھنے کے لیے کلک کریں">
                                                <img src="${g.wafaqResultCardDoc}" alt="وفاق رزلٹ کارڈ" style="width:100%; height:100%; object-fit:cover;">
                                                <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.6); color:white; font-size:0.7rem; padding:2px;">
                                                    <i class="fas fa-eye"></i> کلک کریں
                                                </div>
                                            </div>
                                        ` : `
                                            <div style="height:75px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#94a3b8; font-size:0.75rem;">
                                                <i class="fas fa-image" style="font-size:1.5rem; margin-bottom:4px;"></i> اپلوڈ نہیں ہوا
                                            </div>
                                        `}
                                    </div>

                                    <!-- Hifz Sanad Document -->
                                    <div style="border:1.5px dashed ${g.hifzSanadDoc ? '#0284c7' : '#cbd5e1'}; border-radius:10px; padding:8px; text-align:center; background:${g.hifzSanadDoc ? '#f0f9ff' : '#f8fafc'};">
                                        <div style="font-size:0.8rem; font-weight:bold; color:${g.hifzSanadDoc ? '#0369a1' : '#64748b'}; margin-bottom:4px;">
                                            <i class="fas fa-award"></i> سندِ حفظ / فراغت
                                        </div>
                                        ${g.hifzSanadDoc ? `
                                            <div onclick="GraduatesModule.viewDocument('${g.id}', 'sanad')" style="position:relative; width:100%; height:75px; border-radius:6px; overflow:hidden; cursor:pointer; border:1px solid #bae6fd;" title="دیکھنے کے لیے کلک کریں">
                                                <img src="${g.hifzSanadDoc}" alt="سندِ حفظ" style="width:100%; height:100%; object-fit:cover;">
                                                <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.6); color:white; font-size:0.7rem; padding:2px;">
                                                    <i class="fas fa-eye"></i> کلک کریں
                                                </div>
                                            </div>
                                        ` : `
                                            <div style="height:75px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#94a3b8; font-size:0.75rem;">
                                                <i class="fas fa-certificate" style="font-size:1.5rem; margin-bottom:4px;"></i> اپلوڈ نہیں ہوئی
                                            </div>
                                        `}
                                    </div>
                                </div>

                                <!-- Current Occupation & Contact -->
                                ${g.currentOccupation || g.phone ? `
                                    <div style="border-top:1px solid #f1f5f9; padding-top:8px; margin-bottom:1rem; font-size:0.88rem; color:#475569;">
                                        ${g.currentOccupation ? `<div><i class="fas fa-briefcase" style="color:#6366f1; margin-left:5px;"></i> <b>موجودہ مصروفیت:</b> ${g.currentOccupation} ${g.currentInstitution ? `(${g.currentInstitution})` : ''}</div>` : ''}
                                        ${g.phone ? `<div style="margin-top:3px;"><i class="fas fa-phone" style="color:#059669; margin-left:5px;"></i> <span dir="ltr">${g.phone}</span></div>` : ''}
                                    </div>
                                ` : ''}
                            </div>

                            <!-- Bottom Action Buttons -->
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; border-top:1px solid #e2e8f0; padding-top:10px; margin-top:5px; flex-wrap:wrap;">
                                <div style="display:flex; gap:6px;">
                                    <button onclick="GraduatesModule.printMadrasaSanad(${g.id})" class="btn" style="background:#4338ca; color:white; font-size:0.85rem; font-weight:bold; padding:6px 12px; border-radius:8px; border:none; cursor:pointer;" title="مدرسہ کی باضابطہ سند پرنٹ کریں">
                                        <i class="fas fa-award"></i> سند پرنٹ
                                    </button>
                                    ${formattedWa ? `
                                        <a href="https://wa.me/${formattedWa}" target="_blank" class="btn" style="background:#22c55e; color:white; font-size:0.85rem; padding:6px 10px; border-radius:8px; text-decoration:none; display:inline-flex; align-items:center;" title="واٹس ایپ پر رابطہ">
                                            <i class="fab fa-whatsapp"></i>
                                        </a>
                                    ` : ''}
                                </div>

                                <div style="display:flex; gap:6px;">
                                    <button onclick="GraduatesModule.showGraduateModal(${g.id})" class="btn" style="background:#f1f5f9; color:#475569; font-size:0.85rem; padding:6px 10px; border-radius:8px; border:none; cursor:pointer;" title="کوائف میں ترمیم">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="GraduatesModule.deleteGraduate(${g.id})" class="btn" style="background:#fee2e2; color:#b91c1c; font-size:0.85rem; padding:6px 10px; border-radius:8px; border:none; cursor:pointer;" title="حذف کریں">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // 2. TABLE VIEW
    renderTableView(graduates) {
        return `
            <div class="card" style="background:white; border-radius:14px; padding:1.2rem; overflow-x:auto;">
                <table class="table" style="width:100%; border-collapse:collapse; font-size:0.95rem;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#1e293b; border-bottom:2px solid #cbd5e1;">
                            <th style="padding:10px 12px; text-align:right;">نام طالب علم مع ولدیت</th>
                            <th style="padding:10px 12px; text-align:center;">سالِ فراغت</th>
                            <th style="padding:10px 12px; text-align:right;">شعبہ</th>
                            <th style="padding:10px 12px; text-align:right;">وفاق رول نمبر</th>
                            <th style="padding:10px 12px; text-align:center;">وفاق نمبرات و گریڈ</th>
                            <th style="padding:10px 12px; text-align:center;">وفاق رزلٹ کارڈ</th>
                            <th style="padding:10px 12px; text-align:center;">سندِ حفظ</th>
                            <th style="padding:10px 12px; text-align:right;">موجودہ مصروفیت</th>
                            <th style="padding:10px 12px; text-align:center;">ایکشنز</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${graduates.map(g => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:10px 12px; font-weight:bold; color:#0f172a;">
                                    ${g.name}
                                    <div style="font-size:0.8rem; color:#64748b; font-weight:normal;">${g.fatherName ? `ولد ${g.fatherName}` : ''} ${g.phone ? `| ${g.phone}` : ''}</div>
                                </td>
                                <td style="padding:10px 12px; text-align:center; font-weight:bold; color:#312e81;">
                                    ${g.graduationYear || '---'}ء
                                </td>
                                <td style="padding:10px 12px; color:#475569;">
                                    ${g.graduationType || 'حفظِ قرآن'}
                                </td>
                                <td style="padding:10px 12px; font-family:monospace; color:#0f172a;">
                                    ${g.wafaqRollNo || '---'}
                                </td>
                                <td style="padding:10px 12px; text-align:center;">
                                    ${g.wafaqGrade ? `<span style="background:#ecfdf5; color:#15803d; padding:2px 8px; border-radius:6px; font-size:0.82rem; font-weight:bold;">${g.wafaqGrade}</span>` : '---'}
                                    ${g.wafaqObtainedMarks ? `<div style="font-size:0.8rem; font-family:monospace; color:#64748b;">${g.wafaqObtainedMarks}/${g.wafaqTotalMarks || 100}</div>` : ''}
                                </td>
                                <td style="padding:10px 12px; text-align:center;">
                                    ${g.wafaqResultCardDoc ? `
                                        <button onclick="GraduatesModule.viewDocument('${g.id}', 'wafaq')" class="btn" style="background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; padding:3px 8px; border-radius:6px; font-size:0.82rem; cursor:pointer;">
                                            <i class="fas fa-eye"></i> رزلٹ کارڈ
                                        </button>
                                    ` : '<span style="color:#cbd5e1;">—</span>'}
                                </td>
                                <td style="padding:10px 12px; text-align:center;">
                                    ${g.hifzSanadDoc ? `
                                        <button onclick="GraduatesModule.viewDocument('${g.id}', 'sanad')" class="btn" style="background:#f0f9ff; color:#0284c7; border:1px solid #bae6fd; padding:3px 8px; border-radius:6px; font-size:0.82rem; cursor:pointer;">
                                            <i class="fas fa-eye"></i> سند
                                        </button>
                                    ` : '<span style="color:#cbd5e1;">—</span>'}
                                </td>
                                <td style="padding:10px 12px; color:#475569; font-size:0.88rem;">
                                    ${g.currentOccupation || '---'}
                                </td>
                                <td style="padding:10px 12px; text-align:center;">
                                    <div style="display:inline-flex; gap:6px;">
                                        <button onclick="GraduatesModule.printMadrasaSanad(${g.id})" class="btn" style="background:#4338ca; color:white; border:none; padding:4px 10px; border-radius:6px; font-size:0.85rem; cursor:pointer;" title="سند پرنٹ">
                                            <i class="fas fa-award"></i>
                                        </button>
                                        <button onclick="GraduatesModule.showGraduateModal(${g.id})" class="btn" style="background:#f1f5f9; color:#475569; border:none; padding:4px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" title="ترمیم">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="GraduatesModule.deleteGraduate(${g.id})" class="btn" style="background:#fee2e2; color:#b91c1c; border:none; padding:4px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" title="حذف">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // Navigation & Filters
    onSearch(query) {
        this.searchQuery = query;
        this.render();
    },

    onYearFilter(year) {
        this.filterYear = year;
        this.render();
    },

    onTypeFilter(type) {
        this.filterType = type;
        this.render();
    },

    onGradeFilter(grade) {
        this.filterGrade = grade;
        this.render();
    },

    toggleView(view) {
        this.activeView = view;
        this.render();
    },

    // ==========================================
    // --- ADD / EDIT GRADUATE MODAL ---
    // ==========================================
    async showGraduateModal(graduateId = null) {
        const section = (window.app && window.app.currentSection) ? window.app.currentSection : 'banin';
        let grad = null;
        if (graduateId) {
            grad = await MadrassahDB.getGraduateById(graduateId);
        }

        const isEdit = !!grad;
        const allStudents = await MadrassahDB.getAllStudents(section);
        const teachers = await MadrassahDB.getAllTeachers();

        const modalId = 'graduate-form-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const currentYear = new Date().getFullYear();

        const modalHtml = `
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:1rem;">
                <div style="background:white; border-radius:18px; width:100%; max-width:760px; max-height:92vh; overflow-y:auto; box-shadow:0 25px 50px rgba(0,0,0,0.35); border:2.5px solid #4338ca;">
                    <!-- Modal Header -->
                    <div style="background:linear-gradient(135deg, #1e1b4b, #312e81, #4338ca); color:white; padding:1.2rem 1.6rem; border-radius:15px 15px 0 0; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-graduation-cap" style="font-size:1.6rem; color:#fde047;"></i>
                            <h3 style="margin:0; font-family:'Aref Ruqaa', 'Amiri', serif; font-size:1.6rem;">
                                ${isEdit ? 'فارغ التحصیل طالب علم کے ریکارڈ میں ترمیم' : 'نیا فارغ التحصیل طالب علم درج فرمائیں'}
                            </h3>
                        </div>
                        <button type="button" onclick="document.getElementById('${modalId}').remove()" style="background:none; border:none; color:white; font-size:1.4rem; cursor:pointer;"><i class="fas fa-times"></i></button>
                    </div>

                    <!-- Modal Form -->
                    <form id="graduate-form" onsubmit="GraduatesModule.saveGraduateForm(event)" style="padding:1.6rem;">
                        <input type="hidden" name="id" value="${isEdit ? grad.id : ''}">
                        <input type="hidden" name="section" value="${isEdit ? (grad.section || section) : section}">
                        <input type="hidden" name="wafaqResultCardDoc" id="input_wafaqResultCardDoc" value="${isEdit && grad.wafaqResultCardDoc ? grad.wafaqResultCardDoc : ''}">
                        <input type="hidden" name="hifzSanadDoc" id="input_hifzSanadDoc" value="${isEdit && grad.hifzSanadDoc ? grad.hifzSanadDoc : ''}">

                        <!-- Section 1: Student Selection / Basic Info -->
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:1.2rem; margin-bottom:1.2rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <h4 style="margin:0; color:#312e81; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                                    <i class="fas fa-user"></i> بنیادی کوائف و انتخاب
                                </h4>
                                ${!isEdit ? `
                                    <span style="font-size:0.85rem; color:#64748b;">
                                        موجودہ طالب علم کا انتخاب کریں یا نیچے نیا نام درج کریں
                                    </span>
                                ` : ''}
                            </div>

                            ${!isEdit ? `
                                <div style="margin-bottom:1rem;">
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">مدرسہ کے موجودہ طلباء میں سے انتخاب (اختیاری):</label>
                                    <select id="grad_select_student" onchange="GraduatesModule.onSelectStudentChange(this.value)" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white;">
                                        <option value="">-- فہرست سے طالب علم منتخب کریں یا نیچے نیا نام لکھیں --</option>
                                        ${allStudents.map(st => `
                                            <option value="${st.id}" data-name="${st.name}" data-father="${st.fatherName || ''}" data-code="${st.uniqueCode || ('STU-' + st.id)}" data-phone="${st.phone || st.guardianPhone || ''}" data-city="${st.city || st.district || ''}" data-address="${[st.village, st.tehsil, st.district].filter(Boolean).join('، ') || st.address || ''}">
                                                #${st.id} - ${st.name} ولد ${st.fatherName || '---'} [${st.uniqueCode || ('STU-' + st.id)}]
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            ` : ''}

                            <input type="hidden" name="studentId" id="grad_student_id" value="${isEdit && grad.studentId ? grad.studentId : ''}">
                            <input type="hidden" name="studentCode" id="grad_student_code" value="${isEdit && grad.studentCode ? grad.studentCode : ''}">

                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">طالب علم کا نام <span style="color:#e11d48;">*</span></label>
                                    <input type="text" name="name" id="grad_name" required value="${isEdit ? grad.name : ''}" placeholder="طالب علم کا پورا نام" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">والد کا نام</label>
                                    <input type="text" name="fatherName" id="grad_fatherName" value="${isEdit && grad.fatherName ? grad.fatherName : ''}" placeholder="والد کا نام" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">رابطہ موبائل نمبر</label>
                                    <input type="text" name="phone" id="grad_phone" value="${isEdit && grad.phone ? grad.phone : ''}" placeholder="مثلاً: 03001234567" dir="ltr" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; text-align:right;">
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#16a34a;"><i class="fab fa-whatsapp"></i> واٹس ایپ نمبر</label>
                                    <input type="text" name="whatsapp" id="grad_whatsapp" value="${isEdit && grad.whatsapp ? grad.whatsapp : (isEdit ? grad.phone : '')}" placeholder="مثلاً: 03001234567" dir="ltr" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #86efac; font-size:1rem; text-align:right; background:#f0fdf4;">
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">شہر / ضلع</label>
                                    <input type="text" name="city" id="grad_city" value="${isEdit && grad.city ? grad.city : ''}" placeholder="مثلاً: خانیوال، ملتان" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">مکمل پتہ / گاؤں</label>
                                    <input type="text" name="address" id="grad_address" value="${isEdit && grad.address ? grad.address : ''}" placeholder="مکمل پتہ" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                                </div>
                            </div>
                        </div>

                        <!-- Section 2: Graduation & Department Info -->
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:1.2rem; margin-bottom:1.2rem;">
                            <h4 style="margin:0 0 10px 0; color:#312e81; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                                <i class="fas fa-award"></i> کوائفِ فراغت و شعبہ
                            </h4>

                            <div style="display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">شعبہ فراغت <span style="color:#e11d48;">*</span></label>
                                    <select name="graduationType" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white; font-weight:bold; color:#312e81;">
                                        <option value="حفظِ قرآن کریم" ${!isEdit || grad.graduationType === 'حفظِ قرآن کریم' ? 'selected' : ''}>حفظِ قرآن کریم</option>
                                        <option value="درسِ نظامی (عالم کورس)" ${isEdit && grad.graduationType === 'درسِ نظامی (عالم کورس)' ? 'selected' : ''}>درسِ نظامی (عالم کورس)</option>
                                        <option value="تجوید و قرأت" ${isEdit && grad.graduationType === 'تجوید و قرأت' ? 'selected' : ''}>تجوید و قرأت</option>
                                        <option value="ناظرہ قرآن" ${isEdit && grad.graduationType === 'ناظرہ قرآن' ? 'selected' : ''}>ناظرہ قرآن</option>
                                        <option value="دیگر" ${isEdit && grad.graduationType === 'دیگر' ? 'selected' : ''}>دیگر</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">سالِ فراغت / تکمیل <span style="color:#e11d48;">*</span></label>
                                    <input type="number" name="graduationYear" required value="${isEdit ? grad.graduationYear : currentYear}" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1.05rem; font-weight:bold; color:#0f172a;">
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">تاریخِ تکمیل / دستار بندی</label>
                                    <input type="date" name="completionDate" value="${isEdit && grad.completionDate ? grad.completionDate : new Date().toISOString().split('T')[0]}" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">استاد محترم / قاری صاحب کا نام</label>
                                    <input type="text" name="ustadName" list="grad_teachers_list" value="${isEdit && grad.ustadName ? grad.ustadName : ''}" placeholder="استاد محترم کا نام" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                                    <datalist id="grad_teachers_list">
                                        ${teachers.map(t => `<option value="${t.name}">`).join('')}
                                    </datalist>
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">کل دورانیہِ تعلیم (ماہ)</label>
                                    <input type="number" name="durationMonths" value="${isEdit && grad.durationMonths ? grad.durationMonths : '24'}" placeholder="مثلاً: 24 یا 36" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                                </div>
                            </div>
                        </div>

                        <!-- Section 3: Wafaq-ul-Madaris Examination Details & RESULT CARD UPLOAD -->
                        <div style="background:#f5f3ff; border:2px solid #c7d2fe; border-radius:12px; padding:1.2rem; margin-bottom:1.2rem;">
                            <h4 style="margin:0 0 10px 0; color:#312e81; font-size:1.15rem; display:flex; align-items:center; gap:8px;">
                                <i class="fas fa-file-invoice"></i> امتحانی کوائف برائے وفاق المدارس و اپلوڈ رزلٹ کارڈ
                            </h4>

                            <div style="display:grid; grid-template-columns:1.5fr 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">امتحانی بورڈ / وفاق</label>
                                    <input type="text" name="wafaqBoard" value="${isEdit && grad.wafaqBoard ? grad.wafaqBoard : 'وفاق المدارس العربیہ پاکستان'}" placeholder="وفاق المدارس العربیہ پاکستان" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white;">
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">وفاق رول نمبر</label>
                                    <input type="text" name="wafaqRollNo" value="${isEdit && grad.wafaqRollNo ? grad.wafaqRollNo : ''}" placeholder="مثلاً: 148201" dir="ltr" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; font-family:monospace; text-align:right; background:white;">
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">وفاق رجسٹریشن نمبر</label>
                                    <input type="text" name="wafaqRegNo" value="${isEdit && grad.wafaqRegNo ? grad.wafaqRegNo : ''}" placeholder="مثلاً: REG-98402" dir="ltr" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; font-family:monospace; text-align:right; background:white;">
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns:1fr 1fr 1.2fr; gap:1rem; margin-bottom:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">کل نمبر (Total Marks)</label>
                                    <input type="number" name="wafaqTotalMarks" id="grad_wafaqTotalMarks" oninput="GraduatesModule.calcWafaqGrade()" value="${isEdit && grad.wafaqTotalMarks ? grad.wafaqTotalMarks : '100'}" placeholder="100" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white;">
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#15803d;">حاصل کردہ نمبر (Obtained)</label>
                                    <input type="number" name="wafaqObtainedMarks" id="grad_wafaqObtainedMarks" oninput="GraduatesModule.calcWafaqGrade()" value="${isEdit && grad.wafaqObtainedMarks ? grad.wafaqObtainedMarks : ''}" placeholder="مثلاً: 95" style="width:100%; padding:10px; border-radius:8px; border:2px solid #86efac; font-size:1.1rem; font-weight:bold; color:#15803d; background:white;">
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">درجہ / تقدیر (Grade)</label>
                                    <select name="wafaqGrade" id="grad_wafaqGrade" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white; font-weight:bold;">
                                        <option value="ممتاز (A+)" ${isEdit && grad.wafaqGrade && grad.wafaqGrade.includes('ممتاز') ? 'selected' : ''}>ممتاز (A+)</option>
                                        <option value="جید جداً (A)" ${isEdit && grad.wafaqGrade && grad.wafaqGrade.includes('جید جدا') ? 'selected' : ''}>جید جداً (A)</option>
                                        <option value="جید (B)" ${isEdit && grad.wafaqGrade && grad.wafaqGrade.includes('جید') && !grad.wafaqGrade.includes('جدا') ? 'selected' : ''}>جید (B)</option>
                                        <option value="مقبول (C)" ${isEdit && grad.wafaqGrade && grad.wafaqGrade.includes('مقبول') ? 'selected' : ''}>مقبول (C)</option>
                                    </select>
                                </div>
                            </div>

                            <!-- FILE UPLOAD FOR WAFAQ RESULT CARD -->
                            <div style="background:white; border:1.5px dashed #4338ca; border-radius:10px; padding:12px; margin-top:10px;">
                                <label style="display:block; font-weight:bold; margin-bottom:6px; color:#312e81; font-size:1.05rem;">
                                    <i class="fas fa-upload"></i> وفاق کا رزلٹ کارڈ اپلوڈ فرمائیں (تصویر یا اسکین فائل)
                                </label>
                                <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                                    <input type="file" accept="image/*,application/pdf" id="file_wafaqResultCard" onchange="GraduatesModule.handleFileUpload(event, 'wafaq')" style="display:none;">
                                    <button type="button" onclick="document.getElementById('file_wafaqResultCard').click()" class="btn" style="background:#4338ca; color:white; font-weight:bold; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                        <i class="fas fa-file-arrow-up"></i> رزلٹ کارڈ منتخب کریں
                                    </button>
                                    <span id="label_wafaqResultCard" style="font-size:0.9rem; color:#64748b;">
                                        ${isEdit && grad.wafaqResultCardDoc ? '<span style="color:#059669; font-weight:bold;">✓ رزلٹ کارڈ پہلے سے محفوظ ہے (تبدیل کرنے کے لیے نیا منتخب کریں)</span>' : 'کوئی فائل منتخب نہیں ہوئی (JPG, PNG یا PDF)'}
                                    </span>
                                </div>

                                <!-- Live Preview Container -->
                                <div id="preview_wafaqResultCard_container" style="margin-top:10px; ${isEdit && grad.wafaqResultCardDoc ? '' : 'display:none;'}">
                                    <div style="display:flex; align-items:center; gap:10px; background:#ecfdf5; padding:8px 12px; border-radius:8px; border:1px solid #a7f3d0; width:fit-content;">
                                        <img id="preview_wafaqResultCard_img" src="${isEdit && grad.wafaqResultCardDoc ? grad.wafaqResultCardDoc : ''}" alt="رزلٹ کارڈ" style="width:48px; height:48px; object-fit:cover; border-radius:6px; border:1px solid #10b981;">
                                        <div>
                                            <span style="font-size:0.85rem; font-weight:bold; color:#065f46; display:block;">رزلٹ کارڈ دستاویز کامیابی سے لوڈ ہو گئی</span>
                                            <button type="button" onclick="GraduatesModule.removeDoc('wafaq')" style="background:none; border:none; color:#e11d48; font-size:0.8rem; cursor:pointer; padding:0; text-decoration:underline;">
                                                <i class="fas fa-times-circle"></i> فائل ہٹائیں
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Section 4: Hifz Certificate & SANAD UPLOAD -->
                        <div style="background:#ecfdf5; border:2px solid #a7f3d0; border-radius:12px; padding:1.2rem; margin-bottom:1.2rem;">
                            <h4 style="margin:0 0 10px 0; color:#065f46; font-size:1.15rem; display:flex; align-items:center; gap:8px;">
                                <i class="fas fa-certificate"></i> سندِ حفظ کے کوائف و اپلوڈ سند
                            </h4>

                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">سندِ حفظ نمبر (Sanad No)</label>
                                    <input type="text" name="sanadNumber" value="${isEdit && grad.sanadNumber ? grad.sanadNumber : ('SND-' + (isEdit ? grad.id : (Math.floor(1000 + Math.random() * 9000))))}" placeholder="مثلاً: SND-2026-042" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; font-family:monospace; background:white;">
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">تاریخِ اجراء سند</label>
                                    <input type="date" name="sanadIssueDate" value="${isEdit && grad.sanadIssueDate ? grad.sanadIssueDate : new Date().toISOString().split('T')[0]}" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white;">
                                </div>
                            </div>

                            <!-- FILE UPLOAD FOR HIFZ SANAD -->
                            <div style="background:white; border:1.5px dashed #059669; border-radius:10px; padding:12px; margin-top:10px;">
                                <label style="display:block; font-weight:bold; margin-bottom:6px; color:#065f46; font-size:1.05rem;">
                                    <i class="fas fa-upload"></i> سندِ حفظ کی کاپی / تصویر اپلوڈ فرمائیں
                                </label>
                                <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                                    <input type="file" accept="image/*,application/pdf" id="file_hifzSanad" onchange="GraduatesModule.handleFileUpload(event, 'sanad')" style="display:none;">
                                    <button type="button" onclick="document.getElementById('file_hifzSanad').click()" class="btn" style="background:#059669; color:white; font-weight:bold; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                        <i class="fas fa-file-arrow-up"></i> سند کی فائل منتخب کریں
                                    </button>
                                    <span id="label_hifzSanad" style="font-size:0.9rem; color:#64748b;">
                                        ${isEdit && grad.hifzSanadDoc ? '<span style="color:#059669; font-weight:bold;">✓ سند پہلے سے محفوظ ہے (تبدیل کرنے کے لیے نیا منتخب کریں)</span>' : 'کوئی فائل منتخب نہیں ہوئی (JPG, PNG یا PDF)'}
                                    </span>
                                </div>

                                <!-- Live Preview Container -->
                                <div id="preview_hifzSanad_container" style="margin-top:10px; ${isEdit && grad.hifzSanadDoc ? '' : 'display:none;'}">
                                    <div style="display:flex; align-items:center; gap:10px; background:#ecfdf5; padding:8px 12px; border-radius:8px; border:1px solid #a7f3d0; width:fit-content;">
                                        <img id="preview_hifzSanad_img" src="${isEdit && grad.hifzSanadDoc ? grad.hifzSanadDoc : ''}" alt="سند حفظ" style="width:48px; height:48px; object-fit:cover; border-radius:6px; border:1px solid #10b981;">
                                        <div>
                                            <span style="font-size:0.85rem; font-weight:bold; color:#065f46; display:block;">سندِ حفظ دستاویز کامیابی سے لوڈ ہو گئی</span>
                                            <button type="button" onclick="GraduatesModule.removeDoc('sanad')" style="background:none; border:none; color:#e11d48; font-size:0.8rem; cursor:pointer; padding:0; text-decoration:underline;">
                                                <i class="fas fa-times-circle"></i> فائل ہٹائیں
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Section 5: Current Occupation & Remarks -->
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:1.2rem; margin-bottom:1.5rem;">
                            <h4 style="margin:0 0 10px 0; color:#312e81; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                                <i class="fas fa-briefcase"></i> موجودہ مصروفیات، خدمات و نوٹس
                            </h4>

                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">موجودہ مصروفیت / شعبہ</label>
                                    <input type="text" name="currentOccupation" list="grad_occupations_list" value="${isEdit && grad.currentOccupation ? grad.currentOccupation : ''}" placeholder="مثلاً: امام و خطیب، مدرس شعبہ حفظ، عصری تعلیم، تاجر" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                                    <datalist id="grad_occupations_list">
                                        <option value="امام و خطیب مسجد">
                                        <option value="مدرس / قاری شعبہ حفظ">
                                        <option value="مدرس کتب / درسِ نظامی">
                                        <option value="اعلیٰ دینی تعلیم (تخصص)">
                                        <option value="عصری تعلیم (کالج / یونیورسٹی)">
                                        <option value="ملازمت / کاروبار">
                                    </datalist>
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">موجودہ ادارہ / مقامِ خدمت</label>
                                    <input type="text" name="currentInstitution" value="${isEdit && grad.currentInstitution ? grad.currentInstitution : ''}" placeholder="جامع مسجد نور، جامعہ دارالعلوم وغیرہ" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                                </div>
                            </div>

                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">خصوصی یادداشت / ریمارکس</label>
                                <textarea name="remarks" rows="2" placeholder="طالب علم کے متعلق کوئی خاص اعزاز یا تحریر..." style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.95rem;">${isEdit && grad.remarks ? grad.remarks : ''}</textarea>
                            </div>
                        </div>

                        <!-- Submit Buttons -->
                        <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #e2e8f0; padding-top:1.2rem;">
                            <button type="button" onclick="document.getElementById('${modalId}').remove()" class="btn" style="background:#f1f5f9; color:#475569; font-weight:bold; border-radius:8px; padding:10px 20px; border:none; cursor:pointer;">
                                منسوخ کریں
                            </button>
                            <button type="submit" class="btn btn-primary" style="background:#4338ca; font-weight:bold; border-radius:8px; padding:10px 24px; border:none; cursor:pointer; display:flex; align-items:center; gap:8px; font-size:1.05rem;">
                                <i class="fas fa-save"></i> ${isEdit ? 'تبدیلیاں محفوظ کریں' : 'فارغ التحصیل ریکارڈ محفوظ کریں'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    onSelectStudentChange(studentId) {
        if (!studentId) return;
        const select = document.getElementById('grad_select_student');
        const opt = select.options[select.selectedIndex];
        if (!opt) return;

        const name = opt.getAttribute('data-name');
        const father = opt.getAttribute('data-father');
        const code = opt.getAttribute('data-code');
        const phone = opt.getAttribute('data-phone');
        const city = opt.getAttribute('data-city');
        const address = opt.getAttribute('data-address');

        if (name) document.getElementById('grad_name').value = name;
        if (father) document.getElementById('grad_fatherName').value = father;
        if (phone) {
            document.getElementById('grad_phone').value = phone;
            document.getElementById('grad_whatsapp').value = phone;
        }
        if (city) document.getElementById('grad_city').value = city;
        if (address) document.getElementById('grad_address').value = address;

        document.getElementById('grad_student_id').value = studentId;
        document.getElementById('grad_student_code').value = code;
    },

    calcWafaqGrade() {
        const total = parseFloat(document.getElementById('grad_wafaqTotalMarks').value) || 100;
        const obt = parseFloat(document.getElementById('grad_wafaqObtainedMarks').value) || 0;
        const gradeSelect = document.getElementById('grad_wafaqGrade');
        if (!gradeSelect || obt <= 0) return;

        const pct = (obt / total) * 100;
        if (pct >= 80) gradeSelect.value = 'ممتاز (A+)';
        else if (pct >= 65) gradeSelect.value = 'جید جداً (A)';
        else if (pct >= 50) gradeSelect.value = 'جید (B)';
        else gradeSelect.value = 'مقبول (C)';
    },

    handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            if (type === 'wafaq') {
                document.getElementById('input_wafaqResultCardDoc').value = base64;
                const container = document.getElementById('preview_wafaqResultCard_container');
                const img = document.getElementById('preview_wafaqResultCard_img');
                const label = document.getElementById('label_wafaqResultCard');
                if (img) img.src = base64;
                if (container) container.style.display = 'block';
                if (label) label.innerHTML = `<span style="color:#059669; font-weight:bold;">✓ ${file.name} کامیابی سے لوڈ ہو گیا</span>`;
            } else if (type === 'sanad') {
                document.getElementById('input_hifzSanadDoc').value = base64;
                const container = document.getElementById('preview_hifzSanad_container');
                const img = document.getElementById('preview_hifzSanad_img');
                const label = document.getElementById('label_hifzSanad');
                if (img) img.src = base64;
                if (container) container.style.display = 'block';
                if (label) label.innerHTML = `<span style="color:#059669; font-weight:bold;">✓ ${file.name} کامیابی سے لوڈ ہو گیا</span>`;
            }
        };
        reader.readAsDataURL(file);
    },

    removeDoc(type) {
        if (type === 'wafaq') {
            document.getElementById('input_wafaqResultCardDoc').value = '';
            document.getElementById('preview_wafaqResultCard_container').style.display = 'none';
            document.getElementById('label_wafaqResultCard').innerText = 'کوئی فائل منتخب نہیں ہوئی';
            document.getElementById('file_wafaqResultCard').value = '';
        } else if (type === 'sanad') {
            document.getElementById('input_hifzSanadDoc').value = '';
            document.getElementById('preview_hifzSanad_container').style.display = 'none';
            document.getElementById('label_hifzSanad').innerText = 'کوئی فائل منتخب نہیں ہوئی';
            document.getElementById('file_hifzSanad').value = '';
        }
    },

    async saveGraduateForm(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (data.id) data.id = parseInt(data.id);
        if (data.studentId) data.studentId = parseInt(data.studentId);
        data.graduationYear = parseInt(data.graduationYear) || new Date().getFullYear();
        if (data.wafaqTotalMarks) data.wafaqTotalMarks = parseFloat(data.wafaqTotalMarks) || 100;
        if (data.wafaqObtainedMarks) data.wafaqObtainedMarks = parseFloat(data.wafaqObtainedMarks) || 0;

        try {
            await MadrassahDB.saveGraduate(data);

            // Optional: If linked to an active student, mark them as graduated
            if (data.studentId) {
                try {
                    const st = await MadrassahDB.getStudentById(data.studentId);
                    if (st) {
                        st.status = 'graduated';
                        st.graduationYear = data.graduationYear;
                        st.graduationType = data.graduationType;
                        await MadrassahDB.saveStudent(st);
                    }
                } catch (stErr) {
                    console.warn('Could not auto-update student status:', stErr);
                }
            }

            const modal = document.getElementById('graduate-form-modal');
            if (modal) modal.remove();

            this.render();
            alert('فارغ التحصیل طالب علم کا ریکارڈ بحمداللہ کامیابی سے محفوظ ہو گیا ہے۔');
        } catch (err) {
            console.error('Error saving graduate:', err);
            alert('ریکارڈ محفوظ کرنے میں غلطی: ' + err.message);
        }
    },

    async deleteGraduate(id) {
        const grad = await MadrassahDB.getGraduateById(id);
        if (!grad) return;

        if (!confirm(`کیا آپ واقعی "${grad.name}" کا فارغ التحصیل ریکارڈ حذف کرنا چاہتے ہیں؟`)) {
            return;
        }

        try {
            await MadrassahDB.deleteGraduate(id);
            this.render();
        } catch (err) {
            alert('حذف کرنے میں غلطی: ' + err.message);
        }
    },

    // ==========================================
    // --- DOCUMENT LIGHTBOX / VIEWER MODAL ---
    // ==========================================
    async viewDocument(graduateId, docType) {
        const grad = await MadrassahDB.getGraduateById(graduateId);
        if (!grad) return;

        const isWafaq = docType === 'wafaq';
        const docUrl = isWafaq ? grad.wafaqResultCardDoc : grad.hifzSanadDoc;
        const title = isWafaq ? `وفاق رزلٹ کارڈ - ${grad.name}` : `سندِ حفظ و فراغت - ${grad.name}`;

        if (!docUrl) {
            alert('اس ریکارڈ کے ساتھ کوئی دستاویز منسلک نہیں ہے۔');
            return;
        }

        const modalId = 'doc-lightbox-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const isPdf = docUrl.startsWith('data:application/pdf');

        const modalHtml = `
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10000; display:flex; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(6px); padding:1.5rem;">
                <div style="background:white; border-radius:16px; width:100%; max-width:880px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 50px rgba(0,0,0,0.5); border:2px solid #4338ca;">
                    <!-- Lightbox Header -->
                    <div style="background:#1e1b4b; color:white; padding:1rem 1.5rem; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="${isWafaq ? 'fas fa-file-invoice' : 'fas fa-award'}" style="font-size:1.4rem; color:#fde047;"></i>
                            <h3 style="margin:0; font-family:'Aref Ruqaa', 'Amiri', serif; font-size:1.4rem;">
                                ${title}
                            </h3>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <button onclick="GraduatesModule.printLoadedDocument('${docUrl}', '${title}')" class="btn" style="background:#4338ca; color:white; border:none; padding:6px 14px; border-radius:8px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-print"></i> پرنٹ کریں
                            </button>
                            <a href="${docUrl}" download="${grad.name}_${isWafaq ? 'Wafaq_Result' : 'Sanad'}.png" class="btn" style="background:#059669; color:white; border:none; padding:6px 14px; border-radius:8px; font-weight:bold; cursor:pointer; text-decoration:none; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-download"></i> ڈاؤن لوڈ
                            </a>
                            <button type="button" onclick="document.getElementById('${modalId}').remove()" style="background:none; border:none; color:white; font-size:1.6rem; cursor:pointer; line-height:1;"><i class="fas fa-times"></i></button>
                        </div>
                    </div>

                    <!-- Lightbox Body -->
                    <div style="flex:1; overflow:auto; padding:1.5rem; background:#0f172a; display:flex; align-items:center; justify-content:center; text-align:center;">
                        ${isPdf ? `
                            <iframe src="${docUrl}" style="width:100%; height:70vh; border:none; border-radius:8px; background:white;"></iframe>
                        ` : `
                            <img src="${docUrl}" alt="${title}" style="max-width:100%; max-height:75vh; object-fit:contain; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
                        `}
                    </div>

                    <!-- Lightbox Footer Info -->
                    <div style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:10px 1.5rem; display:flex; justify-content:space-between; align-items:center; font-size:0.95rem; color:#475569;">
                        <div>
                            <b>طالب علم:</b> ${grad.name} ${grad.fatherName ? `ولد ${grad.fatherName}` : ''} | <b>سالِ فراغت:</b> ${grad.graduationYear || '---'}ء
                        </div>
                        <div>
                            ${isWafaq ? `<b>رول نمبر:</b> ${grad.wafaqRollNo || '---'} | <b>گریڈ:</b> ${grad.wafaqGrade || '---'}` : `<b>سند نمبر:</b> ${grad.sanadNumber || '---'}`}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    printLoadedDocument(docUrl, title) {
        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert('براہِ کرم براؤزر پاپ اپ کی اجازت دیں۔');
            return;
        }

        const isPdf = docUrl.startsWith('data:application/pdf');

        const html = `<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @page { size: auto; margin: 10mm; }
        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: white; }
        img { max-width: 100%; max-height: 95vh; object-fit: contain; }
    </style>
</head>
<body>
    ${isPdf ? `<iframe src="${docUrl}" style="width:100%; height:100vh; border:none;"></iframe>` : `<img src="${docUrl}" onload="window.print();">`}
</body>
</html>`;

        printWin.document.write(html);
        printWin.document.close();
    },

    // ==========================================
    // --- PRINT MADRASA SANAD / CERTIFICATE ---
    // ==========================================
    async printMadrasaSanad(graduateId) {
        const grad = await MadrassahDB.getGraduateById(graduateId);
        if (!grad) return;

        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert('براہِ کرم براؤزر پاپ اپ کی اجازت دیں۔');
            return;
        }

        const html = `<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>سندِ فراغت و تکمیلِ حفظ - ${grad.name}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
    <style>
        @page { size: A4 landscape; margin: 8mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Jameel Noori Nastaleeq', Arial, sans-serif; direction: rtl; margin: 0; padding: 15px; color: #1e1b4b; background: #fff; }
        .cert-border { border: 12px double #312e81; outline: 3px solid #b45309; padding: 25px 35px; border-radius: 12px; position: relative; background: #fafaf9; }
        .corner-ornament { position: absolute; width: 60px; height: 60px; border: 4px solid #b45309; }
        .c-tl { top: 8px; left: 8px; border-right: none; border-bottom: none; }
        .c-tr { top: 8px; right: 8px; border-left: none; border-bottom: none; }
        .c-bl { bottom: 8px; left: 8px; border-right: none; border-top: none; }
        .c-br { bottom: 8px; right: 8px; border-left: none; border-top: none; }
        .bismillah { text-align: center; font-size: 2.2rem; color: #312e81; font-family: 'Aref Ruqaa', serif; margin-bottom: 5px; }
        .madrassa-name { text-align: center; font-size: 2.8rem; color: #1e1b4b; font-weight: bold; font-family: 'Aref Ruqaa', serif; margin: 0; line-height: 1.2; }
        .sanad-badge { text-align: center; margin: 15px auto; }
        .sanad-title { display: inline-block; background: #312e81; color: #fde047; padding: 6px 36px; border-radius: 30px; font-size: 1.8rem; font-family: 'Aref Ruqaa', serif; font-weight: bold; border: 2px solid #b45309; }
        .cert-body { font-size: 1.4rem; line-height: 2.2; text-align: justify; margin: 20px 20px; color: #1f2937; }
        .highlight-name { font-size: 1.8rem; color: #1e1b4b; font-weight: bold; border-bottom: 2px dashed #b45309; padding: 0 10px; font-family: 'Aref Ruqaa', serif; }
        .cert-footer { display: flex; justify-content: space-between; margin-top: 45px; padding: 0 30px; font-size: 1.2rem; }
        .sig-block { text-align: center; width: 220px; border-top: 2px dashed #4b5563; padding-top: 6px; font-weight: bold; }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body>
    <div class="no-print" style="text-align:left; margin-bottom:12px;">
        <button onclick="window.print()" style="background:#312e81; color:white; border:none; padding:8px 20px; font-weight:bold; border-radius:6px; cursor:pointer; font-size:1.05rem;">
            <i class="fas fa-print"></i> سند پرنٹ کریں (Print Sanad)
        </button>
    </div>

    <div class="cert-border">
        <div class="corner-ornament c-tl"></div>
        <div class="corner-ornament c-tr"></div>
        <div class="corner-ornament c-bl"></div>
        <div class="corner-ornament c-br"></div>

        <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div class="madrassa-name">مدرسہ عبد الرحمن بن عوف غفوریہ</div>
        <div style="text-align:center; font-size:1.15rem; color:#4b5563;">بوسال کالونی، نزد ٹیوب ویل، خانیوال | الحاق: وفاق المدارس العربیہ پاکستان</div>

        <div class="sanad-badge">
            <span class="sanad-title">سندِ فراغت و تکمیلِ ${grad.graduationType || 'حفظِ قرآن کریم'}</span>
        </div>

        <div style="display:flex; justify-content:space-between; margin:0 30px; font-size:1.1rem; color:#4b5563;">
            <span><b>سند نمبر:</b> ${grad.sanadNumber || ('SND-' + grad.id)}</span>
            <span><b>سالِ فراغت:</b> ${grad.graduationYear || '---'}ء</span>
            <span><b>وفاق رول نمبر:</b> ${grad.wafaqRollNo || '---'}</span>
        </div>

        <div class="cert-body">
            تصدیق کی جاتی ہے کہ محترم <span class="highlight-name">${grad.name}</span> 
            ولد محترم <span class="highlight-name">${grad.fatherName || '---'}</span>، 
            ساکن <span style="font-weight:bold;">${[grad.address, grad.city].filter(Boolean).join('، ') || 'پاکستان'}</span> 
            نے اس ادارہ میں زیرِ نگرانیِ استاد محترم <span style="font-weight:bold; color:#312e81;">${grad.ustadName || 'اساتذہ جامعہ'}</span> 
            باوقار انداز میں اپنا تعلیمی مرحلہ مکمل فرمایا۔ نیز موصوف نے وفاق المدارس العربیہ پاکستان کے سالانہ امتحانات میں 
            درجہ <span style="font-weight:bold; color:#059669; font-size:1.5rem;">${grad.wafaqGrade || 'ممتاز'}</span> میں نمایاں کامیابی حاصل فرمائی۔
            <br>
            ادارہ موصوف کی علمی و عملی ترقی اور دینی خدمات کے لیے دعا گو ہے۔
        </div>

        <div class="cert-footer">
            <div class="sig-block">دستخط استاد محترم / ممتحن</div>
            <div class="sig-block">مہر و دستخط ناظمِ تعلیمات</div>
            <div class="sig-block">مہر و دستخط مہتمم صاحب</div>
        </div>
    </div>
</body>
</html>`;

        printWin.document.write(html);
        printWin.document.close();
    },

    // 5. PRINT GRADUATES DIRECTORY (سجل الفضلاء)
    async printGraduatesDirectoryReport() {
        const section = (window.app && window.app.currentSection) ? window.app.currentSection : 'banin';
        const isBanat = section === 'banat';
        const graduates = await MadrassahDB.getAllGraduates(section);

        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert('براہِ کرم براؤزر پاپ اپ کی اجازت دیں۔');
            return;
        }

        const html = `<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>سجل الفضلاء و فارغ التحصیل ریکارڈ</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
    <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: 'Jameel Noori Nastaleeq', Arial, sans-serif; direction: rtl; margin: 0; padding: 10px; color: #1e1b4b; font-size: 1rem; }
        .header { text-align: center; border-bottom: 2px solid #312e81; padding-bottom: 8px; margin-bottom: 15px; }
        .title { font-size: 2rem; color: #1e1b4b; margin: 0; font-weight: bold; }
        .subtitle { font-size: 1.2rem; color: #475569; margin: 3px 0 0 0; }
        table { width: 100%; border-collapse: collapse; text-align: center; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 6px; font-size: 0.92rem; }
        th { background: #f1f5f9; color: #0f172a; font-weight: bold; }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body>
    <div class="no-print" style="text-align:left; margin-bottom:10px;">
        <button onclick="window.print()" style="background:#312e81; color:white; border:none; padding:8px 20px; font-weight:bold; border-radius:6px; cursor:pointer;">
            <i class="fas fa-print"></i> پرنٹ ڈائریکٹری (Print)
        </button>
    </div>

    <div class="header">
        <h1 class="title">مدرسہ عبد الرحمن بن عوف غفوریہ</h1>
        <div class="subtitle">${isBanat ? 'سجل الفاضلات - فارغ التحصیل طالبات و حفاظ کا جامع ریکارڈ' : 'سجل الفضلاء - فارغ التحصیل طلباء و حفاظِ کرام کا جامع ریکارڈ'}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width:4%;">نمبر</th>
                <th style="width:18%; text-align:right;">نام طالب علم مع ولدیت</th>
                <th style="width:8%;">سالِ فراغت</th>
                <th style="width:12%;">شعبہ</th>
                <th style="width:10%;">وفاق رول نمبر</th>
                <th style="width:10%;">وفاق نمبرات</th>
                <th style="width:10%;">درجہ / گریڈ</th>
                <th style="width:14%; text-align:right;">موجودہ مصروفیت / خدمت</th>
                <th style="width:14%;">رابطہ نمبر</th>
            </tr>
        </thead>
        <tbody>
            ${graduates.map((g, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td style="text-align:right; font-weight:bold;">
                        ${g.name} ${g.fatherName ? `<small style="font-weight:normal; color:#64748b;">(ولد ${g.fatherName})</small>` : ''}
                    </td>
                    <td style="font-weight:bold; color:#312e81;">${g.graduationYear || '---'}ء</td>
                    <td>${g.graduationType || 'حفظِ قرآن'}</td>
                    <td style="font-family:monospace;">${g.wafaqRollNo || '---'}</td>
                    <td style="font-family:monospace;">${g.wafaqObtainedMarks ? `${g.wafaqObtainedMarks}/${g.wafaqTotalMarks || 100}` : '---'}</td>
                    <td style="font-weight:bold; color:#059669;">${g.wafaqGrade || '---'}</td>
                    <td style="text-align:right;">${g.currentOccupation || '---'}</td>
                    <td style="font-family:monospace;" dir="ltr">${g.phone || g.whatsapp || '---'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div style="display:flex; justify-content:space-between; margin-top:40px; padding:0 30px;">
        <div style="border-top:1.5px dashed #4b5563; width:180px; text-align:center; padding-top:6px; font-weight:bold;">ناظمِ امتحانات</div>
        <div style="border-top:1.5px dashed #4b5563; width:180px; text-align:center; padding-top:6px; font-weight:bold;">مہتمم / صدر مدرسہ</div>
    </div>
</body>
</html>`;

        printWin.document.write(html);
        printWin.document.close();
    }
};

if (typeof window !== 'undefined') {
    window.GraduatesModule = GraduatesModule;
}
