using System;
using System.IO;
using System.Drawing;
using System.Diagnostics;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using Microsoft.Win32;

namespace MadrassahManager
{
    static class Program
    {
        const string ACTIVATION_SALT = "MADRASAH_PRO_SECRET_KEY_2026";
        const string ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const string REG_SUBKEY = @"Software\MadrassahAbdulRehmanBinAuf";

        public static string CleanString(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            return Regex.Replace(s.ToUpper(), @"[^A-Z0-9]", "");
        }

        public static string GetHardwareID()
        {
            string guid = "";
            try
            {
                using (var hklm = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64))
                using (var key = hklm.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography"))
                {
                    if (key != null) guid = key.GetValue("MachineGuid") as string ?? "";
                }
            }
            catch { }

            if (string.IsNullOrEmpty(guid))
            {
                try
                {
                    using (var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography"))
                    {
                        if (key != null) guid = key.GetValue("MachineGuid") as string ?? "";
                    }
                }
                catch { }
            }

            if (string.IsNullOrEmpty(guid))
            {
                string comp = Environment.MachineName;
                if (string.IsNullOrEmpty(comp)) comp = "MADRASAH_PC";
                guid = comp + "-8F4D-9A2E-7C1B";
            }

            string clean = CleanString(guid);
            while (clean.Length < 16) clean += "9B7E3A";

            return "MAB-" + clean.Substring(0, 4) + "-" + clean.Substring(4, 4) + "-" + clean.Substring(8, 4);
        }

        public static string CalculateKey(string rawHwid)
        {
            string hwid = CleanString(rawHwid);
            if (string.IsNullOrEmpty(hwid)) return "";

            string[] blocks = new string[4];
            for (int b = 1; b <= 4; b++)
            {
                long sumVal = b * 7919;
                for (int i = 0; i < hwid.Length; i++)
                {
                    int hwidChar = (int)hwid[i];
                    int saltIndex = (i + b * 5) % ACTIVATION_SALT.Length;
                    int saltChar = (int)ACTIVATION_SALT[saltIndex];
                    sumVal = (sumVal * 33 + hwidChar * 17 + saltChar * 13) % 1048573;
                }

                string blockStr = "";
                for (int k = 0; k < 4; k++)
                {
                    int idx = (int)(sumVal % 32);
                    blockStr += ALPHABET[idx];
                    sumVal = sumVal / 32;
                }
                blocks[b - 1] = blockStr;
            }

            return "AK-" + string.Join("-", blocks);
        }

        public static bool ValidateKey(string enteredKey, string hwid)
        {
            if (string.IsNullOrEmpty(enteredKey) || string.IsNullOrEmpty(hwid)) return false;
            string cleanEntered = CleanString(enteredKey);
            string expected = CalculateKey(hwid);
            string cleanExpected = CleanString(expected);

            if (cleanEntered == cleanExpected) return true;
            if (cleanExpected.StartsWith("AK") && cleanEntered == cleanExpected.Substring(2)) return true;
            return false;
        }

        public static bool IsActivated(string hwid)
        {
            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey(REG_SUBKEY))
                {
                    if (key != null)
                    {
                        string storedHwid = key.GetValue("HardwareID") as string;
                        string storedKey = key.GetValue("ActivationKey") as string;
                        if (!string.IsNullOrEmpty(storedKey) && ValidateKey(storedKey, hwid))
                        {
                            return true;
                        }
                    }
                }
            }
            catch { }

            // Check license.json fallback
            try
            {
                string licFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "license.json");
                if (File.Exists(licFile))
                {
                    string json = File.ReadAllText(licFile);
                    var matchKey = Regex.Match(json, "\"activationKey\"\\s*:\\s*\"([^\"]+)\"");
                    if (matchKey.Success && ValidateKey(matchKey.Groups[1].Value, hwid))
                    {
                        return true;
                    }
                }
            }
            catch { }

