<?php
/**
 * Handles the Standalone Frontend UI Shell
 */
class MMS_Dashboard {

    public static function intercept_dashboard_page() {
        if (is_page('madrassah-app')) {
            self::render_shell();
            exit;
        }
    }

    private static function render_shell() {
        ?>
        <!DOCTYPE html>
        <html <?php language_attributes(); ?>>
        <head>
            <meta charset="<?php bloginfo('charset'); ?>">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title><?php wp_title('|', true, 'right'); ?> Madrassah Pro Manager</title>
            <?php wp_head(); ?>
        </head>
        <body class="mms-dashboard-body">
            <div id="mms-wrapper">
                <!-- Sidebar -->
                <aside id="mms-sidebar">
                    <div class="mms-logo-area">
                        <img src="<?php echo MMS_PLUGIN_URL; ?>logo.jpg" alt="مدرسہ عبد الرحمن بن عوف" class="mms-logo-img">
                    </div>
                    <nav class="mms-nav">
                        <a href="#" class="mms-nav-link active" data-view="dashboard">
                            <i class="fas fa-chart-line"></i> <span>ڈیش بورڈ</span>
                        </a>
                        <a href="#" class="mms-nav-link" data-view="students">
                            <i class="fas fa-user-graduate"></i> <span>طلباء</span>
                        </a>
                        <a href="#" class="mms-nav-link" data-view="hifz">
                            <i class="fas fa-book-quran"></i> <span>حفظ ریکارڈ</span>
                        </a>
                        <a href="#" class="mms-nav-link" data-view="accounts">
                            <i class="fas fa-wallet"></i> <span>بیت المال</span>
                        </a>
                        <a href="#" class="mms-nav-link" data-view="reports">
                            <i class="fas fa-file-invoice"></i> <span>رپورٹس</span>
                        </a>
                        <a href="#" class="mms-nav-link" data-view="settings">
                            <i class="fas fa-cog"></i> <span>ترتیبات</span>
                        </a>
                    </nav>
                </aside>

                <!-- Main Content Area -->
                <main id="mms-main">
                    <header id="mms-topbar">
                        <div class="mms-header-left">
                            <button id="mms-sidebar-toggle"><i class="fas fa-bars"></i></button>
                            <h3 id="mms-view-title">ڈیش بورڈ</h3>
                        </div>
                        <div class="mms-header-right">
                            <span class="mms-user-name"><?php $user = wp_get_current_user(); echo $user->display_name; ?></span>
                            <img src="<?php echo get_avatar_url($user->ID); ?>" class="mms-user-avatar">
                        </div>
                    </header>

                    <div id="mms-content-root">
                        <!-- AJAX content will load here -->
                        <div class="mms-loader-wrap">
                            <div class="mms-spinner"></div>
                        </div>
                    </div>

                    <footer id="mms-footer">
                        Designed and Developed by <b>محمد ادریس شاہین</b>
                    </footer>
                </main>
            </div>
            <?php wp_footer(); ?>
        </body>
        </html>
        <?php
    }
}
