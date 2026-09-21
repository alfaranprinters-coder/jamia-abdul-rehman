// Donors Management Module (مستقل معاونین و ڈونرز مینجمنٹ سسٹم)
// Madrassah Pro Manager - Offline Version
// Architecture & Implementation for Madrasa Abdul Rehman Bin Auf

const DonorsModule = {
    activeTab: 'list', // 'list' | 'cards' | 'master' | 'history'
    selectedDonorDetailsId: null, // null = list view, ID = single donor 12-month ledger details
    selectedYear: new Date().getFullYear(),
    calendarType: 'gregorian', // 'gregorian' | 'hijri'
    searchQuery: '',
    filterCategory: 'all',
    filterStatus: 'all',

    GREGORIAN_MONTHS: [
        { index: 0, name: 'جنوری', en: 'January' },
        { index: 1, name: 'فروری', en: 'February' },
        { index: 2, name: 'مارچ', en: 'March' },
        { index: 3, name: 'اپریل', en: 'April' },
        { index: 4, name: 'مئی', en: 'May' },
        { index: 5, name: 'جون', en: 'June' },
        { index: 6, name: 'جولائی', en: 'July' },
        { index: 7, name: 'اگست', en: 'August' },
        { index: 8, name: 'ستمبر', en: 'September' },
        { index: 9, name: 'اکتوبر', en: 'October' },
        { index: 10, name: 'نومبر', en: 'November' },
        { index: 11, name: 'دسمبر', en: 'December' }
    ],

    HIJRI_MONTHS: [
        { index: 0, name: 'محرم الحرام', en: 'Muharram' },
        { index: 1, name: 'صفر المظفر', en: 'Safar' },
        { index: 2, name: 'ربیع الاول', en: 'Rabi-ul-Awwal' },
        { index: 3, name: 'ربیع الثانی', en: 'Rabi-us-Sani' },
        { index: 4, name: 'جمادی الاولیٰ', en: 'Jumada-al-Awwal' },
        { index: 5, name: 'جمادی الثانیہ', en: 'Jumada-as-Sani' },
        { index: 6, name: 'رجب المرجب', en: 'Rajab' },
        { index: 7, name: 'شعبان المعظم', en: 'Shaban' },
        { index: 8, name: 'رمضان المبارک', en: 'Ramadan' },
        { index: 9, name: 'شوال المکرم', en: 'Shawwal' },
        { index: 10, name: 'ذوالقعدۃ', en: 'Zul-Qadah' },
        { index: 11, name: 'ذوالحجہ', en: 'Zul-Hijjah' }
    ],

    getMonths() {
        return this.calendarType === 'hijri' ? this.HIJRI_MONTHS : this.GREGORIAN_MONTHS;
    },

    getMonthName(index) {
        const months = this.getMonths();
        return months[index] ? months[index].name : `ماہ ${index + 1}`;
    },

    // WhatsApp Number Normalizer for Pakistan & International
    formatWhatsAppNumber(rawPhone) {
        if (!rawPhone) return '';
        let digits = String(rawPhone).replace(/[^0-9]/g, '');
        if (!digits) return '';
        if (digits.startsWith('0092')) {
            digits = '92' + digits.slice(4);
        } else if (digits.startsWith('92')) {
            // Valid Pakistani international format
        } else if (digits.startsWith('0')) {
            digits = '92' + digits.slice(1);
        } else if (digits.length === 10 && digits.startsWith('3')) {
            digits = '92' + digits;
        }
        return digits;
    },

    // Reliable WhatsApp link launcher (bypasses browser async popup blocker)
    openWhatsAppDirect(phone, message) {
        const formattedWa = this.formatWhatsAppNumber(phone);
        if (!formattedWa || formattedWa.length < 10) {
            alert('براہِ کرم ڈونر کے کوائف میں درست موبائل یا واٹس ایپ نمبر (مثلاً: 03001234567) درج فرمائیں۔');
            return;
        }
        const url = `https://wa.me/${formattedWa}?text=${encodeURIComponent(message)}`;
        
        try {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { if (a.parentNode) a.parentNode.removeChild(a); }, 300);
        } catch (e) {
            window.open(url, '_blank');
        }
    },

    // Main Render Function
    async render(container) {
        if (!container) container = document.getElementById('main-content');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center; padding: 4rem;"><div class="mms-spinner"></div></div>';

        let donors = [];
        let donations = [];
        try {
            donors = await MadrassahDB.getAllDonors();
            donations = await MadrassahDB.getAllDonorDonations();
        } catch (err) {
            console.error('Error loading donor data:', err);
        }

        // Calculate KPI Stats
        const activeDonors = donors.filter(d => d.status !== 'inactive');
        const totalMonthlyTarget = activeDonors.reduce((sum, d) => sum + (Number(d.monthlyPledge) || 0), 0);
        
        const currentMonthIdx = new Date().getMonth();
        const currentYear = this.selectedYear;

        const thisYearDonations = donations.filter(d => Number(d.year) === Number(currentYear));
        const totalYearCollected = thisYearDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

        const thisMonthDonations = thisYearDonations.filter(d => Number(d.monthIndex) === currentMonthIdx);
        const totalMonthCollected = thisMonthDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

        // Filter donors
        const filteredDonors = donors.filter(d => {
            const matchesSearch = !this.searchQuery || 
                (d.name && d.name.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (d.fatherName && d.fatherName.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (d.donorCode && d.donorCode.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (d.phone && d.phone.includes(this.searchQuery)) ||
                (d.whatsapp && d.whatsapp.includes(this.searchQuery)) ||
                (d.city && d.city.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (d.address && d.address.toLowerCase().includes(this.searchQuery.toLowerCase()));

            const matchesCategory = this.filterCategory === 'all' || d.fundType === this.filterCategory;
            const matchesStatus = this.filterStatus === 'all' || (this.filterStatus === 'active' ? d.status !== 'inactive' : d.status === 'inactive');

            return matchesSearch && matchesCategory && matchesStatus;
        });

        // Generate Available Years for Dropdown (Current - 2 to Current + 2)
        const baseYear = new Date().getFullYear();
        const yearsList = [baseYear - 2, baseYear - 1, baseYear, baseYear + 1, baseYear + 2];

        container.innerHTML = `
            <div class="donors-module-container" style="padding-bottom: 2rem;">
                <!-- Header Card -->
                <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%); color: white; border-radius: 16px; padding: 1.5rem 2rem; box-shadow: 0 10px 25px -5px rgba(6, 95, 70, 0.4);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.2rem;">
                        <div style="display:flex; align-items:center; gap:16px;">
                            <div style="width:58px; height:58px; background:rgba(255,255,255,0.18); backdrop-filter:blur(6px); border:2px solid rgba(255,255,255,0.3); border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:1.9rem; color:#fef08a;">
                                <i class="fas fa-hand-holding-heart"></i>
                            </div>
                            <div>
                                <h2 style="margin:0; font-family:'Aref Ruqaa', 'Amiri', serif; font-size:2rem; letter-spacing:0.5px; color:#ffffff;">
                                    شعبہ مستقل معاونین و عطیات دہندگان
                                </h2>
                                <p style="margin:4px 0 0 0; color:#a7f3d0; font-size:1rem;">
                                    مستقل ڈونرز کا اندراج، ۱۲ مہینوں کا بصری کھاتہ، فوری رسید و واٹس ایپ ترسیل
                                </p>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                            <button onclick="DonorsModule.showDonorModal()" class="btn" style="background:#fef08a; color:#064e3b; font-weight:bold; font-size:1.05rem; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                                <i class="fas fa-user-plus"></i> نیا ڈونر رجسٹر کریں
                            </button>
                            <button onclick="DonorsModule.showDonationModal()" class="btn" style="background:#ffffff; color:#065f46; font-weight:bold; font-size:1.05rem; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                                <i class="fas fa-hand-holding-dollar"></i> رقم وصول کریں (فوری رسید)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1.2rem; margin-bottom: 1.5rem;">
                    <div class="stat-card" style="border-right: 5px solid #059669; background:white; padding:1.2rem 1.4rem; border-radius:12px; box-shadow:var(--shadow-sm);">
                        <div class="stat-icon" style="background:#ecfdf5; color:#059669; width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.4rem;"><i class="fas fa-users"></i></div>
                        <div class="stat-info">
                            <h4 style="margin:0; color:#64748b; font-size:0.95rem;">کل مستقل معاونین</h4>
                            <p style="margin:4px 0 0 0; font-size:1.6rem; font-weight:bold; color:#0f172a;">${donors.length} <span style="font-size:0.9rem; color:#059669; font-weight:normal;">(${activeDonors.length} فعال)</span></p>
                        </div>
                    </div>

                    <div class="stat-card" style="border-right: 5px solid #0284c7; background:white; padding:1.2rem 1.4rem; border-radius:12px; box-shadow:var(--shadow-sm);">
                        <div class="stat-icon" style="background:#f0f9ff; color:#0284c7; width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.4rem;"><i class="fas fa-bullseye"></i></div>
                        <div class="stat-info">
                            <h4 style="margin:0; color:#64748b; font-size:0.95rem;">ماہانہ متوقع تعاون</h4>
                            <p style="margin:4px 0 0 0; font-size:1.6rem; font-weight:bold; color:#0284c7;">Rs. ${totalMonthlyTarget.toLocaleString('en-US')}</p>
                        </div>
                    </div>

                    <div class="stat-card" style="border-right: 5px solid #d97706; background:white; padding:1.2rem 1.4rem; border-radius:12px; box-shadow:var(--shadow-sm);">
                        <div class="stat-icon" style="background:#fffbeb; color:#d97706; width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.4rem;"><i class="fas fa-calendar-check"></i></div>
                        <div class="stat-info">
                            <h4 style="margin:0; color:#64748b; font-size:0.95rem;">رواں ماہ وصولی (${this.getMonthName(currentMonthIdx)})</h4>
                            <p style="margin:4px 0 0 0; font-size:1.6rem; font-weight:bold; color:#d97706;">Rs. ${totalMonthCollected.toLocaleString('en-US')}</p>
                        </div>
                    </div>

                    <div class="stat-card" style="border-right: 5px solid #7c3aed; background:white; padding:1.2rem 1.4rem; border-radius:12px; box-shadow:var(--shadow-sm);">
                        <div class="stat-icon" style="background:#f5f3ff; color:#7c3aed; width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.4rem;"><i class="fas fa-coins"></i></div>
                        <div class="stat-info">
                            <h4 style="margin:0; color:#64748b; font-size:0.95rem;">سال ${currentYear}ء کی کل وصولی</h4>
                            <p style="margin:4px 0 0 0; font-size:1.6rem; font-weight:bold; color:#7c3aed;">Rs. ${totalYearCollected.toLocaleString('en-US')}</p>
                        </div>
                    </div>
                </div>

                <!-- Control & Filter Bar -->
                <div class="card" style="margin-bottom: 1.5rem; padding: 1.2rem 1.5rem; background:white; border-radius:14px; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                        <!-- Tab Pills -->
                        <div style="display:flex; gap:8px; background:#f1f5f9; padding:5px; border-radius:12px;">
                            <button onclick="DonorsModule.switchTab('list')" class="btn" style="border:none; cursor:pointer; font-weight:bold; border-radius:9px; padding:8px 18px; display:flex; align-items:center; gap:6px; ${(this.activeTab === 'list' || this.activeTab === 'cards') ? 'background:var(--primary); color:white; box-shadow:0 2px 6px rgba(0,0,0,0.1);' : 'background:transparent; color:#475569;'}">
                                <i class="fas fa-list-check"></i> ڈونرز کی فہرست
                            </button>
                            <button onclick="DonorsModule.switchTab('master')" class="btn" style="border:none; cursor:pointer; font-weight:bold; border-radius:9px; padding:8px 18px; display:flex; align-items:center; gap:6px; ${this.activeTab === 'master' ? 'background:var(--primary); color:white; box-shadow:0 2px 6px rgba(0,0,0,0.1);' : 'background:transparent; color:#475569;'}">
                                <i class="fas fa-table-cells"></i> سالانہ ماسٹر شیٹ
                            </button>
                            <button onclick="DonorsModule.switchTab('history')" class="btn" style="border:none; cursor:pointer; font-weight:bold; border-radius:9px; padding:8px 18px; display:flex; align-items:center; gap:6px; ${this.activeTab === 'history' ? 'background:var(--primary); color:white; box-shadow:0 2px 6px rgba(0,0,0,0.1);' : 'background:transparent; color:#475569;'}">
                                <i class="fas fa-receipt"></i> تمام رسیدات و ادائیگیاں (${donations.length})
                            </button>
                        </div>

                        <!-- Year & Calendar Selector -->
                        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                            <div style="display:flex; align-items:center; gap:6px;">
                                <label style="font-weight:bold; color:#475569; font-size:0.95rem;"><i class="fas fa-calendar"></i> سال:</label>
                                <select onchange="DonorsModule.changeYear(this.value)" style="padding:7px 14px; border-radius:8px; border:1.5px solid #cbd5e1; font-weight:bold; color:#065f46; font-size:1.05rem; background:#ffffff; cursor:pointer;">
                                    ${yearsList.map(yr => `<option value="${yr}" ${Number(yr) === Number(this.selectedYear) ? 'selected' : ''}>${yr}ء</option>`).join('')}
                                </select>
                            </div>

                            <button onclick="DonorsModule.toggleCalendarType()" class="btn" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#334155; font-weight:bold; border-radius:8px; padding:7px 14px; cursor:pointer; display:flex; align-items:center; gap:6px;" title="تقویم تبدیل کریں">
                                <i class="fas fa-moon" style="color:${this.calendarType === 'hijri' ? '#059669' : '#94a3b8'};"></i>
                                <span>${this.calendarType === 'hijri' ? 'قمری / ہجری مہینے' : 'شمسی / عیسوی مہینے'}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Search & Filter Controls -->
                    <div style="display:flex; gap:1rem; margin-top:1.2rem; flex-wrap:wrap; align-items:center;">
                        <div style="flex:1; min-width:240px; position:relative;">
                            <input type="text" placeholder="نام، ولدیت، کوڈ، فون، واٹس ایپ یا شہر سے تلاش کریں..." value="${this.searchQuery}" oninput="DonorsModule.onSearch(this.value)" style="width:100%; padding:10px 40px 10px 14px; border-radius:10px; border:1.5px solid #cbd5e1; font-size:1rem; outline:none;">
                            <i class="fas fa-search" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); color:#94a3b8;"></i>
                        </div>

                        <div style="display:flex; gap:8px; align-items:center;">
                            <select onchange="DonorsModule.onCategoryFilter(this.value)" style="padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; background:white; font-size:0.95rem; cursor:pointer;">
                                <option value="all" ${this.filterCategory === 'all' ? 'selected' : ''}>تمام مدات / فنڈز</option>
                                <option value="عام عطیہ / امداد" ${this.filterCategory === 'عام عطیہ / امداد' ? 'selected' : ''}>عام عطیہ / امداد</option>
                                <option value="زکوٰۃ" ${this.filterCategory === 'زکوٰۃ' ? 'selected' : ''}>زکوٰۃ</option>
                                <option value="صدقات" ${this.filterCategory === 'صدقات' ? 'selected' : ''}>صدقات</option>
                                <option value="کفالت طلبہ (خوراک و کتب)" ${this.filterCategory === 'کفالت طلبہ (خوراک و کتب)' ? 'selected' : ''}>کفالت طلبہ</option>
                                <option value="تعمیراتی فنڈ" ${this.filterCategory === 'تعمیراتی فنڈ' ? 'selected' : ''}>تعمیراتی فنڈ</option>
                            </select>

                            <select onchange="DonorsModule.onStatusFilter(this.value)" style="padding:9px 12px; border-radius:8px; border:1.5px solid #cbd5e1; background:white; font-size:0.95rem; cursor:pointer;">
                                <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>تمام کیفیت</option>
                                <option value="active" ${this.filterStatus === 'active' ? 'selected' : ''}>صرف فعال</option>
                                <option value="inactive" ${this.filterStatus === 'inactive' ? 'selected' : ''}>غیر فعال</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Main Content Area Based on Tab -->
                <div id="donors-tab-content">
                    ${(this.activeTab === 'list' || this.activeTab === 'cards') ? this.renderDonorsMainView(filteredDonors, thisYearDonations, donors) : ''}
                    ${this.activeTab === 'master' ? this.renderMasterView(filteredDonors, thisYearDonations) : ''}
                    ${this.activeTab === 'history' ? this.renderHistoryView(donations, donors) : ''}
                </div>
            </div>
        `;
    },

    // Main View Dispatcher (List First, Detail On Click)
    renderDonorsMainView(filteredDonors, yearDonations, allDonors) {
        if (this.selectedDonorDetailsId) {
            const singleDonor = (allDonors || []).find(d => String(d.id) === String(this.selectedDonorDetailsId))
                || filteredDonors.find(d => String(d.id) === String(this.selectedDonorDetailsId));
            if (singleDonor) {
                return this.renderSingleDonorDetailsView(singleDonor, yearDonations);
            }
        }
        return this.renderDonorsListView(filteredDonors, yearDonations);
    },

    // 1. DONORS LIST DIRECTORY VIEW (پہلے فہرست نظر آئے گی)
    renderDonorsListView(donors, yearDonations) {
        if (!donors || donors.length === 0) {
            return `
                <div class="card" style="text-align:center; padding:3.5rem 2rem; background:white; border-radius:14px; box-shadow:var(--shadow-sm);">
                    <div style="font-size:3.5rem; color:#cbd5e1; margin-bottom:1rem;"><i class="fas fa-hand-holding-heart"></i></div>
                    <h3 style="color:#475569; margin-bottom:0.5rem;">کوئی مستقل ڈونر موجود نہیں ہے</h3>
                    <p style="color:#94a3b8; font-size:0.95rem; margin-bottom:1.5rem;">مدرسہ کے باقاعدہ ماہانہ معاونین کا اندراج شروع کرنے کے لیے نیا ڈونر شامل فرمائیں۔</p>
                    <button onclick="DonorsModule.showDonorModal()" class="btn btn-primary" style="background:var(--primary); font-weight:bold; padding:10px 24px; border-radius:10px; border:none; cursor:pointer;">
                        <i class="fas fa-plus"></i> نیا ڈونر رجسٹر کریں
                    </button>
                </div>
            `;
        }

        return `
            <div class="card" style="background:white; border-radius:14px; padding:1.2rem 1.5rem; box-shadow:var(--shadow-sm); overflow-x:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; flex-wrap:wrap; gap:10px;">
                    <div>
                        <h3 style="margin:0; font-size:1.35rem; color:#0f172a; font-family:'Aref Ruqaa', 'Amiri', serif;">
                            <i class="fas fa-list-check" style="color:var(--primary); margin-left:6px;"></i> فہرستِ مستقل معاونین (Donors Directory)
                        </h3>
                        <span style="font-size:0.85rem; color:#64748b;">
                            کل معاونین: <b>${donors.length}</b> | سال ${this.selectedYear}ء | مکمل ۱۲ ماہ کا کھاتہ دیکھنے کے لیے متعلقہ ڈونر کے سامنے <b>"تفصیل چیک کریں"</b> دبائیں
                        </span>
                    </div>
                    <div>
                        <button onclick="DonorsModule.showDonorModal()" class="btn btn-sm" style="background:#059669; color:white; font-weight:bold; padding:8px 16px; border-radius:8px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; border:none;">
                            <i class="fas fa-user-plus"></i> نیا ڈونر رجسٹر کریں
                        </button>
                    </div>
                </div>

                <table class="table" style="width:100%; border-collapse:collapse; font-size:0.95rem; text-align:right;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#1e293b; border-bottom:2px solid #cbd5e1;">
                            <th style="padding:11px 10px; text-align:center; width:45px;">#</th>
                            <th style="padding:11px 10px; text-align:center; width:105px;">کوڈ / نمبر</th>
                            <th style="padding:11px 14px;">نامِ ڈونر مع ولدیت</th>
                            <th style="padding:11px 12px;">رابطہ و واٹس ایپ</th>
                            <th style="padding:11px 12px;">شہر / پتہ</th>
                            <th style="padding:11px 12px; text-align:center;">مد / فنڈ</th>
                            <th style="padding:11px 12px; text-align:center;">ماہانہ طے شدہ</th>
                            <th style="padding:11px 12px; text-align:center;">سالانہ پیش رفت (${this.selectedYear}ء)</th>
                            <th style="padding:11px 10px; text-align:center;">کیفیت</th>
                            <th style="padding:11px 14px; text-align:center; min-width:240px;">کارروائی (ایکشنز)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${donors.map((donor, idx) => {
                            const donorDons = yearDonations.filter(d => String(d.donorId) === String(donor.id) || parseInt(d.donorId) === parseInt(donor.id));
                            const paidCount = donorDons.length;
                            const totalDonated = donorDons.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
                            const pledgedAnnual = (Number(donor.monthlyPledge) || 0) * 12;
                            const completionPct = pledgedAnnual > 0 ? Math.min(100, Math.round((totalDonated / pledgedAnnual) * 100)) : 0;
                            const formattedWa = this.formatWhatsAppNumber(donor.whatsapp || donor.phone);

                            return `
                                <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.15s;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='white';">
                                    <td style="padding:11px 10px; text-align:center; color:#64748b; font-weight:bold;">${idx + 1}</td>
                                    <td style="padding:11px 10px; text-align:center;">
                                        <span style="background:#e0f2fe; color:#0369a1; font-family:monospace; font-size:0.85rem; font-weight:bold; padding:3px 8px; border-radius:6px; border:1px solid #bae6fd;">
                                            ${donor.donorCode || ('DNR-' + donor.id)}
                                        </span>
                                    </td>
                                    <td style="padding:11px 14px;">
                                        <div style="font-weight:bold; font-size:1.05rem; color:#0f172a;">
                                            ${donor.name}
                                        </div>
                                        ${donor.fatherName ? `<div style="font-size:0.82rem; color:#64748b;">ولد ${donor.fatherName}</div>` : ''}
                                    </td>
                                    <td style="padding:11px 12px; font-size:0.9rem;">
                                        ${donor.phone ? `<div><i class="fas fa-phone" style="color:#0284c7; font-size:0.8rem; margin-left:4px;"></i> <span dir="ltr">${donor.phone}</span></div>` : ''}
                                        ${formattedWa ? `
                                            <div style="margin-top:2px;">
                                                <a href="https://wa.me/${formattedWa}" target="_blank" rel="noopener noreferrer" style="color:#16a34a; text-decoration:none; display:inline-flex; align-items:center; gap:4px; font-weight:bold; font-size:0.85rem;" title="واٹس ایپ پر رابطہ">
                                                    <i class="fab fa-whatsapp"></i> <span dir="ltr">${donor.whatsapp || donor.phone}</span>
                                                </a>
                                            </div>
                                        ` : ''}
                                    </td>
                                    <td style="padding:11px 12px; color:#475569; font-size:0.88rem;">
                                        ${[donor.city, donor.address].filter(Boolean).join('، ') || '---'}
                                    </td>
                                    <td style="padding:11px 12px; text-align:center;">
                                        <span style="background:#fef3c7; color:#92400e; font-size:0.8rem; font-weight:bold; padding:3px 8px; border-radius:6px; border:1px solid #fde68a;">
                                            ${donor.fundType || 'عام عطیہ'}
                                        </span>
                                    </td>
                                    <td style="padding:11px 12px; text-align:center; font-family:monospace; font-weight:bold; color:#065f46; font-size:1rem;">
                                        Rs. ${(Number(donor.monthlyPledge) || 0).toLocaleString('en-US')}
                                    </td>
                                    <td style="padding:11px 12px; text-align:center;">
                                        <div style="font-weight:bold; font-size:0.88rem; color:${paidCount > 0 ? '#059669' : '#94a3b8'};">
                                            ${paidCount} / ۱۲ ماہ
                                        </div>
                                        <div style="font-family:monospace; font-size:0.82rem; color:#64748b;">
                                            Rs. ${totalDonated.toLocaleString('en-US')}
                                        </div>
                                        <div style="width:100px; height:5px; background:#e2e8f0; border-radius:3px; margin:4px auto 0 auto; overflow:hidden;">
                                            <div style="width:${completionPct}%; height:100%; background:#10b981;"></div>
                                        </div>
                                    </td>
                                    <td style="padding:11px 10px; text-align:center;">
                                        ${donor.status === 'inactive' ? 
                                            '<span style="background:#fee2e2; color:#b91c1c; font-size:0.75rem; font-weight:bold; padding:2px 7px; border-radius:5px;">غیر فعال</span>' : 
                                            '<span style="background:#dcfce7; color:#15803d; font-size:0.75rem; font-weight:bold; padding:2px 7px; border-radius:5px;">فعال</span>'
                                        }
                                    </td>
                                    <td style="padding:11px 14px; text-align:center;">
                                        <div style="display:inline-flex; gap:6px; align-items:center;">
                                            <!-- تفصیلی کھاتہ بٹن -->
                                            <button onclick="DonorsModule.viewDonorDetails('${donor.id}')" class="btn btn-sm" style="background:#0284c7; color:white; font-weight:bold; font-size:0.85rem; padding:6px 12px; border-radius:7px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 5px rgba(2,132,199,0.2);" title="اس ڈونر کا مکمل کھاتہ و ۱۲ ماہ تفصیل دیکھیں">
                                                <i class="fas fa-eye"></i> تفصیل چیک کریں
                                            </button>

                                            <!-- رقم وصولی بٹن -->
                                            <button onclick="DonorsModule.showDonationModal('${donor.id}')" class="btn btn-sm" style="background:#059669; color:white; font-weight:bold; font-size:0.85rem; padding:6px 10px; border-radius:7px; border:none; cursor:pointer;" title="رقم وصول کریں">
                                                <i class="fas fa-plus"></i>
                                            </button>

                                            <!-- ترمیم بٹن -->
                                            <button onclick="DonorsModule.showDonorModal('${donor.id}')" class="btn btn-sm" style="background:#f8fafc; color:#475569; border:1px solid #cbd5e1; padding:6px 9px; border-radius:7px; cursor:pointer;" title="کوائف میں ترمیم">
                                                <i class="fas fa-edit"></i>
                                            </button>

                                            <!-- ڈیلیٹ بٹن -->
                                            <button onclick="DonorsModule.deleteDonor('${donor.id}')" class="btn btn-sm" style="background:#fff1f2; color:#e11d48; border:1px solid #fecdd3; padding:6px 9px; border-radius:7px; cursor:pointer;" title="ڈونر حذف کریں">
                                                <i class="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // 2. SINGLE DONOR DETAILS & 12 MONTHS MATRIX VIEW (جب تفصیل چیک کریں تو یہ آئے)
    renderSingleDonorDetailsView(donor, yearDonations) {
        return `
            <div>
                <!-- Top Navigation & Return Bar -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; background:white; padding:12px 18px; border-radius:12px; border:1.5px solid #cbd5e1; box-shadow:0 2px 8px rgba(0,0,0,0.04); flex-wrap:wrap; gap:12px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <button onclick="DonorsModule.closeDonorDetails()" class="btn" style="background:#0f172a; color:white; font-weight:bold; padding:8px 18px; border-radius:8px; border:none; display:inline-flex; align-items:center; gap:8px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
                            <i class="fas fa-arrow-right"></i> واپس تمام ڈونرز کی فہرست پر جائیں
                        </button>
                        <span style="font-size:1rem; color:#475569;">
                            ڈونر: <b style="color:#065f46; font-size:1.15rem;">${donor.name}</b> (${donor.donorCode || ('DNR-' + donor.id)}) کا ۱۲ ماہ کا تفصیلی کھاتہ
                        </span>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button onclick="DonorsModule.showDonationModal('${donor.id}')" class="btn btn-sm" style="background:#059669; color:white; font-weight:bold; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                            <i class="fas fa-hand-holding-dollar"></i> رقم وصول کریں
                        </button>
                        <button onclick="DonorsModule.printDonorStatement('${donor.id}', ${this.selectedYear})" class="btn btn-sm" style="background:#0284c7; color:white; font-weight:bold; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                            <i class="fas fa-file-invoice"></i> سالانہ اسٹیٹمنٹ پرنٹ
                        </button>
                    </div>
                </div>

                <!-- Detailed Single Donor Card -->
                ${this.renderSingleDonorCard(donor, yearDonations)}
            </div>
        `;
    },

    // Backward compatibility for cards view
    renderCardsView(donors, yearDonations) {
        return this.renderDonorsMainView(donors, yearDonations);
    },

    // Single Donor Card Component (Profile + 12 Months Visual Grid)
    renderSingleDonorCard(donor, yearDonations) {
        const months = this.getMonths();
        const donorDons = yearDonations.filter(d => String(d.donorId) === String(donor.id) || parseInt(d.donorId) === parseInt(donor.id));
        const paidCount = donorDons.length;
        const totalDonated = donorDons.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const pledgedAnnual = (Number(donor.monthlyPledge) || 0) * 12;
        const completionPct = pledgedAnnual > 0 ? Math.min(100, Math.round((totalDonated / pledgedAnnual) * 100)) : 0;
        const formattedWa = this.formatWhatsAppNumber(donor.whatsapp || donor.phone);

        return `
            <div class="card donor-ledger-card" style="background:white; border-radius:16px; border:1px solid #e2e8f0; padding:1.5rem; box-shadow:0 4px 12px rgba(0,0,0,0.05); position:relative; overflow:hidden;">
                <!-- Top Profile Bar -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; border-bottom:1px solid #f1f5f9; padding-bottom:1.2rem; margin-bottom:1.2rem;">
                    <div style="display:flex; gap:14px; align-items:center;">
                        <div style="width:52px; height:52px; border-radius:14px; background:${donor.status === 'inactive' ? '#f1f5f9' : '#ecfdf5'}; color:${donor.status === 'inactive' ? '#94a3b8' : '#059669'}; display:flex; align-items:center; justify-content:center; font-size:1.6rem; border:1.5px solid ${donor.status === 'inactive' ? '#cbd5e1' : '#a7f3d0'};">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div>
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <h3 style="margin:0; font-size:1.35rem; color:#0f172a; font-family:'Aref Ruqaa', 'Amiri', serif;">
                                    ${donor.name} ${donor.fatherName ? `<span style="font-size:1rem; color:#64748b; font-family:'Jameel Noori Nastaleeq', sans-serif;">ولد ${donor.fatherName}</span>` : ''}
                                </h3>
                                <span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:6px; font-size:0.8rem; font-weight:bold; font-family:monospace;">
                                    ${donor.donorCode || ('DNR-' + donor.id)}
                                </span>
                                ${donor.status === 'inactive' ? '<span style="background:#fee2e2; color:#b91c1c; padding:2px 8px; border-radius:6px; font-size:0.8rem; font-weight:bold;">غیر فعال</span>' : '<span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:6px; font-size:0.8rem; font-weight:bold;">فعال ڈونر</span>'}
                                ${donor.fundType ? `<span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:6px; font-size:0.8rem; font-weight:bold;">${donor.fundType}</span>` : ''}
                            </div>
                            <div style="display:flex; gap:14px; align-items:center; margin-top:5px; flex-wrap:wrap; font-size:0.95rem; color:#475569;">
                                ${donor.city || donor.address ? `<span><i class="fas fa-map-marker-alt" style="color:#ef4444; margin-left:4px;"></i> ${[donor.address, donor.city].filter(Boolean).join('، ')}</span>` : ''}
                                ${donor.phone ? `<span><i class="fas fa-phone" style="color:#0284c7; margin-left:4px;"></i> <span dir="ltr">${donor.phone}</span></span>` : ''}
                                ${formattedWa ? `
                                    <a href="https://wa.me/${formattedWa}" target="_blank" rel="noopener noreferrer" style="color:#16a34a; text-decoration:none; display:inline-flex; align-items:center; gap:4px; font-weight:bold;" title="براہِ راست واٹس ایپ پر رابطہ">
                                        <i class="fab fa-whatsapp" style="font-size:1.15rem;"></i> <span dir="ltr">${donor.whatsapp || donor.phone}</span>
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Financial Commitment Badge -->
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px 14px; text-align:left;">
                            <span style="font-size:0.85rem; color:#64748b; display:block;">طے شدہ ماہانہ تعاون</span>
                            <span style="font-size:1.25rem; font-weight:bold; color:#065f46;">Rs. ${(Number(donor.monthlyPledge) || 0).toLocaleString('en-US')} <small style="font-size:0.8rem; font-weight:normal; color:#64748b;">/ ماہانہ</small></span>
                        </div>
                    </div>
                </div>

                <!-- 12 MONTHS VISUAL GRID -->
                <div style="margin-bottom: 1.2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="margin:0; font-size:1.05rem; color:#334155; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-calendar-days" style="color:var(--primary);"></i> ۱۲ مہینوں کا کھاتہ و ادائیگیاں (${this.selectedYear}ء)
                        </h4>
                        <span style="font-size:0.9rem; color:#64748b;">
                            وصول شدہ: <b style="color:#059669;">${paidCount} / ۱۲ ماہ</b> (Rs. ${totalDonated.toLocaleString('en-US')})
                        </span>
                    </div>

                    <div class="months-12-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:10px;">
                        ${months.map(m => {
                            const don = donorDons.find(d => Number(d.monthIndex) === m.index);
                            const isPaid = !!don;

                            if (isPaid) {
                                return `
                                    <div class="month-box paid" style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:10px; padding:8px 10px; text-align:center; position:relative; box-shadow:0 2px 5px rgba(16,185,129,0.1); transition:transform 0.2s;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #bbf7d0; padding-bottom:4px; margin-bottom:4px;">
                                            <span style="font-weight:bold; font-size:0.95rem; color:#166534;">${m.name}</span>
                                            <span style="background:#16a34a; color:white; border-radius:50%; width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; font-size:0.65rem;" title="ادا شدہ">✓</span>
                                        </div>
                                        <div style="font-weight:bold; font-size:1.05rem; color:#15803d; font-family:monospace;">
                                            Rs. ${Number(don.amount).toLocaleString('en-US')}
                                        </div>
                                        <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">
                                            ${don.paymentDate ? don.paymentDate.split('-').reverse().join('/') : ''}
                                        </div>
                                        <!-- Actions on Paid Month -->
                                        <div style="display:flex; justify-content:center; gap:6px; margin-top:6px; border-top:1px solid #dcfce7; padding-top:4px;">
                                            <button onclick="DonorsModule.printDonationReceipt('${don.id}')" title="رسید پرنٹ / PDF" style="background:#dcfce7; border:none; color:#15803d; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:0.8rem;">
                                                <i class="fas fa-print"></i> رسید
                                            </button>
                                            <button onclick="DonorsModule.downloadDonationReceipt('${don.id}')" title="رسید تصویر ڈاؤن لوڈ کریں" style="background:#d1fae5; border:none; color:#065f46; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:0.8rem;">
                                                <i class="fas fa-download"></i>
                                            </button>
                                            ${formattedWa ? `
                                                <button onclick="DonorsModule.shareReceiptWhatsApp('${don.id}')" title="واٹس ایپ پر رسید بھیجیں" style="background:#22c55e; border:none; color:white; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:0.8rem;">
                                                    <i class="fab fa-whatsapp"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                `;
                            } else {
                                return `
                                    <div onclick="DonorsModule.showDonationModal('${donor.id}', ${m.index}, ${this.selectedYear})" class="month-box unpaid" style="background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:10px; padding:10px 8px; text-align:center; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='#fff7ed'; this.style.borderColor='#fb923c';" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1';" title="اس مہینے کی رقم وصول کرنے کے لیے کلک کریں">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                            <span style="font-weight:bold; font-size:0.95rem; color:#64748b;">${m.name}</span>
                                            <span style="color:#94a3b8; font-size:0.8rem;">—</span>
                                        </div>
                                        <div style="font-size:0.85rem; color:#94a3b8; margin:4px 0;">
                                            غیر ادا شدہ
                                        </div>
                                        <div style="color:var(--primary); font-size:0.8rem; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:4px;">
                                            <i class="fas fa-plus-circle"></i> وصول کریں
                                        </div>
                                    </div>
                                `;
                            }
                        }).join('')}
                    </div>
                </div>

                <!-- Bottom Action Bar -->
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; background:#f8fafc; margin:-1.5rem; margin-top:0.8rem; padding:10px 1.5rem; border-top:1px solid #e2e8f0;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="width:120px; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                            <div style="width:${completionPct}%; height:100%; background:linear-gradient(90deg, #10b981, #059669); border-radius:4px;"></div>
                        </div>
                        <span style="font-size:0.85rem; color:#64748b; font-weight:bold;">${completionPct}% سالانہ ہدف</span>
                    </div>

                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <button onclick="DonorsModule.printDonorStatement('${donor.id}', ${this.selectedYear})" class="btn" style="background:#ffffff; border:1.5px solid #cbd5e1; color:#1e293b; font-size:0.88rem; font-weight:bold; padding:6px 12px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:6px;">
                            <i class="fas fa-file-invoice" style="color:#0284c7;"></i> سالانہ اسٹیٹمنٹ پرنٹ
                        </button>

                        <button onclick="DonorsModule.showDonationModal('${donor.id}')" class="btn" style="background:#059669; border:none; color:white; font-size:0.88rem; font-weight:bold; padding:6px 14px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:6px;">
                            <i class="fas fa-plus"></i> رقم وصول کریں
                        </button>

                        ${formattedWa ? `
                            <button onclick="DonorsModule.sendDonorGreeting('${donor.id}')" class="btn" style="background:#22c55e; border:none; color:white; font-size:0.88rem; font-weight:bold; padding:6px 12px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:6px;" title="واٹس ایپ پر رابطہ و دعائیہ پیغام">
                                <i class="fab fa-whatsapp"></i> پیغام
                            </button>
                        ` : ''}

                        <button onclick="DonorsModule.showDonorModal('${donor.id}')" class="btn" style="background:#ffffff; border:1.5px solid #cbd5e1; color:#475569; font-size:0.88rem; padding:6px 10px; border-radius:8px; cursor:pointer;" title="کوائف میں ترمیم">
                            <i class="fas fa-edit"></i>
                        </button>

                        <button onclick="DonorsModule.deleteDonor('${donor.id}')" class="btn" style="background:#ffffff; border:1.5px solid #fecdd3; color:#e11d48; font-size:0.88rem; padding:6px 10px; border-radius:8px; cursor:pointer;" title="ڈونر حذف کریں">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // 2. MASTER ANNUAL LEDGER SHEET (اجتماعی سالانہ شیٹ)
    renderMasterView(donors, yearDonations) {
        const months = this.getMonths();

        // Calculate column totals
        const monthTotals = months.map(m => {
            return yearDonations
                .filter(d => Number(d.monthIndex) === m.index)
                .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        });
        const grandTotal = monthTotals.reduce((a, b) => a + b, 0);

        return `
            <div class="card" style="background:white; border-radius:14px; padding:1.5rem; overflow-x:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h3 style="margin:0; color:var(--primary); font-family:'Aref Ruqaa', 'Amiri', serif; font-size:1.5rem;">
                            اجتماعی سالانہ ماسٹر شیٹ برائے مستقل معاونین (${this.selectedYear}ء)
                        </h3>
                        <p style="margin:4px 0 0 0; color:#64748b; font-size:0.95rem;">
                            تمام مستقل ڈونرز اور ان کے ۱۲ مہینوں کے عطیات کی جامع فہرست
                        </p>
                    </div>
                    <button onclick="DonorsModule.printMasterAnnualSheet(${this.selectedYear})" class="btn btn-primary" style="background:#0284c7; border:none; font-weight:bold; padding:8px 18px; border-radius:8px; display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-print"></i> ماسٹر شیٹ پرنٹ کریں (A4 Landscape)
                    </button>
                </div>

                <table class="table" style="width:100%; border-collapse:collapse; font-size:0.95rem; text-align:center;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#1e293b; border-bottom:2px solid #cbd5e1;">
                            <th style="padding:10px 8px; text-align:right;">ڈونر کا نام</th>
                            <th style="padding:10px 8px;">ماہانہ طے شدہ</th>
                            ${months.map(m => `<th style="padding:10px 4px; font-size:0.9rem;">${m.name}</th>`).join('')}
                            <th style="padding:10px 8px; background:#e0f2fe; color:#0369a1;">کل وصولی</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${donors.map(donor => {
                            const donorDons = yearDonations.filter(d => String(d.donorId) === String(donor.id) || parseInt(d.donorId) === parseInt(donor.id));
                            const donorTotal = donorDons.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

                            return `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:10px 8px; text-align:right; font-weight:bold; color:#0f172a;">
                                        ${donor.name}
                                        <div style="font-size:0.8rem; color:#64748b; font-weight:normal;">${donor.city || donor.phone || donor.donorCode || ''}</div>
                                    </td>
                                    <td style="padding:10px 8px; color:#065f46; font-weight:bold; font-family:monospace;">
                                        ${(Number(donor.monthlyPledge) || 0).toLocaleString('en-US')}
                                    </td>
                                    ${months.map(m => {
                                        const don = donorDons.find(d => Number(d.monthIndex) === m.index);
                                        if (don) {
                                            return `<td style="padding:8px 4px; background:#ecfdf5; color:#15803d; font-weight:bold; font-family:monospace; font-size:0.9rem;" title="رسید: ${don.receiptNo}">
                                                ${Number(don.amount).toLocaleString('en-US')}
                                            </td>`;
                                        } else {
                                            return `<td onclick="DonorsModule.showDonationModal('${donor.id}', ${m.index}, ${this.selectedYear})" style="padding:8px 4px; color:#cbd5e1; cursor:pointer;" title="کلک کر کے وصول کریں">—</td>`;
                                        }
                                    }).join('')}
                                    <td style="padding:10px 8px; background:#f0f9ff; color:#0369a1; font-weight:bold; font-family:monospace; font-size:1.05rem;">
                                        ${donorTotal.toLocaleString('en-US')}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background:#e2e8f0; font-weight:bold; color:#0f172a; border-top:2px solid #94a3b8;">
                            <td style="padding:12px 8px; text-align:right;">میزانِ کل (Grand Total)</td>
                            <td style="padding:12px 8px; color:#065f46; font-family:monospace;">${donors.reduce((sum, d) => sum + (Number(d.monthlyPledge) || 0), 0).toLocaleString('en-US')}</td>
                            ${monthTotals.map(amt => `<td style="padding:12px 4px; font-family:monospace; color:#0f172a;">${amt > 0 ? amt.toLocaleString('en-US') : '0'}</td>`).join('')}
                            <td style="padding:12px 8px; background:#0284c7; color:white; font-family:monospace; font-size:1.15rem;">
                                Rs. ${grandTotal.toLocaleString('en-US')}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    },

    // 3. HISTORY OF ALL DONATIONS & RECEIPTS
    renderHistoryView(donations, donors) {
        if (!donations || donations.length === 0) {
            return `
                <div class="card" style="text-align:center; padding:3.5rem 2rem; background:white; border-radius:14px;">
                    <div style="font-size:3.5rem; color:#cbd5e1; margin-bottom:1rem;"><i class="fas fa-receipt"></i></div>
                    <h3 style="color:#475569;">ابھی تک کوئی رسید یا عطیہ درج نہیں ہوا</h3>
                    <p style="color:#94a3b8;">پہلا عطیہ درج کرنے کے لیے اوپر "رقم وصول کریں" بٹن دبائیں۔</p>
                </div>
            `;
        }

        // Map donors for quick name lookup
        const donorMap = {};
        donors.forEach(d => { donorMap[d.id] = d; });

        const sorted = [...donations].sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));

        return `
            <div class="card" style="background:white; border-radius:14px; padding:1.5rem; overflow-x:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h3 style="margin:0; color:var(--primary); font-family:'Aref Ruqaa', 'Amiri', serif; font-size:1.5rem;">
                            جملہ رسیدات و وصول شدہ عطیات کی تاریخچہ
                        </h3>
                        <p style="margin:4px 0 0 0; color:#64748b; font-size:0.95rem;">
                            کل وصول شدہ رسیدیں: ${donations.length} | مجموعی وصولی: Rs. ${donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0).toLocaleString('en-US')}
                        </p>
                    </div>
                </div>

                <table class="table" style="width:100%; border-collapse:collapse; font-size:0.95rem;">
                    <thead>
                        <tr style="background:#f1f5f9; color:#1e293b; border-bottom:2px solid #cbd5e1;">
                            <th style="padding:10px 12px; text-align:right;">رسید نمبر</th>
                            <th style="padding:10px 12px; text-align:right;">تاریخ</th>
                            <th style="padding:10px 12px; text-align:right;">نامِ معاون (ڈونر)</th>
                            <th style="padding:10px 12px; text-align:right;">بابت ماہ و سال</th>
                            <th style="padding:10px 12px; text-align:right;">مد / فنڈ</th>
                            <th style="padding:10px 12px; text-align:right;">طریقہ ادائیگی</th>
                            <th style="padding:10px 12px; text-align:center;">رقم</th>
                            <th style="padding:10px 12px; text-align:center;">ایکشنز</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(d => {
                            const donor = donorMap[d.donorId] || { name: d.donorName || 'معاون' };
                            const formattedWa = this.formatWhatsAppNumber(donor.whatsapp || donor.phone);

                            return `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:10px 12px; font-weight:bold; font-family:monospace; color:#0369a1;">
                                        ${d.receiptNo || ('DNR-' + d.id)}
                                    </td>
                                    <td style="padding:10px 12px; color:#475569;">
                                        ${d.paymentDate ? d.paymentDate.split('-').reverse().join('/') : '---'}
                                    </td>
                                    <td style="padding:10px 12px; font-weight:bold; color:#0f172a;">
                                        ${donor.name} ${donor.fatherName ? `<small style="color:#64748b; font-weight:normal;">(${donor.fatherName})</small>` : ''}
                                    </td>
                                    <td style="padding:10px 12px; color:#065f46; font-weight:bold;">
                                        ${d.monthName || this.getMonthName(d.monthIndex)} ${d.year}ء
                                    </td>
                                    <td style="padding:10px 12px; color:#64748b;">
                                        <span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:6px; font-size:0.8rem; font-weight:bold;">
                                             ${d.fundType || 'عام عطیہ'}
                                        </span>
                                    </td>
                                    <td style="padding:10px 12px; color:#475569;">
                                        ${d.paymentMethod || 'نقد'}
                                    </td>
                                    <td style="padding:10px 12px; text-align:center; font-weight:bold; font-family:monospace; color:#15803d; font-size:1.05rem;">
                                        Rs. ${Number(d.amount).toLocaleString('en-US')}
                                    </td>
                                    <td style="padding:10px 12px; text-align:center;">
                                        <div style="display:inline-flex; gap:6px;">
                                            <button onclick="DonorsModule.printDonationReceipt('${d.id}')" class="btn" style="background:#0284c7; color:white; border:none; padding:4px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" title="رسید پرنٹ / PDF">
                                                <i class="fas fa-print"></i> رسید
                                            </button>
                                            <button onclick="DonorsModule.downloadDonationReceipt('${d.id}')" class="btn" style="background:#059669; color:white; border:none; padding:4px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" title="رسید تصویر ڈاؤن لوڈ کریں">
                                                <i class="fas fa-download"></i> ڈاؤن لوڈ
                                            </button>
                                            ${formattedWa ? `
                                                <button onclick="DonorsModule.shareReceiptWhatsApp('${d.id}')" class="btn" style="background:#22c55e; color:white; border:none; padding:4px 10px; border-radius:6px; font-size:0.85rem; cursor:pointer;" title="واٹس ایپ پر رسید بھیجیں">
                                                    <i class="fab fa-whatsapp"></i>
                                                </button>
                                            ` : ''}
                                            <button onclick="DonorsModule.deleteDonation('${d.id}')" class="btn" style="background:#fee2e2; color:#b91c1c; border:none; padding:4px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" title="رسید منسوخ / حذف کریں">
                                                <i class="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // Navigation & State Helpers
    switchTab(tab) {
        this.activeTab = tab;
        this.selectedDonorDetailsId = null;
        this.render();
    },

    viewDonorDetails(donorId) {
        this.selectedDonorDetailsId = donorId;
        this.activeTab = 'list';
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    closeDonorDetails() {
        this.selectedDonorDetailsId = null;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    changeYear(yr) {
        this.selectedYear = parseInt(yr);
        this.render();
    },

    toggleCalendarType() {
        this.calendarType = this.calendarType === 'hijri' ? 'gregorian' : 'hijri';
        this.render();
    },

    onSearch(val) {
        this.searchQuery = val;
        this.render();
    },

    onCategoryFilter(val) {
        this.filterCategory = val;
        this.render();
    },

    onStatusFilter(val) {
        this.filterStatus = val;
        this.render();
    },

    // ==========================================
    // --- MODALS & FORMS ---
    // ==========================================

    // 1. ADD / EDIT DONOR MODAL
    async showDonorModal(donorId = null) {
        let donor = null;
        if (donorId) {
            donor = await MadrassahDB.getDonorById(donorId);
        }

        const isEdit = !!donor;
        const modalId = 'donor-form-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const modalHtml = `
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:1rem;">
                <div style="background:white; border-radius:18px; width:100%; max-width:650px; max-height:92vh; overflow-y:auto; box-shadow:0 20px 40px rgba(0,0,0,0.3); border:2px solid var(--primary);">
                    <!-- Modal Header -->
                    <div style="background:linear-gradient(135deg, #065f46, #047857); color:white; padding:1.2rem 1.6rem; border-radius:16px 16px 0 0; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-hand-holding-heart" style="font-size:1.4rem; color:#fef08a;"></i>
                            <h3 style="margin:0; font-family:'Aref Ruqaa', 'Amiri', serif; font-size:1.5rem;">
                                ${isEdit ? 'مستقل ڈونر کے کوائف میں ترمیم' : 'نیا مستقل ڈونر رجسٹر کریں'}
                            </h3>
                        </div>
                        <button type="button" onclick="document.getElementById('${modalId}').remove()" style="background:none; border:none; color:white; font-size:1.4rem; cursor:pointer;"><i class="fas fa-times"></i></button>
                    </div>

                    <!-- Modal Body -->
                    <form id="donor-form" onsubmit="DonorsModule.saveDonorForm(event)" style="padding:1.6rem;">
                        ${isEdit ? `<input type="hidden" name="id" value="${donor.id}">` : ''}
                        <input type="hidden" name="donorCode" value="${isEdit && donor.donorCode ? donor.donorCode : ''}">

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">نامِ معاون (ڈونر کا نام) <span style="color:#e11d48;">*</span></label>
                                <input type="text" name="name" required value="${isEdit ? donor.name : ''}" placeholder="مثلاً: حاجی محمد افضل صاحب" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">ولدیت / سرپرست</label>
                                <input type="text" name="fatherName" value="${isEdit && donor.fatherName ? donor.fatherName : ''}" placeholder="مثلاً: عبد الغفور مرحوم" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">موبائل / فون نمبر <span style="color:#e11d48;">*</span></label>
                                <input type="text" name="phone" required value="${isEdit ? donor.phone : ''}" placeholder="مثلاً: 03001234567" dir="ltr" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; text-align:right;">
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#16a34a;"><i class="fab fa-whatsapp"></i> واٹس ایپ نمبر (برائے رسید ترسیل)</label>
                                <input type="text" name="whatsapp" value="${isEdit && donor.whatsapp ? donor.whatsapp : (isEdit ? donor.phone : '')}" placeholder="مثلاً: 03001234567" dir="ltr" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #86efac; font-size:1rem; text-align:right; background:#f0fdf4;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">طے شدہ ماہانہ تعاون (رقم) <span style="color:#e11d48;">*</span></label>
                                <input type="number" name="monthlyPledge" required min="1" step="any" value="${isEdit ? donor.monthlyPledge : '5000'}" placeholder="مثلاً: 5000" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1.1rem; font-weight:bold; color:#065f46;">
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">مد / فنڈ کی قسم</label>
                                <select name="fundType" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white;">
                                    <option value="عام عطیہ / امداد" ${isEdit && donor.fundType === 'عام عطیہ / امداد' ? 'selected' : ''}>عام عطیہ / امداد</option>
                                    <option value="زکوٰۃ" ${isEdit && donor.fundType === 'زکوٰۃ' ? 'selected' : ''}>زکوٰۃ</option>
                                    <option value="صدقات" ${isEdit && donor.fundType === 'صدقات' ? 'selected' : ''}>صدقات</option>
                                    <option value="کفالت طلبہ (خوراک و کتب)" ${isEdit && donor.fundType === 'کفالت طلبہ (خوراک و کتب)' ? 'selected' : ''}>کفالت طلبہ (خوراک و کتب)</option>
                                    <option value="تعمیراتی فنڈ" ${isEdit && donor.fundType === 'تعمیراتی فنڈ' ? 'selected' : ''}>تعمیراتی فنڈ</option>
                                </select>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">شہر / علاقہ</label>
                                <input type="text" name="city" value="${isEdit && donor.city ? donor.city : ''}" placeholder="مثلاً: خانیوال، ملتان، لاہور وغیرہ" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">ادائیگی کا ترجیحی طریقہ</label>
                                <select name="paymentMethod" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white;">
                                    <option value="نقد (Cash)" ${isEdit && donor.paymentMethod === 'نقد (Cash)' ? 'selected' : ''}>نقد (Cash)</option>
                                    <option value="بینک ٹرانسفر (Bank)" ${isEdit && donor.paymentMethod === 'بینک ٹرانسفر (Bank)' ? 'selected' : ''}>بینک ٹرانسفر (Bank)</option>
                                    <option value="جاز کیش (JazzCash)" ${isEdit && donor.paymentMethod === 'جاز کیش (JazzCash)' ? 'selected' : ''}>جاز کیش (JazzCash)</option>
                                    <option value="ایزی پیسہ (EasyPaisa)" ${isEdit && donor.paymentMethod === 'ایزی پیسہ (EasyPaisa)' ? 'selected' : ''}>ایزی پیسہ (EasyPaisa)</option>
                                    <option value="چیک (Cheque)" ${isEdit && donor.paymentMethod === 'چیک (Cheque)' ? 'selected' : ''}>چیک (Cheque)</option>
                                </select>
                            </div>
                        </div>

                        <div style="margin-bottom:1rem;">
                            <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">مکمل پتہ</label>
                            <input type="text" name="address" value="${isEdit && donor.address ? donor.address : ''}" placeholder="گھر / دکان کا مکمل پتہ یا محلہ" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                        </div>

                        <div style="margin-bottom:1rem;">
                            <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">بینک تفصیلات (اگر ڈونر بینک سے رقم بھیجتے ہوں)</label>
                            <input type="text" name="bankDetails" value="${isEdit && donor.bankDetails ? donor.bankDetails : ''}" placeholder="بینک کا نام، اکاؤنٹ ٹائٹل وغیرہ" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.95rem;">
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">حیثیت (اسٹیٹس)</label>
                                <select name="status" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white;">
                                    <option value="active" ${!isEdit || donor.status !== 'inactive' ? 'selected' : ''}>فعال (Active)</option>
                                    <option value="inactive" ${isEdit && donor.status === 'inactive' ? 'selected' : ''}>غیر فعال (Inactive)</option>
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">خصوصی ہدایات / نوٹس</label>
                                <input type="text" name="notes" value="${isEdit && donor.notes ? donor.notes : ''}" placeholder="کوئی خاص یاد دہانی وغیرہ" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.95rem;">
                            </div>
                        </div>

                        <!-- Submit Buttons -->
                        <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #e2e8f0; padding-top:1.2rem;">
                            <button type="button" onclick="document.getElementById('${modalId}').remove()" class="btn" style="background:#f1f5f9; color:#475569; font-weight:bold; border-radius:8px; padding:10px 20px; border:none; cursor:pointer;">
                                منسوخ کریں
                            </button>
                            <button type="submit" class="btn btn-primary" style="background:var(--primary); font-weight:bold; border-radius:8px; padding:10px 24px; border:none; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-save"></i> ${isEdit ? 'تبدیلیاں محفوظ کریں' : 'ڈونر محفوظ کریں'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    async saveDonorForm(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (data.id && String(data.id).trim() !== '' && !isNaN(data.id) && parseInt(data.id) > 0) {
            data.id = parseInt(data.id);
        } else {
            delete data.id;
        }
        data.monthlyPledge = parseFloat(data.monthlyPledge) || 0;

        try {
            await MadrassahDB.saveDonor(data);
            const modal = document.getElementById('donor-form-modal');
            if (modal) modal.remove();
            this.render();
        } catch (err) {
            console.error('Error saving donor:', err);
            alert('ڈونر محفوظ کرنے میں غلطی پیش آئی: ' + err.message);
        }
    },

    async deleteDonor(id) {
        const donor = await MadrassahDB.getDonorById(id);
        if (!donor) return;

        if (!confirm(`کیا آپ واقعی ڈونر "${donor.name}" کو حذف کرنا چاہتے ہیں؟\nنوٹ: سابقہ رسیدیں ریکارڈ میں برقرار رہیں گی۔`)) {
            return;
        }

        try {
            await MadrassahDB.deleteDonor(id);
            this.render();
        } catch (err) {
            alert('ڈونر حذف کرنے میں غلطی پیش آئی: ' + err.message);
        }
    },

    // 2. DONATION PAYMENT ENTRY MODAL
    async showDonationModal(preSelectDonorId = null, preSelectMonthIdx = null, preSelectYear = null) {
        const donors = (await MadrassahDB.getAllDonors()) || [];
        if (donors.length === 0) {
            alert('پہلے کم از کم ایک مستقل ڈونر رجسٹر فرمائیں!');
            this.showDonorModal();
            return;
        }

        // Safe donor lookup
        let currentDonor = null;
        if (preSelectDonorId !== null && preSelectDonorId !== undefined && String(preSelectDonorId).trim() !== '') {
            currentDonor = donors.find(d => String(d.id) === String(preSelectDonorId) || parseInt(d.id) === parseInt(preSelectDonorId));
        }
        if (!currentDonor) {
            currentDonor = donors[0];
        }
        const selectedDonorId = currentDonor.id;

        const selectedMonth = (preSelectMonthIdx !== null && preSelectMonthIdx !== undefined && !isNaN(preSelectMonthIdx)) ? parseInt(preSelectMonthIdx) : new Date().getMonth();
        const selectedYr = (preSelectYear && !isNaN(preSelectYear)) ? parseInt(preSelectYear) : this.selectedYear;

        const defaultAmount = currentDonor.monthlyPledge || 5000;
        const defaultFund = currentDonor.fundType || 'عام عطیہ / امداد';

        const modalId = 'donation-entry-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const months = this.getMonths();
        const todayStr = new Date().toISOString().split('T')[0];

        const modalHtml = `
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:1rem;">
                <div style="background:white; border-radius:18px; width:100%; max-width:620px; max-height:92vh; overflow-y:auto; box-shadow:0 20px 40px rgba(0,0,0,0.3); border:2px solid #059669;">
                    <!-- Modal Header -->
                    <div style="background:linear-gradient(135deg, #059669, #047857); color:white; padding:1.2rem 1.6rem; border-radius:16px 16px 0 0; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-hand-holding-dollar" style="font-size:1.5rem; color:#fef08a;"></i>
                            <h3 style="margin:0; font-family:'Aref Ruqaa', 'Amiri', serif; font-size:1.5rem;">
                                ماہانہ عطیہ وصولی و فوری رسید کا اجراء
                            </h3>
                        </div>
                        <button type="button" onclick="document.getElementById('${modalId}').remove()" style="background:none; border:none; color:white; font-size:1.4rem; cursor:pointer;"><i class="fas fa-times"></i></button>
                    </div>

                    <!-- Modal Body -->
                    <form id="donation-entry-form" onsubmit="DonorsModule.saveDonationForm(event)" style="padding:1.6rem;">
                        <!-- Donor Selection -->
                        <div style="margin-bottom:1.2rem;">
                            <label style="display:block; font-weight:bold; margin-bottom:5px; color:#1e293b;">مستقل ڈونر کا انتخاب فرمائیں <span style="color:#e11d48;">*</span></label>
                            <select name="donorId" id="don_select_donor" required onchange="DonorsModule.onModalDonorChange(this.value)" style="width:100%; padding:11px; border-radius:8px; border:2px solid #a7f3d0; font-size:1.05rem; font-weight:bold; color:#065f46; background:#ecfdf5;">
                                ${donors.map(d => `
                                    <option value="${d.id}" ${String(d.id) === String(selectedDonorId) ? 'selected' : ''} data-pledge="${d.monthlyPledge || 0}" data-fund="${d.fundType || 'عام عطیہ / امداد'}" data-phone="${d.phone || ''}" data-wa="${d.whatsapp || ''}">
                                        ${d.name} ${d.fatherName ? `ولد ${d.fatherName}` : ''} [${d.donorCode || ('DNR-' + d.id)}] — طے شدہ: Rs. ${(Number(d.monthlyPledge) || 0).toLocaleString('en-US')}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Year and Month -->
                        <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:1rem; margin-bottom:1.2rem;">
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">بابت ماہ (Month) <span style="color:#e11d48;">*</span></label>
                                <select name="monthIndex" id="don_select_month" required style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white; font-weight:bold; color:#0f172a;">
                                    ${months.map(m => `
                                        <option value="${m.index}" ${m.index === selectedMonth ? 'selected' : ''}>${m.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">سال (Year) <span style="color:#e11d48;">*</span></label>
                                <input type="number" name="year" id="don_select_year" required value="${selectedYr}" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1.05rem; font-weight:bold; color:#0f172a;">
                            </div>
                        </div>

                        <!-- Amount and Date -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.2rem;">
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#065f46;">وصول شدہ رقم (PKR) <span style="color:#e11d48;">*</span></label>
                                <input type="number" name="amount" id="don_input_amount" required min="1" step="any" value="${defaultAmount}" placeholder="مثلاً: 5000" style="width:100%; padding:10px; border-radius:8px; border:2px solid #86efac; font-size:1.3rem; font-weight:bold; color:#15803d; background:#f0fdf4;">
                                <small style="display:block; color:#64748b; margin-top:3px; font-size:0.82rem;">(طے شدہ سے کم یا زیادہ کوئی بھی رقم آزادانہ درج کی جا سکتی ہے)</small>
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">تاریخِ وصولی <span style="color:#e11d48;">*</span></label>
                                <input type="date" name="paymentDate" required value="${todayStr}" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem;">
                            </div>
                        </div>

                        <!-- Fund Type & Payment Method -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.2rem;">
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">مد / فنڈ کی قسم</label>
                                <select name="fundType" id="don_select_fund" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white;">
                                    <option value="عام عطیہ / امداد" ${defaultFund === 'عام عطیہ / امداد' ? 'selected' : ''}>عام عطیہ / امداد</option>
                                    <option value="زکوٰۃ" ${defaultFund === 'زکوٰۃ' ? 'selected' : ''}>زکوٰۃ</option>
                                    <option value="صدقات" ${defaultFund === 'صدقات' ? 'selected' : ''}>صدقات</option>
                                    <option value="کفالت طلبہ (خوراک و کتب)" ${defaultFund === 'کفالت طلبہ (خوراک و کتب)' ? 'selected' : ''}>کفالت طلبہ (خوراک و کتب)</option>
                                    <option value="تعمیراتی فنڈ" ${defaultFund === 'تعمیراتی فنڈ' ? 'selected' : ''}>تعمیراتی فنڈ</option>
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">طریقہ ادائیگی</label>
                                <select name="paymentMethod" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:1rem; background:white;">
                                    <option value="نقد (Cash)">نقد (Cash)</option>
                                    <option value="بینک ٹرانسفر (Bank)">بینک ٹرانسفر (Bank)</option>
                                    <option value="جاز کیش (JazzCash)">جاز کیش (JazzCash)</option>
                                    <option value="ایزی پیسہ (EasyPaisa)">ایزی پیسہ (EasyPaisa)</option>
                                    <option value="چیک (Cheque)">چیک (Cheque)</option>
                                </select>
                            </div>
                        </div>

                        <!-- TRx ID & Received By -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.2rem;">
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">بینک حوالہ / ٹرانزیکشن آئی ڈی (اختیاری)</label>
                                <input type="text" name="transactionId" placeholder="مثلاً: TRx-94821038" dir="ltr" style="width:100%; padding:9px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.95rem; text-align:right;">
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; margin-bottom:4px; color:#1e293b;">وصول کنندہ</label>
                                <input type="text" name="receivedBy" value="ناظم مالیات" placeholder="دستخط یا نام" style="width:100%; padding:9px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.95rem;">
                            </div>
                        </div>

                        <!-- Bait-ul-Maal Auto Sync -->
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px; margin-bottom:1.5rem; display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" name="syncToAccounts" id="syncToAccountsCheck" checked style="width:18px; height:18px; cursor:pointer;">
                            <label for="syncToAccountsCheck" style="font-size:0.95rem; color:#1e293b; cursor:pointer; font-weight:bold;">
                                بیت المال (مرکزی اکاؤنٹ) میں خودکار آمدن درج کریں
                                <small style="display:block; color:#64748b; font-weight:normal;">اس سے مدرسہ کے کیش بیلنس میں یہ رقم خود بخود جمع ہو جائے گی۔</small>
                            </label>
                        </div>

                        <!-- Action Buttons -->
                        <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #e2e8f0; padding-top:1.2rem;">
                            <button type="button" onclick="document.getElementById('${modalId}').remove()" class="btn" style="background:#f1f5f9; color:#475569; font-weight:bold; border-radius:8px; padding:10px 20px; border:none; cursor:pointer;">
                                منسوخ کریں
                            </button>
                            <button type="submit" class="btn btn-primary" style="background:#059669; font-weight:bold; border-radius:8px; padding:10px 24px; border:none; cursor:pointer; display:flex; align-items:center; gap:8px; font-size:1.05rem; box-shadow:0 4px 12px rgba(5,150,105,0.25);">
                                <i class="fas fa-receipt"></i> رقم محفوظ کریں اور رسید نکالیں
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    onModalDonorChange(donorId) {
        const select = document.getElementById('don_select_donor');
        if (!select) return;
        const opt = select.options[select.selectedIndex];
        if (!opt) return;

        const pledge = opt.getAttribute('data-pledge');
        const fund = opt.getAttribute('data-fund');

        const amountInput = document.getElementById('don_input_amount');
        if (amountInput && pledge) amountInput.value = pledge;

        const fundSelect = document.getElementById('don_select_fund');
        if (fundSelect && fund) fundSelect.value = fund;
    },

    async saveDonationForm(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (data.donorId && !isNaN(data.donorId)) {
            data.donorId = parseInt(data.donorId);
        }
        data.monthIndex = parseInt(data.monthIndex);
        data.year = parseInt(data.year);
        data.amount = parseFloat(data.amount) || 0;
        data.syncToAccounts = !!data.syncToAccounts;

        const donor = await MadrassahDB.getDonorById(data.donorId);
        if (!donor) {
            alert('منتخب ڈونر کا ریکارڈ نہیں مل سکا!');
            return;
        }

        data.donorName = donor.name;
        data.donorCode = donor.donorCode;
        data.monthName = this.getMonthName(data.monthIndex);

        // Generate receipt number
        data.receiptNo = 'DNR-' + data.year + '-' + Math.floor(10000 + Math.random() * 90000);

        try {
            // Save Donation
            const donationId = await MadrassahDB.saveDonorDonation(data);
            data.id = donationId;

            // Sync with Accounts (Bait-ul-Maal)
            if (data.syncToAccounts) {
                try {
                    await MadrassahDB.saveTransaction({
                        type: 'Income',
                        category: data.fundType || 'عطیات و صدقات',
                        amount: data.amount,
                        name: donor.name,
                        phone: donor.phone || '',
                        address: donor.address || donor.city || '',
                        date: new Date(data.paymentDate || Date.now()).getTime(),
                        receiptNo: data.receiptNo,
                        description: `ماہانہ معاونت بابت ماہ ${data.monthName} ${data.year}ء [طریقہ: ${data.paymentMethod || 'نقد'}] (مستقل ڈونر: ${donor.donorCode || ''})`
                    });
                } catch (accErr) {
                    console.warn('Could not auto-sync transaction to accounts:', accErr);
                }
            }

            // Close Entry Modal
            const entryModal = document.getElementById('donation-entry-modal');
            if (entryModal) entryModal.remove();

            // Refresh underlying view
            this.render();

            // OPEN INSTANT RECEIPT MODAL
            this.showInstantReceiptModal(data, donor);

        } catch (err) {
            console.error('Error saving donation:', err);
            alert('عطیہ محفوظ کرنے میں غلطی پیش آئی: ' + err.message);
        }
    },

    async deleteDonation(id) {
        if (!confirm('کیا آپ واقعی یہ رسید حذف کرنا چاہتے ہیں؟')) return;
        try {
            await MadrassahDB.deleteDonorDonation(id);
            this.render();
        } catch (err) {
            alert('رسید حذف کرنے میں غلطی: ' + err.message);
        }
    },

    // ==========================================
    // --- INSTANT RECEIPT & WHATSAPP MODAL ---
    // ==========================================
    showInstantReceiptModal(donation, donor) {
        const modalId = 'instant-receipt-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const amountWords = (window.app && typeof window.app.numberToUrduWords === 'function') 
            ? window.app.numberToUrduWords(donation.amount) 
            : `${donation.amount} روپے`;

        const formattedWa = this.formatWhatsAppNumber(donor.whatsapp || donor.phone);

        const modalHtml = `
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px); padding:1rem;">
                <div style="background:white; border-radius:20px; width:100%; max-width:540px; box-shadow:0 25px 50px rgba(0,0,0,0.35); border:2.5px solid #059669; overflow:hidden; text-align:center;">
                    <!-- Top Green Banner -->
                    <div style="background:linear-gradient(135deg, #064e3b, #059669); color:white; padding:1.8rem 1.5rem; position:relative;">
                        <div style="width:64px; height:64px; background:#ecfdf5; color:#059669; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:2rem; margin-bottom:0.6rem; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                            <i class="fas fa-check"></i>
                        </div>
                        <h2 style="margin:0; font-family:'Aref Ruqaa', 'Amiri', serif; font-size:1.8rem; color:#ffffff;">
                            بحمداللہ! رقم کامیابی سے وصول ہو گئی
                        </h2>
                        <p style="margin:4px 0 0 0; color:#a7f3d0; font-size:0.95rem;">
                            رسید کا باضابطہ اندراج اور کھاتہ اپ ڈیٹ ہو چکا ہے
                        </p>
                    </div>

                    <!-- Receipt Preview Card -->
                    <div style="padding:1.5rem; background:#f8fafc;">
                        <div style="background:white; border:1.5px dashed #cbd5e1; border-radius:12px; padding:1.2rem; text-align:right; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:8px; margin-bottom:8px;">
                                <span style="font-size:0.9rem; color:#64748b;">رسید نمبر:</span>
                                <span style="font-weight:bold; font-family:monospace; color:#0369a1; font-size:1.05rem;">${donation.receiptNo}</span>
                            </div>

                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                <span style="font-size:0.9rem; color:#64748b;">نامِ معاون:</span>
                                <span style="font-weight:bold; color:#0f172a;">${donor.name}</span>
                            </div>

                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                <span style="font-size:0.9rem; color:#64748b;">بمد:</span>
                                <span style="font-weight:bold; color:#065f46;">${donation.fundType || 'عام عطیہ'}</span>
                            </div>

                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                <span style="font-size:0.9rem; color:#64748b;">وصول شدہ رقم:</span>
                                <span style="font-weight:bold; color:#15803d; font-size:1.25rem; font-family:monospace;">Rs. ${Number(donation.amount).toLocaleString('en-US')}</span>
                            </div>

                            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #e2e8f0; padding-top:6px; margin-top:6px; font-size:0.85rem;">
                                <span style="color:#64748b;">مبلغ:</span>
                                <span style="font-weight:bold; color:#334155;">${amountWords}</span>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div style="margin-top:1.4rem; display:flex; flex-direction:column; gap:10px;">
                            <button onclick="DonorsModule.printDonationReceipt('${donation.id}')" class="btn" style="background:#0284c7; color:white; font-size:1.1rem; font-weight:bold; padding:12px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(2,132,199,0.3);">
                                <i class="fas fa-print"></i> باضابطہ رسید پرنٹ / PDF (Print / Save PDF)
                            </button>
                            <button onclick="DonorsModule.downloadDonationReceipt('${donation.id}')" class="btn" style="background:#059669; color:white; font-size:1.05rem; font-weight:bold; padding:12px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(5,150,105,0.3);">
                                <i class="fas fa-file-arrow-down"></i> رسید کی تصویر ڈاؤن لوڈ کریں (Download PNG Image)
                            </button>

                            ${formattedWa ? `
                                <button onclick="DonorsModule.shareReceiptWhatsApp('${donation.id}')" class="btn" style="background:#16a34a; color:white; font-size:1.05rem; font-weight:bold; padding:11px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(22,163,74,0.3);">
                                    <i class="fab fa-whatsapp" style="font-size:1.25rem;"></i> واٹس ایپ پر رسید و شکریہ کا میسج بھیجیں
                                </button>
                            ` : `
                                <div style="font-size:0.85rem; color:#64748b; background:#f1f5f9; padding:6px; border-radius:6px;">
                                    ڈونر کا واٹس ایپ نمبر موجود نہیں ہے (کوائف میں واٹس ایپ نمبر شامل فرما لیں)
                                </div>
                            `}

                            <button type="button" onclick="document.getElementById('${modalId}').remove()" class="btn" style="background:#e2e8f0; color:#475569; font-weight:bold; padding:9px; border-radius:8px; border:none; cursor:pointer;">
                                بند کریں (Close)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // ==========================================
    // --- RECEIPT PRINTING & WHATSAPP SHARING ---
    // ==========================================

    async downloadDonationReceipt(donationId) {
        if (window.app && typeof window.app.hasReceiptTemplate === 'function' && !window.app.hasReceiptTemplate()) {
            alert('توجہ فرمائیں! پرانی ڈیفالٹ رسید ختم کر دی گئی ہے۔ رسید ڈاؤنلوڈ یا پرنٹ کرنے کے لیے پہلے "سیٹنگز" (Settings) میں جا کر اپنی باضابطہ رسید اپلوڈ فرمائیں۔');
            if (window.app && typeof window.app.navigate === 'function') {
                window.app.navigate('settings');
            }
            return;
        }

        const donations = await MadrassahDB.getAllDonorDonations();
        const d = donations.find(item => String(item.id) === String(donationId) || parseInt(item.id) === parseInt(donationId));
        if (!d) {
            alert('رسید کا ریکارڈ نہیں مل سکا!');
            return;
        }

        const donor = await MadrassahDB.getDonorById(d.donorId);
        const donorName = donor ? donor.name : (d.donorName || 'معاون محترم');
        const payee = donorName;
        const address = donor ? [donor.address, donor.city].filter(Boolean).join('، ') : '';
        const purpose = d.fundType || 'عطیات / صدقات';

        const amountWords = (window.app && typeof window.app.numberToUrduWords === 'function') 
            ? window.app.numberToUrduWords(d.amount) 
            : `${d.amount} روپے صرف`;

        if (window.app && typeof window.app.downloadReceiptImageDirect === 'function') {
            await window.app.downloadReceiptImageDirect({
                receiptTitle: 'رسیدِ عطیہ برائے مستقل معاونین (Permanent Donor Receipt)',
                receiptNo: d.receiptNo || ('DNR-' + d.id),
                bookNo: '1',
                amount: d.amount,
                amountInWords: amountWords,
                payeeName: payee,
                address: address,
                onAccountOf: purpose,
                dateStr: d.paymentDate || d.createdAt || Date.now(),
                receivedBy: d.receivedBy || 'ناظم مالیات / خازن'
            });
        } else {
            this.printDonationReceipt(donationId);
        }
    },

    async printDonationReceipt(donationId) {
        if (window.app && typeof window.app.hasReceiptTemplate === 'function' && !window.app.hasReceiptTemplate()) {
            alert('توجہ فرمائیں! پرانی ڈیفالٹ رسید ختم کر دی گئی ہے۔ رسید ڈاؤنلوڈ یا پرنٹ کرنے کے لیے پہلے "سیٹنگز" (Settings) میں جا کر اپنی باضابطہ رسید اپلوڈ فرمائیں۔');
            if (window.app && typeof window.app.navigate === 'function') {
                window.app.navigate('settings');
            }
            return;
        }

        const donations = await MadrassahDB.getAllDonorDonations();
        const d = donations.find(item => String(item.id) === String(donationId) || parseInt(item.id) === parseInt(donationId));
        if (!d) {
            alert('رسید کا ریکارڈ نہیں مل سکا!');
            return;
        }

        const donor = await MadrassahDB.getDonorById(d.donorId);
        const donorName = donor ? donor.name : (d.donorName || 'معاون محترم');
        const payee = donorName;
        const address = donor ? [donor.address, donor.city].filter(Boolean).join('، ') : '';
        const purpose = d.fundType || 'عطیات / صدقات';

        const amountWords = (window.app && typeof window.app.numberToUrduWords === 'function') 
            ? window.app.numberToUrduWords(d.amount) 
            : `${d.amount} روپے صرف`;

        if (window.app && typeof window.app.openReceiptWindow === 'function') {
            window.app.openReceiptWindow({
                receiptTitle: 'رسیدِ عطیہ برائے مستقل معاونین (Permanent Donor Receipt)',
                receiptNo: d.receiptNo || ('DNR-' + d.id),
                bookNo: '1',
                amount: d.amount,
                amountInWords: amountWords,
                payeeName: payee,
                address: address,
                onAccountOf: purpose,
                dateStr: d.paymentDate || d.createdAt || Date.now(),
                receivedBy: d.receivedBy || 'ناظم مالیات / خازن'
            });
        } else if (window.app && typeof window.app.generateOfficialReceiptHtml === 'function') {
            const html = window.app.generateOfficialReceiptHtml({
                receiptTitle: 'رسیدِ عطیہ برائے مستقل معاونین (Permanent Donor Receipt)',
                receiptNo: d.receiptNo || ('DNR-' + d.id),
                bookNo: '1',
                amount: d.amount,
                amountInWords: amountWords,
                payeeName: payee,
                address: address,
                onAccountOf: purpose,
                dateStr: d.paymentDate || d.createdAt || Date.now(),
                receivedBy: d.receivedBy || 'ناظم مالیات / خازن'
            });
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
            }
        } else {
            alert('رسید جنریٹر فنکشن دستیاب نہیں ہو سکا۔');
        }
    },

    async shareReceiptWhatsApp(donationId) {
        const donations = await MadrassahDB.getAllDonorDonations();
        const d = donations.find(item => String(item.id) === String(donationId) || parseInt(item.id) === parseInt(donationId));
        if (!d) {
            alert('رسید کا ریکارڈ نہیں مل سکا!');
            return;
        }

        const donor = await MadrassahDB.getDonorById(d.donorId);
        if (!donor) {
            alert('ڈونر کا ریکارڈ نہیں مل سکا!');
            return;
        }

        const phone = donor.whatsapp || donor.phone;
        if (!phone) {
            alert('اس ڈونر کا کوئی موبائل یا واٹس ایپ نمبر درج نہیں ہے!');
            return;
        }

        const monthName = d.monthName || this.getMonthName(d.monthIndex);
        const amountWords = (window.app && typeof window.app.numberToUrduWords === 'function') 
            ? window.app.numberToUrduWords(d.amount) 
            : `${d.amount} روپے صرف`;

        const dateStr = d.paymentDate ? d.paymentDate.split('-').reverse().join('/') : new Date().toLocaleDateString('ur-PK');

        const message = 
`السلام علیکم ورحمۃ اللہ وبرکاتہ!
محترم *${donor.name}* صاحب!

مدرسہ عبد الرحمن بن عوف غفوریہ کی طرف سے آپ کا بے حد شکریہ۔
بحمداللہ آپ کا ماہانہ تعاون وصول پا گیا ہے، تفصیل درج ذیل ہے:

📋 *رسید نمبر:* ${d.receiptNo}
📅 *تاریخ:* ${dateStr}
🌙 *بابت:* ماہ ${monthName} ${d.year}ء
💰 *رقم:* Rs. ${Number(d.amount).toLocaleString('en-US')} (${amountWords})
🏷️ *مد:* ${d.fundType || 'عام عطیہ / امداد'}
💳 *طریقہ:* ${d.paymentMethod || 'نقد'}

اللہ تعالیٰ آپ کے مال، جان اور اہل و عیال میں بے پناہ برکتیں عطا فرمائے اور اس صدقہ جاریہ کو اپنی بارگاہ میں قبول فرمائے۔ آمین!

*ادارہ:* مدرسہ عبد الرحمن بن عوف غفوریہ
خانیوال، پاکستان`;

        this.openWhatsAppDirect(phone, message);
    },

    async sendDonorGreeting(donorId) {
        const donor = await MadrassahDB.getDonorById(donorId);
        if (!donor) {
            alert('ڈونر کا ریکارڈ نہیں مل سکا!');
            return;
        }

        const phone = donor.whatsapp || donor.phone;
        if (!phone) {
            alert('اس ڈونر کا کوئی واٹس ایپ نمبر درج نہیں ہے!');
            return;
        }

        const message = 
`السلام علیکم ورحمۃ اللہ وبرکاتہ!
محترم *${donor.name}* صاحب!

امید ہے آپ بخیر و عافیت ہوں گے۔ مدرسہ عبد الرحمن بن عوف غفوریہ کے جملہ اساتذہ و طلبہ آپ کی خیر و عافیت اور کاروبار میں برکت کے لیے دعا گو ہیں۔

اللہ تعالیٰ آپ کے جان و مال میں برکتیں عطا فرمائے۔ آمین!

*مدرسہ عبد الرحمن بن عوف غفوریہ*`;

        this.openWhatsAppDirect(phone, message);
    },

    // 4. PRINT ANNUAL STATEMENT FOR A SINGLE DONOR
    async printDonorStatement(donorId, year) {
        const donor = await MadrassahDB.getDonorById(donorId);
        if (!donor) return;

        const allDonations = await MadrassahDB.getDonorDonations(donorId);
        const yearDonations = allDonations.filter(d => Number(d.year) === Number(year));
        const months = this.getMonths();

        const totalPaid = yearDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const pledgedAnnual = (Number(donor.monthlyPledge) || 0) * 12;
        const balance = Math.max(0, pledgedAnnual - totalPaid);

        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert('براہِ کرم براؤزر پاپ اپ کی اجازت دیں۔');
            return;
        }

        const html = `<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>سالانہ کھاتہ و اسٹیٹمنٹ - ${donor.name} (${year}ء)</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
    <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Jameel Noori Nastaleeq', Arial, sans-serif; direction: rtl; margin: 0; padding: 10px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 12px; margin-bottom: 15px; }
        .title { font-size: 2rem; color: #065f46; margin: 0; font-weight: bold; }
        .subtitle { font-size: 1.2rem; color: #64748b; margin: 2px 0 0 0; }
        .donor-box { border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px 18px; margin-bottom: 18px; background: #f8fafc; }
        .ledger-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .ledger-table th, .ledger-table td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; font-size: 1rem; }
        .ledger-table th { background: #f1f5f9; color: #0f172a; font-weight: bold; }
        .paid-row { background: #f0fdf4; color: #166534; }
        .unpaid-row { background: #ffffff; color: #94a3b8; }
        .totals-box { display: flex; justify-content: space-between; border: 1.5px solid #065f46; border-radius: 8px; padding: 10px 15px; margin-bottom: 30px; background: #ecfdf5; font-weight: bold; font-size: 1.1rem; }
        .sig-section { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 30px; }
        .sig-box { text-align: center; border-top: 1.5px dashed #64748b; width: 180px; padding-top: 6px; font-weight: bold; }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body>
    <div class="no-print" style="text-align:left; margin-bottom:15px;">
        <button onclick="window.print()" style="background:#059669; color:white; border:none; padding:8px 18px; font-weight:bold; border-radius:6px; cursor:pointer;">
            <i class="fas fa-print"></i> پرنٹ کریں (Print)
        </button>
    </div>

    <div class="header">
        <h1 class="title">مدرسہ عبد الرحمن بن عوف غفوریہ</h1>
        <div class="subtitle">سالانہ کھاتہ و اسٹیٹمنٹ برائے مستقل معاونین (سال ${year}ء)</div>
    </div>

    <div class="donor-box">
        <table style="width:100%; border:none; font-size:1.1rem;">
            <tr>
                <td style="width:50%;"><b>نامِ معاون:</b> ${donor.name} ${donor.fatherName ? `ولد ${donor.fatherName}` : ''}</td>
                <td style="width:50%;"><b>ڈونر کوڈ:</b> ${donor.donorCode || ('DNR-' + donor.id)}</td>
            </tr>
            <tr>
                <td><b>رابطہ فون:</b> <span dir="ltr">${donor.phone || '---'}</span></td>
                <td><b>واٹس ایپ:</b> <span dir="ltr">${donor.whatsapp || donor.phone || '---'}</span></td>
            </tr>
            <tr>
                <td><b>پتہ / شہر:</b> ${[donor.address, donor.city].filter(Boolean).join('، ') || '---'}</td>
                <td><b>طے شدہ ماہانہ رقم:</b> Rs. ${(Number(donor.monthlyPledge) || 0).toLocaleString('en-US')} / ماہ</td>
            </tr>
        </table>
    </div>

    <table class="ledger-table">
        <thead>
            <tr>
                <th style="width:8%;">نمبر شمار</th>
                <th style="width:20%;">ماہ (Month)</th>
                <th style="width:16%;">کیفیت (Status)</th>
                <th style="width:18%;">تاریخِ ادائیگی</th>
                <th style="width:18%;">رسید نمبر</th>
                <th style="width:20%;">وصول شدہ رقم</th>
            </tr>
        </thead>
        <tbody>
            ${months.map((m, idx) => {
                const don = yearDonations.find(d => Number(d.monthIndex) === m.index);
                const isPaid = !!don;
                return `
                    <tr class="${isPaid ? 'paid-row' : 'unpaid-row'}">
                        <td>${idx + 1}</td>
                        <td style="font-weight:bold;">${m.name}</td>
                        <td>${isPaid ? '<span style="color:#15803d; font-weight:bold;">ادا شدہ ✓</span>' : 'واجب الادا'}</td>
                        <td>${isPaid && don.paymentDate ? don.paymentDate.split('-').reverse().join('/') : '---'}</td>
                        <td style="font-family:monospace;">${isPaid ? don.receiptNo : '---'}</td>
                        <td style="font-weight:bold; font-family:monospace;">
                            ${isPaid ? 'Rs. ' + Number(don.amount).toLocaleString('en-US') : '0'}
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    </table>

    <div class="totals-box">
        <div>سالانہ طے شدہ ہدف: Rs. ${pledgedAnnual.toLocaleString('en-US')}</div>
        <div style="color:#15803d;">کل ادا شدہ: Rs. ${totalPaid.toLocaleString('en-US')}</div>
        <div style="color:${balance > 0 ? '#b91c1c' : '#059669'};">بقیہ واجبات: Rs. ${balance.toLocaleString('en-US')}</div>
    </div>

    <div class="sig-section">
        <div class="sig-box">دستخط ناظم مالیات / خازن</div>
        <div class="sig-box">مہر و دستخط مہتمم صاحب</div>
    </div>
</body>
</html>`;

        printWin.document.write(html);
        printWin.document.close();
    },

    // 5. PRINT MASTER ANNUAL SHEET (A4 Landscape)
    async printMasterAnnualSheet(year) {
        const donors = await MadrassahDB.getAllDonors();
        const allDonations = await MadrassahDB.getAllDonorDonations();
        const yearDonations = allDonations.filter(d => Number(d.year) === Number(year));
        const months = this.getMonths();

        const monthTotals = months.map(m => {
            return yearDonations
                .filter(d => Number(d.monthIndex) === m.index)
                .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        });
        const grandTotal = monthTotals.reduce((a, b) => a + b, 0);

        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert('براہِ کرم براؤزر پاپ اپ کی اجازت دیں۔');
            return;
        }

        const html = `<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>اجتماعی سالانہ ماسٹر شیٹ - مستقل معاونین (${year}ء)</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
    <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: 'Jameel Noori Nastaleeq', Arial, sans-serif; direction: rtl; margin: 0; padding: 5px; color: #1e293b; font-size: 0.95rem; }
        .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 8px; margin-bottom: 12px; }
        .title { font-size: 1.8rem; color: #065f46; margin: 0; font-weight: bold; }
        .subtitle { font-size: 1.1rem; color: #64748b; margin: 2px 0 0 0; }
        table { width: 100%; border-collapse: collapse; text-align: center; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 4px; font-size: 0.88rem; }
        th { background: #f1f5f9; color: #0f172a; font-weight: bold; }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body>
    <div class="no-print" style="text-align:left; margin-bottom:10px;">
        <button onclick="window.print()" style="background:#059669; color:white; border:none; padding:6px 16px; font-weight:bold; border-radius:6px; cursor:pointer;">
            <i class="fas fa-print"></i> پرنٹ ماسٹر شیٹ (Print)
        </button>
    </div>

    <div class="header">
        <h1 class="title">مدرسہ عبد الرحمن بن عوف غفوریہ</h1>
        <div class="subtitle">اجتماعی سالانہ ماسٹر شیٹ برائے مستقل معاونین و عطیات دہندگان (سال ${year}ء)</div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width:4%;">نمبر</th>
                <th style="width:16%; text-align:right;">نامِ معاون مع ولدیت</th>
                <th style="width:8%;">طے شدہ</th>
                ${months.map(m => `<th style="width:5.5%; font-size:0.82rem;">${m.name}</th>`).join('')}
                <th style="width:9%; background:#e0f2fe;">کل وصولی</th>
            </tr>
        </thead>
        <tbody>
            ${donors.map((donor, idx) => {
                const donorDons = yearDonations.filter(d => parseInt(d.donorId) === parseInt(donor.id));
                const total = donorDons.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

                return `
                    <tr>
                        <td>${idx + 1}</td>
                        <td style="text-align:right; font-weight:bold;">
                            ${donor.name} ${donor.fatherName ? `<small style="font-weight:normal; color:#64748b;">(ولد ${donor.fatherName})</small>` : ''}
                        </td>
                        <td style="font-family:monospace; color:#065f46;">${(Number(donor.monthlyPledge) || 0).toLocaleString('en-US')}</td>
                        ${months.map(m => {
                            const don = donorDons.find(d => Number(d.monthIndex) === m.index);
                            return don 
                                ? `<td style="background:#ecfdf5; color:#15803d; font-family:monospace; font-weight:bold;">${Number(don.amount).toLocaleString('en-US')}</td>`
                                : `<td style="color:#cbd5e1;">—</td>`;
                        }).join('')}
                        <td style="background:#f0f9ff; color:#0369a1; font-weight:bold; font-family:monospace;">
                            ${total.toLocaleString('en-US')}
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
        <tfoot>
            <tr style="background:#e2e8f0; font-weight:bold;">
                <td colspan="2" style="text-align:right; padding:8px;">میزانِ کل (Grand Total)</td>
                <td style="font-family:monospace; color:#065f46;">${donors.reduce((sum, d) => sum + (Number(d.monthlyPledge) || 0), 0).toLocaleString('en-US')}</td>
                ${monthTotals.map(amt => `<td style="font-family:monospace;">${amt > 0 ? amt.toLocaleString('en-US') : '0'}</td>`).join('')}
                <td style="background:#0284c7; color:white; font-family:monospace; font-size:1rem;">
                    Rs. ${grandTotal.toLocaleString('en-US')}
                </td>
            </tr>
        </tfoot>
    </table>

    <div style="display:flex; justify-content:space-between; margin-top:35px; padding:0 30px;">
        <div style="border-top:1.5px dashed #64748b; width:180px; text-align:center; padding-top:6px; font-weight:bold;">ناظم مالیات / سیکرٹری</div>
        <div style="border-top:1.5px dashed #64748b; width:180px; text-align:center; padding-top:6px; font-weight:bold;">مہتمم / صدر مدرسہ</div>
    </div>
</body>
</html>`;

        printWin.document.write(html);
        printWin.document.close();
    }
};

if (typeof window !== 'undefined') {
    window.DonorsModule = DonorsModule;
}
