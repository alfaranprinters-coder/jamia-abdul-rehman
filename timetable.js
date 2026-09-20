// Timetable & Daily Schedule Module (جدول الاوقات و نظام الاوقات)
// 3 Shifts / Sessions: وقتِ اول، وقتِ ثانی، وقتِ آخر
// Madrasah Pro Manager - Offline Version
// Architecture & Implementation for Madrasa Abdul Rehman Bin Auf

var TimetableModule = {
    activeShiftTab: 'all', // 'all' | 'awwal' | 'sani' | 'aakhir' | 'books'
    
    // Default 3 Shifts Structure
    defaultSchedule: {
        awwal: {
            id: 'awwal',
            title: 'وقتِ اول',
            subtitle: 'صبح کا تعلیمی سیشن (نیا سبق، اسباقِ کتب و ناظرہ)',
            icon: 'fa-sun',
            color: '#0284c7',
            bg: '#f0f9ff',
            border: '#bae6fd',
            badgeBg: '#e0f2fe',
            badgeColor: '#0369a1',
            startTime: '08:00',
            endTime: '12:30',
            periodDuration: 40,
            hasBreak: true,
            breakStartTime: '10:00',
            breakDuration: 20,
            activityDesc: 'حفظ کا نیا سبق، اسباقِ کتب، ناظرہ قرآن و ابتدائی دینیات',
            periods: [
                { id: 1, name: 'گھنٹی اول (پیریڈ ۱)', startTime: '08:00', endTime: '08:40', duration: 40, subject: 'حفظ نیا سبق / تلاوت', className: 'شعبہ حفظ', teacherId: '', isBreak: false },
                { id: 2, name: 'گھنٹی دوم (پیریڈ ۲)', startTime: '08:40', endTime: '09:20', duration: 40, subject: 'تجوید و ناظرہ', className: 'شعبہ ناظرہ', teacherId: '', isBreak: false },
                { id: 3, name: 'گھنٹی سوم (پیریڈ ۳)', startTime: '09:20', endTime: '10:00', duration: 40, subject: 'درسِ نظامی اسباق / فقہ', className: '', teacherId: '', isBreak: false },
                { id: 4, name: 'وقفہ تفریح و ناشتہ', startTime: '10:00', endTime: '10:20', duration: 20, subject: 'تفریح و استراحت', className: '', teacherId: '', isBreak: true },
                { id: 5, name: 'گھنٹی چہارم (پیریڈ ۴)', startTime: '10:20', endTime: '11:00', duration: 40, subject: 'عربی گرامر / اردو', className: '', teacherId: '', isBreak: false },
                { id: 6, name: 'گھنٹی پنجم (پیریڈ ۵)', startTime: '11:00', endTime: '11:45', duration: 45, subject: 'سیرت و احادیث', className: '', teacherId: '', isBreak: false },
                { id: 7, name: 'گھنٹی ششم (پیریڈ ۶)', startTime: '11:45', endTime: '12:30', duration: 45, subject: 'دہرائی و اختتامی تلاوت', className: '', teacherId: '', isBreak: false }
            ]
        },
        sani: {
            id: 'sani',
            title: 'وقتِ ثانی',
            subtitle: 'بعد ظہر کا تعلیمی سیشن (سبقی، دہرائی و کتب)',
            icon: 'fa-cloud-sun',
            color: '#d97706',
            bg: '#fffbeb',
            border: '#fde68a',
            badgeBg: '#fef3c7',
            badgeColor: '#92400e',
            startTime: '14:00',
            endTime: '16:30',
            periodDuration: 35,
            hasBreak: false,
            breakStartTime: '15:10',
            breakDuration: 15,
            activityDesc: 'سبقی کا جائزہ، کچی پکی منزل، عربی ادب، تمرین و خطاطی',
            periods: [
                { id: 1, name: 'گھنٹی اول (پیریڈ ۱)', startTime: '14:00', endTime: '14:40', duration: 40, subject: 'سبقی (سابقہ یاد کردہ پارے)', className: 'شعبہ حفظ', teacherId: '', isBreak: false },
                { id: 2, name: 'گھنٹی دوم (پیریڈ ۲)', startTime: '14:40', endTime: '15:20', duration: 40, subject: 'تمرین و قواعد النحو', className: '', teacherId: '', isBreak: false },
                { id: 3, name: 'گھنٹی سوم (پیریڈ ۳)', startTime: '15:20', endTime: '16:00', duration: 40, subject: 'ترجمۃ القرآن و عقائد', className: '', teacherId: '', isBreak: false },
                { id: 4, name: 'گھنٹی چہارم (پیریڈ ۴)', startTime: '16:00', endTime: '16:30', duration: 30, subject: 'خطاطی و خوشخطی / متفرق', className: '', teacherId: '', isBreak: false }
            ]
        },
        aakhir: {
            id: 'aakhir',
            title: 'وقتِ آخر',
            subtitle: 'شام و رات کا سیشن (بعد مغرب و عشاء: پختگیِ منزل و مطالعہ)',
            icon: 'fa-moon',
            color: '#4338ca',
            bg: '#f5f3ff',
            border: '#c7d2fe',
            badgeBg: '#e0e7ff',
            badgeColor: '#3730a3',
            startTime: '18:30',
            endTime: '21:30',
            periodDuration: 45,
            hasBreak: true,
            breakStartTime: '19:45',
            breakDuration: 30,
            activityDesc: 'پختگیِ منزل، تکرارِ اسباق، نگران اساتذہ کو سنانا، مطالعہ و آرام',
            periods: [
                { id: 1, name: 'گھنٹی اول (بعد مغرب)', startTime: '18:30', endTime: '19:45', duration: 75, subject: 'منزل کا دور / پختگی', className: 'شعبہ حفظ', teacherId: '', isBreak: false },
                { id: 2, name: 'نمازِ عشاء و طعام', startTime: '19:45', endTime: '20:15', duration: 30, subject: 'نمازِ باجماعت و رات کا کھانا', className: '', teacherId: '', isBreak: true },
                { id: 3, name: 'گھنٹی دوم (بعد عشاء)', startTime: '20:15', endTime: '21:00', duration: 45, subject: 'تکرارِ کتب و شبینہ دہرائی', className: '', teacherId: '', isBreak: false },
                { id: 4, name: 'گھنٹی سوم (حتمی جائزہ)', startTime: '21:00', endTime: '21:30', duration: 30, subject: 'فردا فردا سنانا و حاضری شب', className: '', teacherId: '', isBreak: false }
            ]
        }
    },

    // Load Schedule from Storage or DB
    async getSchedule() {
        let schedule = null;
        try {
            const db = (typeof MadrassahDB !== 'undefined' ? MadrassahDB : (typeof window !== 'undefined' ? window.MadrassahDB : null));
            if (db && typeof db.getSetting === 'function') {
                schedule = await db.getSetting('mms_three_shifts_timetable');
            }
        } catch (e) {
            console.warn('DB getSetting timetable warning:', e);
        }

        if (!schedule) {
            const local = (typeof localStorage !== 'undefined') ? localStorage.getItem('mms_three_shifts_timetable') : null;
            if (local) {
                try { schedule = JSON.parse(local); } catch(err){}
            }
        }

        if (!schedule) {
            schedule = JSON.parse(JSON.stringify(this.defaultSchedule));
        }

        // Ensure all 3 shifts exist
        ['awwal', 'sani', 'aakhir'].forEach(key => {
            if (!schedule[key]) {
                schedule[key] = JSON.parse(JSON.stringify(this.defaultSchedule[key]));
            }
        });

        return schedule;
    },

    // Floating Save Toast Notification
    showToast(message, type = 'success') {
        if (typeof document === 'undefined' || !document.body) return;
        let toast = document.getElementById('tt-save-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'tt-save-toast';
            toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); z-index:99999; padding:12px 28px; border-radius:50px; font-weight:bold; font-size:1.05rem; box-shadow:0 12px 30px rgba(0,0,0,0.3); display:flex; align-items:center; gap:10px; transition:all 0.35s cubic-bezier(0.16, 1, 0.3, 1); opacity:0; pointer-events:none; font-family:"Jameel Noori Nastaleeq", Arial, sans-serif;';
            document.body.appendChild(toast);
        }
        toast.style.background = type === 'success' ? '#065f46' : '#dc2626';
        toast.style.color = '#ffffff';
        toast.style.border = type === 'success' ? '2px solid #34d399' : '2px solid #f87171';
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}" style="font-size:1.3rem;"></i> <span>${message}</span>`;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            if (toast) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(20px)';
            }
        }, 2200);
    },

    // Save Schedule to Storage & IndexedDB
    async saveSchedule(schedule, notify = true) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('mms_three_shifts_timetable', JSON.stringify(schedule));
        }
        try {
            const db = (typeof MadrassahDB !== 'undefined' ? MadrassahDB : (typeof window !== 'undefined' ? window.MadrassahDB : null));
            if (db && typeof db.saveSetting === 'function') {
                await db.saveSetting('mms_three_shifts_timetable', schedule);
            }
        } catch (e) {
            console.warn('DB saveSetting timetable warning:', e);
        }
        if (notify && typeof this.showToast === 'function') {
            this.showToast('تبدیلیاں بحمداللہ خودکار محفوظ ہو گئیں ✓');
        }
    },

    // Manual Save All Changes Button
    async saveAllChangesBtn() {
        const schedule = await this.getSchedule();
        await this.saveSchedule(schedule, false);
        this.showToast('تمام تبدیلیاں بحمداللہ مستقل طور پر محفوظ کر لی گئی ہیں! ✓');
    },

    // Format 24-hour time to AM/PM Urdu representation
    formatTimeUrdu(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        let hrs = parseInt(parts[0]);
        const mins = parts[1];
        const isPm = hrs >= 12;
        if (hrs > 12) hrs -= 12;
        if (hrs === 0) hrs = 12;
        return `${hrs}:${mins} ${isPm ? 'شام' : 'صبح'}`;
    },

    // Check which shift is currently live
    getCurrentLiveShift(schedule) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        const toMins = (str) => {
            if (!str) return 0;
            const [h, m] = str.split(':').map(Number);
            return h * 60 + m;
        };

        const awwalStart = toMins(schedule.awwal.startTime);
        const awwalEnd = toMins(schedule.awwal.endTime);
        const saniStart = toMins(schedule.sani.startTime);
        const saniEnd = toMins(schedule.sani.endTime);
        const aakhirStart = toMins(schedule.aakhir.startTime);
        const aakhirEnd = toMins(schedule.aakhir.endTime);

        if (currentMins >= awwalStart && currentMins <= awwalEnd) {
            return { key: 'awwal', shift: schedule.awwal, text: 'اس وقت مدرسہ میں [وقتِ اول] جاری ہے', color: '#059669', bg: '#ecfdf5' };
        } else if (currentMins >= saniStart && currentMins <= saniEnd) {
            return { key: 'sani', shift: schedule.sani, text: 'اس وقت مدرسہ میں [وقتِ ثانی] جاری ہے', color: '#d97706', bg: '#fffbeb' };
        } else if (currentMins >= aakhirStart && currentMins <= aakhirEnd) {
            return { key: 'aakhir', shift: schedule.aakhir, text: 'اس وقت مدرسہ میں [وقتِ آخر] جاری ہے', color: '#4338ca', bg: '#eef2ff' };
        } else {
            return { key: 'none', shift: null, text: 'اس وقت مدرسہ میں وقفہ / استراحت کا وقت ہے', color: '#64748b', bg: '#f8fafc' };
        }
    },

    // Main Render Function
    async render(container) {
        if (!container) container = document.getElementById('main-content');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center; padding: 4rem;"><div class="mms-spinner"></div></div>';

        const schedule = await this.getSchedule();
        const db = (typeof MadrassahDB !== 'undefined' ? MadrassahDB : (typeof window !== 'undefined' ? window.MadrassahDB : null));
        let books = [];
        let teachers = [];
        try {
            if (db && typeof db.getAllBooks === 'function') {
                books = (await db.getAllBooks()) || [];
            }
            if (db && typeof db.getAllTeachers === 'function') {
                teachers = (await db.getAllTeachers()) || [];
            }
        } catch (e) {
            console.warn('Timetable books/teachers fetch warning:', e);
        }
        const liveShift = this.getCurrentLiveShift(schedule);

        container.innerHTML = `
            <div class="timetable-module-wrapper" style="padding-bottom: 2.5rem;">
                <!-- Header Banner -->
                <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); color: white; border-radius: 16px; padding: 1.5rem 2rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.2rem;">
                        <div style="display:flex; align-items:center; gap:16px;">
                            <div style="width:58px; height:58px; background:rgba(255,255,255,0.12); backdrop-filter:blur(6px); border:2px solid rgba(255,255,255,0.25); border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:1.8rem; color:#38bdf8;">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div>
                                <h2 style="margin:0; font-family:'Aref Ruqaa', 'Amiri', serif; font-size:2rem; letter-spacing:0.5px; color:#ffffff;">
                                    نظام الاوقات و جدول الاوقات (سہ گانہ سیشنز)
                                </h2>
                                <p style="margin:4px 0 0 0; color:#94a3b8; font-size:1rem;">
                                    وقتِ اول، وقتِ ثانی، اور وقتِ آخر کی خودکار و مینول سیٹنگ مع گھنٹیاں اور اساتذہ
                                </p>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                            <button onclick="TimetableModule.saveAllChangesBtn()" class="btn" style="background:#10b981; color:white; font-weight:bold; font-size:1.02rem; padding:10px 18px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(16,185,129,0.35);">
                                <i class="fas fa-check-circle"></i> جدول محفوظ کریں
                            </button>
                            <button onclick="TimetableModule.printOfficialTimetable()" class="btn" style="background:#38bdf8; color:#0f172a; font-weight:bold; font-size:1.02rem; padding:10px 18px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(56,189,248,0.3);">
                                <i class="fas fa-print"></i> باضابطہ جدول پرنٹ کریں (A4)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Live Shift Tracker & Presets Bar -->
                <div class="card" style="margin-bottom: 1.5rem; padding: 1.2rem 1.6rem; background:white; border-radius:14px; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.2rem;">
                        <!-- Live Status -->
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="display:inline-flex; width:14px; height:14px; border-radius:50%; background:${liveShift.color}; box-shadow:0 0 0 4px ${liveShift.bg}; animation: pulse 2s infinite;"></span>
                            <div>
                                <span style="font-size:0.85rem; color:#64748b; display:block;">لائیو سیشن نشاندہی (خودکار گھڑی):</span>
                                <b style="font-size:1.1rem; color:${liveShift.color};">${liveShift.text}</b>
                            </div>
                        </div>

                        <!-- 1-Click Seasonal Presets (خودکار طریقے) -->
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <span style="font-size:0.9rem; font-weight:bold; color:#475569;">
                                <i class="fas fa-wand-magic-sparkles" style="color:#f59e0b;"></i> خودکار معیاری اوقات:
                            </span>
                            <button onclick="TimetableModule.applyPreset('summer')" class="btn" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a; font-size:0.88rem; font-weight:bold; padding:6px 12px; border-radius:8px; cursor:pointer;" title="گرما اوقات لوڈ کریں">
                                🌞 موسمِ گرما
                            </button>
                            <button onclick="TimetableModule.applyPreset('winter')" class="btn" style="background:#f0f9ff; color:#0369a1; border:1px solid #bae6fd; font-size:0.88rem; font-weight:bold; padding:6px 12px; border-radius:8px; cursor:pointer;" title="سرما اوقات لوڈ کریں">
                                ❄️ موسمِ سرما
                            </button>
                            <button onclick="TimetableModule.applyPreset('hifz')" class="btn" style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; font-size:0.88rem; font-weight:bold; padding:6px 12px; border-radius:8px; cursor:pointer;" title="شعبہ حفظ و تجوید اوقات لوڈ کریں">
                                📖 شعبہ حفظ شیڈول
                            </button>
                            <button onclick="TimetableModule.resetToDefault()" class="btn" style="background:#f1f5f9; color:#475569; border:none; font-size:0.88rem; padding:6px 12px; border-radius:8px; cursor:pointer;" title="طے شدہ حالت پر واپس">
                                <i class="fas fa-rotate-left"></i> ری سیٹ
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 3 SHIFTS OVERVIEW CARDS (وقتِ اول، وقتِ ثانی، وقتِ آخر) -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.4rem; margin-bottom:1.5rem;">
                    ${['awwal', 'sani', 'aakhir'].map(key => {
                        const shift = schedule[key];
                        return `
                            <div class="card shift-kpi-card" style="background:${shift.bg}; border:2px solid ${shift.border}; border-radius:16px; padding:1.4rem; position:relative; box-shadow:0 4px 12px rgba(0,0,0,0.04);">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <div style="width:48px; height:48px; border-radius:12px; background:white; color:${shift.color}; display:flex; align-items:center; justify-content:center; font-size:1.5rem; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
                                            <i class="fas ${shift.icon}"></i>
                                        </div>
                                        <div>
                                            <h3 style="margin:0; font-size:1.35rem; color:${shift.color}; font-family:'Aref Ruqaa', 'Amiri', serif;">
                                                ${shift.title}
                                            </h3>
                                            <span style="font-size:0.85rem; color:#64748b;">${shift.subtitle}</span>
                                        </div>
                                    </div>
                                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                                        <span style="background:${shift.badgeBg}; color:${shift.badgeColor}; font-weight:bold; font-size:0.8rem; padding:3px 10px; border-radius:20px;">
                                            ${shift.periods ? shift.periods.length : 0} گھنٹیاں
                                        </span>
                                        <span style="font-size:0.75rem; color:#059669; font-weight:bold; display:flex; align-items:center; gap:4px;" title="ہر تبدیلی فوری خودکار محفوظ ہوتی ہے">
                                            <i class="fas fa-check-double"></i> خودکار محفوظ
                                        </span>
                                    </div>
                                </div>

                                <!-- Start and End Time Display / Edit Form -->
                                <div style="background:white; border-radius:12px; padding:12px 14px; border:1px solid ${shift.border}; margin-bottom:1rem;">
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; align-items:center;">
                                        <div>
                                            <label style="display:block; font-size:0.82rem; color:#64748b; font-weight:bold; margin-bottom:2px;">
                                                وقتِ ابتداء (Start):
                                            </label>
                                            <input type="time" value="${shift.startTime}" onchange="TimetableModule.updateShiftTime('${key}', 'startTime', this.value)" style="width:100%; padding:6px 8px; border-radius:6px; border:1.5px solid #cbd5e1; font-weight:bold; font-size:1.05rem; color:#0f172a; text-align:center;">
                                        </div>
                                        <div>
                                            <label style="display:block; font-size:0.82rem; color:#64748b; font-weight:bold; margin-bottom:2px;">
                                                وقتِ انتہا (End):
                                            </label>
                                            <input type="time" value="${shift.endTime}" onchange="TimetableModule.updateShiftTime('${key}', 'endTime', this.value)" style="width:100%; padding:6px 8px; border-radius:6px; border:1.5px solid #cbd5e1; font-weight:bold; font-size:1.05rem; color:#0f172a; text-align:center;">
                                        </div>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:0.85rem; color:#475569; border-top:1px dashed #e2e8f0; padding-top:6px;">
                                        <span>کل دورانیہ: <b>${TimetableModule.calcTotalDuration(shift.startTime, shift.endTime)}</b></span>
                                        <span style="color:${shift.color}; font-weight:bold;">${TimetableModule.formatTimeUrdu(shift.startTime)} تا ${TimetableModule.formatTimeUrdu(shift.endTime)}</span>
                                    </div>
                                </div>

                                <!-- Auto-generate & Settings Bar -->
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                                    <button onclick="TimetableModule.autoGeneratePeriodsPrompt('${key}')" class="btn" style="flex:1; background:white; border:1.5px solid ${shift.border}; color:${shift.color}; font-weight:bold; font-size:0.88rem; padding:6px 10px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                                        <i class="fas fa-calculator"></i> خودکار گھنٹیاں بنائیں
                                    </button>
                                    <button onclick="TimetableModule.addNewPeriod('${key}')" class="btn" style="background:${shift.color}; color:white; font-weight:bold; font-size:0.88rem; padding:6px 12px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; gap:4px;" title="نیا پیریڈ دستی شامل کریں">
                                        <i class="fas fa-plus"></i> نیا پیریڈ
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Control Tabs (سیشنز کی تفصیل اور کتب تفویض) -->
                <div class="card" style="margin-bottom: 1.5rem; padding: 1.2rem; background:white; border-radius:14px; box-shadow:var(--shadow-sm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid #f1f5f9; padding-bottom:0.8rem; margin-bottom:1.2rem;">
                        <div style="display:flex; gap:8px; background:#f1f5f9; padding:4px; border-radius:10px; flex-wrap:wrap;">
                            <button onclick="TimetableModule.switchShiftTab('all')" class="btn" style="border:none; cursor:pointer; font-weight:bold; border-radius:8px; padding:8px 18px; font-size:0.95rem; ${this.activeShiftTab === 'all' ? 'background:#0f172a; color:white;' : 'background:transparent; color:#475569;'}">
                                <i class="fas fa-table-list"></i> مکمل شیڈول (تینوں اوقات)
                            </button>
                            <button onclick="TimetableModule.switchShiftTab('awwal')" class="btn" style="border:none; cursor:pointer; font-weight:bold; border-radius:8px; padding:8px 18px; font-size:0.95rem; ${this.activeShiftTab === 'awwal' ? 'background:#0284c7; color:white;' : 'background:transparent; color:#475569;'}">
                                <i class="fas fa-sun"></i> وقتِ اول
                            </button>
                            <button onclick="TimetableModule.switchShiftTab('sani')" class="btn" style="border:none; cursor:pointer; font-weight:bold; border-radius:8px; padding:8px 18px; font-size:0.95rem; ${this.activeShiftTab === 'sani' ? 'background:#d97706; color:white;' : 'background:transparent; color:#475569;'}">
                                <i class="fas fa-cloud-sun"></i> وقتِ ثانی
                            </button>
                            <button onclick="TimetableModule.switchShiftTab('aakhir')" class="btn" style="border:none; cursor:pointer; font-weight:bold; border-radius:8px; padding:8px 18px; font-size:0.95rem; ${this.activeShiftTab === 'aakhir' ? 'background:#4338ca; color:white;' : 'background:transparent; color:#475569;'}">
                                <i class="fas fa-moon"></i> وقتِ آخر
                            </button>
                            <button onclick="TimetableModule.switchShiftTab('books')" class="btn" style="border:none; cursor:pointer; font-weight:bold; border-radius:8px; padding:8px 18px; font-size:0.95rem; ${this.activeShiftTab === 'books' ? 'background:#059669; color:white;' : 'background:transparent; color:#475569;'}">
                                <i class="fas fa-book-bookmark"></i> کتب و اساتذہ تفویض (${books.length})
                            </button>
                        </div>

                        <div style="font-size:0.9rem; color:#64748b;">
                            * گھنٹی کا وقت، مضمون یا استاد تبدیل کرنے پر تبدیلی <b>خود بخود</b> محفوظ ہو جاتی ہے۔
                        </div>
                    </div>

                    <!-- Shift Content -->
                    ${this.activeShiftTab === 'books' ? this.renderBooksAssignmentTab(books, teachers) : this.renderShiftsPeriodsTables(schedule, teachers, books)}
                </div>
            </div>
        `;
    },

    // Render Periods Tables for 1 or all shifts
    renderShiftsPeriodsTables(schedule, teachers, books) {
        const shiftsToShow = this.activeShiftTab === 'all' 
            ? ['awwal', 'sani', 'aakhir'] 
            : [this.activeShiftTab];

        return `
            <div style="display:flex; flex-direction:column; gap:2rem;">
                ${shiftsToShow.map(shiftKey => {
                    const shift = schedule[shiftKey];
                    const periods = shift.periods || [];

                    return `
                        <div style="border:1.5px solid ${shift.border}; border-radius:14px; overflow:hidden; background:white;">
                            <!-- Shift Table Header -->
                            <div style="background:${shift.bg}; border-bottom:1.5px solid ${shift.border}; padding:1rem 1.4rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <i class="fas ${shift.icon}" style="font-size:1.3rem; color:${shift.color};"></i>
                                    <div>
                                        <h3 style="margin:0; font-size:1.3rem; color:${shift.color}; font-family:'Aref Ruqaa', 'Amiri', serif;">
                                            ${shift.title} — جدول و تفویضِ اسباق
                                        </h3>
                                        <span style="font-size:0.85rem; color:#64748b;">
                                            وقتِ ابتداء: <b>${this.formatTimeUrdu(shift.startTime)}</b> | وقتِ انتہا: <b>${this.formatTimeUrdu(shift.endTime)}</b>
                                        </span>
                                    </div>
                                </div>
                                <div style="display:flex; gap:8px;">
                                    <button onclick="TimetableModule.addNewPeriod('${shiftKey}')" class="btn" style="background:${shift.color}; color:white; font-size:0.85rem; font-weight:bold; padding:6px 12px; border-radius:8px; border:none; cursor:pointer;">
                                        <i class="fas fa-plus"></i> گھنٹی شامل کریں
                                    </button>
                                </div>
                            </div>

                            <!-- Periods Table -->
                            <div style="overflow-x:auto;">
                                <table class="table" style="width:100%; border-collapse:collapse; font-size:0.95rem;">
                                    <thead>
                                        <tr style="background:#f8fafc; color:#1e293b; border-bottom:1px solid #e2e8f0;">
                                            <th style="padding:10px 12px; text-align:center; width:60px;">گھنٹی</th>
                                            <th style="padding:10px 12px; text-align:right; width:200px;">عنوانِ پیریڈ</th>
                                            <th style="padding:10px 12px; text-align:center; width:130px;">وقتِ ابتداء</th>
                                            <th style="padding:10px 12px; text-align:center; width:130px;">وقتِ انتہا</th>
                                            <th style="padding:10px 12px; text-align:center; width:90px;">دورانیہ</th>
                                            <th style="padding:10px 12px; text-align:right;">کتاب / مضمون</th>
                                            <th style="padding:10px 12px; text-align:right; width:150px;">درجہ / کلاس</th>
                                            <th style="padding:10px 12px; text-align:right; width:180px;">نگران استاد</th>
                                            <th style="padding:10px 12px; text-align:center; width:90px;">ایکشن</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${periods.map((p, idx) => {
                                            if (p.isBreak) {
                                                return `
                                                    <tr style="background:#fefce8; border-bottom:1px solid #fef08a;">
                                                        <td style="text-align:center; font-weight:bold; color:#854d0e;">#${idx + 1}</td>
                                                        <td style="font-weight:bold; color:#854d0e;">
                                                            <i class="fas fa-coffee" style="margin-left:5px;"></i> ${p.name || 'وقفہ استراحت / طعام'}
                                                        </td>
                                                        <td style="text-align:center;">
                                                            <input type="time" value="${p.startTime}" onchange="TimetableModule.updatePeriodTime('${shiftKey}', ${p.id}, 'startTime', this.value)" style="padding:4px; border-radius:6px; border:1px solid #cbd5e1; font-weight:bold; text-align:center;">
                                                        </td>
                                                        <td style="text-align:center;">
                                                            <input type="time" value="${p.endTime}" onchange="TimetableModule.updatePeriodTime('${shiftKey}', ${p.id}, 'endTime', this.value)" style="padding:4px; border-radius:6px; border:1px solid #cbd5e1; font-weight:bold; text-align:center;">
                                                        </td>
                                                        <td style="text-align:center; font-weight:bold; color:#854d0e;">
                                                            ${p.duration || TimetableModule.calcDurationMins(p.startTime, p.endTime)} منٹ
                                                        </td>
                                                        <td colspan="3" style="text-align:center; color:#a16207; font-weight:bold;">
                                                            --- نمازِ باجماعت، طعام و وقفہ تفریح ---
                                                        </td>
                                                        <td style="text-align:center;">
                                                            <button onclick="TimetableModule.deletePeriod('${shiftKey}', ${p.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.9rem;" title="حذف کریں">
                                                                <i class="fas fa-trash-alt"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                `;
                                            }

                                            return `
                                                <tr style="border-bottom:1px solid #f1f5f9;">
                                                    <td style="text-align:center; font-weight:bold; color:#64748b;">${idx + 1}</td>
                                                    <td>
                                                        <input type="text" value="${p.name || `گھنٹی ${idx + 1}`}" onchange="TimetableModule.updatePeriodField('${shiftKey}', ${p.id}, 'name', this.value)" style="width:100%; padding:5px 8px; border-radius:6px; border:1px solid #cbd5e1; font-weight:bold; color:#0f172a;">
                                                    </td>
                                                    <td style="text-align:center;">
                                                        <input type="time" value="${p.startTime}" onchange="TimetableModule.updatePeriodTime('${shiftKey}', ${p.id}, 'startTime', this.value)" style="padding:5px 8px; border-radius:6px; border:1.5px solid #cbd5e1; font-weight:bold; text-align:center;">
                                                    </td>
                                                    <td style="text-align:center;">
                                                        <input type="time" value="${p.endTime}" onchange="TimetableModule.updatePeriodTime('${shiftKey}', ${p.id}, 'endTime', this.value)" style="padding:5px 8px; border-radius:6px; border:1.5px solid #cbd5e1; font-weight:bold; text-align:center;">
                                                    </td>
                                                    <td style="text-align:center; font-weight:bold; color:#059669; font-family:monospace;">
                                                        ${p.duration || TimetableModule.calcDurationMins(p.startTime, p.endTime)}m
                                                    </td>
                                                    <td>
                                                        <input type="text" list="tt_books_datalist" value="${p.subject || ''}" onchange="TimetableModule.updatePeriodField('${shiftKey}', ${p.id}, 'subject', this.value)" placeholder="کتاب یا مضمون..." style="width:100%; padding:5px 8px; border-radius:6px; border:1px solid #cbd5e1;">
                                                    </td>
                                                    <td>
                                                        <input type="text" value="${p.className || ''}" onchange="TimetableModule.updatePeriodField('${shiftKey}', ${p.id}, 'className', this.value)" placeholder="کلاس / درجہ..." style="width:100%; padding:5px 8px; border-radius:6px; border:1px solid #cbd5e1;">
                                                    </td>
                                                    <td>
                                                        <select onchange="TimetableModule.updatePeriodField('${shiftKey}', ${p.id}, 'teacherId', this.value)" style="width:100%; padding:5px 8px; border-radius:6px; border:1px solid #cbd5e1; background:white;">
                                                            <option value="">-- استاد کا انتخاب --</option>
                                                            ${teachers.map(t => `<option value="${t.id}" ${parseInt(p.teacherId) === parseInt(t.id) ? 'selected' : ''}>${t.name}</option>`).join('')}
                                                        </select>
                                                    </td>
                                                    <td style="text-align:center;">
                                                        <div style="display:inline-flex; gap:6px;">
                                                            <button onclick="TimetableModule.togglePeriodBreak('${shiftKey}', ${p.id})" class="btn" style="background:#fef3c7; color:#92400e; border:none; padding:4px 6px; border-radius:4px; font-size:0.75rem; cursor:pointer;" title="اسے وقفہ / تفریح بنائیں">
                                                                <i class="fas fa-mug-hot"></i>
                                                            </button>
                                                            <button onclick="TimetableModule.deletePeriod('${shiftKey}', ${p.id})" class="btn" style="background:#fee2e2; color:#b91c1c; border:none; padding:4px 6px; border-radius:4px; font-size:0.75rem; cursor:pointer;" title="حذف کریں">
                                                                <i class="fas fa-trash-alt"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('') || '<tr><td colspan="9" style="text-align:center; padding:2rem; color:#94a3b8;">اس سیشن میں فی الحال کوئی گھنٹی شامل نہیں ہے</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <datalist id="tt_books_datalist">
                ${books.map(b => `<option value="${b.bookName}">`).join('')}
                <option value="حفظ نیا سبق">
                <option value="سبقی (دہرائی)">
                <option value="پختگی منزل">
                <option value="تجوید و قراءات">
                <option value="ناظرہ قرآن کریم">
                <option value="ترجمۃ القرآن">
                <option value="فقہ و مسائل">
                <option value="عربی گرامر">
                <option value="احادیث نبویہ">
                <option value="مطالعہ و تکرار">
            </datalist>
        `;
    },

    // Render Books & Teachers Assignment Tab (Existing feature integrated)
    renderBooksAssignmentTab(books, teachers) {
        const teachingTeachers = teachers.filter(t => !t.staffType || t.staffType === 'تدریسی');

        return `
            <div style="display:grid; grid-template-columns: 1fr 1.8fr; gap: 1.5rem;">
                <div class="card" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:1.2rem;">
                    <h3 style="color:var(--primary); margin-bottom:1rem; border-bottom:1px solid #e2e8f0; padding-bottom:0.4rem; font-size:1.2rem;">
                        <i class="fas fa-plus-circle"></i> نئی کتاب شامل کریں
                    </h3>
                    <form onsubmit="TimetableModule.handleSaveBook(event)">
                        <div class="tt-form-group" style="margin-bottom:0.8rem;">
                            <label style="display:block; font-weight:bold; margin-bottom:3px;">کتاب کا نام <span style="color:#e11d48;">*</span></label>
                            <input type="text" name="bookName" required placeholder="مثلاً نور الایضاح، قدوری، تیسیر المنطق" style="width:100%; padding:8px; border-radius:6px; border:1.5px solid #cbd5e1;">
                        </div>
                        <div class="tt-form-group" style="margin-bottom:0.8rem;">
                            <label style="display:block; font-weight:bold; margin-bottom:3px;">درجہ / کلاس</label>
                            <input type="text" name="className" placeholder="مثلاً درجہ اولیٰ، ثانیہ، حفظ وغیرہ" style="width:100%; padding:8px; border-radius:6px; border:1.5px solid #cbd5e1;">
                        </div>
                        <div class="tt-form-group" style="margin-bottom:0.8rem;">
                            <label style="display:block; font-weight:bold; margin-bottom:3px;">استاد محترم (تفویض کریں)</label>
                            <select name="assignedTeacherId" style="width:100%; padding:8px; border-radius:6px; border:1.5px solid #cbd5e1; background:white;">
                                <option value="">-- استاد کا انتخاب کریں --</option>
                                ${teachingTeachers.map(t => `<option value="${t.id}">${t.name} (${t.designation || 'استاد'})</option>`).join('')}
                            </select>
                        </div>
                        <div class="tt-form-group" style="margin-bottom:1.2rem;">
                            <label style="display:block; font-weight:bold; margin-bottom:3px;">فن / صنف</label>
                            <input type="text" name="subjectType" placeholder="مثلاً فقہ، نحو، صرف، حدیث" style="width:100%; padding:8px; border-radius:6px; border:1.5px solid #cbd5e1;">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%; padding:9px; font-weight:bold; border-radius:8px;">
                            <i class="fas fa-save"></i> کتاب محفوظ کریں
                        </button>
                    </form>
                </div>

                <div class="card" style="padding:0; overflow:hidden; border:1px solid #e2e8f0; border-radius:12px;">
                    <div style="padding:1rem 1.2rem; background:#f1f5f9; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; color:#0f172a; font-size:1.15rem;">
                            <i class="fas fa-book"></i> شعبہ کتب (تفویضِ اساتذہ کا ریکارڈ)
                        </h3>
                        <span style="font-size:0.85rem; color:#64748b;">کل کتب: ${books.length}</span>
                    </div>
                    <div style="max-height: 480px; overflow-y: auto;">
                        <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
                            <thead>
                                <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; color:#475569;">
                                    <th style="padding:8px 10px; text-align:right;">کتاب</th>
                                    <th style="padding:8px 10px; text-align:right;">درجہ</th>
                                    <th style="padding:8px 10px; text-align:right;">استادِ محترم</th>
                                    <th style="padding:8px 10px; text-align:center; width:50px;">حذف</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${books.map(b => `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:8px 10px; font-weight:bold; color:#0f172a;">${b.bookName}</td>
                                        <td style="padding:8px 10px;"><span style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-size:0.85rem;">${b.className || '---'}</span></td>
                                        <td style="padding:8px 10px;">
                                            <select style="padding:4px 6px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.9rem; width:100%; background:white;" onchange="TimetableModule.assignTeacherToBook(${b.id}, this.value)">
                                                <option value="">انتخاب کریں</option>
                                                ${teachingTeachers.map(t => `<option value="${t.id}" ${b.assignedTeacherId == t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                                            </select>
                                        </td>
                                        <td style="text-align:center; padding:8px 10px;">
                                            <i class="fas fa-trash" style="color:#ef4444; cursor:pointer; font-size:0.9rem;" onclick="TimetableModule.deleteBook(${b.id})"></i>
                                        </td>
                                    </tr>
                                `).join('') || '<tr><td colspan="4" style="text-align:center; padding:2rem; color:#94a3b8;">کوئی کتاب درج نہیں ہے</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    // Switch Tab
    switchShiftTab(tab) {
        this.activeShiftTab = tab;
        this.render();
    },

    // Update Shift Start Time or End Time manually
    async updateShiftTime(shiftKey, field, value) {
        const schedule = await this.getSchedule();
        if (schedule[shiftKey]) {
            schedule[shiftKey][field] = value;
            await this.saveSchedule(schedule);
            this.render();
        }
    },

    // Update Period Specific Field
    async updatePeriodField(shiftKey, periodId, field, value) {
        const schedule = await this.getSchedule();
        if (schedule[shiftKey] && schedule[shiftKey].periods) {
            const p = schedule[shiftKey].periods.find(item => item.id === periodId);
            if (p) {
                p[field] = value;
                await this.saveSchedule(schedule);
            }
        }
    },

    // Update Period Time & Recalculate duration
    async updatePeriodTime(shiftKey, periodId, field, value) {
        const schedule = await this.getSchedule();
        if (schedule[shiftKey] && schedule[shiftKey].periods) {
            const p = schedule[shiftKey].periods.find(item => item.id === periodId);
            if (p) {
                p[field] = value;
                p.duration = this.calcDurationMins(p.startTime, p.endTime);
                await this.saveSchedule(schedule);
                this.render();
            }
        }
    },

    // Add New Period Manually
    async addNewPeriod(shiftKey) {
        const schedule = await this.getSchedule();
        if (!schedule[shiftKey]) return;

        const periods = schedule[shiftKey].periods || [];
        const nextId = periods.length > 0 ? Math.max(...periods.map(p => p.id)) + 1 : 1;
        
        let startTime = schedule[shiftKey].startTime;
        if (periods.length > 0) {
            startTime = periods[periods.length - 1].endTime || schedule[shiftKey].startTime;
        }

        const duration = schedule[shiftKey].periodDuration || 40;
        const endTime = this.addMinutesToTime(startTime, duration);

        periods.push({
            id: nextId,
            name: `گھنٹی ${periods.length + 1}`,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            subject: '',
            className: '',
            teacherId: '',
            isBreak: false
        });

        schedule[shiftKey].periods = periods;
        await this.saveSchedule(schedule);
        this.render();
    },

    // Delete Period
    async deletePeriod(shiftKey, periodId) {
        const schedule = await this.getSchedule();
        if (schedule[shiftKey] && schedule[shiftKey].periods) {
            schedule[shiftKey].periods = schedule[shiftKey].periods.filter(p => p.id !== periodId);
            await this.saveSchedule(schedule);
            this.render();
        }
    },

    // Toggle Period as Break
    async togglePeriodBreak(shiftKey, periodId) {
        const schedule = await this.getSchedule();
        if (schedule[shiftKey] && schedule[shiftKey].periods) {
            const p = schedule[shiftKey].periods.find(item => item.id === periodId);
            if (p) {
                p.isBreak = !p.isBreak;
                if (p.isBreak) p.name = 'وقفہ تفریح / چائے';
                await this.saveSchedule(schedule);
                this.render();
            }
        }
    },

    // ==========================================
    // --- AUTOMATIC GENERATION & PRESETS ---
    // ==========================================

    // Auto-generate Period Slots based on duration and shift start/end
    async autoGeneratePeriodsPrompt(shiftKey) {
        const schedule = await this.getSchedule();
        const shift = schedule[shiftKey];
        if (!shift) return;

        const durationStr = prompt(`برائے مہربانی "${shift.title}" کے لیے فی گھنٹی کا دورانیہ منٹوں میں درج فرمائیں:`, shift.periodDuration || 40);
        if (!durationStr) return;

        const periodDuration = parseInt(durationStr);
        if (isNaN(periodDuration) || periodDuration < 10) {
            alert('دورانیہ کم از کم 10 منٹ ہونا چاہیے!');
            return;
        }

        shift.periodDuration = periodDuration;
        const generatedPeriods = this.generateSlots(shift.startTime, shift.endTime, periodDuration, shift.hasBreak, shift.breakStartTime, shift.breakDuration);
        shift.periods = generatedPeriods;

        await this.saveSchedule(schedule);
        this.render();
        alert(`خودکار طور پر ${generatedPeriods.length} گھنٹیاں کامیابی سے تیار کر دی گئی ہیں۔`);
    },

    generateSlots(startTime, endTime, durationMins, hasBreak = false, breakStart = null, breakMins = 20) {
        const toMins = (str) => {
            const [h, m] = str.split(':').map(Number);
            return h * 60 + m;
        };
        const toTimeStr = (mins) => {
            let h = Math.floor(mins / 60) % 24;
            let m = mins % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };

        const startM = toMins(startTime);
        const endM = toMins(endTime);
        const breakStartM = (hasBreak && breakStart) ? toMins(breakStart) : -1;
        const breakDurationM = parseInt(breakMins) || 20;

        let current = startM;
        const slots = [];
        let slotIndex = 1;
        let breakInserted = false;

        while (current + 10 <= endM) {
            // Check if break time is reached
            if (hasBreak && !breakInserted && breakStartM > 0 && current >= breakStartM) {
                const bEnd = Math.min(endM, current + breakDurationM);
                slots.push({
                    id: slotIndex++,
                    name: 'وقفہ تفریح و استراحت',
                    startTime: toTimeStr(current),
                    endTime: toTimeStr(bEnd),
                    duration: bEnd - current,
                    subject: 'تفریح',
                    className: '',
                    teacherId: '',
                    isBreak: true
                });
                current = bEnd;
                breakInserted = true;
                continue;
            }

            let next = current + durationMins;
            if (next > endM) next = endM;

            slots.push({
                id: slotIndex++,
                name: `گھنٹی ${slots.filter(s => !s.isBreak).length + 1}`,
                startTime: toTimeStr(current),
                endTime: toTimeStr(next),
                duration: next - current,
                subject: '',
                className: '',
                teacherId: '',
                isBreak: false
            });

            current = next;
        }

        return slots;
    },

    // Apply Seasonal / Routine Presets
    async applyPreset(presetType) {
        if (!confirm('کیا آپ واقعی یہ خودکار اوقات سیٹ کرنا چاہتے ہیں؟ موجودہ اوقات نئے پیٹرن کے مطابق اپ ڈیٹ ہو جائیں گے۔')) {
            return;
        }

        const schedule = await this.getSchedule();

        if (presetType === 'summer') {
            // Summer
            schedule.awwal.startTime = '07:30';
            schedule.awwal.endTime = '11:30';
            schedule.awwal.periodDuration = 40;
            schedule.awwal.periods = this.generateSlots('07:30', '11:30', 40, true, '09:30', 20);

            schedule.sani.startTime = '14:00';
            schedule.sani.endTime = '16:30';
            schedule.sani.periodDuration = 35;
            schedule.sani.periods = this.generateSlots('14:00', '16:30', 35);

            schedule.aakhir.startTime = '18:30';
            schedule.aakhir.endTime = '21:30';
            schedule.aakhir.periodDuration = 45;
            schedule.aakhir.periods = this.generateSlots('18:30', '21:30', 45, true, '19:45', 30);

        } else if (presetType === 'winter') {
            // Winter
            schedule.awwal.startTime = '08:00';
            schedule.awwal.endTime = '12:00';
            schedule.awwal.periodDuration = 40;
            schedule.awwal.periods = this.generateSlots('08:00', '12:00', 40, true, '10:00', 20);

            schedule.sani.startTime = '13:30';
            schedule.sani.endTime = '16:00';
            schedule.sani.periodDuration = 35;
            schedule.sani.periods = this.generateSlots('13:30', '16:00', 35);

            schedule.aakhir.startTime = '17:30';
            schedule.aakhir.endTime = '20:30';
            schedule.aakhir.periodDuration = 45;
            schedule.aakhir.periods = this.generateSlots('17:30', '20:30', 45, true, '18:45', 30);

        } else if (presetType === 'hifz') {
            // Hifz
            schedule.awwal.startTime = '05:30';
            schedule.awwal.endTime = '10:30';
            schedule.awwal.subtitle = 'صبح کا سیشن (سبق بعد فجر)';
            schedule.awwal.periodDuration = 60;
            schedule.awwal.periods = [
                { id: 1, name: 'تلاوت و نیا سبق یاد کرنا', startTime: '05:30', endTime: '07:30', duration: 120, subject: 'حفظ نیا سبق', className: 'شعبہ حفظ', teacherId: '', isBreak: false },
                { id: 2, name: 'ناشتہ و تفریح', startTime: '07:30', endTime: '08:15', duration: 45, subject: 'ناشتہ', className: '', teacherId: '', isBreak: true },
                { id: 3, name: 'استاد محترم کو سبق سنانا', startTime: '08:15', endTime: '09:30', duration: 75, subject: 'نیا سبق عرض کرنا', className: 'شعبہ حفظ', teacherId: '', isBreak: false },
                { id: 4, name: 'تجوید و مشق', startTime: '09:30', endTime: '10:30', duration: 60, subject: 'تجوید و قراءات', className: 'شعبہ حفظ', teacherId: '', isBreak: false }
            ];

            schedule.sani.startTime = '14:00';
            schedule.sani.endTime = '16:30';
            schedule.sani.subtitle = 'بعد ظہر کا سیشن (سبقی کا دور)';
            schedule.sani.periods = [
                { id: 1, name: 'سبقی کا انفرادی مطالعہ', startTime: '14:00', endTime: '15:00', duration: 60, subject: 'سبقی یاد کرنا', className: 'شعبہ حفظ', teacherId: '', isBreak: false },
                { id: 2, name: 'استاد محترم کو سبقی سنانا', startTime: '15:00', endTime: '16:30', duration: 90, subject: 'سبقی سنانا', className: 'شعبہ حفظ', teacherId: '', isBreak: false }
            ];

            schedule.aakhir.startTime = '18:30';
            schedule.aakhir.endTime = '21:00';
            schedule.aakhir.subtitle = 'بعد مغرب و عشاء (پختگیِ منزل)';
            schedule.aakhir.periods = [
                { id: 1, name: 'منزل کی دہرائی', startTime: '18:30', endTime: '19:45', duration: 75, subject: 'منزل کا دور', className: 'شعبہ حفظ', teacherId: '', isBreak: false },
                { id: 2, name: 'نمازِ عشاء و طعام', startTime: '19:45', endTime: '20:15', duration: 30, subject: 'عشاء و کھانا', className: '', teacherId: '', isBreak: true },
                { id: 3, name: 'استاد کو منزل سنانا', startTime: '20:15', endTime: '21:00', duration: 45, subject: 'منزل سنانا و حتمی جائزہ', className: 'شعبہ حفظ', teacherId: '', isBreak: false }
            ];
        }

        await this.saveSchedule(schedule);
        this.render();
        alert('خودکار شیڈول بحمداللہ کامیابی سے لوڈ ہو چکا ہے۔');
    },

    async resetToDefault() {
        if (!confirm('کیا آپ واقعی طے شدہ نظام الاوقات پر واپس جانا چاہتے ہیں؟')) return;
        await this.saveSchedule(JSON.parse(JSON.stringify(this.defaultSchedule)));
        this.render();
    },

    // Helper: Add minutes to HH:MM string
    addMinutesToTime(timeStr, minsToAdd) {
        const [h, m] = timeStr.split(':').map(Number);
        const total = h * 60 + m + minsToAdd;
        const newH = Math.floor(total / 60) % 24;
        const newM = total % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    },

    // Helper: Calculate duration between two HH:MM strings in minutes
    calcDurationMins(startStr, endStr) {
        if (!startStr || !endStr) return 0;
        const [h1, m1] = startStr.split(':').map(Number);
        const [h2, m2] = endStr.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60;
        return diff;
    },

    calcTotalDuration(startStr, endStr) {
        const mins = this.calcDurationMins(startStr, endStr);
        const hrs = Math.floor(mins / 60);
        const m = mins % 60;
        if (hrs > 0 && m > 0) return `${hrs} گھنٹے ${m} منٹ`;
        if (hrs > 0) return `${hrs} گھنٹے`;
        return `${m} منٹ`;
    },

    // Books helpers
    async handleSaveBook(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        if (data.assignedTeacherId) data.assignedTeacherId = parseInt(data.assignedTeacherId);
        await MadrassahDB.saveBook(data);
        this.render();
    },

    async assignTeacherToBook(bookId, teacherId) {
        const books = await MadrassahDB.getAllBooks();
        const book = books.find(b => b.id === bookId);
        if (book) {
            book.assignedTeacherId = parseInt(teacherId);
            await MadrassahDB.saveBook(book);
        }
    },

    async deleteBook(id) {
        if (confirm('کیا آپ واقعی یہ کتاب حذف کرنا چاہتے ہیں؟')) {
            await MadrassahDB.deleteBook(id);
            this.render();
        }
    },

    // ==========================================
    // --- PRINT OFFICIAL A4 TIMETABLE SHEET ---
    // ==========================================
    async printOfficialTimetable() {
        const schedule = await this.getSchedule();
        const db = (typeof MadrassahDB !== 'undefined' ? MadrassahDB : (typeof window !== 'undefined' ? window.MadrassahDB : null));
        let teachers = [];
        try {
            if (db && typeof db.getAllTeachers === 'function') {
                teachers = (await db.getAllTeachers()) || [];
            }
        } catch (e) {
            console.warn('Print timetable teachers fetch warning:', e);
        }
        const teacherMap = new Map(teachers.map(t => [t.id, t.name]));

        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert('براہِ کرم براؤزر پاپ اپ کی اجازت دیں۔');
            return;
        }

        const html = `<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>باضابطہ جدول الاوقات - مدرسہ عبد الرحمن بن عوف</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
    <style>
        @page { size: A4 landscape; margin: 8mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Jameel Noori Nastaleeq', Arial, sans-serif; direction: rtl; margin: 0; padding: 10px; color: #0f172a; font-size: 1rem; }
        .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 6px; margin-bottom: 12px; }
        .madrassa-name { font-size: 2.2rem; color: #065f46; font-family: 'Aref Ruqaa', serif; margin: 0; font-weight: bold; }
        .subtitle { font-size: 1.25rem; color: #334155; margin: 2px 0 0 0; }
        .shifts-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .shift-block { border: 1.5px solid #94a3b8; border-radius: 8px; overflow: hidden; background: #fff; }
        .shift-header { padding: 6px 10px; font-weight: bold; text-align: center; border-bottom: 1.5px solid #94a3b8; }
        table { width: 100%; border-collapse: collapse; text-align: center; font-size: 0.88rem; }
        th, td { border: 1px solid #cbd5e1; padding: 5px 4px; }
        th { background: #f1f5f9; color: #0f172a; font-weight: bold; }
        .break-row { background: #fefce8; color: #854d0e; font-weight: bold; }
        .footer { display: flex; justify-content: space-between; margin-top: 25px; padding: 0 40px; font-size: 1.1rem; }
        .sig-box { text-align: center; border-top: 1.5px dashed #475569; width: 180px; padding-top: 6px; font-weight: bold; }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body>
    <div class="no-print" style="text-align:left; margin-bottom:10px;">
        <button onclick="window.print()" style="background:#065f46; color:white; border:none; padding:8px 20px; font-weight:bold; border-radius:6px; cursor:pointer; font-size:1rem;">
            <i class="fas fa-print"></i> پرنٹ کریں (Print)
        </button>
    </div>

    <div class="header">
        <h1 class="madrassa-name">مدرسہ عبد الرحمن بن عوف غفوریہ</h1>
        <div class="subtitle">نظام الاوقات و جدولِ یومیہ برائے طلباء و اساتذہ (سہ گانہ سیشنز)</div>
    </div>

    <div class="shifts-grid">
        <!-- وقتِ اول -->
        <div class="shift-block">
            <div class="shift-header" style="background:#e0f2fe; color:#0369a1;">
                <div style="font-size:1.3rem; font-family:'Aref Ruqaa', serif;">وقتِ اول (صبح کا سیشن)</div>
                <div style="font-size:0.85rem;">ابتداء: ${this.formatTimeUrdu(schedule.awwal.startTime)} | انتہا: ${this.formatTimeUrdu(schedule.awwal.endTime)}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width:12%;">نمبر</th>
                        <th style="width:30%;">اوقات</th>
                        <th style="width:34%;">کتاب / مضمون</th>
                        <th style="width:24%;">استاد</th>
                    </tr>
                </thead>
                <tbody>
                    ${(schedule.awwal.periods || []).map((p, i) => `
                        <tr class="${p.isBreak ? 'break-row' : ''}">
                            <td>${i + 1}</td>
                            <td style="font-size:0.82rem;">${p.startTime} - ${p.endTime}</td>
                            <td style="font-weight:bold;">${p.subject || p.name}</td>
                            <td>${p.isBreak ? '---' : (teacherMap.get(parseInt(p.teacherId)) || '---')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- وقتِ ثانی -->
        <div class="shift-block">
            <div class="shift-header" style="background:#fef3c7; color:#92400e;">
                <div style="font-size:1.3rem; font-family:'Aref Ruqaa', serif;">وقتِ ثانی (بعد ظہر)</div>
                <div style="font-size:0.85rem;">ابتداء: ${this.formatTimeUrdu(schedule.sani.startTime)} | انتہا: ${this.formatTimeUrdu(schedule.sani.endTime)}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width:12%;">نمبر</th>
                        <th style="width:30%;">اوقات</th>
                        <th style="width:34%;">کتاب / مضمون</th>
                        <th style="width:24%;">استاد</th>
                    </tr>
                </thead>
                <tbody>
                    ${(schedule.sani.periods || []).map((p, i) => `
                        <tr class="${p.isBreak ? 'break-row' : ''}">
                            <td>${i + 1}</td>
                            <td style="font-size:0.82rem;">${p.startTime} - ${p.endTime}</td>
                            <td style="font-weight:bold;">${p.subject || p.name}</td>
                            <td>${p.isBreak ? '---' : (teacherMap.get(parseInt(p.teacherId)) || '---')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- وقتِ آخر -->
        <div class="shift-block">
            <div class="shift-header" style="background:#e0e7ff; color:#3730a3;">
                <div style="font-size:1.3rem; font-family:'Aref Ruqaa', serif;">وقتِ آخر (بعد مغرب و عشاء)</div>
                <div style="font-size:0.85rem;">ابتداء: ${this.formatTimeUrdu(schedule.aakhir.startTime)} | انتہا: ${this.formatTimeUrdu(schedule.aakhir.endTime)}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width:12%;">نمبر</th>
                        <th style="width:30%;">اوقات</th>
                        <th style="width:34%;">کتاب / مضمون</th>
                        <th style="width:24%;">استاد</th>
                    </tr>
                </thead>
                <tbody>
                    ${(schedule.aakhir.periods || []).map((p, i) => `
                        <tr class="${p.isBreak ? 'break-row' : ''}">
                            <td>${i + 1}</td>
                            <td style="font-size:0.82rem;">${p.startTime} - ${p.endTime}</td>
                            <td style="font-weight:bold;">${p.subject || p.name}</td>
                            <td>${p.isBreak ? '---' : (teacherMap.get(parseInt(p.teacherId)) || '---')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <div class="footer">
        <div class="sig-box">ناظمِ تعلیمات</div>
        <div class="sig-box">نگرانِ شعبہ حفظ و کتب</div>
        <div class="sig-box">مہر و دستخط مہتمم صاحب</div>
    </div>
</body>
</html>`;

        printWin.document.write(html);
        printWin.document.close();
    }
};

if (typeof window !== 'undefined') {
    window.TimetableModule = TimetableModule;
}
