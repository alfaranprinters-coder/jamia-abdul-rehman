// Wheat & Grain Donors and Stock Management Module (شعبہ گندم و غلہ جات)
// Madrassah Pro Manager - Offline Version
// Architecture & Implementation for Madrasa Abdul Rehman Bin Auf

const WheatModule = {
    activeTab: 'donors', // 'donors' | 'usage' | 'stock'
    selectedSeason: 'all',
    searchQuery: '',
    filterPurpose: 'all',

    // Available Wheat Seasons (فصلیں / سال)
    SEASONS: [
        'فصل ربیع 2026ء',
        'فصل ربیع 2025ء',
        'فصل ربیع 2024ء',
        'فصل ربیع 2023ء'
    ],

    // Common Purposes for Wheat Usage (مداتِ استعمال)
    PURPOSES: [
        'طلباء کے راشن کے لیے آٹا پسائی',
        'کچن (براہ راست استعمال)',
        'نادار و غریب طلباء کو تعاون',
        'ملازمین راشن الاؤنس',
        'امداد برائے مستحقین و غرباء',
        'تبادلہ / فروخت برائے اشیائے خوردونوش',
        'متفرق استعمال'
    ],

    // Purpose cleaner removing "طعام گاہ" / "بعام گاہ"
    cleanPurposeText(purpose) {
        if (!purpose) return 'طلباء کے راشن کے لیے آٹا پسائی';
        let str = String(purpose)
            .replace(/^(اخراج\s*\/\s*)?استعمال\s*:\s*/gi, '')
            .replace(/بعام\s*گاہ/gi, '')
            .replace(/طعام\s*گاہ/gi, '')
            .replace(/بعام/gi, '')
            .trim();
        str = str.replace(/\(\s*\)/g, '').trim();
        if (str.startsWith('(') && str.endsWith(')')) {
            str = str.slice(1, -1).trim();
        }
        str = str.replace(/^[-\s:،]+|[-\s:،]+$/g, '').trim();
        return str || 'طلباء کے راشن کے لیے آٹا پسائی';
    },

    // WhatsApp Number Normalizer
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

    openWhatsAppDirect(phone, message) {
        const formattedWa = this.formatWhatsAppNumber(phone);
        if (!formattedWa || formattedWa.length < 10) {
            alert('براہِ کرم ڈونر کا درست موبائل یا واٹس ایپ نمبر (مثلاً: 03001234567) درج فرمائیں۔');
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


    // Format Maunds and Kg (من اور کلو)
    formatMaundsAndKg(val) {
        if (val === undefined || val === null || isNaN(val) || val === '') return '0 من';
        const numMaunds = parseFloat(val);
        if (numMaunds <= 0) return '0 من';
        
        const totalKg = Math.round(numMaunds * 40 * 10) / 10;
        const m = Math.floor(totalKg / 40);
        const kg = Math.round((totalKg % 40) * 10) / 10;
        
        if (m > 0 && kg > 0) {
            return `${m} من ${kg} کلو`;
        } else if (m > 0) {
            return `${m} من`;
        } else {
            return `${kg} کلو`;
        }
    },

    autoCalculateFromBags() {
        const bagsInput = document.getElementById('wheat-form-bags');
        const maundsPartInput = document.getElementById('wheat-form-maunds-part');
        const kgPartInput = document.getElementById('wheat-form-kg-part');
        if (bagsInput && maundsPartInput && kgPartInput) {
            const bags = parseInt(bagsInput.value || 0);
            if (bags >= 0) {
                const totalKg = bags * 100;
                const m = Math.floor(totalKg / 40);
                const kg = totalKg % 40;
                maundsPartInput.value = m;
                kgPartInput.value = kg;
                this.updateTotalWeightDisplay();
            }
        }
    },

    updateTotalWeightDisplay() {
        const maundsPartInput = document.getElementById('wheat-form-maunds-part');
        const kgPartInput = document.getElementById('wheat-form-kg-part');
        const textEl = document.getElementById('wheat-form-weight-text');
        const kgEl = document.getElementById('wheat-form-total-kg');
        if (maundsPartInput && kgPartInput && textEl && kgEl) {
            let m = parseInt(maundsPartInput.value || 0);
            let kg = parseFloat(kgPartInput.value || 0);
            if (kg >= 40) {
                m += Math.floor(kg / 40);
                kg = Math.round((kg % 40) * 10) / 10;
                maundsPartInput.value = m;
                kgPartInput.value = kg;
            }
            const totalKg = (m * 40) + kg;
            textEl.textContent = this.formatMaundsAndKg(totalKg / 40);
            kgEl.textContent = totalKg;
        }
    },

    autoCalculateUsageFromBags() {
        const bagsInput = document.getElementById('wheat-usage-bags');
        const maundsPartInput = document.getElementById('wheat-usage-maunds-part');
        const kgPartInput = document.getElementById('wheat-usage-kg-part');
        if (bagsInput && maundsPartInput && kgPartInput) {
            const bags = parseInt(bagsInput.value || 0);
            if (bags >= 0) {
                const totalKg = bags * 100;
                const m = Math.floor(totalKg / 40);
                const kg = totalKg % 40;
                maundsPartInput.value = m;
                kgPartInput.value = kg;
                this.updateUsageWeightDisplay();
            }
        }
    },

    updateUsageWeightDisplay() {
        const maundsPartInput = document.getElementById('wheat-usage-maunds-part');
        const kgPartInput = document.getElementById('wheat-usage-kg-part');
        const textEl = document.getElementById('wheat-usage-weight-text');
        const kgEl = document.getElementById('wheat-usage-total-kg');
        if (maundsPartInput && kgPartInput && textEl && kgEl) {
            let m = parseInt(maundsPartInput.value || 0);
            let kg = parseFloat(kgPartInput.value || 0);
            if (kg >= 40) {
                m += Math.floor(kg / 40);
                kg = Math.round((kg % 40) * 10) / 10;
                maundsPartInput.value = m;
                kgPartInput.value = kg;
            }
            const totalKg = (m * 40) + kg;
            textEl.textContent = this.formatMaundsAndKg(totalKg / 40);
            kgEl.textContent = totalKg;
        }
    },

    // Main Module Render
    async render(container) {
        if (!container) container = document.getElementById('main-content');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align:center; padding: 4rem;">
                <div class="mms-spinner"></div>
                <p style="margin-top:1rem; color:#64748b; font-family:'Jameel Noori Nastaleeq', Arial;">گندم و غلہ جات ریکارڈ لوڈ ہو رہا ہے...</p>
            </div>
        `;

        try {
            const [donations, usage] = await Promise.all([
                MadrassahDB.getAllWheatDonations(this.selectedSeason),
                MadrassahDB.getAllWheatUsage(this.selectedSeason)
            ]);

            // Calculate overall stock figures
            let totalReceivedMaunds = 0;
            let totalReceivedBags = 0;
            donations.forEach(d => {
                totalReceivedMaunds += parseFloat(d.maunds || 0);
                totalReceivedBags += parseInt(d.bags || 0);
            });

            let totalUsedMaunds = 0;
            let totalUsedBags = 0;
            usage.forEach(u => {
                totalUsedMaunds += parseFloat(u.maunds || 0);
                totalUsedBags += parseInt(u.bags || 0);
            });

            const netBalanceMaunds = (totalReceivedMaunds - totalUsedMaunds);
            const netBalanceBags = (totalReceivedBags - totalUsedBags);
            const totalDonorsCount = donations.length;

            // Render Layout
            container.innerHTML = `
                <div class="wheat-module-wrapper" style="direction:rtl; text-align:right; font-family:'Jameel Noori Nastaleeq', 'Segoe UI', Tahoma, sans-serif;">
                    
                    <!-- Header Bar -->
                    <div style="background: linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%); color: white; padding: 1.5rem 2rem; border-radius: 16px; margin-bottom: 1.5rem; box-shadow: 0 10px 25px rgba(180, 83, 9, 0.25); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <div style="display:flex; align-items:center; gap: 12px;">
                                <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem;">
                                    <i class="fas fa-wheat-awn"></i>
                                </div>
                                <div>
                                    <h2 style="margin: 0; font-size: 1.8rem; font-weight: bold; letter-spacing: 0;">شعبہ گندم و غلہ جات (گندم ڈونرز و اسٹاک)</h2>
                                    <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 1rem;">مدرسہ عبد الرحمن بن عوفؓ - گندم عطیات، آٹا پسائی، استعمال اور گودام اسٹاک کا خودکار نظام</p>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="WheatModule.openAddDonationModal()" class="btn" style="background: #ffffff; color: #78350f; font-weight: bold; padding: 10px 18px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                <i class="fas fa-plus-circle" style="color:#d97706;"></i> نیا گندم عطیہ درج کریں
                            </button>
                            <button onclick="WheatModule.openAddUsageModal()" class="btn" style="background: rgba(255,255,255,0.2); color: #ffffff; font-weight: bold; padding: 10px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.4); cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-arrow-down-from-bracket"></i> گندم کا اخراج / استعمال درج کریں
                            </button>
                            <button onclick="WheatModule.showStockRegisterModal()" class="btn" style="background: #0f172a; color: #f8fafc; font-weight: bold; padding: 10px 16px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px;" title="مکمل اسٹاک رجسٹر کا معائنہ اور پرنٹ">
                                <i class="fas fa-boxes-stacked"></i> مکمل اسٹاک رجسٹر دیکھیں / پرنٹ
                            </button>
                        </div>
                    </div>

                    <!-- Metric Cards -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <!-- Card 1: Total Received -->
                        <div style="background: white; border-radius: 14px; padding: 1.2rem; border-right: 5px solid #16a34a; box-shadow: 0 4px 15px rgba(0,0,0,0.04); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-size: 0.95rem; color: #64748b; font-weight: bold;">کل وصول شدہ گندم</span>
                                <div style="font-size: 1.7rem; font-weight: bold; color: #16a34a; margin-top: 4px;">
                                    ${WheatModule.formatMaundsAndKg(totalReceivedMaunds)}
                                </div>
                                <div style="font-size: 0.9rem; color: #64748b; margin-top: 2px;">
                                    (${totalReceivedBags} بوریاں | ${Math.round(totalReceivedMaunds * 40)} کلوگرام)
                                </div>
                            </div>
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: #dcfce7; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                                <i class="fas fa-truck-ramp-box"></i>
                            </div>
                        </div>

                        <!-- Card 2: Total Used -->
                        <div style="background: white; border-radius: 14px; padding: 1.2rem; border-right: 5px solid #ea580c; box-shadow: 0 4px 15px rgba(0,0,0,0.04); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-size: 0.95rem; color: #64748b; font-weight: bold;">کل استعمال / پسائی</span>
                                <div style="font-size: 1.7rem; font-weight: bold; color: #ea580c; margin-top: 4px;">
                                    ${WheatModule.formatMaundsAndKg(totalUsedMaunds)}
                                </div>
                                <div style="font-size: 0.9rem; color: #64748b; margin-top: 2px;">
                                    (${totalUsedBags} بوریاں | ${Math.round(totalUsedMaunds * 40)} کلوگرام)
                                </div>
                            </div>
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: #ffedd5; color: #ea580c; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                                <i class="fas fa-kitchen-set"></i>
                            </div>
                        </div>

                        <!-- Card 3: Net Balance Stock -->
                        <div style="background: white; border-radius: 14px; padding: 1.2rem; border-right: 5px solid #2563eb; box-shadow: 0 4px 15px rgba(0,0,0,0.04); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-size: 0.95rem; color: #64748b; font-weight: bold;">موجودہ بقیہ گندم ذخیرہ</span>
                                <div style="font-size: 1.7rem; font-weight: bold; color: ${netBalanceMaunds >= 0 ? '#2563eb' : '#dc2626'}; margin-top: 4px;">
                                    ${WheatModule.formatMaundsAndKg(netBalanceMaunds)}
                                </div>
                                <div style="font-size: 0.9rem; color: #64748b; margin-top: 2px;">
                                    (${netBalanceBags} بوریاں گودام میں | ${Math.round(netBalanceMaunds * 40)} کلوگرام)
                                </div>
                            </div>
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: #dbeafe; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                                <i class="fas fa-warehouse"></i>
                            </div>
                        </div>

                        <!-- Card 4: Total Donors -->
                        <div style="background: white; border-radius: 14px; padding: 1.2rem; border-right: 5px solid #7c3aed; box-shadow: 0 4px 15px rgba(0,0,0,0.04); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-size: 0.95rem; color: #64748b; font-weight: bold;">کل گندم معاونین / ڈونرز</span>
                                <div style="font-size: 1.7rem; font-weight: bold; color: #7c3aed; margin-top: 4px;">
                                    ${totalDonorsCount} <span style="font-size: 1rem; color: #475569;">افراد</span>
                                </div>
                                <div style="font-size: 0.9rem; color: #64748b; margin-top: 2px;">
                                    اندراج شدہ عطیات
                                </div>
                            </div>
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                                <i class="fas fa-users-line"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation Tabs & Season Filter -->
                    <div style="background: white; border-radius: 14px; padding: 0.8rem 1.2rem; margin-bottom: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div style="display: flex; gap: 8px;">
                            <button onclick="WheatModule.setTab('donors')" class="btn" style="padding: 9px 18px; border-radius: 10px; font-weight: bold; border: none; cursor: pointer; transition: all 0.2s; ${this.activeTab === 'donors' ? 'background:#b45309; color:white; box-shadow:0 3px 10px rgba(180,83,9,0.3);' : 'background:#f1f5f9; color:#475569;'}">
                                <i class="fas fa-hand-holding-heart" style="margin-left:6px;"></i> گندم ڈونرز فہرست (${donations.length})
                            </button>
                            <button onclick="WheatModule.setTab('usage')" class="btn" style="padding: 9px 18px; border-radius: 10px; font-weight: bold; border: none; cursor: pointer; transition: all 0.2s; ${this.activeTab === 'usage' ? 'background:#b45309; color:white; box-shadow:0 3px 10px rgba(180,83,9,0.3);' : 'background:#f1f5f9; color:#475569;'}">
                                <i class="fas fa-kitchen-set" style="margin-left:6px;"></i> گندم کا استعمال و اخراج (${usage.length})
                            </button>
                            <button onclick="WheatModule.setTab('stock')" class="btn" style="padding: 9px 18px; border-radius: 10px; font-weight: bold; border: none; cursor: pointer; transition: all 0.2s; ${this.activeTab === 'stock' ? 'background:#b45309; color:white; box-shadow:0 3px 10px rgba(180,83,9,0.3);' : 'background:#f1f5f9; color:#475569;'}">
                                <i class="fas fa-boxes-stacked" style="margin-left:6px;"></i> اسٹاک و گودام رجسٹر
                            </button>
                        </div>

                        <!-- Season Selector -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: bold; color: #475569; font-size: 0.95rem;"><i class="fas fa-calendar-alt" style="color:#b45309;"></i> سیزن / سال:</span>
                            <select onchange="WheatModule.onSeasonChange(this.value)" style="padding: 7px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b; background: #f8fafc; cursor: pointer; font-family:'Jameel Noori Nastaleeq', Arial;">
                                <option value="all" ${this.selectedSeason === 'all' ? 'selected' : ''}>تمام سیزنز (All Seasons)</option>
                                ${this.SEASONS.map(s => `<option value="${s}" ${this.selectedSeason === s ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Active Tab Content Container -->
                    <div id="wheat-tab-content">
                        ${this.activeTab === 'donors' ? this.renderDonorsTab(donations) : 
                          this.activeTab === 'usage' ? this.renderUsageTab(usage) : 
                          this.renderStockTab(donations, usage, totalReceivedMaunds, totalReceivedBags, totalUsedMaunds, totalUsedBags, netBalanceMaunds, netBalanceBags)}
                    </div>

                </div>
            `;
        } catch (err) {
            console.error('Error rendering WheatModule:', err);
            container.innerHTML = `
                <div style="padding: 2.5rem; text-align: center; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; margin: 2rem auto; max-width: 550px;">
                    <i class="fas fa-triangle-exclamation" style="font-size: 2.5rem; color: #e11d48; margin-bottom: 0.8rem;"></i>
                    <h4 style="color: #9f1239; margin-bottom: 0.4rem;">شعبہ گندم لوڈ کرنے میں رکاوٹ پیش آئی</h4>
                    <p style="color: #881337; font-size: 0.95rem;">${err.message}</p>
                    <button class="btn btn-primary" onclick="WheatModule.render()" style="background:#b45309; border:none; padding:8px 20px; border-radius:8px; cursor:pointer; margin-top:1rem;">
                        <i class="fas fa-rotate"></i> دوبارہ کوشش کریں
                    </button>
                </div>
            `;
        }
    },

    setTab(tab) {
        this.activeTab = tab;
        this.render();
    },

    onSeasonChange(season) {
        this.selectedSeason = season;
        this.render();
    },

    // -------------------------------------------------------------
    // 1. DONORS TAB (گندم ڈونرز فہرست)
    // -------------------------------------------------------------
    renderDonorsTab(donations) {
        // Filter by search query if any
        let filtered = donations;
        if (this.searchQuery && this.searchQuery.trim() !== '') {
            const q = this.searchQuery.trim().toLowerCase();
            filtered = filtered.filter(d => 
                (d.name && d.name.toLowerCase().includes(q)) ||
                (d.phone && d.phone.includes(q)) ||
                (d.whatsapp && d.whatsapp.includes(q)) ||
                (d.address && d.address.toLowerCase().includes(q)) ||
                (d.receiptNo && d.receiptNo.toLowerCase().includes(q))
            );
        }

        return `
            <div style="background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
                
                <!-- Search & Actions Bar -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.2rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1; max-width: 450px;">
                        <div style="position: relative; width: 100%;">
                            <i class="fas fa-search" style="position: absolute; right: 14px; top: 12px; color: #94a3b8;"></i>
                            <input type="text" id="wheat-donor-search" value="${this.searchQuery || ''}" 
                                oninput="WheatModule.onSearchInput(this.value)" 
                                placeholder="ڈونر کا نام، فون نمبر، پتہ یا رسید نمبر تلاش کریں..." 
                                style="width: 100%; padding: 9px 38px 9px 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.95rem; font-family:'Jameel Noori Nastaleeq', Arial; box-sizing: border-box;">
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="WheatModule.exportDonorsToCSV()" class="btn" style="background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-file-excel" style="color:#16a34a;"></i> ایکسل فائل برآمد
                        </button>
                        <button onclick="WheatModule.openAddDonationModal()" class="btn btn-primary" style="background: #b45309; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 3px 10px rgba(180,83,9,0.25);">
                            <i class="fas fa-user-plus"></i> نیا گندم ڈونر
                        </button>
                    </div>
                </div>

                <!-- Donors Table -->
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.95rem; text-align: right;">
                        <thead>
                            <tr style="background: #f8fafc; color: #475569; font-weight: bold; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 12px 14px; border-top-right-radius: 10px;">رسید #</th>
                                <th style="padding: 12px 14px;">تاریخ وصولی</th>
                                <th style="padding: 12px 14px;">نام ڈونر (معاون)</th>
                                <th style="padding: 12px 14px;">فون / واٹس ایپ نمبر</th>
                                <th style="padding: 12px 14px;">گاؤں / علاقہ / پتہ</th>
                                <th style="padding: 12px 14px; text-align: center;">مقدار (بوریاں)</th>
                                <th style="padding: 12px 14px; text-align: center;">مقدار (من)</th>
                                <th style="padding: 12px 14px;">سیزن / سال</th>
                                <th style="padding: 12px 14px;">وصول کنندہ</th>
                                <th style="padding: 12px 14px; text-align: center; border-top-left-radius: 10px;">کارروائی</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? `
                                <tr>
                                    <td colspan="10" style="text-align: center; padding: 3rem; color: #94a3b8;">
                                        <i class="fas fa-seedling" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.8rem; display: block;"></i>
                                        کوئی گندم ڈونر ریکارڈ موجود نہیں ہے۔ نیا اندراج کرنے کے لیے اوپر دیے گئے بٹن پر کلک کریں۔
                                    </td>
                                </tr>
                            ` : filtered.map((d, index) => `
                                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#fffbeb'" onmouseout="this.style.background='white'">
                                    <td style="padding: 12px 14px; font-weight: bold; color: #b45309;">
                                        ${d.receiptNo || 'WHT-' + d.id}
                                    </td>
                                    <td style="padding: 12px 14px; color: #334155;">
                                        ${d.date ? new Date(d.date).toLocaleDateString('ur-PK') : '-'}
                                    </td>
                                    <td style="padding: 12px 14px; font-weight: bold; color: #1e293b;">
                                        ${d.name || '-'}
                                    </td>
                                    <td style="padding: 12px 14px;">
                                        <div style="display:flex; align-items:center; gap:6px;">
                                            <span style="direction:ltr; unicode-bidi:embed; font-family:Arial;">${d.phone || d.whatsapp || '-'}</span>
                                            ${(d.whatsapp || d.phone) ? `
                                                <button onclick="WheatModule.shareReceiptWhatsAppDirect(${d.id})" title="واٹس ایپ پر رسید اور شکریہ کا پیغام بھیجیں" style="background:#25d366; color:white; border:none; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.85rem;">
                                                    <i class="fab fa-whatsapp"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                    <td style="padding: 12px 14px; color: #475569;">
                                        ${d.address || '-'}
                                    </td>
                                    <td style="padding: 12px 14px; text-align: center; font-weight: bold; color: #78350f;">
                                        ${d.bags ? d.bags + ' بوری' : '-'}
                                    </td>
                                    <td style="padding: 12px 14px; text-align: center; font-weight: bold; color: #16a34a; font-size: 1.05rem;">
                                        ${d.maunds ? WheatModule.formatMaundsAndKg(d.maunds) : '-'}
                                    </td>
                                    <td style="padding: 12px 14px; color: #64748b;">
                                        <span style="background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 6px; font-size: 0.85rem; font-weight: bold;">
                                            ${d.season || '-'}
                                        </span>
                                    </td>
                                    <td style="padding: 12px 14px; color: #64748b;">
                                        ${d.receivedBy || 'دفتر مدرسہ'}
                                    </td>
                                    <td style="padding: 12px 14px; text-align: center;">
                                        <div style="display: inline-flex; gap: 6px; align-items: center;">
                                            <button onclick="WheatModule.printReceipt(${d.id})" class="btn" style="background: #dbeafe; color: #1e40af; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;" title="باقاعدہ پرنٹ شدہ رسید جاری کریں">
                                                <i class="fas fa-print"></i> رسید
                                            </button>
                                            <button onclick="WheatModule.openEditDonationModal(${d.id})" class="btn" style="background: #f1f5f9; color: #334155; border: none; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;" title="ترمیم کریں">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="WheatModule.confirmDeleteDonation(${d.id})" class="btn" style="background: #fee2e2; color: #dc2626; border: none; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;" title="حذف کریں">
                                                <i class="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

            </div>
        `;
    },

    onSearchInput(val) {
        this.searchQuery = val;
        const container = document.getElementById('wheat-tab-content');
        if (container) {
            MadrassahDB.getAllWheatDonations(this.selectedSeason).then(donations => {
                container.innerHTML = this.renderDonorsTab(donations);
                const input = document.getElementById('wheat-donor-search');
                if (input) {
                    input.focus();
                    input.setSelectionRange(val.length, val.length);
                }
            });
        }
    },

    // -------------------------------------------------------------
    // 2. USAGE TAB (گندم کا استعمال و اخراج)
    // -------------------------------------------------------------
    renderUsageTab(usage) {
        return `
            <div style="background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
                
                <!-- Action Bar -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.2rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem;">
                    <div>
                        <h4 style="margin: 0; color: #1e293b; font-size: 1.2rem; font-weight: bold;">
                            <i class="fas fa-kitchen-set" style="color: #ea580c; margin-left: 6px;"></i> گندم کا اخراج و آٹا پسائی ریکارڈ
                        </h4>
                        <p style="margin: 3px 0 0 0; color: #64748b; font-size: 0.9rem;">طلباء طعام گاہ، کچن راشن اور آٹا چکی کا مکمل اندراج</p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="WheatModule.openAddUsageModal()" class="btn btn-primary" style="background: #ea580c; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 3px 10px rgba(234,88,12,0.25);">
                            <i class="fas fa-plus"></i> نیا اخراج / پسائی درج کریں
                        </button>
                    </div>
                </div>

                <!-- Usage Table -->
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.95rem; text-align: right;">
                        <thead>
                            <tr style="background: #f8fafc; color: #475569; font-weight: bold; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 12px 14px; border-top-right-radius: 10px;">واؤچر #</th>
                                <th style="padding: 12px 14px;">تاریخِ اخراج</th>
                                <th style="padding: 12px 14px; text-align: center;">مقدار (بوریاں)</th>
                                <th style="padding: 12px 14px; text-align: center;">مقدار (من)</th>
                                <th style="padding: 12px 14px;">مد / مقصدِ استعمال</th>
                                <th style="padding: 12px 14px;">فلور مل / چکی و پسائی خرچ</th>
                                <th style="padding: 12px 14px;">جاری کنندہ</th>
                                <th style="padding: 12px 14px;">وصول کنندہ (باورچی/انچارج)</th>
                                <th style="padding: 12px 14px;">تفصیل / کیفیات</th>
                                <th style="padding: 12px 14px; text-align: center; border-top-left-radius: 10px;">کارروائی</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usage.length === 0 ? `
                                <tr>
                                    <td colspan="10" style="text-align: center; padding: 3rem; color: #94a3b8;">
                                        <i class="fas fa-bread-slice" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.8rem; display: block;"></i>
                                        گندم کے استعمال کا کوئی ریکارڈ موجود نہیں ہے۔
                                    </td>
                                </tr>
                            ` : usage.map(u => `
                                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#fff7ed'" onmouseout="this.style.background='white'">
                                    <td style="padding: 12px 14px; font-weight: bold; color: #ea580c;">
                                        ${u.voucherNo || 'WUV-' + u.id}
                                    </td>
                                    <td style="padding: 12px 14px; color: #334155;">
                                        ${u.date ? new Date(u.date).toLocaleDateString('ur-PK') : '-'}
                                    </td>
                                    <td style="padding: 12px 14px; text-align: center; font-weight: bold; color: #9a3412;">
                                        ${u.bags ? u.bags + ' بوری' : '-'}
                                    </td>
                                    <td style="padding: 12px 14px; text-align: center; font-weight: bold; color: #ea580c; font-size: 1.05rem;">
                                        ${u.maunds ? WheatModule.formatMaundsAndKg(u.maunds) : '-'}
                                    </td>
                                    <td style="padding: 12px 14px; font-weight: bold; color: #1e293b;">
                                        ${WheatModule.cleanPurposeText(u.purpose)}
                                    </td>
                                    <td style="padding: 12px 14px; color: #475569;">
                                        <div style="font-weight: 600; color: #1e293b;">${u.millName ? u.millName : '-'}</div>
                                        ${u.grindingCost ? `
                                            <div style="color: #15803d; font-weight: bold; font-size: 0.85rem; margin-top: 3px; display: inline-flex; align-items: center; gap: 4px;">
                                                <i class="fas fa-money-bill-wave"></i> Rs. ${parseFloat(u.grindingCost).toLocaleString()}
                                                <span style="background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; border-radius: 4px; padding: 1px 5px; font-size: 0.72rem; font-weight: bold;" title="یہ خرچ بیت المال (Accounts) میں بھی درج ہے">
                                                    <i class="fas fa-link"></i> بیت المال واؤچر
                                                </span>
                                            </div>
                                        ` : ''}
                                    </td>
                                    <td style="padding: 12px 14px; color: #64748b;">
                                        ${u.issuedBy || '-'}
                                    </td>
                                    <td style="padding: 12px 14px; color: #64748b;">
                                        ${u.receivedBy || '-'}
                                    </td>
                                    <td style="padding: 12px 14px; color: #64748b; font-size: 0.9rem;">
                                        ${u.remarks || '-'}
                                    </td>
                                    <td style="padding: 12px 14px; text-align: center;">
                                        <div style="display: inline-flex; gap: 6px; align-items: center;">
                                            <button onclick="WheatModule.openEditUsageModal(${u.id})" class="btn" style="background: #f1f5f9; color: #334155; border: none; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;" title="ترمیم کریں">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="WheatModule.confirmDeleteUsage(${u.id})" class="btn" style="background: #fee2e2; color: #dc2626; border: none; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;" title="حذف کریں">
                                                <i class="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

            </div>
        `;
    },

    // -------------------------------------------------------------
    // 3. STOCK & WAREHOUSE LEDGER TAB (اسٹاک و گودام رجسٹر)
    // -------------------------------------------------------------
    renderStockTab(donations, usage, totalRecM, totalRecB, totalUsedM, totalUsedB, netM, netB) {
        // Build combined chronological ledger
        const ledger = [];

        donations.forEach(d => {
            ledger.push({
                type: 'inflow',
                date: d.date || d.createdAt || '2026-01-01',
                refNo: d.receiptNo || ('WHT-' + d.id),
                title: 'وصولی عطیہ: ' + (d.name || 'نامعلوم ڈونر'),
                subTitle: (d.address ? 'علاقہ: ' + d.address : '') + (d.season ? ' | سیزن: ' + d.season : ''),
                inBags: parseInt(d.bags || 0),
                inMaunds: parseFloat(d.maunds || 0),
                outBags: 0,
                outMaunds: 0,
                person: d.receivedBy || 'گودام انچارج'
            });
        });

        usage.forEach(u => {
            ledger.push({
                type: 'outflow',
                date: u.date || u.createdAt || '2026-01-01',
                refNo: u.voucherNo || ('WUV-' + u.id),
                title: 'اخراج / استعمال: ' + WheatModule.cleanPurposeText(u.purpose),
                subTitle: (u.millName ? 'چکی: ' + u.millName : '') + (u.remarks ? ' | ' + u.remarks : ''),
                inBags: 0,
                inMaunds: 0,
                outBags: parseInt(u.bags || 0),
                outMaunds: parseFloat(u.maunds || 0),
                person: u.issuedBy || 'جاری کنندہ'
            });
        });

        // Sort ascending by date for chronological balance calculation
        ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

        let runMaunds = 0;
        let runBags = 0;
        ledger.forEach(entry => {
            runMaunds += (entry.inMaunds - entry.outMaunds);
            runBags += (entry.inBags - entry.outBags);
            entry.balanceMaunds = runMaunds;
            entry.balanceBags = runBags;
        });

        // Reverse to display newest first
        const displayLedger = [...ledger].reverse();

        return `
            <div style="background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
                
                <!-- Header with Print Button -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem;">
                    <div>
                        <h4 style="margin: 0; color: #1e293b; font-size: 1.25rem; font-weight: bold;">
                            <i class="fas fa-boxes-stacked" style="color: #b45309; margin-left: 6px;"></i> گودام رجسٹر برائے غلہ جات و گندم ذخیرہ
                        </h4>
                        <p style="margin: 3px 0 0 0; color: #64748b; font-size: 0.95rem;">آمد، خرچ اور موجودہ بیلنس کا تفصیلی لیجر (Running Stock Ledger)</p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="WheatModule.showStockRegisterModal()" class="btn btn-primary" style="background: #0f172a; border: none; padding: 9px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(15,23,42,0.2);">
                            <i class="fas fa-eye"></i> رجسٹر کا تفصیلی معائنہ و پرنٹ
                        </button>
                    </div>
                </div>

                <!-- Summary Bar -->
                <div style="display: flex; justify-content: space-around; background: #f8fafc; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; flex-wrap: wrap; gap: 1rem;">
                    <div style="text-align: center;">
                        <span style="color: #64748b; font-size: 0.9rem;">کل آمد / وصولی:</span>
                        <div style="color: #16a34a; font-weight: bold; font-size: 1.3rem;">
                            +${WheatModule.formatMaundsAndKg(totalRecM)} <span style="font-size: 0.85rem; color: #475569;">(${totalRecB} بوریاں | ${Math.round(totalRecM * 40)} کلو)</span>
                        </div>
                    </div>
                    <div style="text-align: center; border-right: 1px solid #e2e8f0; padding-right: 1.5rem;">
                        <span style="color: #64748b; font-size: 0.9rem;">کل خرچ / اخراج:</span>
                        <div style="color: #ea580c; font-weight: bold; font-size: 1.3rem;">
                            -${WheatModule.formatMaundsAndKg(totalUsedM)} <span style="font-size: 0.85rem; color: #475569;">(${totalUsedB} بوریاں | ${Math.round(totalUsedM * 40)} کلو)</span>
                        </div>
                    </div>
                    <div style="text-align: center; border-right: 1px solid #e2e8f0; padding-right: 1.5rem;">
                        <span style="color: #64748b; font-size: 0.9rem;">موجودہ بقیہ ذخیرہ:</span>
                        <div style="color: #2563eb; font-weight: bold; font-size: 1.3rem;">
                            ${WheatModule.formatMaundsAndKg(netM)} <span style="font-size: 0.85rem; color: #475569;">(${netB} بوریاں | ${Math.round(netM * 40)} کلو)</span>
                        </div>
                    </div>
                </div>

                <!-- Running Stock Ledger Table -->
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.95rem; text-align: right;">
                        <thead>
                            <tr style="background: #f1f5f9; color: #334155; font-weight: bold; border-bottom: 2px solid #cbd5e1;">
                                <th style="padding: 12px 14px; border-top-right-radius: 10px;">تاریخ</th>
                                <th style="padding: 12px 14px;">ریفرنس / رسید</th>
                                <th style="padding: 12px 14px;">تفصیلِ آمد / خرچ</th>
                                <th style="padding: 12px 14px; text-align: center; color: #16a34a;">آمد (من و کلو)</th>
                                <th style="padding: 12px 14px; text-align: center; color: #16a34a;">آمد (بوریاں)</th>
                                <th style="padding: 12px 14px; text-align: center; color: #ea580c;">خرچ (من و کلو)</th>
                                <th style="padding: 12px 14px; text-align: center; color: #ea580c;">خرچ (بوریاں)</th>
                                <th style="padding: 12px 14px; text-align: center; color: #2563eb; border-top-left-radius: 10px;">میزانِ ذخیرہ (من و کلو)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${displayLedger.length === 0 ? `
                                <tr>
                                    <td colspan="8" style="text-align: center; padding: 3rem; color: #94a3b8;">
                                        اسٹاک لیجر میں کوئی اندراج موجود نہیں ہے۔
                                    </td>
                                </tr>
                            ` : displayLedger.map(item => `
                                <tr style="border-bottom: 1px solid #f1f5f9; background: ${item.type === 'inflow' ? '#ffffff' : '#fffcf8'};">
                                    <td style="padding: 11px 14px; color: #475569;">
                                        ${new Date(item.date).toLocaleDateString('ur-PK')}
                                    </td>
                                    <td style="padding: 11px 14px; font-weight: bold; color: ${item.type === 'inflow' ? '#b45309' : '#ea580c'};">
                                        ${item.refNo}
                                    </td>
                                    <td style="padding: 11px 14px;">
                                        <div style="font-weight: bold; color: #1e293b;">${item.title}</div>
                                        <div style="font-size: 0.85rem; color: #64748b;">${item.subTitle}</div>
                                    </td>
                                    <td style="padding: 11px 14px; text-align: center; font-weight: bold; color: #16a34a;">
                                        ${item.inMaunds > 0 ? '+' + WheatModule.formatMaundsAndKg(item.inMaunds) : '-'}
                                    </td>
                                    <td style="padding: 11px 14px; text-align: center; color: #16a34a;">
                                        ${item.inBags > 0 ? '+' + item.inBags : '-'}
                                    </td>
                                    <td style="padding: 11px 14px; text-align: center; font-weight: bold; color: #ea580c;">
                                        ${item.outMaunds > 0 ? '-' + WheatModule.formatMaundsAndKg(item.outMaunds) : '-'}
                                    </td>
                                    <td style="padding: 11px 14px; text-align: center; color: #ea580c;">
                                        ${item.outBags > 0 ? '-' + item.outBags : '-'}
                                    </td>
                                    <td style="padding: 11px 14px; text-align: center; font-weight: bold; color: #2563eb; font-size: 1.05rem;">
                                        ${WheatModule.formatMaundsAndKg(item.balanceMaunds)} <span style="font-size:0.85rem; color:#64748b;">(${item.balanceBags} بوری)</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

            </div>
        `;
    },

    // -------------------------------------------------------------
    // MODALS: ADD / EDIT DONOR DONATION
    // -------------------------------------------------------------
    async openAddDonationModal() {
        const nextReceiptNo = 'WHT-' + Math.floor(1000 + Math.random() * 9000);
        const todayStr = new Date().toISOString().split('T')[0];
        const activeSeason = this.selectedSeason !== 'all' ? this.selectedSeason : this.SEASONS[0];

        this.renderDonationFormModal({
            receiptNo: nextReceiptNo,
            date: todayStr,
            season: activeSeason,
            bags: 1,
            maunds: 2.5,
            receivedBy: 'دفتر مدرسہ'
        }, false);
    },

    async openEditDonationModal(id) {
        const donation = await MadrassahDB.getWheatDonationById(id);
        if (!donation) {
            alert('ریکارڈ نہیں مل سکا!');
            return;
        }
        this.renderDonationFormModal(donation, true);
    },

    renderDonationFormModal(data, isEdit) {
        this.closeModal();
        const totalKg = data.totalKg !== undefined ? parseFloat(data.totalKg) : Math.round((parseFloat(data.maunds || 2.5)) * 40);
        const maundsPart = Math.floor(totalKg / 40);
        const kgPart = Math.round((totalKg % 40) * 10) / 10;

        const modalHtml = `
            <div id="wheat-modal-overlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.65); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; direction:rtl; text-align:right; font-family:'Jameel Noori Nastaleeq', Arial;">
                <div style="background:white; border-radius:20px; width:100%; max-width:680px; max-height:92vh; overflow-y:auto; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:1px solid #e2e8f0;">
                    
                    <!-- Modal Header -->
                    <div style="background:linear-gradient(135deg, #78350f, #b45309); color:white; padding:1.2rem 1.8rem; border-top-left-radius:19px; border-top-right-radius:19px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-hand-holding-heart" style="font-size:1.4rem;"></i>
                            <h3 style="margin:0; font-size:1.4rem; font-weight:bold;">${isEdit ? 'گندم عطیہ ریکارڈ میں ترمیم' : 'نیا گندم عطیہ اندراج (گندم ڈونر)'}</h3>
                        </div>
                        <button onclick="WheatModule.closeModal()" style="background:transparent; border:none; color:white; font-size:1.3rem; cursor:pointer; opacity:0.8;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Modal Form -->
                    <form onsubmit="WheatModule.saveDonationForm(event)" style="padding:1.8rem;">
                        <input type="hidden" id="wheat-form-id" value="${data.id || ''}">

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem; margin-bottom:1.2rem;">
                            <div>
                                <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">رسید نمبر (Receipt No)</label>
                                <input type="text" id="wheat-form-receiptNo" value="${data.receiptNo || ''}" required 
                                    style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:Arial, sans-serif; font-weight:bold; color:#b45309;">
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">تاریخِ وصولی (Date)</label>
                                <input type="date" id="wheat-form-date" value="${data.date || new Date().toISOString().split('T')[0]}" required 
                                    style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">
                            </div>
                        </div>

                        <div style="margin-bottom:1.2rem;">
                            <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">محترم ڈونر / معاون کا نام <span style="color:#dc2626;">*</span></label>
                            <input type="text" id="wheat-form-name" value="${data.name || ''}" required placeholder="مثلاً: چوہدری محمد اسلم صاحب" 
                                style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-size:1rem; font-family:'Jameel Noori Nastaleeq', Arial;">
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem; margin-bottom:1.2rem;">
                            <div>
                                <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">موبائل / فون نمبر</label>
                                <input type="text" id="wheat-form-phone" value="${data.phone || ''}" placeholder="03001234567" 
                                    style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:Arial, sans-serif; direction:ltr; text-align:right;">
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">واٹس ایپ نمبر (WhatsApp)</label>
                                <input type="text" id="wheat-form-whatsapp" value="${data.whatsapp || data.phone || ''}" placeholder="03001234567" 
                                    style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:Arial, sans-serif; direction:ltr; text-align:right;">
                            </div>
                        </div>

                        <div style="margin-bottom:1.2rem;">
                            <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">پتہ / علاقہ / گاؤں / شہر</label>
                            <input type="text" id="wheat-form-address" value="${data.address || ''}" placeholder="مثلاً: چک نمبر 123، تحصیل و ضلع..." 
                                style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:'Jameel Noori Nastaleeq', Arial;">
                        </div>

                        <!-- Quantity inputs: Bags, Maunds and Kgs -->
                        <div style="background:#fffbeb; border:1.5px solid #fde68a; border-radius:12px; padding:1.2rem; margin-bottom:1.2rem;">
                            <div style="font-weight:bold; color:#92400e; margin-bottom:10px; font-size:1.05rem; display:flex; justify-content:space-between; align-items:center;">
                                <span><i class="fas fa-wheat-awn"></i> گندم کی مقدار (بوریاں، من اور کلو)</span>
                                <span style="font-size:0.8rem; background:#fef3c7; color:#92400e; padding:2px 10px; border-radius:12px; border:1px solid #fcd34d;">۱ من = ۴۰ کلوگرام</span>
                            </div>
                            
                            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">تعداد بوریاں (Bags)</label>
                                    <input type="number" id="wheat-form-bags" value="${data.bags !== undefined ? data.bags : 1}" min="0" step="1"
                                        oninput="WheatModule.autoCalculateFromBags()"
                                        style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-weight:bold; font-size:1.15rem; color:#78350f;">
                                    <span style="font-size:0.75rem; color:#64748b;">(معیاری بوری 100 کلو)</span>
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">من (Maunds) <span style="color:#dc2626;">*</span></label>
                                    <input type="number" id="wheat-form-maunds-part" value="${maundsPart}" min="0" step="1" required 
                                        oninput="WheatModule.updateTotalWeightDisplay()"
                                        style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-weight:bold; font-size:1.15rem; color:#16a34a;">
                                    <span style="font-size:0.75rem; color:#64748b;">(مکمل من)</span>
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">کلوگرام (Kg)</label>
                                    <input type="number" id="wheat-form-kg-part" value="${kgPart}" min="0" max="39" step="any"
                                        oninput="WheatModule.updateTotalWeightDisplay()"
                                        style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-weight:bold; font-size:1.15rem; color:#2563eb;">
                                    <span style="font-size:0.75rem; color:#64748b;">(اضافی کلو 0 تا 39)</span>
                                </div>
                            </div>

                            <!-- Live calculated badge -->
                            <div id="wheat-form-weight-summary" style="margin-top:12px; padding:8px 14px; background:white; border:1.5px dashed #f59e0b; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <span style="font-size:1.02rem; font-weight:bold; color:#92400e;">
                                    <i class="fas fa-scale-balanced"></i> کل مقدار: <b id="wheat-form-weight-text" style="color:#065f46; font-size:1.15rem;">${WheatModule.formatMaundsAndKg(totalKg / 40)}</b>
                                </span>
                                <span style="font-size:0.88rem; color:#475569; font-weight:bold;">
                                    مجموعی وزن: <span id="wheat-form-total-kg" style="color:#1d4ed8; font-family:monospace; font-size:1.05rem;">${totalKg}</span> کلوگرام
                                </span>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem; margin-bottom:1.2rem;">
                            <div>
                                <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">فصل / سیزن (Season)</label>
                                <select id="wheat-form-season" style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:'Jameel Noori Nastaleeq', Arial; font-weight:bold;">
                                    ${this.SEASONS.map(s => `<option value="${s}" ${data.season === s ? 'selected' : ''}>${s}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">وصول کنندہ / گودام انچارج</label>
                                <input type="text" id="wheat-form-receivedBy" value="${data.receivedBy || 'دفتر مدرسہ'}" 
                                    style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:'Jameel Noori Nastaleeq', Arial;">
                            </div>
                        </div>

                        <div style="margin-bottom:1.5rem;">
                            <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">کیفیات و نوٹس (Remarks)</label>
                            <textarea id="wheat-form-remarks" rows="2" placeholder="اگر کوئی خاص نوٹ یا پسائی وغیرہ کی تفصیل ہو..." 
                                style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:'Jameel Noori Nastaleeq', Arial;">${data.remarks || ''}</textarea>
                        </div>

                        <!-- Buttons -->
                        <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #e2e8f0; padding-top:1.2rem;">
                            <button type="button" onclick="WheatModule.closeModal()" class="btn" style="background:#f1f5f9; color:#475569; border:none; padding:9px 18px; border-radius:8px; cursor:pointer; font-weight:bold;">
                                منسوخ کریں
                            </button>
                            <button type="submit" class="btn btn-primary" style="background:#b45309; border:none; padding:9px 24px; border-radius:8px; font-weight:bold; cursor:pointer; box-shadow:0 3px 10px rgba(180,83,9,0.3); color:white; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-check"></i> محفوظ کریں
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    autoCalculateMaunds() {
        const bagsInput = document.getElementById('wheat-form-bags');
        const maundsInput = document.getElementById('wheat-form-maunds');
        if (bagsInput && maundsInput) {
            const bags = parseInt(bagsInput.value || 0);
            if (bags > 0) {
                // By Pakistani agricultural standard: 1 wheat sack (بوری) = 100 kg = 2.5 Maunds (من)
                // (or if 50kg bag = 1.25 maunds). Setting 2.5 maunds per 100kg bag as default:
                maundsInput.value = (bags * 2.5).toFixed(1);
            }
        }
    },

    async saveDonationForm(event) {
        if (event) event.preventDefault();

        const id = document.getElementById('wheat-form-id').value;
        const receiptNo = document.getElementById('wheat-form-receiptNo').value.trim();
        const date = document.getElementById('wheat-form-date').value;
        const name = document.getElementById('wheat-form-name').value.trim();
        const phone = document.getElementById('wheat-form-phone').value.trim();
        const whatsapp = document.getElementById('wheat-form-whatsapp').value.trim();
        const address = document.getElementById('wheat-form-address').value.trim();
        const bags = parseInt(document.getElementById('wheat-form-bags').value || 0);
        const mPart = parseInt(document.getElementById('wheat-form-maunds-part').value || 0);
        const kgPart = parseFloat(document.getElementById('wheat-form-kg-part').value || 0);
        const totalKg = (mPart * 40) + kgPart;
        const maunds = parseFloat((totalKg / 40).toFixed(3));
        const season = document.getElementById('wheat-form-season').value;
        const receivedBy = document.getElementById('wheat-form-receivedBy').value.trim();
        const remarks = document.getElementById('wheat-form-remarks').value.trim();

        if (!name) {
            alert('براہِ کرم ڈونر کا نام درج فرمائیں۔');
            return;
        }

        const data = {
            receiptNo,
            date,
            name,
            phone,
            whatsapp,
            address,
            bags,
            maunds,
            maundsPart: mPart,
            kg: kgPart,
            totalKg,
            maundsPart: mPart,
            kg: kgPart,
            totalKg,
            season,
            receivedBy,
            remarks
        };

        if (id) data.id = parseInt(id);

        try {
            const submitBtn = event && event.target ? event.target.querySelector('button[type="submit"]') : null;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
            }
            const savedId = await MadrassahDB.saveWheatDonation(data);
            this.closeModal();
            this.render();
            
            if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast('گندم عطیہ کا ریکارڈ کامیابی سے محفوظ ہو گیا ہے۔', 'success');
            }

            // Ask if user wants to print receipt or share on WhatsApp immediately
            if (!id) {
                setTimeout(() => {
                    if (confirm('کیا آپ اس عطیہ کی پرنٹ شدہ رسید جاری کرنا یا ڈونر کو واٹس ایپ پر پیغام بھیجنا چاہتے ہیں؟')) {
                        WheatModule.printReceipt(savedId || data.id);
                    }
                }, 300);
            }
        } catch (err) {
            console.error('Error saving wheat donation:', err);
            alert('ریکارڈ محفوظ کرنے میں خرابی: ' + (err.message || err));
            const submitBtn = event && event.target ? event.target.querySelector('button[type="submit"]') : null;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check"></i> محفوظ کریں';
            }
        }
    },

    async confirmDeleteDonation(id) {
        if (!confirm('کیا آپ واقعی یہ گندم عطیہ ریکارڈ حذف کرنا چاہتے ہیں؟')) return;
        try {
            await MadrassahDB.deleteWheatDonation(id);
            if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast('ریکارڈ کامیابی سے حذف کر دیا گیا ہے۔', 'info');
            }
            this.render();
        } catch (err) {
            alert('خرابی: ' + err.message);
        }
    },

    // -------------------------------------------------------------
    // MODALS: ADD / EDIT WHEAT USAGE (گندم کا اخراج و استعمال)
    // -------------------------------------------------------------
    async openAddUsageModal() {
        const nextVoucherNo = 'WUV-' + Math.floor(1000 + Math.random() * 9000);
        const todayStr = new Date().toISOString().split('T')[0];
        const activeSeason = this.selectedSeason !== 'all' ? this.selectedSeason : this.SEASONS[0];

        this.renderUsageFormModal({
            voucherNo: nextVoucherNo,
            date: todayStr,
            season: activeSeason,
            bags: 1,
            maunds: 2.5,
            purpose: this.PURPOSES[0],
            issuedBy: 'گودام انچارج',
            receivedBy: 'باورچی / راشن انچارج'
        }, false);
    },

    async openEditUsageModal(id) {
        const usage = await MadrassahDB.getWheatUsageById(id);
        if (!usage) {
            alert('ریکارڈ نہیں مل سکا!');
            return;
        }
        this.renderUsageFormModal(usage, true);
    },

    renderUsageFormModal(data, isEdit) {
        this.closeModal();
        const totalKg = data.totalKg !== undefined ? parseFloat(data.totalKg) : Math.round((parseFloat(data.maunds || 2.5)) * 40);
        const maundsPart = Math.floor(totalKg / 40);
        const kgPart = Math.round((totalKg % 40) * 10) / 10;

        const modalHtml = `
            <div id="wheat-modal-overlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.65); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; direction:rtl; text-align:right; font-family:'Jameel Noori Nastaleeq', Arial;">
                <div style="background:white; border-radius:20px; width:100%; max-width:680px; max-height:92vh; overflow-y:auto; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:1px solid #e2e8f0;">
                    
                    <!-- Modal Header -->
                    <div style="background:linear-gradient(135deg, #c2410c, #ea580c); color:white; padding:1.2rem 1.8rem; border-top-left-radius:19px; border-top-right-radius:19px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-kitchen-set" style="font-size:1.4rem;"></i>
                            <h3 style="margin:0; font-size:1.4rem; font-weight:bold;">${isEdit ? 'گندم اخراج / پسائی ریکارڈ میں ترمیم' : 'نیا گندم اخراج و پسائی اندراج'}</h3>
                        </div>
                        <button onclick="WheatModule.closeModal()" style="background:transparent; border:none; color:white; font-size:1.3rem; cursor:pointer; opacity:0.8;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Modal Form -->
                    <form onsubmit="WheatModule.saveUsageForm(event)" style="padding:1.8rem;">
                        <input type="hidden" id="wheat-usage-id" value="${data.id || ''}">

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem; margin-bottom:1.2rem;">
                            <div>
                                <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">واؤچر نمبر (Voucher No)</label>
                                <input type="text" id="wheat-usage-voucherNo" value="${data.voucherNo || ''}" required 
                                    style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:Arial, sans-serif; font-weight:bold; color:#ea580c;">
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">تاریخِ اخراج (Date)</label>
                                <input type="date" id="wheat-usage-date" value="${data.date || new Date().toISOString().split('T')[0]}" required 
                                    style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">
                            </div>
                        </div>

                        <!-- Quantity inputs: Bags, Maunds and Kgs -->
                        <div style="background:#fff7ed; border:1.5px solid #fed7aa; border-radius:12px; padding:1.2rem; margin-bottom:1.2rem;">
                            <div style="font-weight:bold; color:#9a3412; margin-bottom:10px; font-size:1.05rem; display:flex; justify-content:space-between; align-items:center;">
                                <span><i class="fas fa-boxes-stacked"></i> اخراج کی جانے والی مقدار (بوریاں، من اور کلو)</span>
                                <span style="font-size:0.8rem; background:#ffedd5; color:#9a3412; padding:2px 10px; border-radius:12px; border:1px solid #fdba74;">۱ من = ۴۰ کلوگرام</span>
                            </div>
                            
                            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">تعداد بوریاں (Bags)</label>
                                    <input type="number" id="wheat-usage-bags" value="${data.bags !== undefined ? data.bags : 1}" min="0" step="1"
                                        oninput="WheatModule.autoCalculateUsageFromBags()"
                                        style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-weight:bold; font-size:1.15rem; color:#c2410c;">
                                    <span style="font-size:0.75rem; color:#64748b;">(معیاری بوری 100 کلو)</span>
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">من (Maunds) <span style="color:#dc2626;">*</span></label>
                                    <input type="number" id="wheat-usage-maunds-part" value="${maundsPart}" min="0" step="1" required 
                                        oninput="WheatModule.updateUsageWeightDisplay()"
                                        style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-weight:bold; font-size:1.15rem; color:#ea580c;">
                                    <span style="font-size:0.75rem; color:#64748b;">(مکمل من)</span>
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">کلوگرام (Kg)</label>
                                    <input type="number" id="wheat-usage-kg-part" value="${kgPart}" min="0" max="39" step="any"
                                        oninput="WheatModule.updateUsageWeightDisplay()"
                                        style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-weight:bold; font-size:1.15rem; color:#2563eb;">
                                    <span style="font-size:0.75rem; color:#64748b;">(اضافی کلو 0 تا 39)</span>
                                </div>
                            </div>

                            <!-- Live calculated badge -->
                            <div id="wheat-usage-weight-summary" style="margin-top:12px; padding:8px 14px; background:white; border:1.5px dashed #ea580c; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <span style="font-size:1.02rem; font-weight:bold; color:#9a3412;">
                                    <i class="fas fa-scale-balanced"></i> کل اخراج: <b id="wheat-usage-weight-text" style="color:#c2410c; font-size:1.15rem;">${WheatModule.formatMaundsAndKg(totalKg / 40)}</b>
                                </span>
                                <span style="font-size:0.88rem; color:#475569; font-weight:bold;">
                                    مجموعی وزن: <span id="wheat-usage-total-kg" style="color:#c2410c; font-family:monospace; font-size:1.05rem;">${totalKg}</span> کلوگرام
                                </span>
                            </div>
                        </div>

                        <div style="margin-bottom:1.2rem;">
                            <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">مد / مقصدِ استعمال (Purpose) <span style="color:#dc2626;">*</span></label>
                            <select id="wheat-usage-purpose" style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:'Jameel Noori Nastaleeq', Arial; font-weight:bold;">
                                ${this.PURPOSES.map(p => `<option value="${p}" ${data.purpose === p ? 'selected' : ''}>${p}</option>`).join('')}
                            </select>
                        </div>

                        <!-- Flour Mill & Grinding Cost with Automated Bait-ul-Maal sync -->
                        <div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:12px; padding:1.1rem; margin-bottom:1.2rem;">
                            <div style="font-weight:bold; color:#166534; margin-bottom:10px; font-size:1.05rem; display:flex; align-items:center; gap:8px;">
                                <i class="fas fa-industry"></i> آٹا پسائی و چکی کی تفصیل (Grinding & Mill Details)
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem; margin-bottom:10px;">
                                <div>
                                    <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">فلور مل / چکی کا نام</label>
                                    <input type="text" id="wheat-usage-millName" value="${data.millName || ''}" placeholder="مثلاً: مدینہ فلور ملز / قاری صاحب چکی" 
                                        style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:'Jameel Noori Nastaleeq', Arial;">
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">پسائی خرچ / اجرت (روپے)</label>
                                    <input type="number" id="wheat-usage-grindingCost" value="${data.grindingCost || ''}" placeholder="0" min="0" step="any"
                                        style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #16a34a; box-sizing:border-box; font-family:Arial, sans-serif; font-weight:bold; font-size:1.1rem; color:#15803d;">
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                                <input type="checkbox" id="wheat-usage-syncAccounts" ${data.syncToAccounts === false ? '' : 'checked'} style="width:18px; height:18px; accent-color:#059669; cursor:pointer;">
                                <label for="wheat-usage-syncAccounts" style="font-size:0.95rem; font-weight:bold; color:#065f46; cursor:pointer;">
                                    پسائی کی یہ رقم خودکار طور پر بیت المال کے اخراجات (Cash Expense — مد: راشن) میں درج کریں
                                </label>
                            </div>
                            <div style="font-size:0.8rem; color:#15803d; margin-top:4px; margin-right:26px;">
                                (بیت المال واؤچر خودکار بن جائے گا، اور اگر پسائی میں ترمیم یا حذف کریں گے تو بیت المال سے بھی درست ہو جائے گا)
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem; margin-bottom:1.2rem;">
                            <div>
                                <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">جاری کنندہ (Issued By)</label>
                                <input type="text" id="wheat-usage-issuedBy" value="${data.issuedBy || 'گودام انچارج'}" 
                                    style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:'Jameel Noori Nastaleeq', Arial;">
                            </div>
                            <div>
                                <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">وصول کنندہ (Received By)</label>
                                <input type="text" id="wheat-usage-receivedBy" value="${data.receivedBy || 'باورچی / راشن انچارج'}" 
                                    style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:'Jameel Noori Nastaleeq', Arial;">
                            </div>
                        </div>

                        <div style="margin-bottom:1.5rem;">
                            <label style="display:block; font-weight:bold; color:#334155; margin-bottom:6px;">تفصیل / نوٹس (Remarks)</label>
                            <textarea id="wheat-usage-remarks" rows="2" placeholder="اگر کوئی اضافی نوٹ یا ہدایت ہو..." 
                                style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; font-family:'Jameel Noori Nastaleeq', Arial;">${data.remarks || ''}</textarea>
                        </div>

                        <!-- Buttons -->
                        <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #e2e8f0; padding-top:1.2rem;">
                            <button type="button" onclick="WheatModule.closeModal()" class="btn" style="background:#f1f5f9; color:#475569; border:none; padding:9px 18px; border-radius:8px; cursor:pointer; font-weight:bold;">
                                منسوخ کریں
                            </button>
                            <button type="submit" class="btn btn-primary" style="background:#ea580c; border:none; padding:9px 24px; border-radius:8px; font-weight:bold; cursor:pointer; box-shadow:0 3px 10px rgba(234,88,12,0.3); color:white; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-check"></i> اخراج محفوظ کریں
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    autoCalculateUsageMaunds() {
        const bagsInput = document.getElementById('wheat-usage-bags');
        const maundsInput = document.getElementById('wheat-usage-maunds');
        if (bagsInput && maundsInput) {
            const bags = parseInt(bagsInput.value || 0);
            if (bags > 0) {
                maundsInput.value = (bags * 2.5).toFixed(1);
            }
        }
    },

    async saveUsageForm(event) {
        if (event) event.preventDefault();

        const id = document.getElementById('wheat-usage-id').value;
        const voucherNo = document.getElementById('wheat-usage-voucherNo').value.trim();
        const date = document.getElementById('wheat-usage-date').value;
        const bags = parseInt(document.getElementById('wheat-usage-bags').value || 0);
        const mPart = parseInt(document.getElementById('wheat-usage-maunds-part').value || 0);
        const kgPart = parseFloat(document.getElementById('wheat-usage-kg-part').value || 0);
        const totalKg = (mPart * 40) + kgPart;
        const maunds = parseFloat((totalKg / 40).toFixed(3));
        const purpose = document.getElementById('wheat-usage-purpose').value;
        const millName = document.getElementById('wheat-usage-millName').value.trim();
        const grindingCost = parseFloat(document.getElementById('wheat-usage-grindingCost').value || 0);
        const syncAccountsCheckbox = document.getElementById('wheat-usage-syncAccounts');
        const syncToAccounts = syncAccountsCheckbox ? syncAccountsCheckbox.checked : true;
        const issuedBy = document.getElementById('wheat-usage-issuedBy').value.trim();
        const receivedBy = document.getElementById('wheat-usage-receivedBy').value.trim();
        const remarks = document.getElementById('wheat-usage-remarks').value.trim();
        const season = this.selectedSeason !== 'all' ? this.selectedSeason : this.SEASONS[0];

        let previousUsage = null;
        if (id) {
            previousUsage = await MadrassahDB.getWheatUsageById(id);
        }

        const data = {
            voucherNo,
            date,
            bags,
            maunds,
            maundsPart: mPart,
            kg: kgPart,
            totalKg,
            purpose,
            millName,
            grindingCost,
            syncToAccounts: syncToAccounts,
            issuedBy,
            receivedBy,
            remarks,
            season
        };

        if (id) data.id = parseInt(id);
        if (previousUsage && previousUsage.linkedTransactionId) {
            data.linkedTransactionId = previousUsage.linkedTransactionId;
        }

        try {
            const submitBtn = event && event.target ? event.target.querySelector('button[type="submit"]') : null;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
            }

            // Automated Bait-ul-Maal expense synchronization
            if (syncToAccounts && grindingCost > 0) {
                const transDate = date ? new Date(date + 'T12:00:00').getTime() : Date.now();
                const millTitle = millName ? millName : 'فلور مل / آٹا چکی';
                const bagMaundText = `${bags} بوری (${maunds} من)`;

                let existingTransId = data.linkedTransactionId || null;
                if (!existingTransId) {
                    const allTrans = await MadrassahDB.getAllTransactions();
                    const match = allTrans.find(t => t.receiptNo === voucherNo && t.type === 'Expense');
                    if (match) existingTransId = match.id;
                }

                const transData = {
                    type: 'Expense',
                    category: 'راشن',
                    amount: parseFloat(grindingCost),
                    name: `پسائی آٹا (${millTitle})`,
                    phone: '',
                    address: '',
                    receiptNo: voucherNo,
                    description: `گندم پسائی اجرت برائے ${bagMaundText} — مد: ${purpose}`,
                    paymentMethod: 'نقد (Cash)',
                    date: transDate
                };

                if (existingTransId) {
                    transData.id = existingTransId;
                }

                const savedTransId = await MadrassahDB.saveTransaction(transData);
                data.linkedTransactionId = savedTransId || existingTransId;
            } else {
                // If grindingCost is 0 or sync unchecked, remove previously linked transaction
                const transIdToDelete = data.linkedTransactionId;
                if (transIdToDelete) {
                    try { await MadrassahDB.deleteTransaction(transIdToDelete); } catch(e) {}
                    data.linkedTransactionId = null;
                } else if (voucherNo) {
                    try { await MadrassahDB.deleteTransactionByReceipt(voucherNo); } catch(e) {}
                }
            }

            await MadrassahDB.saveWheatUsage(data);
            this.closeModal();
            this.render();

            if (window.app && typeof window.app.showToast === 'function') {
                const toastMsg = (syncToAccounts && grindingCost > 0)
                    ? 'گندم اخراج اور بیت المال میں پسائی کا خرچ خودکار درج ہو گیا ہے۔'
                    : 'گندم کے اخراج کا ریکارڈ کامیابی سے محفوظ ہو گیا ہے۔';
                window.app.showToast(toastMsg, 'success');
            }
        } catch (err) {
            console.error('Error saving wheat usage:', err);
            alert('خرابی: ' + (err.message || err));
            const submitBtn = event && event.target ? event.target.querySelector('button[type="submit"]') : null;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check"></i> اخراج محفوظ کریں';
            }
        }
    },

    async confirmDeleteUsage(id) {
        if (!confirm('کیا آپ واقعی یہ اخراج کا ریکارڈ حذف کرنا چاہتے ہیں؟ (اگر پسائی کا خرچ بیت المال میں درج تھا تو وہ بھی خودکار حذف ہو جائے گا)')) return;
        try {
            const usage = await MadrassahDB.getWheatUsageById(id);
            if (usage) {
                if (usage.linkedTransactionId) {
                    try { await MadrassahDB.deleteTransaction(usage.linkedTransactionId); } catch(e) {}
                }
                if (usage.voucherNo) {
                    try { await MadrassahDB.deleteTransactionByReceipt(usage.voucherNo); } catch(e) {}
                }
            }
            await MadrassahDB.deleteWheatUsage(id);
            if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast('اخراج کا ریکارڈ اور متعلقہ بیت المال خرچ حذف کر دیا گیا ہے۔', 'info');
            }
            this.render();
        } catch (err) {
            alert('خرابی: ' + err.message);
        }
    },

    closeModal() {
        const el = document.getElementById('wheat-modal-overlay');
        if (el) el.remove();
        const rcpt = document.getElementById('wheat-receipt-modal');
        if (rcpt) rcpt.remove();
        const stkW = document.getElementById('wheat-stock-register-modal');
        if (stkW) stkW.remove();
    },

    // -------------------------------------------------------------
    // 4. PRINT OFFICIAL WHEAT DONATION RECEIPT (رسید عطیہ گندم)
    // -------------------------------------------------------------
    async printReceipt(id) {
        const d = await MadrassahDB.getWheatDonationById(id);
        if (!d) {
            alert('ڈونر کا ریکارڈ نہیں ملا!');
            return;
        }

        this.closeModal();

        const formattedDate = d.date ? new Date(d.date).toLocaleDateString('ur-PK') : new Date().toLocaleDateString('ur-PK');

        const modalHtml = `
            <div id="wheat-receipt-modal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.7); backdrop-filter:blur(5px); z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem; direction:rtl; text-align:right; font-family:'Jameel Noori Nastaleeq', Arial;">
                <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:95vh; overflow-y:auto; box-shadow:0 25px 50px -12px rgba(0,0,0,0.3); border:1px solid #cbd5e1; display:flex; flex-direction:column;">
                    
                    <!-- Action Bar -->
                    <div style="background:#f8fafc; padding:12px 20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold; color:#1e293b; font-size:1.1rem;"><i class="fas fa-receipt" style="color:#b45309;"></i> سرکاری رسیدِ عطیہ گندم</span>
                        <div style="display:flex; gap:8px;">
                            <button onclick="WheatModule.shareReceiptWhatsAppDirect(${d.id})" class="btn" style="background:#25d366; color:white; border:none; padding:7px 14px; border-radius:8px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                <i class="fab fa-whatsapp"></i> واٹس ایپ شیئر
                            </button>
                            <button onclick="WheatModule.printReceiptDoc()" class="btn btn-primary" style="background:#0f172a; border:none; padding:7px 16px; border-radius:8px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-print"></i> پرنٹ کریں
                            </button>
                            <button onclick="WheatModule.closeModal()" style="background:#e2e8f0; border:none; color:#475569; width:32px; height:32px; border-radius:50%; cursor:pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Printable Receipt Container -->
                    <div id="wheat-printable-slip" style="padding:2.5rem; background:white; position:relative; box-sizing:border-box;">
                        
                        <!-- Watermark/Background Design -->
                        <div style="border: 3px double #b45309; padding: 1.8rem; border-radius: 12px; background: #fffdfa; position: relative;">
                            
                            <!-- Header -->
                            <div style="text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 1rem; margin-bottom: 1.2rem;">
                                <div style="font-size: 1rem; color: #78350f; font-weight: bold; margin-bottom: 4px;">بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ</div>
                                <h2 style="margin: 0; font-size: 2rem; color: #78350f; font-weight: bold;">مدرسہ عبد الرحمن ؓ بن عوف غفوریہ</h2>
                                <div style="font-size: 1.05rem; color: #92400e; margin-top: 2px;">شعبہ غلہ جات و فنڈِ گندم — چک نمبر R/28-10 بوسال کالونی ضلع خانیوال (رابطہ: 0302 7440199)</div>
                                <div style="margin-top: 8px;">
                                    <span style="background: #b45309; color: white; padding: 4px 18px; border-radius: 20px; font-size: 1.1rem; font-weight: bold; letter-spacing: 0;">
                                        رسیدِ وصولی عطیہ گندم
                                    </span>
                                </div>
                            </div>

                            <!-- Meta details: Receipt No & Date -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; font-size: 1rem; border-bottom: 1px dashed #cbd5e1; padding-bottom: 0.6rem;">
                                <div><strong>رسید نمبر:</strong> <span style="font-family:Arial; font-weight:bold; color:#b45309;">${d.receiptNo || 'WHT-' + d.id}</span></div>
                                <div><strong>سیزن / سال:</strong> <span style="font-weight:bold;">${d.season || '-'}</span></div>
                                <div><strong>تاریخِ وصولی:</strong> <span style="font-family:Arial; font-weight:bold;">${formattedDate}</span></div>
                            </div>

                            <!-- Body Info -->
                            <div style="line-height: 2.2; font-size: 1.15rem; color: #1e293b;">
                                <div>
                                    محترم جناب: <strong style="font-size: 1.25rem; color: #0f172a; text-decoration: underline;">${d.name || '-'}</strong> صاحب
                                </div>
                                <div style="display:flex; justify-content:space-between; flex-wrap:wrap;">
                                    <div>فون / واٹس ایپ: <span style="font-family:Arial; direction:ltr; unicode-bidi:embed; font-weight:bold;">${d.phone || d.whatsapp || '-'}</span></div>
                                    <div>سکونت / پتہ: <strong>${d.address || '-'}</strong></div>
                                </div>
                                <div style="margin-top: 10px; background: #fef3c7; border: 1px solid #fde68a; padding: 12px 18px; border-radius: 10px;">
                                    <div style="font-size: 1.2rem; color: #92400e;">
                                        کی جانب سے مدرسہ کے طلباء کی طعام گاہ و خوراک کے لیے بطورِ عطیہ/صدقہ:
                                    </div>
                                    <div style="display: flex; gap: 2rem; margin-top: 6px; font-size: 1.3rem; font-weight: bold; color: #78350f;">
                                        <div>تعداد بوریاں: <span style="color:#b45309;">${d.bags || 0} بوری</span></div>
                                        <div>کل وزن (مقدار): <span style="color:#16a34a;">${WheatModule.formatMaundsAndKg(d.maunds)}</span> <span style="font-size:0.95rem; color:#64748b;">(${Math.round(parseFloat(d.maunds || 0) * 40)} کلوگرام)</span></div>
                                    </div>
                                </div>
                                ${d.remarks ? `<div style="font-size:0.95rem; color:#64748b; margin-top:6px;">کیفیات: ${d.remarks}</div>` : ''}
                            </div>

                            <!-- Dua / Blessings -->
                            <div style="margin: 1.5rem 0 1.2rem 0; text-align: center; background: #f8fafc; border-radius: 8px; padding: 10px; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #047857; font-weight: bold;">
                                "جَزَاكُمُ اللَّهُ خَيْرًا وَأَحْسَنَ الْجَزَاءِ فِي الدَّارَيْنِ"<br>
                                <span style="font-size: 0.95rem; color: #475569; font-weight: normal;">اللہ تعالیٰ آپ کا یہ عطیہ اپنی بارگاہ میں شرفِ قبولیت بخشے اور آپ کے مال، جان اور اہل و عیال میں بے شمار برکتیں عطا فرمائے۔ آمین۔</span>
                            </div>

                            <!-- Footer Signatures -->
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2rem; padding-top: 1rem;">
                                <div style="text-align: center;">
                                    <div style="font-weight: bold; color: #475569;">${d.receivedBy || 'دفتر مدرسہ'}</div>
                                    <div style="border-top: 1px solid #94a3b8; width: 140px; margin-top: 4px; font-size: 0.85rem; color: #64748b;">دستخط وصول کنندہ</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="width:68px; height:68px; border-radius:50%; border:2px solid #b45309; box-shadow:0 0 0 1px #fde68a, inset 0 0 4px rgba(180, 83, 9, 0.15); display:flex; align-items:center; justify-content:center; transform:rotate(-5deg); background:rgba(255,255,255,0.95); margin:0 auto;">
                                        <div style="width:58px; height:58px; border-radius:50%; border:1.2px dashed #b45309; display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:2px; box-sizing:border-box; text-align:center; font-family:'Amiri',serif; color:#b45309;">
                                            <div style="font-size:6.8pt; font-weight:bold; line-height:1.1; white-space:nowrap;">مدرسہ عبد الرحمن ؓ بن عوف</div>
                                            <div style="display:flex; align-items:center; justify-content:center; gap:2px; padding:0 2px; border-top:1px solid currentColor; border-bottom:1px solid currentColor; width:90%; margin:1px auto;">
                                                <span style="font-size:4.5pt;">★</span>
                                                <span style="font-size:6.8pt; font-weight:800; line-height:1.1;">مصدقہ مہر</span>
                                                <span style="font-size:4.5pt;">★</span>
                                            </div>
                                            <div style="font-size:6pt; font-weight:bold; line-height:1; white-space:nowrap;">غفوریہ — خانیوال</div>
                                        </div>
                                    </div>
                                    <div style="font-size: 0.8rem; color: #b45309; font-weight:bold; margin-top:3px;">مہر ادارہ (Official Seal)</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="border-top: 1px solid #94a3b8; width: 140px; margin-top: 4px; font-size: 0.85rem; color: #64748b;">دستخط مہتمم / ناظم</div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    printReceiptDoc() {
        const printContent = document.getElementById('wheat-printable-slip');
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>رسید عطیہ گندم - مدرسہ عبد الرحمن بن عوفؓ</title>
                <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
                <style>
                    body {
                        font-family: 'Jameel Noori Nastaleeq', 'Segoe UI', Tahoma, sans-serif;
                        direction: rtl;
                        text-align: right;
                        background: white;
                        margin: 20px;
                        color: #1e293b;
                    }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    // -------------------------------------------------------------
    // 5. WHATSAPP SHARING (پیغام بذریعہ واٹس ایپ)
    // -------------------------------------------------------------
    async shareReceiptWhatsAppDirect(id) {
        const d = await MadrassahDB.getWheatDonationById(id);
        if (!d) {
            alert('ریکارڈ نہیں ملا!');
            return;
        }

        const phone = d.whatsapp || d.phone;
        if (!phone) {
            alert('ڈونر کا موبائل یا واٹس ایپ نمبر درج نہیں ہے۔ براہ کرم ترمیم کر کے نمبر لکھیں۔');
            return;
        }

        const formattedDate = d.date ? new Date(d.date).toLocaleDateString('ur-PK') : new Date().toLocaleDateString('ur-PK');

        const message = 
`السلام علیکم ورحمۃ اللہ وبرکاتہ!
محترم ${d.name} صاحب!
مدرسہ عبد الرحمن ؓ بن عوف غفوریہ کی جانب سے آپ کے گندم کے عطیہ کی وصولی تصدیق کی جاتی ہے۔

📋 *تفصیلاتِ رسید:*
رسید نمبر: ${d.receiptNo || 'WHT-' + d.id}
تاریخِ وصولی: ${formattedDate}
سیزن / فصل: ${d.season || '-'}
تعداد بوریاں: ${d.bags || 0} بوری
کل مقدار (وزن): ${WheatModule.formatMaundsAndKg(d.maunds)} (${Math.round(parseFloat(d.maunds || 0) * 40)} کلوگرام)

جَزَاكُمُ اللَّهُ خَيْرًا وَأَحْسَنَ الْجَزَاءِ فِي الدَّارَيْنِ
اللہ تعالیٰ آپ کا یہ صدقہ و عطیہ اپنی بارگاہ میں شرفِ قبولیت بخشے اور آپ کے مال، جان اور اہل و عیال میں بے شمار برکتیں عطا فرمائے۔ آمین۔

خیراندیش:
انتظامیہ مدرسہ عبد الرحمن ؓ بن عوف غفوریہ
چک نمبر R/28-10 بوسال کالونی ضلع خانیوال | رابطہ: 0302 7440199`;

        this.openWhatsAppDirect(phone, message);
    },

    // -------------------------------------------------------------
    // 6. STOCK REGISTER PREVIEW & PRINT (مکمل اسٹاک رجسٹر معائنہ و پرنٹ)
    // -------------------------------------------------------------
    async showStockRegisterModal() {
        const [donations, usage] = await Promise.all([
            MadrassahDB.getAllWheatDonations(this.selectedSeason),
            MadrassahDB.getAllWheatUsage(this.selectedSeason)
        ]);

        let totalRecM = 0, totalRecB = 0;
        donations.forEach(d => { totalRecM += parseFloat(d.maunds || 0); totalRecB += parseInt(d.bags || 0); });

        let totalUsedM = 0, totalUsedB = 0;
        usage.forEach(u => { totalUsedM += parseFloat(u.maunds || 0); totalUsedB += parseInt(u.bags || 0); });

        const netM = totalRecM - totalUsedM;
        const netB = totalRecB - totalUsedB;

        // Build combined ledger
        const ledger = [];
        donations.forEach(d => {
            ledger.push({
                type: 'آمد',
                date: d.date || '2026-01-01',
                refNo: d.receiptNo || ('WHT-' + d.id),
                title: 'ڈونر: ' + (d.name || '-') + (d.address ? ' (' + d.address + ')' : ''),
                inBags: parseInt(d.bags || 0),
                inMaunds: parseFloat(d.maunds || 0),
                outBags: 0,
                outMaunds: 0
            });
        });
        usage.forEach(u => {
            ledger.push({
                type: 'خرچ',
                date: u.date || '2026-01-01',
                refNo: u.voucherNo || ('WUV-' + u.id),
                title: 'استعمال: ' + WheatModule.cleanPurposeText(u.purpose) + (u.millName ? ' | چکی: ' + u.millName : ''),
                inBags: 0,
                inMaunds: 0,
                outBags: parseInt(u.bags || 0),
                outMaunds: parseFloat(u.maunds || 0)
            });
        });

        ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

        let curM = 0, curB = 0;
        ledger.forEach(item => {
            curM += (item.inMaunds - item.outMaunds);
            curB += (item.inBags - item.outBags);
            item.balM = curM;
            item.balB = curB;
        });

        this.closeModal();

        const modalHtml = `
            <div id="wheat-stock-register-modal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.75); backdrop-filter:blur(5px); z-index:10000; display:flex; align-items:center; justify-content:center; padding:1.2rem; direction:rtl; text-align:right; font-family:'Jameel Noori Nastaleeq', 'Segoe UI', Arial;">
                <div style="background:white; border-radius:16px; width:100%; max-width:1050px; max-height:94vh; overflow-y:auto; box-shadow:0 25px 50px -12px rgba(0,0,0,0.35); border:1px solid #cbd5e1; display:flex; flex-direction:column;">
                    
                    <!-- Top Action / Navigation Bar -->
                    <div style="background:#f8fafc; padding:12px 22px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:10;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:38px; height:38px; border-radius:8px; background:#b45309; color:white; display:flex; align-items:center; justify-content:center; font-size:1.15rem;">
                                <i class="fas fa-boxes-stacked"></i>
                            </div>
                            <div>
                                <span style="font-weight:bold; color:#1e293b; font-size:1.15rem;">اسٹاک رجسٹر برائے گندم و غلہ جات (پیشگی معائنہ / Print Preview)</span>
                                <div style="font-size:0.85rem; color:#64748b;">پرنٹ سے قبل رجسٹر کی تمام تفصیلات کا جائزہ لیں</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <button onclick="WheatModule.printStockRegisterDoc()" class="btn btn-primary" style="background:#0f172a; color:#ffffff; border:none; padding:8px 20px; border-radius:8px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 3px 10px rgba(15,23,42,0.25); font-size:0.95rem;">
                                <i class="fas fa-print"></i> پرنٹ کریں (Print)
                            </button>
                            <button onclick="WheatModule.closeModal()" style="background:#e2e8f0; border:none; color:#475569; width:34px; height:34px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1.1rem;" title="بند کریں">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Printable Container (also previewed inside modal) -->
                    <div id="wheat-printable-stock-register" style="padding:2.2rem 2.5rem; background:white; color:#0f172a;">
                        
                        <!-- Header Section -->
                        <div style="text-align: center; border-bottom: 2px solid #b45309; padding-bottom: 12px; margin-bottom: 16px;">
                            <div style="font-size: 1.15rem; color: #78350f; font-weight: bold;">بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ</div>
                            <h2 style="margin: 3px 0; font-size: 2.3rem; color: #78350f; font-weight: bold;">مدرسہ عبد الرحمن ؓ بن عوف غفوریہ</h2>
                            <div style="font-size: 1.05rem; color: #78350f; font-weight: bold; margin-bottom: 3px;">چک نمبر R/28-10 بوسال کالونی ضلع خانیوال | رابطہ: 0302 7440199</div>
                            <div style="font-size: 1.35rem; font-weight: bold; color: #0f172a; margin-top: 4px;">اسٹاک رجسٹر برائے گندم و غلہ جات (گودام و راشن خلاصہ)</div>
                            <div style="font-size: 1rem; color: #475569; margin-top: 5px;">
                                سیزن / سال: <strong>${this.selectedSeason === 'all' ? 'تمام سیزنز' : this.selectedSeason}</strong> &nbsp;|&nbsp; تاریخِ معائنہ و پرنٹ: ${new Date().toLocaleDateString('ur-PK')}
                            </div>
                        </div>

                        <!-- KPI Summary Bar -->
                        <div style="display: flex; justify-content: space-around; background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 12px; border-radius: 10px; margin-bottom: 18px; font-size: 1.05rem; font-weight: bold; flex-wrap: wrap; gap: 10px;">
                            <div>کل وصول شدہ گندم: <span style="color:#16a34a;">${WheatModule.formatMaundsAndKg(totalRecM)} (${totalRecB} بوریاں | ${Math.round(totalRecM * 40)} کلو)</span></div>
                            <div style="border-right: 1px solid #cbd5e1; padding-right: 15px;">کل استعمال شدہ گندم: <span style="color:#ea580c;">${WheatModule.formatMaundsAndKg(totalUsedM)} (${totalUsedB} بوریاں | ${Math.round(totalUsedM * 40)} کلو)</span></div>
                            <div style="border-right: 1px solid #cbd5e1; padding-right: 15px;">موجودہ بقیہ ذخیرہ: <span style="color:#2563eb;">${WheatModule.formatMaundsAndKg(netM)} (${netB} بوریاں | ${Math.round(netM * 40)} کلو)</span></div>
                        </div>

                        <!-- Ledger Table -->
                        <table style="width: 100%; border-collapse: collapse; font-size: 1rem; margin-top: 10px; text-align: right;">
                            <thead>
                                <tr style="background: #f1f5f9; color: #1e293b;">
                                    <th style="border: 1px solid #94a3b8; padding: 9px 8px; text-align: center; width: 40px;">شمار</th>
                                    <th style="border: 1px solid #94a3b8; padding: 9px 8px; text-align: center; width: 90px;">تاریخ</th>
                                    <th style="border: 1px solid #94a3b8; padding: 9px 8px; text-align: center; width: 85px;">رسید/واؤچر</th>
                                    <th style="border: 1px solid #94a3b8; padding: 9px 8px; text-align: center; width: 55px;">نوعیت</th>
                                    <th style="border: 1px solid #94a3b8; padding: 9px 10px;">تفصیل (ڈونر مع پتہ یا مدِ خرچ)</th>
                                    <th style="border: 1px solid #94a3b8; padding: 9px 8px; text-align: center; width: 95px; color:#16a34a;">آمد (من و کلو)</th>
                                    <th style="border: 1px solid #94a3b8; padding: 9px 8px; text-align: center; width: 65px; color:#16a34a;">آمد (بوری)</th>
                                    <th style="border: 1px solid #94a3b8; padding: 9px 8px; text-align: center; width: 95px; color:#ea580c;">خرچ (من و کلو)</th>
                                    <th style="border: 1px solid #94a3b8; padding: 9px 8px; text-align: center; width: 65px; color:#ea580c;">خرچ (بوری)</th>
                                    <th style="border: 1px solid #94a3b8; padding: 9px 8px; text-align: center; width: 105px; color:#0f172a;">میزان (من و کلو)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ledger.length === 0 ? `
                                    <tr>
                                        <td colspan="10" style="border: 1px solid #94a3b8; text-align: center; padding: 2rem; color: #64748b;">اسٹاک رجسٹر میں کوئی اندراج موجود نہیں ہے۔</td>
                                    </tr>
                                ` : ledger.map((row, idx) => `
                                    <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#fcfcfc'};">
                                        <td style="border: 1px solid #94a3b8; padding: 7px 8px; text-align: center;">${idx + 1}</td>
                                        <td style="border: 1px solid #94a3b8; padding: 7px 8px; text-align: center;">${new Date(row.date).toLocaleDateString('ur-PK')}</td>
                                        <td style="border: 1px solid #94a3b8; padding: 7px 8px; text-align: center; font-weight: bold; color: ${row.type === 'آمد' ? '#b45309' : '#ea580c'};">${row.refNo}</td>
                                        <td style="border: 1px solid #94a3b8; padding: 7px 8px; text-align: center; font-weight:bold; color:${row.type === 'آمد' ? '#16a34a' : '#ea580c'};">${row.type}</td>
                                        <td style="border: 1px solid #94a3b8; padding: 7px 10px;">${row.title}</td>
                                        <td style="border: 1px solid #94a3b8; padding: 7px 8px; text-align: center; font-weight:bold; color:#16a34a;">${row.inMaunds > 0 ? WheatModule.formatMaundsAndKg(row.inMaunds) : '-'}</td>
                                        <td style="border: 1px solid #94a3b8; padding: 7px 8px; text-align: center;">${row.inBags > 0 ? row.inBags : '-'}</td>
                                        <td style="border: 1px solid #94a3b8; padding: 7px 8px; text-align: center; font-weight:bold; color:#ea580c;">${row.outMaunds > 0 ? WheatModule.formatMaundsAndKg(row.outMaunds) : '-'}</td>
                                        <td style="border: 1px solid #94a3b8; padding: 7px 8px; text-align: center;">${row.outBags > 0 ? row.outBags : '-'}</td>
                                        <td style="border: 1px solid #94a3b8; padding: 7px 8px; text-align: center; font-weight:bold; color:#0f172a; background:#f8fafc;">${WheatModule.formatMaundsAndKg(row.balM)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <!-- Signatures & Stamp -->
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 45px; padding: 0 40px;">
                            <div style="text-align: center;">
                                <div style="border-top: 1px solid #334155; width: 170px; padding-top: 5px; font-weight: bold; color: #334155;">گودام انچارج</div>
                            </div>

                            <!-- Madrasa Official Stamp -->
                            <div style="text-align: center;">
                                <div style="width:72px; height:72px; border-radius:50%; border:2px solid #b45309; box-shadow:0 0 0 1px #fde68a, inset 0 0 4px rgba(180, 83, 9, 0.15); display:flex; align-items:center; justify-content:center; transform:rotate(-4deg); background:rgba(255,255,255,0.95); margin:0 auto;">
                                    <div style="width:62px; height:62px; border-radius:50%; border:1.2px dashed #b45309; display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:2px; box-sizing:border-box; text-align:center; font-family:'Amiri',serif; color:#b45309;">
                                        <div style="font-size:7pt; font-weight:bold; line-height:1.1; white-space:nowrap;">مدرسہ عبد الرحمن ؓ بن عوف</div>
                                        <div style="display:flex; align-items:center; justify-content:center; gap:2px; padding:0 2px; border-top:1px solid currentColor; border-bottom:1px solid currentColor; width:90%; margin:1px auto;">
                                            <span style="font-size:4.5pt;">★</span>
                                            <span style="font-size:7pt; font-weight:800; line-height:1.1;">مصدقہ مہر</span>
                                            <span style="font-size:4.5pt;">★</span>
                                        </div>
                                        <div style="font-size:6.2pt; font-weight:bold; line-height:1; white-space:nowrap;">غفوریہ — خانیوال</div>
                                    </div>
                                </div>
                                <div style="font-size: 0.8rem; color: #b45309; font-weight:bold; margin-top:3px;">مہر ادارہ (Official Seal)</div>
                            </div>

                            <div style="text-align: center;">
                                <div style="border-top: 1px solid #334155; width: 170px; padding-top: 5px; font-weight: bold; color: #334155;">دستخط مہتمم صاحب</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    printStockRegisterDoc() {
        const printContent = document.getElementById('wheat-printable-stock-register');
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=1000,height=900');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>اسٹاک رجسٹر گندم و غلہ جات - مدرسہ عبد الرحمن ؓ بن عوف غفوریہ</title>
                <link rel="stylesheet" href="https://cdn.rawgit.com/mquandalle/bower-jameel-noori-nastaleeq/master/style.css">
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 8mm 10mm;
                    }
                    * {
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Jameel Noori Nastaleeq', 'Segoe UI', Tahoma, sans-serif;
                        direction: rtl;
                        text-align: right;
                        background: white;
                        margin: 0;
                        padding: 12px 18px;
                        color: #0f172a;
                        width: 100%;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 0.95rem;
                        margin-top: 10px;
                    }
                    th, td {
                        border: 1px solid #475569;
                        padding: 6px 8px;
                        text-align: right;
                    }
                    th {
                        background: #f1f5f9;
                        font-weight: bold;
                    }
                    .text-center { text-align: center; }
                    @media print {
                        @page {
                            size: A4 landscape;
                            margin: 8mm 10mm;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="text-align:center; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #e2e8f0;">
                    <button onclick="window.print()" style="background:#0f172a; color:#fff; border:none; padding:8px 24px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1rem;">
                        <i class="fas fa-print"></i> پرنٹ کریں (A4 Landscape)
                    </button>
                    <button onclick="window.close()" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:8px 18px; border-radius:8px; font-weight:bold; cursor:pointer; margin-right:10px;">
                        بند کریں
                    </button>
                </div>
                ${printContent.innerHTML}
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
        printWindow.document.close();
    },

    printWheatStockRegister() {
        this.showStockRegisterModal();
    },

    // -------------------------------------------------------------
    // 7. EXPORT TO CSV
    // -------------------------------------------------------------
    async exportDonorsToCSV() {
        const donations = await MadrassahDB.getAllWheatDonations(this.selectedSeason);
        if (!donations || donations.length === 0) {
            alert('برآمد کرنے کے لیے کوئی ریکارڈ موجود نہیں ہے۔');
            return;
        }

        let csv = '\uFEFFرسید نمبر,تاریخ,ڈونر کا نام,فون نمبر,واٹس ایپ,پتہ,بوریاں,من,سیزن,وصول کنندہ,کیفیات\n';
        donations.forEach(d => {
            const clean = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
            csv += [
                clean(d.receiptNo),
                clean(d.date),
                clean(d.name),
                clean(d.phone),
                clean(d.whatsapp),
                clean(d.address),
                clean(d.bags),
                clean(d.maunds),
                clean(d.season),
                clean(d.receivedBy),
                clean(d.remarks)
            ].join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `wheat_donors_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

if (typeof window !== 'undefined') {
    window.WheatModule = WheatModule;
}
