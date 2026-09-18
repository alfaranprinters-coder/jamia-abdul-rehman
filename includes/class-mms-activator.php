<?php
/**
 * Handles plugin activation logic: Database schema and Page creation.
 */
class MMS_Activator {

    public static function activate() {
        self::create_tables();
        self::create_dashboard_page();
    }

    private static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        // 1. Students Table
        $table_students = $wpdb->prefix . 'mms_students';
        $sql_students = "CREATE TABLE $table_students (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            reg_no varchar(50) NOT NULL,
            name varchar(255) NOT NULL,
            father_name varchar(255) NOT NULL,
            dob date DEFAULT NULL,
            gender enum('male', 'female') NOT NULL DEFAULT 'male',
            address text,
            phone varchar(20),
            shoba varchar(100),
            class_name varchar(100),
            status enum('active', 'inactive', 'graduated') DEFAULT 'active',
            photo text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($sql_students);

        // 2. Hifz Record Table
        $table_hifz = $wpdb->prefix . 'mms_hifz_record';
        $sql_hifz = "CREATE TABLE $table_hifz (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            student_id bigint(20) NOT NULL,
            para int(2) NOT NULL,
            sabaq text,
            sabaqi text,
            manzil text,
            date date NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($sql_hifz);

        // 3. Accounts Table (Bait-ul-Maal)
        $table_accounts = $wpdb->prefix . 'mms_accounts';
        $sql_accounts = "CREATE TABLE $table_accounts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            type enum('credit', 'debit') NOT NULL,
            category varchar(100) NOT NULL,
            amount decimal(15,2) NOT NULL,
            description text,
            date date NOT NULL,
            created_by bigint(20),
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($sql_accounts);

        // 4. Attendance Table
        $table_attendance = $wpdb->prefix . 'mms_attendance';
        $sql_attendance = "CREATE TABLE $table_attendance (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            user_type enum('student', 'staff') NOT NULL,
            status enum('present', 'absent', 'leave') NOT NULL,
            date date NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($sql_attendance);
    }

    private static function create_dashboard_page() {
        $page_title = 'Madrassah Dashboard';
        $page_slug = 'madrassah-app';

        $check_page = get_page_by_path($page_slug);

        if (!$check_page) {
            $page_id = wp_insert_post(array(
                'post_title'   => $page_title,
                'post_name'    => $page_slug,
                'post_content' => '[mms_main_dashboard]',
                'post_status'  => 'publish',
                'post_type'    => 'page',
            ));
        }
    }
}
