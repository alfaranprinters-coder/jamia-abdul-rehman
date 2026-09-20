const fs = require('fs');

console.log('--- Preparing Bait-ul-Maal Redesign ---');

let appJs = fs.readFileSync('app.js', 'utf8');

// Find the boundaries of the Bait-ul-Maal section in app.js
const startMarker = '// --- Bait-ul-Maal (Accounts) Management ---';
const endMarker = '    printAdmissionReceipt(student, paidAmount, receiptNo, remaining) {';

if (!appJs.includes(startMarker) || !appJs.includes(endMarker)) {
    console.error('Markers not found in app.js!');
    process.exit(1);
}

const startIndex = appJs.indexOf(startMarker);
const endIndex = appJs.indexOf(endMarker);

console.log('Found Bait-ul-Maal section from index', startIndex, 'to', endIndex);

const newBaitUlMaalCode = `// --- Bait-ul-Maal (Accounts) Management ---
    // State for filtering transaction history
    accountsFilter: {
        search: '',
        type: 'all',
        category: 'all',
        period: 'all'
    },

    async renderAccountsModule(container) {
        const allTransactions = await MadrassahDB.getAllTransactions();
        
        // Compute overall statistics
        const totalIncome = allTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + parseInt(t.amount || 0), 0);
        const totalExpense = allTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + parseInt(t.amount || 0), 0);
        const netBalance = totalIncome - totalExpense;
        const balanceColor = netBalance < 0 ? '#dc2626' : '#059669';
        const balanceBg = netBalance < 0 ? '#fef2f2' : '#ecfdf5';

        // Extract unique categories for filter
        const categories = Array.from(new Set(allTransactions.map(t => t.category).filter(Boolean))).sort();

        // Apply filters
        const filter = this.accountsFilter || { search: '', type: 'all', category: 'all', period: 'all' };
        let filtered = allTransactions.slice();

        // Type filter
        if (filter.type !== 'all') {
            filtered = filtered.filter(t => t.type === filter.type);
        }

        // Category filter
        if (filter.category !== 'all') {
            filtered = filtered.filter(t => t.category === filter.category);
        }

        // Period filter
        const now = new Date();
        if (filter.period === 'today') {
            const todayStr = new Date().toDateString();
            filtered = filtered.filter(t => new Date(t.date || t.timestamp || Date.now()).toDateString() === todayStr);
        } else if (filter.period === 'this_month') {
            const curMonth = now.getMonth();
            const curYear = now.getFullYear();
            filtered = filtered.filter(t => {
                const d = new Date(t.date || t.timestamp || Date.now());
                return d.getMonth() === curMonth && d.getFullYear() === curYear;
            });
        } else if (filter.period === 'last_month') {
            const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            filtered = filtered.filter(t => {
                const d = new Date(t.date || t.timestamp || Date.now());
                return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
            });
        }

        // Search filter
        if (filter.search && filter.search.trim()) {
            const q = filter.search.trim().toLowerCase();
            filtered = filtered.filter(t => {
                const name = (t.name || '').toLowerCase();
                const desc = (t.description || '').toLowerCase();
                const rec = (t.receiptNo || '').toLowerCase();
                const cat = (t.category || '').toLowerCase();
                const phone = (t.phone || '').toLowerCase();
                return name.includes(q) || desc.includes(q) || rec.includes(q) || cat.includes(q) || phone.includes(q);
            });
        }

        // Sort descending by date
        filtered.sort((a, b) => (b.date || 0) - (a.date || 0));

        // Compute displayed stats
        const dispIncome = filtered.filter(t => t.type === 'Income').reduce((sum, t) => sum + parseInt(t.amount || 0), 0);
        const dispExpense = filtered.filter(t => t.type === 'Expense').reduce((sum, t) => sum + parseInt(t.amount || 0), 0);
        const dispBalance = dispIncome - dispExpense;

        container.innerHTML = \`
            <!-- Header Section -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.8rem; flex-wrap:wrap; gap:1rem; background:white; padding:1.2rem 1.6rem; border-radius:18px; box-shadow:0 4px 20px rgba(0,0,0,0.05); border:1px solid #e2e8f0;">
                <div>
                    <h2 style="color:var(--primary); margin:0; font-size:1.9rem; font-family:'Aref Ruqaa', serif; display:flex; align-items:center; gap:10px;">
                        <span style="background:var(--primary-subtle); color:var(--primary); width:44px; height:44px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; font-size:1.3rem; box-shadow:0 4px 10px rgba(6,95,70,0.15);">
                            <i class="fas fa-vault"></i>
                        </span>
                        بیت المال و مرکزی اکاؤنٹس (Bait-ul-Maal)
                    </h2>
                    <div style="color:#64748b; font-size:0.95rem; margin-top:4px;">
                        مدرسہ عبد الرحمن بن عوف غفوریہ — تمام مالی آمدن و اخراجات کا مصدقہ نظام
                    </div>
                </div>

                <div style="display:flex; gap:0.6rem; flex-wrap:wrap; align-items:center;">
                    <button class="btn" style="background:#0284c7; color:white; border:none; border-radius:10px; font-weight:bold; padding:9px 15px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(2,132,199,0.25); cursor:pointer;" onclick="app.navigate('donors')">
                        <i class="fas fa-hand-holding-heart"></i> مستقل ڈونرز
                    </button>
                    <button class="btn" style="background:#059669; color:white; border:none; border-radius:10px; font-weight:bold; padding:10px 18px; font-size:1.05rem; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 14px rgba(5,150,105,0.3); cursor:pointer;" onclick="app.showTransactionModal('Income')">
                        <i class="fas fa-plus-circle"></i> نئی آمدن (Income)
                    </button>
                    <button class="btn" style="background:#dc2626; color:white; border:none; border-radius:10px; font-weight:bold; padding:10px 18px; font-size:1.05rem; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 14px rgba(220,38,38,0.3); cursor:pointer;" onclick="app.showTransactionModal('Expense')">
                        <i class="fas fa-minus-circle"></i> نیا خرچ (Expense)
                    </button>
                    <button class="btn" style="background:#475569; color:white; border:none; border-radius:10px; font-weight:bold; padding:9px 14px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 10px rgba(71,85,105,0.2); cursor:pointer;" onclick="app.printAccountsLedger()" title="مکمل مالیاتی گوشوارہ پرنٹ کریں">
                        <i class="fas fa-print"></i> پرنٹ گوشوارہ
                    </button>
                </div>
            </div>

            <!-- Top 4 KPI Stats Cards -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:1.2rem; margin-bottom:1.8rem;">
                <!-- Total Income Card -->
                <div style="background:white; border-radius:16px; padding:1.2rem; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1px solid #e2e8f0; border-right:5px solid #059669; display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <div style="color:#64748b; font-size:0.95rem; font-weight:600;">کل آمدن و عطیات</div>
                        <div style="font-size:1.7rem; font-weight:bold; color:#059669; font-family:monospace; margin-top:2px;">
                            Rs. \${Number(totalIncome).toLocaleString('en-US')}
                        </div>
                        <div style="font-size:0.8rem; color:#10b981; margin-top:4px;">
                            <i class="fas fa-arrow-down"></i> \${allTransactions.filter(t => t.type === 'Income').length} وصولیاں
                        </div>
                    </div>
                    <div style="width:52px; height:52px; border-radius:14px; background:#ecfdf5; color:#059669; display:flex; align-items:center; justify-content:center; font-size:1.6rem;">
                        <i class="fas fa-wallet"></i>
                    </div>
                </div>

                <!-- Total Expense Card -->
                <div style="background:white; border-radius:16px; padding:1.2rem; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1px solid #e2e8f0; border-right:5px solid #dc2626; display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <div style="color:#64748b; font-size:0.95rem; font-weight:600;">کل اخراجات و ادائیگیاں</div>
                        <div style="font-size:1.7rem; font-weight:bold; color:#dc2626; font-family:monospace; margin-top:2px;">
                            Rs. \${Number(totalExpense).toLocaleString('en-US')}
                        </div>
                        <div style="font-size:0.8rem; color:#ef4444; margin-top:4px;">
                            <i class="fas fa-arrow-up"></i> \${allTransactions.filter(t => t.type === 'Expense').length} ادائیگیاں
                        </div>
                    </div>
                    <div style="width:52px; height:52px; border-radius:14px; background:#fef2f2; color:#dc2626; display:flex; align-items:center; justify-content:center; font-size:1.6rem;">
                        <i class="fas fa-receipt"></i>
                    </div>
                </div>

                <!-- Net Cash Balance Card -->
                <div style="background:white; border-radius:16px; padding:1.2rem; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1px solid #e2e8f0; border-right:5px solid \${balanceColor}; display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <div style="color:#64748b; font-size:0.95rem; font-weight:600;">خالص بیلنس (کیش ان ہینڈ)</div>
                        <div style="font-size:1.7rem; font-weight:bold; color:\${balanceColor}; font-family:monospace; margin-top:2px;">
                            Rs. \${Number(netBalance).toLocaleString('en-US')}
                        </div>
                        <div style="font-size:0.8rem; color:\${balanceColor}; margin-top:4px;">
                            <i class="fas fa-scale-balanced"></i> \${netBalance >= 0 ? 'موجودہ خالص بچت' : 'منفی خسارہ (Alert)'}
                        </div>
                    </div>
                    <div style="width:52px; height:52px; border-radius:14px; background:\${balanceBg}; color:\${balanceColor}; display:flex; align-items:center; justify-content:center; font-size:1.6rem;">
                        <i class="fas fa-coins"></i>
                    </div>
                </div>

                <!-- Total Count Card -->
                <div style="background:white; border-radius:16px; padding:1.2rem; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1px solid #e2e8f0; border-right:5px solid #6366f1; display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <div style="color:#64748b; font-size:0.95rem; font-weight:600;">مجموعی لین دین</div>
                        <div style="font-size:1.7rem; font-weight:bold; color:#4f46e5; font-family:monospace; margin-top:2px;">
                            \${allTransactions.length}
                        </div>
                        <div style="font-size:0.8rem; color:#6366f1; margin-top:4px;">
                            کل ریکارڈ شدہ اندراجات
                        </div>
                    </div>
                    <div style="width:52px; height:52px; border-radius:14px; background:#eef2ff; color:#4f46e5; display:flex; align-items:center; justify-content:center; font-size:1.6rem;">
                        <i class="fas fa-list-check"></i>
                    </div>
                </div>
            </div>

            <!-- Filter & Search Toolbar -->
            <div style="background:white; border-radius:16px; padding:1.2rem 1.4rem; box-shadow:0 4px 16px rgba(0,0,0,0.04); border:1px solid #e2e8f0; margin-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem; flex-wrap:wrap; gap:8px;">
                    <div style="font-weight:bold; color:#1e293b; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-filter" style="color:var(--primary);"></i> تلاش و فلٹرز برائے ٹرانزیکشن ہسٹری
                    </div>
                    <div style="font-size:0.85rem; color:#64748b;">
                        ظاہر شدہ: <b>\${filtered.length}</b> از کل <b>\${allTransactions.length}</b> اندراجات
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:2fr 1.2fr 1.2fr 1.2fr auto; gap:10px; align-items:center;">
                    <!-- Search Input -->
                    <div style="position:relative;">
                        <i class="fas fa-search" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); color:#94a3b8;"></i>
                        <input type="text" id="acc_search_input" value="\${filter.search || ''}" placeholder="نام، رسید نمبر، فون یا تفصیل سے تلاش کریں..." style="width:100%; padding:9px 36px 9px 12px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:0.95rem;" oninput="app.updateAccountsFilter('search', this.value)">
                    </div>

                    <!-- Type Filter -->
                    <div>
                        <select id="acc_type_filter" style="width:100%; padding:9px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:0.95rem;" onchange="app.updateAccountsFilter('type', this.value)">
                            <option value="all" \${filter.type === 'all' ? 'selected' : ''}>سبھی لین دین (All)</option>
                            <option value="Income" \${filter.type === 'Income' ? 'selected' : ''}>صرف آمدن (Income Only)</option>
                            <option value="Expense" \${filter.type === 'Expense' ? 'selected' : ''}>صرف اخراجات (Expense Only)</option>
                        </select>
                    </div>

                    <!-- Category Filter -->
                    <div>
                        <select id="acc_cat_filter" style="width:100%; padding:9px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:0.95rem;" onchange="app.updateAccountsFilter('category', this.value)">
                            <option value="all">تمام کیٹیگریز / مدات</option>
                            \${categories.map(c => \`<option value="\${c}" \${filter.category === c ? 'selected' : ''}>\${c}</option>\`).join('')}
                        </select>
                    </div>

                    <!-- Period Filter -->
                    <div>
                        <select id="acc_period_filter" style="width:100%; padding:9px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:0.95rem;" onchange="app.updateAccountsFilter('period', this.value)">
                            <option value="all" \${filter.period === 'all' ? 'selected' : ''}>مکمل ریکارڈ (All Time)</option>
                            <option value="today" \${filter.period === 'today' ? 'selected' : ''}>صرف آج (Today)</option>
                            <option value="this_month" \${filter.period === 'this_month' ? 'selected' : ''}>رواں ماہ (This Month)</option>
                            <option value="last_month" \${filter.period === 'last_month' ? 'selected' : ''}>گزشتہ ماہ (Last Month)</option>
                        </select>
                    </div>

                    <!-- Clear Filter Button -->
                    <div>
                        <button class="btn" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; border-radius:10px; padding:9px 12px; font-size:0.9rem; cursor:pointer;" onclick="app.clearAccountsFilters()" title="تمام فلٹرز ختم کریں">
                            <i class="fas fa-rotate-left"></i> ری سیٹ
                        </button>
                    </div>
                </div>
            </div>

            <!-- Justified Transaction History Card & Table -->
            <div style="background:white; border-radius:18px; box-shadow:0 8px 30px rgba(0,0,0,0.06); border:1px solid #e2e8f0; overflow:hidden;">
                <div style="padding:1.2rem 1.6rem; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div style="font-weight:bold; color:var(--primary); font-size:1.2rem; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-history"></i> ٹرانزیکشن ہسٹری و لیجر (Financial Transaction Ledger)
                    </div>
                    <div style="font-size:0.9rem; color:#64748b;">
                        آمدن: <b style="color:#059669;">Rs. \${Number(dispIncome).toLocaleString('en-US')}</b> | 
                        اخراجات: <b style="color:#dc2626;">Rs. \${Number(dispExpense).toLocaleString('en-US')}</b> | 
                        بیلنس: <b style="color:\${dispBalance >= 0 ? '#059669' : '#dc2626'};">Rs. \${Number(dispBalance).toLocaleString('en-US')}</b>
                    </div>
                </div>

                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; text-align:right; font-size:0.98rem;">
                        <thead>
                            <tr style="background:#f1f5f9; color:#334155; border-bottom:2px solid #cbd5e1; font-weight:bold;">
                                <th style="padding:12px 14px; width:110px; text-align:center;">رسید / واؤچر</th>
                                <th style="padding:12px 14px; width:110px; text-align:center;">تاریخ</th>
                                <th style="padding:12px 14px; width:130px; text-align:center;">نوعیت و مد</th>
                                <th style="padding:12px 14px; width:220px; text-align:right;">معاون / وصول کنندہ</th>
                                <th style="padding:12px 14px; width:110px; text-align:center;">طریقہ</th>
                                <th style="padding:12px 14px; text-align:right;">تفصیل / مد</th>
                                <th style="padding:12px 14px; width:140px; text-align:left;">رقم (روپے)</th>
                                <th style="padding:12px 14px; width:170px; text-align:center;">کارروائی</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${filtered.length > 0 ? filtered.map((t, idx) => {
                                const isIncome = t.type === 'Income';
                                const dObj = new Date(t.date || t.timestamp || Date.now());
                                const dateStr = !isNaN(dObj.getTime()) 
                                    ? \`\${String(dObj.getDate()).padStart(2, '0')}/\${String(dObj.getMonth() + 1).padStart(2, '0')}/\${dObj.getFullYear()}\`
                                    : (t.date || '---');
                                const rowBg = idx % 2 === 0 ? '#ffffff' : '#fcfdfd';
                                const formattedWa = (t.phone && isIncome) ? this.formatWhatsAppNumber(t.phone) : null;

                                return \`
                                    <tr style="background:\${rowBg}; border-bottom:1px solid #edf2f7; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='\${rowBg}'">
                                        <!-- Receipt / Voucher Badge -->
                                        <td style="padding:12px 10px; text-align:center;">
                                            <span style="background:\${isIncome ? '#ecfdf5' : '#fef2f2'}; color:\${isIncome ? '#047857' : '#b91c1c'}; border:1px solid \${isIncome ? '#a7f3d0' : '#fecaca'}; border-radius:6px; padding:3px 8px; font-size:0.8rem; font-family:monospace; font-weight:bold; display:inline-block;">
                                                \${t.receiptNo || (isIncome ? 'R-' + t.id : 'V-' + t.id)}
                                            </span>
                                        </td>

                                        <!-- Date -->
                                        <td style="padding:12px 10px; text-align:center; color:#475569; font-size:0.9rem; font-family:monospace;">
                                            \${dateStr}
                                        </td>

                                        <!-- Type & Category Badge -->
                                        <td style="padding:12px 10px; text-align:center;">
                                            <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
                                                <span style="background:\${isIncome ? '#10b981' : '#ef4444'}; color:white; border-radius:12px; padding:2px 10px; font-size:0.75rem; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">
                                                    <i class="fas \${isIncome ? 'fa-plus' : 'fa-minus'}"></i> \${isIncome ? 'آمدن' : 'خرچ'}
                                                </span>
                                                <span style="color:#334155; font-size:0.85rem; font-weight:600;">
                                                    \${t.category || 'عام'}
                                                </span>
                                            </div>
                                        </td>

                                        <!-- Payee / Donor Name -->
                                        <td style="padding:12px 14px; text-align:right;">
                                            <div style="font-weight:bold; color:#1e293b; font-size:1.02rem;">
                                                \${t.name || (isIncome ? 'عام معاون محترم' : 'ادائیگی مصارف')}
                                            </div>
                                            \${t.phone ? \`<div style="font-size:0.8rem; color:#64748b; font-family:monospace; direction:ltr; text-align:right; margin-top:2px;"><i class="fas fa-phone" style="font-size:0.75rem;"></i> \${t.phone}</div>\` : ''}
                                            \${t.address ? \`<div style="font-size:0.8rem; color:#64748b; margin-top:1px;"><i class="fas fa-map-marker-alt" style="font-size:0.75rem; color:#94a3b8;"></i> \${t.address}</div>\` : ''}
                                        </td>

                                        <!-- Payment Method -->
                                        <td style="padding:12px 10px; text-align:center;">
                                            <span style="background:#f1f5f9; color:#475569; border-radius:6px; padding:3px 8px; font-size:0.8rem; font-weight:600;">
                                                \${t.paymentMethod || 'نقد (Cash)'}
                                            </span>
                                        </td>

                                        <!-- Description -->
                                        <td style="padding:12px 14px; color:#475569; font-size:0.92rem; line-height:1.4;">
                                            \${t.description ? t.description : '<span style="color:#cbd5e1;">—</span>'}
                                        </td>

                                        <!-- Amount (Left-aligned numerals for financial clarity) -->
                                        <td style="padding:12px 14px; text-align:left; font-family:monospace; font-weight:bold; font-size:1.15rem; color:\${isIncome ? '#059669' : '#dc2626'}; direction:ltr;">
                                            \${isIncome ? '+' : '-'} Rs. \${Number(t.amount).toLocaleString('en-US')}
                                        </td>

                                        <!-- Actions -->
                                        <td style="padding:12px 10px; text-align:center;">
                                            <div style="display:inline-flex; gap:5px; align-items:center; justify-content:center;">
                                                \${isIncome ? \`
                                                    <button class="btn btn-sm" style="background:#0284c7; color:white; border:none; padding:5px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" onclick="app.printDonationReceipt(\${t.id})" title="باضابطہ رسید پرنٹ / Save PDF">
                                                        <i class="fas fa-print"></i>
                                                    </button>
                                                    <button class="btn btn-sm" style="background:#059669; color:white; border:none; padding:5px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" onclick="app.downloadDonationReceipt(\${t.id})" title="رسید تصویر ڈاؤن لوڈ کریں (PNG)">
                                                        <i class="fas fa-download"></i>
                                                    </button>
                                                    \${formattedWa ? \`
                                                        <button class="btn btn-sm" style="background:#16a34a; color:white; border:none; padding:5px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" onclick="app.shareAccountsReceiptWhatsApp(\${t.id})" title="واٹس ایپ پر رسید بھیجیں">
                                                            <i class="fab fa-whatsapp"></i>
                                                        </button>
                                                    \` : ''}
                                                \` : ''}
                                                <button class="btn btn-sm" style="background:#475569; color:white; border:none; padding:5px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" onclick="app.editTransaction(\${t.id})" title="ترمیم / ایڈیٹ">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm" style="background:#fee2e2; color:#b91c1c; border:none; padding:5px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" onclick="app.deleteTransaction(\${t.id})" title="ڈیلیٹ / حذف">
                                                    <i class="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                \`;
                            }).join('') : \`
                                <tr>
                                    <td colspan="8" style="text-align:center; padding:3.5rem 1rem; color:#94a3b8;">
                                        <i class="fas fa-folder-open" style="font-size:3rem; margin-bottom:1rem; display:block; color:#cbd5e1;"></i>
                                        <div style="font-size:1.15rem; font-weight:bold; color:#64748b;">کوئی لین دین کا ریکارڈ نہیں ملا</div>
                                        <div style="font-size:0.9rem; color:#94a3b8; margin-top:4px;">مطلوبہ فلٹرز کے مطابق کوئی ٹرانزیکشن موجود نہیں ہے۔</div>
                                    </td>
                                </tr>
                            \`}
                        </tbody>
                        <!-- Table Summary Footer -->
                        \${filtered.length > 0 ? \`
                            <tfoot>
                                <tr style="background:#f8fafc; border-top:2px solid #cbd5e1; font-weight:bold; color:#1e293b;">
                                    <td colspan="3" style="padding:14px; text-align:right;">
                                        مجموعی میزان (Grand Total):
                                    </td>
                                    <td colspan="3" style="padding:14px; font-size:0.92rem; color:#64748b;">
                                        آمدن: <span style="color:#059669; font-family:monospace;">+Rs. \${Number(dispIncome).toLocaleString('en-US')}</span> | 
                                        اخراجات: <span style="color:#dc2626; font-family:monospace;">-Rs. \${Number(dispExpense).toLocaleString('en-US')}</span>
                                    </td>
                                    <td style="padding:14px; text-align:left; font-family:monospace; font-size:1.25rem; color:\${dispBalance >= 0 ? '#059669' : '#dc2626'}; direction:ltr;">
                                        Rs. \${Number(dispBalance).toLocaleString('en-US')}
                                    </td>
                                    <td style="padding:14px; text-align:center; font-size:0.85rem; color:#64748b;">
                                        \${filtered.length} ریکارڈز
                                    </td>
                                </tr>
                            </tfoot>
                        \` : ''}
                    </table>
                </div>
            </div>
        \`;
    },

    updateAccountsFilter(field, value) {
        if (!this.accountsFilter) {
            this.accountsFilter = { search: '', type: 'all', category: 'all', period: 'all' };
        }
        this.accountsFilter[field] = value;
        this.renderAccountsModule(document.getElementById('main-content'));
    },

    clearAccountsFilters() {
        this.accountsFilter = { search: '', type: 'all', category: 'all', period: 'all' };
        this.renderAccountsModule(document.getElementById('main-content'));
    },

    // --- Modern Professional Transaction Modal Window ---
    showTransactionModal(type, existingData = null) {
        const isIncome = type === 'Income';
        const modalId = 'modal_transaction_dialog';
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        const categories = isIncome 
            ? ['عمومی تعاون', 'زکوٰۃ', 'صدقات واجبہ', 'صدقات نافلہ', 'فیس', 'جمعہ فنڈ', 'جنس / راشن', 'دیگر']
            : ['تنخواہ عملہ', 'طعام و راشن', 'یوٹیلیٹی بلز', 'تعمیر و مرمت', 'اسٹیشنری و کتب', 'مہمان نوازی', 'سفری مصارف', 'متفرق اخراجات'];

        this.editTransactionId = existingData ? existingData.id : null;

        // Determine default date
        let defaultDateStr = '';
        if (existingData && existingData.date) {
            const d = new Date(existingData.date);
            if (!isNaN(d.getTime())) {
                defaultDateStr = d.toISOString().split('T')[0];
            }
        }
        if (!defaultDateStr) {
            defaultDateStr = new Date().toISOString().split('T')[0];
        }

        const autoReceiptNo = existingData ? (existingData.receiptNo || '') : (isIncome ? ('DON-' + Math.floor(100000 + Math.random() * 900000)) : ('VOU-' + Math.floor(100000 + Math.random() * 900000)));

        const modalHtml = \`
            <div id="\${modalId}" style="position:fixed; inset:0; background:rgba(15,23,42,0.72); backdrop-filter:blur(6px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:15px; animation:fadeIn 0.25s ease-out;">
                <div style="background:#ffffff; border-radius:22px; width:100%; max-width:660px; max-height:92vh; overflow-y:auto; box-shadow:0 25px 60px rgba(0,0,0,0.35); border:2px solid \${isIncome ? '#10b981' : '#f43f5e'};">
                    
                    <!-- Header -->
                    <div style="background:linear-gradient(135deg, \${isIncome ? '#065f46 0%, #047857 100%' : '#991b1b 0%, #b91c1c 100%'}); color:white; padding:1.2rem 1.6rem; border-top-left-radius:20px; border-top-right-radius:20px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="background:rgba(255,255,255,0.2); width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
                                <i class="fas \${isIncome ? 'fa-hand-holding-dollar' : 'fa-file-invoice-dollar'}"></i>
                            </span>
                            <div>
                                <h3 style="margin:0; font-family:'Aref Ruqaa', serif; font-size:1.6rem; color:white;">
                                    \${existingData ? 'اصلاح و ترمیمِ لین دین' : (isIncome ? 'بیت المال: نئی آمدن کا اندراج' : 'بیت المال: نئے خرچ کا اندراج')}
                                </h3>
                                <div style="font-size:0.85rem; opacity:0.9; margin-top:2px;">
                                    \${isIncome ? 'عطیات، زکوٰۃ، فیس و دیگر وصولیوں کا باضابطہ اندراج' : 'ادائیگی مصارف، بلز و تنخواہوں کا باضابطہ واؤچر'}
                                </div>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('\${modalId}').remove()" style="background:rgba(255,255,255,0.15); border:none; color:white; width:34px; height:34px; border-radius:50%; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Form Content -->
                    <form onsubmit="app.handleTransactionSubmit(event)" style="padding:1.6rem;">
                        <input type="hidden" name="type" value="\${type}">

                        <!-- Quick Category Pills -->
                        <div style="margin-bottom:1.2rem;">
                            <label style="display:block; font-size:0.9rem; font-weight:bold; color:#475569; margin-bottom:6px;">
                                <i class="fas fa-tags" style="color:\${isIncome ? '#059669' : '#dc2626'};"></i> فوری کیٹیگری / مد منتخب فرمائیں:
                            </label>
                            <div style="display:flex; flex-wrap:wrap; gap:6px;">
                                \${categories.map(c => \`
                                    <button type="button" class="btn" style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; border-radius:20px; padding:4px 12px; font-size:0.85rem; cursor:pointer; transition:all 0.2s;" onclick="document.getElementById('modal_category_select').value='\${c}'" onmouseover="this.style.background='\${isIncome ? '#ecfdf5' : '#fef2f2'}'; this.style.borderColor='\${isIncome ? '#10b981' : '#ef4444'}';" onmouseout="this.style.background='#f1f5f9'; this.style.borderColor='#cbd5e1';">
                                        \${c}
                                    </button>
                                \`).join('')}
                            </div>
                        </div>

                        <!-- Row 1: Category & Date -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                            <div>
                                <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:5px; color:#1e293b;">
                                    کیٹیگری / مد <span style="color:#dc2626;">*</span>
                                </label>
                                <select name="category" id="modal_category_select" class="mms-select" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1; font-size:1rem;" required>
                                    \${categories.map(c => \`<option value="\${c}" \${existingData && existingData.category === c ? 'selected' : ''}>\${c}</option>\`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:5px; color:#1e293b;">
                                    تاریخ <span style="color:#dc2626;">*</span>
                                </label>
                                <input type="date" name="dateInput" value="\${defaultDateStr}" style="width:100%; padding:9px 12px; border-radius:10px; border:1.5px solid #cbd5e1; font-size:0.95rem; font-family:monospace;" required>
                            </div>
                        </div>

                        <!-- Row 2: Amount & Payment Method -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:0.6rem;">
                            <div>
                                <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:5px; color:#1e293b;">
                                    رقم (Amount in PKR) <span style="color:#dc2626;">*</span>
                                </label>
                                <div style="position:relative;">
                                    <input type="number" name="amount" id="modal_trans_amount" step="any" min="1" value="\${existingData ? existingData.amount : ''}" placeholder="مثلاً: 5000" style="width:100%; padding:10px 12px; border-radius:10px; border:2px solid \${isIncome ? '#059669' : '#dc2626'}; font-size:1.25rem; font-weight:bold; font-family:monospace; color:#0f172a;" required oninput="
                                        const words = (window.app && typeof window.app.numberToUrduWords === 'function') ? window.app.numberToUrduWords(this.value) : '';
                                        const wordsEl = document.getElementById('modal_amount_words');
                                        if (wordsEl) wordsEl.innerText = words ? words : '—';
                                    ">
                                </div>
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:5px; color:#1e293b;">
                                    طریقہ ادائیگی
                                </label>
                                <select name="paymentMethod" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1; font-size:1rem;">
                                    <option value="نقد (Cash)" \${existingData && existingData.paymentMethod === 'نقد (Cash)' ? 'selected' : ''}>نقد (Cash)</option>
                                    <option value="بینک اکاؤنٹ (Bank)" \${existingData && existingData.paymentMethod === 'بینک اکاؤنٹ (Bank)' ? 'selected' : ''}>بینک اکاؤنٹ (Bank)</option>
                                    <option value="جاز کیش (JazzCash)" \${existingData && existingData.paymentMethod === 'جاز کیش (JazzCash)' ? 'selected' : ''}>جاز کیش (JazzCash)</option>
                                    <option value="ایزی پیسہ (EasyPaisa)" \${existingData && existingData.paymentMethod === 'ایزی پیسہ (EasyPaisa)' ? 'selected' : ''}>ایزی پیسہ (EasyPaisa)</option>
                                    <option value="چیک (Cheque)" \${existingData && existingData.paymentMethod === 'چیک (Cheque)' ? 'selected' : ''}>چیک (Cheque)</option>
                                    <option value="دیگر" \${existingData && existingData.paymentMethod === 'دیگر' ? 'selected' : ''}>دیگر</option>
                                </select>
                            </div>
                        </div>

                        <!-- Live Urdu Words Display -->
                        <div style="background:\${isIncome ? '#f0fdf4' : '#fff1f2'}; border:1px dashed \${isIncome ? '#86efac' : '#fca5a5'}; border-radius:8px; padding:6px 12px; margin-bottom:1rem; font-size:0.92rem; display:flex; gap:6px; align-items:center;">
                            <span style="color:#64748b; font-weight:600;">مبلغ (الفاظ میں):</span>
                            <span id="modal_amount_words" style="font-weight:bold; color:\${isIncome ? '#15803d' : '#be123c'};">
                                \${existingData && existingData.amount ? (this.numberToUrduWords(existingData.amount)) : 'رقم درج فرمائیں...'}
                            </span>
                        </div>

                        <!-- Row 3: Name & Phone -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                            <div>
                                <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:5px; color:#1e293b;">
                                    \${isIncome ? 'نامِ معاون / ڈونر' : 'نامِ وصول کنندہ / بنام'} <span style="color:#dc2626;">*</span>
                                </label>
                                <input type="text" name="name" value="\${existingData ? existingData.name : ''}" placeholder="\${isIncome ? 'مثلاً: حاجی محمد یوسف صاحب' : 'مثلاً: قاری صاحب / دکاندار / ملازم'}" style="width:100%; padding:9px 12px; border-radius:10px; border:1.5px solid #cbd5e1; font-size:0.95rem;" required>
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:5px; color:#1e293b;">
                                    موبائل / واٹس ایپ نمبر
                                </label>
                                <input type="text" name="phone" value="\${existingData && existingData.phone ? existingData.phone : ''}" placeholder="03001234567" style="width:100%; padding:9px 12px; border-radius:10px; border:1.5px solid #cbd5e1; font-size:0.95rem; font-family:monospace; direction:ltr; text-align:right;">
                            </div>
                        </div>

                        <!-- Row 4: Address & Receipt No -->
                        <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:1rem; margin-bottom:1rem;">
                            <div>
                                <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:5px; color:#1e293b;">
                                    پتہ / شہر (Address)
                                </label>
                                <input type="text" name="address" value="\${existingData && existingData.address ? existingData.address : ''}" placeholder="مثلاً: بوسال کالونی، ضلع خانیوال" style="width:100%; padding:9px 12px; border-radius:10px; border:1.5px solid #cbd5e1; font-size:0.95rem;">
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:5px; color:#1e293b;">
                                    \${isIncome ? 'رسید نمبر' : 'واؤچر نمبر'}
                                </label>
                                <input type="text" name="receiptNo" value="\${existingData ? (existingData.receiptNo || '') : autoReceiptNo}" style="width:100%; padding:9px 12px; border-radius:10px; border:1.5px solid #cbd5e1; font-size:0.95rem; font-family:monospace;">
                            </div>
                        </div>

                        <!-- Row 5: Detailed Description -->
                        <div style="margin-bottom:1.4rem;">
                            <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:5px; color:#1e293b;">
                                تفصیل / مد / ریمارکس (Description / Purpose)
                            </label>
                            <textarea name="description" rows="2" placeholder="لین دین کی مزید ضروری تفصیل یا نوٹ درج فرمائیں..." style="width:100%; padding:9px 12px; border-radius:10px; border:1.5px solid #cbd5e1; font-size:0.95rem;">\${existingData ? (existingData.description || '') : ''}</textarea>
                        </div>

                        <!-- Submit Buttons -->
                        <div style="display:flex; gap:10px; justify-content:flex-end;">
                            <button type="button" onclick="document.getElementById('\${modalId}').remove()" class="btn" style="background:#f1f5f9; color:#475569; border:none; border-radius:10px; padding:10px 20px; font-size:1rem; cursor:pointer; font-weight:bold;">
                                منسوخ کریں (Cancel)
                            </button>
                            <button type="submit" class="btn" style="background:\${isIncome ? '#059669' : '#dc2626'}; color:white; border:none; border-radius:10px; padding:11px 28px; font-size:1.1rem; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 15px \${isIncome ? 'rgba(5,150,105,0.35)' : 'rgba(220,38,38,0.35)'};">
                                <i class="fas \${existingData ? 'fa-check' : (isIncome ? 'fa-plus' : 'fa-check')}"></i>
                                \${existingData ? 'تبدیلی محفوظ فرمائیں' : (isIncome ? 'آمدن محفوظ کریں' : 'خرچ محفوظ کریں')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        \`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // Backward compatibility alias for showTransactionForm
    showTransactionForm(type, existingData = null) {
        this.showTransactionModal(type, existingData);
    },

    async editTransaction(id) {
        const transactions = await MadrassahDB.getAllTransactions();
        const t = transactions.find(item => item.id === id);
        if (!t) return;

        if (t.receiptNo && t.receiptNo.startsWith('RF-')) {
            alert('یہ لین دین طلباء کی فیس کی وصولی سے متعلق ہے۔ براہ کرم اسے فیس والے سیکشن میں جا کر تبدیل فرمائیں۔');
            return;
        }

        this.showTransactionModal(t.type, t);
    },

    async handleTransactionSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Parse date
        if (data.dateInput) {
            const parsed = new Date(data.dateInput + 'T12:00:00');
            data.date = !isNaN(parsed.getTime()) ? parsed.getTime() : Date.now();
        } else {
            data.date = this.editTransactionId ? (await MadrassahDB.getAllTransactions()).find(t => t.id === this.editTransactionId).date : Date.now();
        }
        delete data.dateInput;

        data.amount = parseFloat(data.amount) || 0;

        const isNew = !this.editTransactionId;
        if (this.editTransactionId) {
            data.id = this.editTransactionId;
        }

        const savedId = await MadrassahDB.saveTransaction(data);
        const modal = document.getElementById('modal_transaction_dialog');
        if (modal) modal.remove();

        this.editTransactionId = null;
        await this.renderAccountsModule(document.getElementById('main-content'));

        // If it was a newly added Income, offer instant receipt print/download modal
        if (isNew && data.type === 'Income') {
            const finalId = savedId || data.id;
            this.showAccountsInstantReceiptModal(finalId, data);
        } else {
            alert(isNew ? 'اندراج کامیابی سے محفوظ کر لیا گیا ہے۔' : 'اصلاح کامیابی سے محفوظ کر لی گئی ہے۔');
        }
    },

    // Instant Receipt Modal after entering Income in Accounts
    showAccountsInstantReceiptModal(id, data) {
        const modalId = 'acc_instant_receipt_modal';
        const oldModal = document.getElementById(modalId);
        if (oldModal) oldModal.remove();

        const amountWords = this.numberToUrduWords(data.amount);
        const formattedWa = data.phone ? this.formatWhatsAppNumber(data.phone) : null;

        const modalHtml = \`
            <div id="\${modalId}" style="position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:99999; display:flex; align-items:center; justify-content:center; padding:15px; backdrop-filter:blur(4px); animation:fadeIn 0.2s ease-out;">
                <div style="background:white; border-radius:20px; width:100%; max-width:480px; box-shadow:0 25px 50px rgba(0,0,0,0.3); border:2px solid #10b981; overflow:hidden;">
                    <div style="background:linear-gradient(135deg, #065f46, #047857); color:white; padding:1.2rem; text-align:center;">
                        <div style="width:48px; height:48px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; margin:0 auto 8px auto; font-size:1.5rem;">
                            <i class="fas fa-check-circle" style="color:#4ade80;"></i>
                        </div>
                        <h3 style="margin:0; font-family:'Aref Ruqaa', serif; font-size:1.6rem; color:white;">آمدن کا باضابطہ اندراج مکمل</h3>
                        <div style="font-size:0.9rem; opacity:0.9; margin-top:2px;">رسید نمبر: \${data.receiptNo || ('DON-' + id)}</div>
                    </div>

                    <div style="padding:1.4rem;">
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:1.2rem;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.92rem;">
                                <span style="color:#64748b;">معاون محترم:</span>
                                <span style="font-weight:bold; color:#1e293b;">\${data.name}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.92rem;">
                                <span style="color:#64748b;">مد / کیٹیگری:</span>
                                <span style="font-weight:bold; color:#047857;">\${data.category}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.92rem;">
                                <span style="color:#64748b;">وصول شدہ رقم:</span>
                                <span style="font-weight:bold; color:#059669; font-size:1.2rem; font-family:monospace;">Rs. \${Number(data.amount).toLocaleString('en-US')}</span>
                            </div>
                            <div style="border-top:1px dashed #cbd5e1; padding-top:6px; font-size:0.85rem; color:#475569;">
                                مبلغ: \${amountWords}
                            </div>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <button onclick="app.printDonationReceipt(\${id}); document.getElementById('\${modalId}').remove();" class="btn" style="background:#0284c7; color:white; font-weight:bold; padding:11px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-size:1.05rem;">
                                <i class="fas fa-print"></i> باضابطہ رسید پرنٹ / Save as PDF
                            </button>
                            <button onclick="app.downloadDonationReceipt(\${id}); document.getElementById('\${modalId}').remove();" class="btn" style="background:#059669; color:white; font-weight:bold; padding:11px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-size:1.05rem;">
                                <i class="fas fa-file-arrow-down"></i> رسید کی تصویر ڈاؤن لوڈ کریں (PNG)
                            </button>
                            \${formattedWa ? \`
                                <button onclick="app.shareAccountsReceiptWhatsApp(\${id}); document.getElementById('\${modalId}').remove();" class="btn" style="background:#16a34a; color:white; font-weight:bold; padding:10px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                                    <i class="fab fa-whatsapp" style="font-size:1.2rem;"></i> واٹس ایپ پر رسید و شکریہ بھیجیں
                                </button>
                            \` : ''}
                            <button type="button" onclick="document.getElementById('\${modalId}').remove()" class="btn" style="background:#f1f5f9; color:#475569; padding:9px; border-radius:8px; border:none; cursor:pointer; font-weight:bold; margin-top:4px;">
                                مکمل (Done)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        \`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    async shareAccountsReceiptWhatsApp(id) {
        const transactions = await MadrassahDB.getAllTransactions();
        const t = transactions.find(item => item.id === id);
        if (!t) {
            alert('ریکارڈ نہیں مل سکا!');
            return;
        }

        if (!t.phone) {
            alert('اس ریکارڈ کے لیے کوئی موبائل یا واٹس ایپ نمبر درج نہیں ہے!');
            return;
        }

        const formattedPhone = this.formatWhatsAppNumber(t.phone);
        if (!formattedPhone) {
            alert('درج شدہ موبائل نمبر درست نہیں ہے!');
            return;
        }

        const dateStr = new Date(t.date || Date.now()).toLocaleDateString('ur-PK');
        const amountWords = this.numberToUrduWords(t.amount);

        const msg = \`*مدرسہ عبد الرحمن بن عوف غفوریہ (بوسال کالونی، خانیوال)*%0A\` +
            \`*باضابطہ رسیدِ عطیہ / مالی تعاون*%0A%0A\` +
            \`محترم جناب *"\${t.name}"* صاحب!%0A\` +
            \`السلام علیکم ورحمۃ اللہ وبرکاتہ%0A%0A\` +
            \`مدرسہ ہذا کے بیت المال میں آپ کا تعاون بفضلِ خدا موصول ہو گیا ہے:%0A%0A\` +
            \`📜 *رسید نمبر:* \${t.receiptNo || ('DON-' + t.id)}%0A\` +
            \`📅 *تاریخ:* \${dateStr}%0A\` +
            \`🏷️ *مد / کیٹیگری:* \${t.category}%0A\` +
            \`💰 *رقم:* Rs. \${Number(t.amount).toLocaleString('en-US')}/-%0A\` +
            \`✍️ *مبلغ:* \${amountWords}%0A\` +
            (t.paymentMethod ? \`💳 *ذریعہ:* \${t.paymentMethod}%0A\` : '') +
            (t.description ? \`📝 *تفصیل:* \${t.description}%0A\` : '') +
            \`%0Aاللہ تعالیٰ آپ کے اس تعاون و اخلاص کو اپنی بارگاہ میں قبول فرمائے اور آپ کے مال و اہل و عیال میں بے پناہ برکتیں عطا فرمائے۔ آمین۔%0A%0A\` +
            \`*خادم:* ناظم مالیات / خازن بیت المال%0A\` +
            \`*رابطہ:* 0300-8380313\`;

        const waUrl = \`https://api.whatsapp.com/send?phone=\${formattedPhone}&text=\${msg}\`;
        
        // Direct synthetic anchor click to bypass browser pop-up blockers
        const a = document.createElement('a');
        a.href = waUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { if (a.parentNode) a.parentNode.removeChild(a); }, 1000);
    },

    // Print Formal Financial Ledger (A4 printable report)
    async printAccountsLedger() {
        const transactions = await MadrassahDB.getAllTransactions();
        transactions.sort((a, b) => (b.date || 0) - (a.date || 0));

        const income = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + parseInt(t.amount || 0), 0);
        const expense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + parseInt(t.amount || 0), 0);
        const balance = income - expense;
        const printDate = new Date().toLocaleDateString('ur-PK');

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('براہِ کرم براؤزر سے پاپ اپ کی اجازت دیں۔');
            return;
        }

        printWindow.document.write(\`
            <!DOCTYPE html>
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>بیت المال مالیاتی گوشوارہ - مدرسہ عبد الرحمن بن عوف</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                <style>
                    @page { size: A4 portrait; margin: 12mm; }
                    body { font-family: 'Jameel Noori Nastaleeq', 'Noto Sans Urdu', Arial, sans-serif; direction: rtl; margin: 0; padding: 15px; color: #0f172a; }
                    .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 12px; margin-bottom: 15px; }
                    .header h1 { margin: 0; color: #065f46; font-size: 26px; }
                    .header h2 { margin: 4px 0; color: #475569; font-size: 16px; font-weight: normal; }
                    .stats-bar { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; margin-bottom: 15px; }
                    .stat-item { text-align: center; }
                    .stat-item .title { font-size: 12px; color: #64748b; }
                    .stat-item .val { font-size: 18px; font-weight: bold; font-family: monospace; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
                    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; }
                    th { background: #f1f5f9; color: #1e293b; text-align: center; }
                    .inc { color: #059669; font-weight: bold; font-family: monospace; direction: ltr; text-align: left; }
                    .exp { color: #dc2626; font-weight: bold; font-family: monospace; direction: ltr; text-align: left; }
                    .footer { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 40px; }
                    .signature { border-top: 1px solid #334155; width: 160px; text-align: center; padding-top: 5px; font-size: 12px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>مدرسہ عبد الرحمن بن عوف غفوریہ (خانیوال)</h1>
                    <h2>بیت المال و مالیات — مکمل رجسٹر و مالیاتی گوشوارہ</h2>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">تاریخِ اجراء: \${printDate}</div>
                </div>

                <div class="stats-bar">
                    <div class="stat-item">
                        <div class="title">کل وصول شدہ آمدن</div>
                        <div class="val" style="color:#059669;">Rs. \${Number(income).toLocaleString('en-US')}</div>
                    </div>
                    <div class="stat-item">
                        <div class="title">کل مصارف و اخراجات</div>
                        <div class="val" style="color:#dc2626;">Rs. \${Number(expense).toLocaleString('en-US')}</div>
                    </div>
                    <div class="stat-item">
                        <div class="title">موجودہ خالص بیلنس</div>
                        <div class="val" style="color:\${balance >= 0 ? '#059669' : '#dc2626'};">Rs. \${Number(balance).toLocaleString('en-US')}</div>
                    </div>
                    <div class="stat-item">
                        <div class="title">کل ٹرانزیکشنز</div>
                        <div class="val" style="color:#1e293b;">\${transactions.length}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width:30px;">#</th>
                            <th style="width:75px;">رسید نمبر</th>
                            <th style="width:70px;">تاریخ</th>
                            <th style="width:50px;">نوعیت</th>
                            <th style="width:90px;">مد / کیٹیگری</th>
                            <th>معاون / وصول کنندہ</th>
                            <th>تفصیل و ریمارکس</th>
                            <th style="width:90px;">رقم (PKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${transactions.map((t, i) => {
                            const isInc = t.type === 'Income';
                            const d = new Date(t.date || t.timestamp || Date.now());
                            const dt = !isNaN(d.getTime()) ? \`\${d.getDate()}/\${d.getMonth()+1}/\${d.getFullYear()}\` : '';
                            return \`
                                <tr>
                                    <td style="text-align:center;">\${i+1}</td>
                                    <td style="text-align:center; font-family:monospace;">\${t.receiptNo || ('TR-' + t.id)}</td>
                                    <td style="text-align:center; font-family:monospace;">\${dt}</td>
                                    <td style="text-align:center; color:\${isInc ? '#059669' : '#dc2626'}; font-weight:bold;">\${isInc ? 'آمدن' : 'خرچ'}</td>
                                    <td>\${t.category || ''}</td>
                                    <td>\${t.name || ''}</td>
                                    <td>\${t.description || ''}</td>
                                    <td class="\${isInc ? 'inc' : 'exp'}">\${isInc ? '+' : '-'} \${Number(t.amount).toLocaleString('en-US')}</td>
                                </tr>
                            \`;
                        }).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <div class="signature">دستخط ناظمِ مالیات / خازن</div>
                    <div class="signature">دستخط آڈیٹر / محاسب</div>
                    <div class="signature">دستخط مہتمم / صدر مدرسہ</div>
                </div>

                <div class="no-print" style="text-align:center; margin-top:25px;">
                    <button onclick="window.print()" style="padding:10px 30px; background:#065f46; color:white; border:none; border-radius:20px; font-weight:bold; font-size:14px; cursor:pointer;">
                        پرنٹ کریں (Print)
                    </button>
                </div>
            </body>
            </html>
        \`);
        printWindow.document.close();
    },

    async printDonationReceipt(id) {
        const transactions = await MadrassahDB.getAllTransactions();
        const t = transactions.find(item => item.id === id);
        if (!t) return;
        
        const amountWords = this.numberToUrduWords(t.amount);
        const payee = t.name ? (t.name + (t.phone ? \` (\${t.phone})\` : '')) : 'عام تعاون کنندہ';
        const purpose = \`\${t.category || 'عطیات / زکوٰۃ / صدقات'} \${t.description ? '(' + t.description + ')' : ''}\`;
        
        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'ڈونیشن / تعاون کی رسید (Donation Receipt)',
            receiptNo: t.receiptNo || 'DON-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: t.amount,
            amountInWords: amountWords,
            payeeName: payee,
            address: t.address || '',
            onAccountOf: purpose,
            dateStr: t.date || Date.now()
        });

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    },

`;

appJs = appJs.substring(0, startIndex) + newBaitUlMaalCode + appJs.substring(endIndex);

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('app.js successfully updated with redesigned Bait-ul-Maal module!');
