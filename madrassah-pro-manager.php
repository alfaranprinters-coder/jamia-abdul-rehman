<?php
/**
 * Plugin Name: Madrassah Pro Manager
 * Description: A complete Madrassah Management System for religious institutions.
 * Version: 1.0.0
 * Author: Muhammad Idrees Shaheen
 * Text Domain: madrassah-pro-manager
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Define Constants
define('MMS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MMS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MMS_VERSION', '1.0.0');

/**
 * Main Plugin Class
 */
class MadrassahProManager {

    public function __construct() {
        // Activation Hook
        register_activation_hook(__FILE__, array($this, 'activate'));
        
        // Load Dependencies
        $this->load_dependencies();
        
        // Hooks
        add_action('init', array($this, 'init_hooks'));
        add_shortcode('mms_main_dashboard', array($this, 'render_dashboard_shortcode'));
        
        // AJAX Handlers
        $this->init_ajax();
    }

    private function load_dependencies() {
        require_once MMS_PLUGIN_DIR . 'includes/class-mms-activator.php';
        require_once MMS_PLUGIN_DIR . 'includes/class-mms-dashboard.php';
        require_once MMS_PLUGIN_DIR . 'includes/class-mms-ajax.php';
    }

    public function activate() {
        MMS_Activator::activate();
    }

    public function init_hooks() {
        // Handle Standalone Frontend UI
        add_action('template_redirect', array('MMS_Dashboard', 'intercept_dashboard_page'));
        
        // Enqueue Assets
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
    }

    public function enqueue_assets() {
        if (is_page('madrassah-app') || has_shortcode(get_post()->post_content, 'mms_main_dashboard')) {
            wp_enqueue_style('mms-google-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Amiri:wght@400;700&family=Noto+Sans+Urdu:wght@400;700&display=swap');
            wp_enqueue_style('mms-fontawesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');
            wp_enqueue_style('mms-main-style', MMS_PLUGIN_URL . 'assets/css/style.css', array(), MMS_VERSION);
            
            wp_enqueue_script('jquery');
            wp_enqueue_script('mms-main-script', MMS_PLUGIN_URL . 'assets/js/app.js', array('jquery'), MMS_VERSION, true);
            
            wp_localize_script('mms-main-script', 'mms_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce'    => wp_create_nonce('mms_security_nonce')
            ));
        }
    }

    public function render_dashboard_shortcode() {
        return '<div id="mms-app-root">Loading Dashboard...</div>';
    }

    private function init_ajax() {
        $ajax_handler = new MMS_Ajax();
        $ajax_handler->init();
    }
}

// Initialize the plugin
new MadrassahProManager();
