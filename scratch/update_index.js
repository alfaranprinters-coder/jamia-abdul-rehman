const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Clean the <style> block: remove display !important rules, keep z-index & overlay
const oldStyle = `    <!-- Permanent display rule preventing any hidden state -->
    <style>
        #app, #mms-app-main {
            display: flex !important;
            min-height: 100vh;
        }
        #welcome-login-screen {
            display: none !important;
        }
        /* Guarantee sidebar is always clickable and above any overlay on desktop */
        aside#mms-sidebar {
            z-index: 1000 !important;
        }
        #mms-sidebar-overlay:not(.active) {
            display: none !important;
            pointer-events: none !important;
        }
        @media (min-width: 993px) {
            #mms-sidebar-overlay {
                display: none !important;
                pointer-events: none !important;
            }
        }
        .nav-link, .section-tabs .tab, .sidebar-toggle-btn {
            cursor: pointer !important;
            user-select: none;
            pointer-events: auto !important;
        }
    </style>`;

const newStyle = `    <style>
        /* Guarantee sidebar is always clickable and above any overlay on desktop */
        aside#mms-sidebar {
            z-index: 1000 !important;
        }
        #mms-sidebar-overlay:not(.active) {
            display: none !important;
            pointer-events: none !important;
        }
        @media (min-width: 993px) {
            #mms-sidebar-overlay {
                display: none !important;
                pointer-events: none !important;
            }
        }
        .nav-link, .section-tabs .tab, .sidebar-toggle-btn {
            cursor: pointer !important;
            user-select: none;
            pointer-events: auto !important;
        }
    </style>`;

// 2. Clean head script: replace the whole hacky block with clean delegates
const oldHeadScript = `    <!-- Pre-seed Authentication & Global Namespace Guard -->
    <script>
        // 1. Pre-seed authentication in storage
        try { sessionStorage.setItem('mms_authenticated', 'true'); } catch (e) {}
        try { localStorage.setItem('mms_authenticated', 'true'); } catch (e) {}

        // 2. Storage override to guarantee 'mms_authenticated' returns 'true' even on restrictive file:/// origins
        try {
            if (typeof Storage !== 'undefined' && Storage.prototype) {
                var origGet = Storage.prototype.getItem;
                Storage.prototype.getItem = function(k) {
                    if (k === 'mms_authenticated') return 'true';
                    return origGet.apply(this, arguments);
                };
            }
        } catch(e) {}

        // 3. Global Real App Locator — ONLY returns existing instance, never creates new one
        window._getApp = function() {
            var a = window.app;
            if (a && typeof a.renderDashboard === 'function') return a;
            if (window._mmsRealApp && typeof window._mmsRealApp.renderDashboard === 'function') return window._mmsRealApp;
            if (a && typeof a.navigate === 'function' && typeof a.render === 'function' && a.constructor && a.constructor.name === 'MadrassahApp') return a;
            return null;
        };

        window.getMmsApp = window._getApp;

        // ── Global Navigation Functions (called from nav link onclick attrs) ──
        window._nav = function(view) {
            // Update active state in sidebar immediately for instant feedback
            document.querySelectorAll('.nav-link').forEach(function(l) {
                var v = l.getAttribute('data-view');
                var isActive = (v === view);
                l.classList.toggle('active', isActive);
                if (isActive) {
                    var titleEl = document.getElementById('mms-view-title');
                    var spanEl = l.querySelector('span');
                    if (titleEl && spanEl) titleEl.innerText = spanEl.innerText;
                }
            });

            // Close mobile sidebar if screen width <= 992
            if (window.innerWidth <= 992 && typeof window._tog === 'function') {
                window._tog(false);
            }

            var a = window._getApp();
            if (a) {
                a.isAuthenticated = true;
                if (typeof a.navigate === 'function') {
                    a.navigate(view);
                } else if (typeof a.render === 'function') {
                    a.currentView = view;
                    a.render();
                }
            } else {
                setTimeout(function() { window._nav(view); }, 150);
            }
        };

        window._sec = function(section) {
            var a = window._getApp();
            if (a && typeof a.switchSection === 'function') {
                a.switchSection(section);
            } else if (a && typeof a.applySectionTheme === 'function') {
                a.applySectionTheme(section);
                if (typeof a.render === 'function') a.render();
            }
            document.querySelectorAll('.section-tabs .tab').forEach(function(t) {
                t.classList.toggle('active', t.getAttribute('data-section') === section);
            });
        };

        window._tog = function(forceState) {
            var a = window._getApp();
            if (a && typeof a.toggleSidebar === 'function') {
                a.toggleSidebar(forceState);
                return;
            }
            var sb = document.getElementById('mms-sidebar');
            var ov = document.getElementById('mms-sidebar-overlay');
            if (!sb) return;
            var open = typeof forceState === 'boolean' ? forceState : !sb.classList.contains('open');
            sb.classList.toggle('open', open);
            if (ov) ov.classList.toggle('active', open);
        };

        window._out = function() {
            var a = window._getApp();
            if (a && typeof a.logout === 'function') { a.logout(); return; }
            try { sessionStorage.removeItem('mms_authenticated'); } catch(e) {}
            try { localStorage.removeItem('mms_authenticated'); } catch(e) {}
            location.reload();
        };

        // 4. Initial placeholder for 'window.app' routing through our robust functions
        window.app = {
            currentSection: 'banin',
            currentView: 'dashboard',
            isAuthenticated: true,
            navigate: function(v) { window._nav(v); },
            switchSection: function(s) { window._sec(s); },
            toggleSidebar: function(f) { window._tog(f); },
            logout: function() { window._out(); }
        };

        window.enterSoftwareDirectly = function() {
            var welcome = document.getElementById('welcome-login-screen');
            var appEl = document.getElementById('app') || document.getElementById('mms-app-main');
            if (welcome) welcome.setAttribute('style', 'display: none !important;');
            if (appEl)   appEl.setAttribute('style',   'display: flex !important;');
            window._nav('dashboard');
        };
    </script>`;