            return false;
        }

        public static void SaveActivation(string hwid, string actKey)
        {
            try
            {
                using (var key = Registry.CurrentUser.CreateSubKey(REG_SUBKEY))
                {
                    if (key != null)
                    {
                        key.SetValue("HardwareID", hwid);
                        key.SetValue("ActivationKey", actKey);
                        key.SetValue("ActivatedDate", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                    }
                }
            }
            catch { }

            try
            {
                string licFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "license.json");
                string json = "{\n  \"hardwareId\": \"" + hwid + "\",\n  \"activationKey\": \"" + actKey + "\",\n  \"date\": \"" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "\"\n}";
                File.WriteAllText(licFile, json);
            }
            catch { }
        }

        public static void LaunchApp()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string htmlPath = Path.Combine(baseDir, "index.html");
            if (File.Exists(htmlPath))
            {
                Process.Start(new ProcessStartInfo(htmlPath) { UseShellExecute = true });
            }
            else
            {
                MessageBox.Show("فائل index.html نہیں ملی!", "خرابی", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string hwid = GetHardwareID();

            if (IsActivated(hwid))
            {
                LaunchApp();
                return;
            }

            // Show Activation Form
            Application.Run(new ActivationForm(hwid));
        }
    }

    public class ActivationForm : Form
    {
        private string m_hwid;
        private TextBox txtHwid;
        private TextBox txtKey;
        private Button btnCopy;
        private Button btnWhatsApp;
        private Button btnActivate;
        private Button btnCancel;
        private Label lblTitle;
        private Label lblSub;
        private Label lblDesc;
        private PictureBox picLogo;

        public ActivationForm(string hwid)
        {
            m_hwid = hwid;
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "مدرسہ عبد الرحمن ؓ بن عوف غفوریہ - سافٹ ویئر ایکٹیویشن";
            this.Width = 620;
            this.Height = 520;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = true;
            this.RightToLeft = RightToLeft.Yes;
            this.RightToLeftLayout = true;
            this.BackColor = Color.FromArgb(248, 250, 252);
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string icoPath = Path.Combine(baseDir, "app_logo.ico");
            if (!File.Exists(icoPath)) icoPath = Path.Combine(baseDir, "assets", "app_logo.ico");
            if (File.Exists(icoPath))
            {
                try { this.Icon = new Icon(icoPath); } catch { }
            }

            // Top Header Panel
            Panel topPanel = new Panel();
            topPanel.Dock = DockStyle.Top;
            topPanel.Height = 110;
            topPanel.BackColor = Color.FromArgb(6, 95, 70); // Deep Emerald
            this.Controls.Add(topPanel);

            picLogo = new PictureBox();
            picLogo.Size = new Size(80, 80);
            picLogo.Location = new Point(20, 15);
            picLogo.SizeMode = PictureBoxSizeMode.Zoom;
            picLogo.BackColor = Color.Transparent;
            string logoPath = Path.Combine(baseDir, "logo.png");
            if (!File.Exists(logoPath)) logoPath = Path.Combine(baseDir, "logo.jpg");
            if (File.Exists(logoPath))
            {
                try { picLogo.Image = Image.FromFile(logoPath); } catch { }
            }
            topPanel.Controls.Add(picLogo);

            lblTitle = new Label();
            lblTitle.Text = "مدرسہ عبد الرحمن ؓ بن عوف غفوریہ";
            lblTitle.Font = new Font("Segoe UI", 14f, FontStyle.Bold);
            lblTitle.ForeColor = Color.White;
            lblTitle.Location = new Point(115, 20);
            lblTitle.Size = new Size(470, 32);
            topPanel.Controls.Add(lblTitle);

            lblSub = new Label();
            lblSub.Text = "سافٹ ویئر لائسنس و مشین ایکٹیویشن (Hardware Security System)";
            lblSub.Font = new Font("Segoe UI", 10f, FontStyle.Regular);
            lblSub.ForeColor = Color.FromArgb(167, 243, 208);
            lblSub.Location = new Point(115, 55);
            lblSub.Size = new Size(470, 26);
            topPanel.Controls.Add(lblSub);

            // Body controls
            int curY = 125;

            lblDesc = new Label();
            lblDesc.Text = "یہ سافٹ ویئر صرف مجاز کمپیوٹر پر استعمال کے لیے مخصوص ہے۔ براہِ کرم درج ذیل ہارڈویئر کوڈ ایڈمن (0302-7440199) کو فراہم کر کے ایکٹیویشن کی حاصل فرمائیں۔";
            lblDesc.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblDesc.ForeColor = Color.FromArgb(51, 65, 85);
            lblDesc.Location = new Point(25, curY);
            lblDesc.Size = new Size(550, 40);
            this.Controls.Add(lblDesc);
            curY += 45;

            Label lblHwidTitle = new Label();
            lblHwidTitle.Text = "آپ کے کمپیوٹر کی ہارڈویئر آئی ڈی (Hardware ID):";
            lblHwidTitle.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblHwidTitle.ForeColor = Color.FromArgb(15, 23, 42);
            lblHwidTitle.Location = new Point(25, curY);
            lblHwidTitle.Size = new Size(400, 22);
            this.Controls.Add(lblHwidTitle);
            curY += 24;

            txtHwid = new TextBox();
            txtHwid.Text = m_hwid;
            txtHwid.ReadOnly = true;
            txtHwid.Font = new Font("Consolas", 12f, FontStyle.Bold);
            txtHwid.Location = new Point(25, curY);
            txtHwid.Size = new Size(340, 30);
            txtHwid.BackColor = Color.FromArgb(241, 245, 249);
            txtHwid.TextAlign = HorizontalAlignment.Center;
            this.Controls.Add(txtHwid);

            btnCopy = new Button();
            btnCopy.Text = "کاپی کوڈ (Copy)";
            btnCopy.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            btnCopy.BackColor = Color.FromArgb(2, 132, 199);
            btnCopy.ForeColor = Color.White;
            btnCopy.FlatStyle = FlatStyle.Flat;
            btnCopy.FlatAppearance.BorderSize = 0;
            btnCopy.Location = new Point(375, curY);
            btnCopy.Size = new Size(100, 30);
            btnCopy.Cursor = Cursors.Hand;
            btnCopy.Click += BtnCopy_Click;
            this.Controls.Add(btnCopy);

            btnWhatsApp = new Button();
            btnWhatsApp.Text = "واٹس ایپ";
            btnWhatsApp.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            btnWhatsApp.BackColor = Color.FromArgb(37, 211, 102);
            btnWhatsApp.ForeColor = Color.White;
            btnWhatsApp.FlatStyle = FlatStyle.Flat;
            btnWhatsApp.FlatAppearance.BorderSize = 0;
            btnWhatsApp.Location = new Point(485, curY);
            btnWhatsApp.Size = new Size(90, 30);
            btnWhatsApp.Cursor = Cursors.Hand;
            btnWhatsApp.Click += BtnWhatsApp_Click;
            this.Controls.Add(btnWhatsApp);
            curY += 45;

            Label lblKeyTitle = new Label();
            lblKeyTitle.Text = "ایکٹیویشن کی درج فرمائیں (Enter Activation Key):";
            lblKeyTitle.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblKeyTitle.ForeColor = Color.FromArgb(15, 23, 42);
            lblKeyTitle.Location = new Point(25, curY);
            lblKeyTitle.Size = new Size(400, 22);
            this.Controls.Add(lblKeyTitle);
            curY += 24;

            txtKey = new TextBox();
            txtKey.Font = new Font("Consolas", 12f, FontStyle.Bold);
            txtKey.Location = new Point(25, curY);
            txtKey.Size = new Size(550, 30);
            txtKey.BackColor = Color.White;
            txtKey.TextAlign = HorizontalAlignment.Center;
            this.Controls.Add(txtKey);
            curY += 55;

            Panel line = new Panel();
            line.BackColor = Color.FromArgb(226, 232, 240);
            line.Size = new Size(550, 1);
            line.Location = new Point(25, curY);
            this.Controls.Add(line);
            curY += 15;

            btnActivate = new Button();
            btnActivate.Text = "ایکٹیویٹ کریں و سافٹ ویئر کھولیں";
            btnActivate.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            btnActivate.BackColor = Color.FromArgb(5, 150, 105);
            btnActivate.ForeColor = Color.White;
            btnActivate.FlatStyle = FlatStyle.Flat;
            btnActivate.FlatAppearance.BorderSize = 0;
            btnActivate.Location = new Point(25, curY);
            btnActivate.Size = new Size(260, 42);
            btnActivate.Cursor = Cursors.Hand;
            btnActivate.Click += BtnActivate_Click;
            this.Controls.Add(btnActivate);

            btnCancel = new Button();
            btnCancel.Text = "منسوخ (بند کریں)";
            btnCancel.Font = new Font("Segoe UI", 10f, FontStyle.Regular);
            btnCancel.BackColor = Color.FromArgb(226, 232, 240);
            btnCancel.ForeColor = Color.FromArgb(71, 85, 105);
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Location = new Point(295, curY);
            btnCancel.Size = new Size(130, 42);
            btnCancel.Cursor = Cursors.Hand;
            btnCancel.Click += (s, e) => this.Close();
            this.Controls.Add(btnCancel);
        }

        private void BtnCopy_Click(object sender, EventArgs e)
        {
            try
            {
                Clipboard.SetText(m_hwid);
                MessageBox.Show("ہارڈویئر آئی ڈی کاپی ہو گئی ہے!\n\n" + m_hwid + "\n\nیہ کوڈ ایڈمن کو بھیج کر ایکٹیویشن کی حاصل فرمائیں۔", "کاپی ہو گیا", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("کاپی کرنے میں خرابی: " + ex.Message);
            }
        }

        private void BtnWhatsApp_Click(object sender, EventArgs e)
        {
            try
            {
                string msg = "محترم ایڈمن صاحب!\nجامعہ عبد الرحمن بن عوف سافٹ ویئر کی ایکٹیویشن درکار ہے۔\n\nمیرا ہارڈویئر آئی ڈی: " + m_hwid + "\n\nبراہِ کرم ایکٹیویشن کی عنایت فرمائیں۔ شکریہ!";
                string url = "https://wa.me/923027440199?text=" + Uri.EscapeDataString(msg);
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                MessageBox.Show("واٹس ایپ کھولنے میں خرابی: " + ex.Message);
            }
        }

        private void BtnActivate_Click(object sender, EventArgs e)
        {
            string entered = (txtKey.Text ?? "").Trim();
            if (string.IsNullOrEmpty(entered))
            {
                MessageBox.Show("براہِ کرم پہلے ایکٹیویشن کی درج فرمائیں!", "تنبیہ", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (Program.ValidateKey(entered, m_hwid))
            {
                Program.SaveActivation(m_hwid, entered);
                MessageBox.Show("ماشاءاللہ! سافٹ ویئر کامیابی سے ایکٹیویٹ ہو گیا ہے۔\nاب سافٹ ویئر اوپن ہو رہا ہے۔", "مبارک باد", MessageBoxButtons.OK, MessageBoxIcon.Information);
                this.Hide();
                Program.LaunchApp();
                this.Close();
            }
            else
            {
                MessageBox.Show("درج کردہ ایکٹیویشن کی درست نہیں ہے!\n\nیہ کی اس کمپیوٹر کے ہارڈویئر آئی ڈی سے مطابقت نہیں رکھتی۔\nبراہِ کرم درست کی درج فرمائیں۔", "غلط ایکٹیویشن کی", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
