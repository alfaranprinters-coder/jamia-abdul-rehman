(function($) {
    'use strict';

    const MMS_App = {
        init: function() {
            this.bindEvents();
            this.loadView('dashboard');
        },

        bindEvents: function() {
            const self = this;

            // Sidebar Navigation
            $('.mms-nav-link').on('click', function(e) {
                e.preventDefault();
                const view = $(this).data('view');
                
                $('.mms-nav-link').removeClass('active');
                $(this).addClass('active');
                
                self.loadView(view);
                
                // Update Title
                $('#mms-view-title').text($(this).find('span').text());
                
                // Close sidebar on mobile
                if ($(window).width() < 992) {
                    $('#mms-sidebar').removeClass('open');
                }
            });

            // Sidebar Toggle
            $('#mms-sidebar-toggle').on('click', function() {
                $('#mms-sidebar').toggleClass('open');
            });
        },

        loadView: function(view) {
            const root = $('#mms-content-root');
            root.html('<div class="mms-loader-wrap"><div class="mms-spinner"></div></div>');

            $.ajax({
                url: mms_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'mms_load_view',
                    view: view,
                    _wpnonce: mms_ajax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        root.html(response.data);
                    } else {
                        root.html('<div class="mms-error">خطا: معلومات لوڈ نہیں ہو سکیں۔</div>');
                    }
                },
                error: function() {
                    root.html('<div class="mms-error">سرور سے رابطہ نہیں ہو سکا۔</div>');
                }
            });
        }
    };

    $(document).ready(function() {
        MMS_App.init();
    });

})(jQuery);
