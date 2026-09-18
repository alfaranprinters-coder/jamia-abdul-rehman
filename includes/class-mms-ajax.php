<?php
/**
 * Handles AJAX requests for the Madrassah Pro Manager
 */
class MMS_Ajax {

    public function init() {
        add_action('wp_ajax_mms_load_view', array($this, 'load_view'));
    }

    public function load_view() {
        check_ajax_referer('mms_security_nonce');

        $view = isset($_POST['view']) ? sanitize_text_field($_POST['view']) : 'dashboard';

        ob_start();
        switch ($view) {
            case 'dashboard':
                $this->render_dashboard_view();
                break;
            case 'students':
                $this->render_students_view();
                break;
            case 'hifz':
                $this->render_placeholder('حفظ ریکارڈ');
                break;
            case 'accounts':
                $this->render_placeholder('بیت المال');
                break;
            case 'reports':
                $this->render_placeholder('رپورٹس');
                break;
            case 'settings':
                $this->render_placeholder('ترتیبات');
                break;
            default:
                echo 'View not found.';
        }
        $content = ob_get_clean();

        wp_send_json_success($content);
    }

    private function render_dashboard_view() {
        global $wpdb;
        $student_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}mms_students");
        ?>
        <div class="mms-dashboard-grid">
            <div class="mms-stat-card">
                <i class="fas fa-users"></i>
                <div class="mms-stat-info">
                    <h4>کل طلباء</h4>
                    <h3><?php echo (int)$student_count; ?></h3>
                </div>
            </div>
            <div class="mms-stat-card">
                <i class="fas fa-money-bill-wave" style="color: #b45309;"></i>
                <div class="mms-stat-info">
                    <h4>آج کی آمدنی</h4>
                    <h3>0</h3>
                </div>
            </div>
        </div>

        <div class="mms-recent-activity mms-glass-card">
            <h3>حالیہ داخلہ</h3>
            <table>
                <thead>
                    <tr>
                        <th>نام</th>
                        <th>ولدیت</th>
                        <th>کلاس</th>
                        <th>تاریخ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="4" style="text-align:center;">کوئی ریکارڈ موجود نہیں</td></tr>
                </tbody>
            </table>
        </div>

        <style>
            .mms-dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
            .mms-stat-card { background: white; padding: 1.5rem; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 1.5rem; border: 1px solid rgba(0,0,0,0.05); }
            .mms-stat-card i { font-size: 2rem; color: var(--primary); background: rgba(6,95,70,0.05); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
            .mms-stat-info h4 { margin: 0; color: var(--text-muted); font-size: 0.9rem; }
            .mms-stat-info h3 { margin: 5px 0 0; font-size: 1.5rem; }
            .mms-glass-card { background: white; padding: 1.5rem; border-radius: 15px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th { text-align: right; padding: 1rem; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: var(--text-muted); }
            td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }
        </style>
        <?php
    }

    private function render_students_view() {
        ?>
        <div class="mms-view-header" style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h3>طلباء کی فہرست</h3>
            <button class="btn btn-primary" style="background:var(--primary); color:white; border:none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor:pointer;">
                <i class="fas fa-plus"></i> نیا داخلہ
            </button>
        </div>

        <div class="mms-glass-card">
            <table>
                <thead>
                    <tr>
                        <th>نام</th>
                        <th>ولدیت</th>
                        <th>فون</th>
                        <th>شعبہ</th>
                        <th>ایکشن</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="5" style="text-align:center;">لوڈنگ...</td></tr>
                </tbody>
            </table>
        </div>
        <?php
    }

    private function render_placeholder($title) {
        echo "<div class='mms-glass-card'><h3>$title</h3><p>یہ فیچر جلد آ رہا ہے...</p></div>";
    }
}