const newHeadScript = `    <!-- Global Navigation & Compatibility Helpers -->
    <script>
        // Backward-compatibility delegates routing directly to window.app
        window._nav = function(v) {
            if (window.app && typeof window.app.navigate === 'function') {
                window.app.navigate(v);
            }
        };
        window._sec = function(s) {
            if (window.app && typeof window.app.switchSection === 'function') {
                window.app.switchSection(s);
            }
        };
        window._tog = function(f) {
            if (window.app && typeof window.app.toggleSidebar === 'function') {
                window.app.toggleSidebar(f);
            }
        };
        window._out = function() {
            if (window.app && typeof window.app.logout === 'function') {
                window.app.logout();
            }
        };
        window.enterSoftwareDirectly = function() {
            if (window.app) {
                window.app.isAuthenticated = true;
                try { sessionStorage.setItem('mms_authenticated', 'true'); } catch(e) {}
                try { localStorage.setItem('mms_authenticated', 'true'); } catch(e) {}
                window.app.showAppScreen();
                window.app.applySectionTheme(window.app.currentSection || 'banin');
                window.app.navigate('dashboard');
            }
        };
    </script>`;

// 3. Clean the bottom bootstrap script
const oldBottomMarker = `    <!-- MMS Final Bootstrap & Event Delegation -->`;
const oldBottomIndex = html.indexOf(oldBottomMarker);

if (oldBottomIndex === -1) {
    console.error('Bottom marker not found!');
    process.exit(1);
}

const beforeBottom = html.substring(0, oldBottomIndex);
const newBottomScript = `    <script>
        // Ensure app renders initial view on DOM ready
        document.addEventListener('DOMContentLoaded', function() {
            if (window.app && window.app.isAuthenticated && typeof window.app.render === 'function') {
                var mc = document.getElementById('main-content');
                if (mc && (!mc.children.length || mc.querySelector('.mms-spinner'))) {
                    window.app.render();
                }
            }
        });
    </script>
</body>
</html>
`;

// Replace style and head script
const isCRLF = html.includes('\r\n');
const normalize = str => str.replace(/\r\n/g, '\n');

let normHtml = normalize(beforeBottom);
let normOldStyle = normalize(oldStyle);
let normNewStyle = normalize(newStyle);
let normOldHead = normalize(oldHeadScript);
let normNewHead = normalize(newHeadScript);

if (!normHtml.includes(normOldStyle)) {
    console.error('Style block not found!');
    process.exit(1);
}
normHtml = normHtml.replace(normOldStyle, normNewStyle);

if (!normHtml.includes(normOldHead)) {
    console.error('Head script block not found!');
    process.exit(1);
}
normHtml = normHtml.replace(normOldHead, normNewHead);

// Also clean up section tabs and sidebar nav links to use app.switchSection and app.navigate directly
normHtml = normHtml.replace(/onclick="_sec\('banin'\)"/g, "onclick=\"app.switchSection('banin')\"");
normHtml = normHtml.replace(/onclick="_sec\('banat'\)"/g, "onclick=\"app.switchSection('banat')\"");
normHtml = normHtml.replace(/onclick="_nav\('([a-zA-Z0-9_]+)'\)"/g, "onclick=\"app.navigate('$1')\"");
normHtml = normHtml.replace(/onclick="_tog\(\)"/g, "onclick=\"app.toggleSidebar()\"");
normHtml = normHtml.replace(/onclick="_tog\(false\)"/g, "onclick=\"app.toggleSidebar(false)\"");
normHtml = normHtml.replace(/onclick="_out\(\)"/g, "onclick=\"app.logout()\"");

// Also remove inline style="display: none !important;" from welcome-login-screen and style="display: flex !important;" from app
normHtml = normHtml.replace('<div id="welcome-login-screen" style="display: none !important;">', '<div id="welcome-login-screen">');
normHtml = normHtml.replace('<div id="app" style="display: flex !important;">', '<div id="app">');

// Append new bottom script
let finalHtml = normHtml + normalize(newBottomScript);

if (isCRLF) {
    finalHtml = finalHtml.replace(/\n/g, '\r\n');
}

fs.writeFileSync('index.html', finalHtml, 'utf8');
console.log('Successfully updated index.html!');
