; =========================================================================
; MADRASAH ABDUL REHMAN BIN AUF GHAFOORIA - SETUP SCRIPT WITH ACTIVATION
; جامعہ / مدرسہ عبد الرحمن ؓ بن عوف غفوریہ - خانیوال
; مکمل انسٹالیشن اسکرپٹ مع ہارڈویئر ایکٹیویشن اور جامعہ لوگو آئیکن
; =========================================================================

#define MyAppName "مدرسہ عبد الرحمن بن عوف غفوریہ"
#define MyAppUrduName "مدرسہ عبد الرحمن بن عوف غفوریہ"
#define MyAppVersion "3.6"
#define MyAppPublisher "مدرسہ عبد الرحمن بن عوف غفوریہ - خانیوال"
#define MyAppExeName "مدرسہ عبد الرحمن بن عوف.exe"

[Setup]
; بنیادی ایپلیکیشن معلومات
AppId={{E8A1D3C5-7B9F-4A2D-8C6E-1F3B5A7D9E0C}
AppName={#MyAppUrduName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppUrduName} - Setup {#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\MadrassahAbdulRehmanBinAuf
DefaultGroupName={#MyAppUrduName}
DisableProgramGroupPage=yes

; آؤٹ پٹ فولڈر اور انسٹالر فائل کا نام
OutputDir=..\installer_output
OutputBaseFilename=Setup_Madrassah_Abdul_Rehman_Bin_Auf
Compression=lzma2/ultra64
SolidCompression=yes

; جامعہ کا لوگو بطور آئیکن
WizardStyle=modern
WizardResizable=no
PrivilegesRequired=lowest
SetupIconFile=app_logo.ico
UninstallDisplayIcon={app}\assets\app_logo.ico

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "ڈیسک ٹاپ پر جامعہ کے آئیکن والا شارٹ کٹ بنائیں (Create Desktop Icon)"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; تمام ویب فائلیں اور لاؤنچر بغیر کسی تبدیلی کے انسٹال کریں (انسٹالر اور عارضی فائلوں کو چھوڑ کر)
Source: "..\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.iss,*.bak*,*.backup*,installer,installer_output,scratch,.git*,.gemini"

; لوگو فائل تاکہ انسٹالر کی سکرین پر جامعہ کا لوگو دکھایا جا سکے
Source: "logo.png"; Flags: dontcopy

[Icons]
Name: "{group}\{#MyAppUrduName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\assets\app_logo.ico"
Name: "{group}\ویب براؤزر ورژن"; Filename: "{app}\index.html"; IconFilename: "{app}\assets\app_logo.ico"
Name: "{autodesktop}\{#MyAppUrduName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\assets\app_logo.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "سافٹ ویئر ابھی چلائیں (Launch Application)"; Flags: nowait postinstall skipifsilent

; =========================================================================
; [Code] - PASCAL SCRIPT FOR HARDWARE ACTIVATION & AUTHENTIC JAMIA UI
; =========================================================================
[Code]

type
  TGdiplusStartupInput = record
    Version: Cardinal;
    DebugEventCallback: LongWord;
    SuppressBackgroundThread: Boolean;
    SuppressExternalCodecs: Boolean;
  end;

function GdiplusStartup(var Token: LongWord; const Input: TGdiplusStartupInput; Output: LongWord): Integer;
  external 'GdiplusStartup@gdiplus.dll stdcall';
function GdiplusShutdown(Token: LongWord): Integer;
  external 'GdiplusShutdown@gdiplus.dll stdcall';
function GdipCreateFromHDC(hDC: LongWord; var Graphics: LongWord): Integer;
  external 'GdipCreateFromHDC@gdiplus.dll stdcall';
function GdipDeleteGraphics(Graphics: LongWord): Integer;
  external 'GdipDeleteGraphics@gdiplus.dll stdcall';
function GdipLoadImageFromFile(FileName: WideString; var Image: LongWord): Integer;
  external 'GdipLoadImageFromFile@gdiplus.dll stdcall';
function GdipDisposeImage(Image: LongWord): Integer;
  external 'GdipDisposeImage@gdiplus.dll stdcall';
function GdipDrawImageRectI(Graphics, Image: LongWord; X, Y, Width, Height: Integer): Integer;
  external 'GdipDrawImageRectI@gdiplus.dll stdcall';

const
  ACTIVATION_SALT = 'MADRASAH_PRO_SECRET_KEY_2026';
  ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  ADMIN_WHATSAPP = '923027440199';

var
  ActivationPage: TWizardPage;
  HwidEdit: TEdit;
  KeyEdit: TEdit;
  HwidValue: String;
  CopyPanel: TPanel;
  CopyLabel: TLabel;
  WhatsAppPanel: TPanel;
  WhatsAppLabel: TLabel;
  NextPanel: TPanel;
  NextLabel: TLabel;
  GdiToken: LongWord;
  GdiLogoImage: LongWord;
  LogoPaintBox: TPaintBox;

// 1. ہارڈویئر آئی ڈی اور کی سے غیر ضروری نشانات ہٹانا
function CleanString(S: String): String;
var
  i: Integer;
  c: Char;
  Res: String;
begin
  Res := '';
  for i := 1 to Length(S) do
  begin
    c := S[i];
    if (c >= 'a') and (c <= 'z') then
      c := Chr(Ord(c) - 32);
    if ((c >= 'A') and (c <= 'Z')) or ((c >= '0') and (c <= '9')) then
      Res := Res + c;
  end;
  Result := Res;
end;

// 2. ونڈوز سے منفرد مشین گائیڈ (MachineGuid) حاصل کر کے Hardware ID بنانا
function GetMachineHardwareID(): String;
var
  Guid: String;
  CleanGuid: String;
  CompName: String;
begin
  Guid := '';

  if IsWin64 then
    RegQueryStringValue(HKLM64, 'SOFTWARE\Microsoft\Cryptography', 'MachineGuid', Guid);

  if Guid = '' then
    RegQueryStringValue(HKLM, 'SOFTWARE\Microsoft\Cryptography', 'MachineGuid', Guid);

  if Guid = '' then
  begin
    CompName := GetEnv('COMPUTERNAME');
    if CompName = '' then CompName := 'MADRASAH_SYSTEM';
    Guid := CompName + '-8F4D-9A2E-7C1B';
  end;

  CleanGuid := CleanString(Guid);

  while Length(CleanGuid) < 16 do
    CleanGuid := CleanGuid + '9B7E3A';

  Result := 'MAB-' + Copy(CleanGuid, 1, 4) + '-' + Copy(CleanGuid, 5, 4) + '-' + Copy(CleanGuid, 9, 4);
end;

// 3. ایکٹیویشن کی کیلکولیٹ کرنے کا ریاضیاتی الگورتھم
function CalculateKey(RawHwid: String): String;
var
  Hwid: String;
  b, i, k: Integer;
  SumVal: LongInt;
  HwidChar, SaltChar: LongInt;
  SaltIndex: Integer;
  BlockStr: String;
  ResultKey: String;
  Idx: Integer;
begin
  Hwid := CleanString(RawHwid);
  if Hwid = '' then
  begin
    Result := '';
    Exit;
  end;

  ResultKey := 'AK';
  for b := 1 to 4 do
  begin
    SumVal := b * 7919;
    for i := 1 to Length(Hwid) do
    begin
      HwidChar := Ord(Hwid[i]);
      SaltIndex := ((i - 1 + b * 5) mod Length(ACTIVATION_SALT)) + 1;
      SaltChar := Ord(ACTIVATION_SALT[SaltIndex]);
      SumVal := (SumVal * 33 + HwidChar * 17 + SaltChar * 13) mod 1048573;
    end;

    BlockStr := '';
    for k := 1 to 4 do
    begin
      Idx := (SumVal mod 32) + 1;
      BlockStr := BlockStr + ALPHABET[Idx];
      SumVal := SumVal div 32;
    end;

    ResultKey := ResultKey + '-' + BlockStr;
  end;

  Result := ResultKey;
end;

// 4. کی درستگی کی تصدیق
function ValidateActivationKey(RawEnteredKey, RawHwid: String): Boolean;
var
  CleanEntered, CleanExpected: String;
  ExpectedKey: String;
begin
  CleanEntered := CleanString(RawEnteredKey);
  ExpectedKey := CalculateKey(RawHwid);
  CleanExpected := CleanString(ExpectedKey);

  if (CleanEntered = CleanExpected) or 
     (CleanEntered = Copy(CleanExpected, 3, Length(CleanExpected) - 2)) then
    Result := True
  else
    Result := False;
end;

// کاپی کوڈ بٹن کلک
procedure CopyHwidClick(Sender: TObject);
var
  ResultCode: Integer;
begin
  HwidEdit.SelectAll;
  Exec('cmd.exe', '/c <nul set /p="' + HwidValue + '" | clip', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  MsgBox('ہارڈویئر آئی ڈی کامیابی سے کاپی ہو گئی ہے!' #13#10#13#10 + 
         HwidValue + #13#10#13#10 + 
         'یہ کوڈ ایڈمن کو واٹس ایپ (0302-7440199) پر بھیج کر ایکٹیویشن کی حاصل فرمائیں۔', mbInformation, MB_OK);
end;

// واٹس ایپ رابطہ بٹن کلک
procedure WhatsAppClick(Sender: TObject);
var
  Url: String;
  Msg: String;
  ResultCode: Integer;
begin
  Msg := 'السلام علیکم! مدرسہ عبد الرحمن بن عوف غفوریہ سافٹ ویئر کی ایکٹیویشن مطلوب ہے۔ ہارڈویئر آئی ڈی: ' + HwidValue;
  Url := 'https://wa.me/' + ADMIN_WHATSAPP + '?text=' + Msg;
  ShellExec('open', Url, '', '', SW_SHOWNORMAL, ewNoWait, ResultCode);
end;

// کسٹم آگے بڑھیں بٹن کلک
procedure CustomNextClick(Sender: TObject);
begin
  WizardForm.NextButton.OnClick(WizardForm.NextButton);
end;

// لوگو پینٹ ایونٹ
procedure LogoPaintBoxPaint(Sender: TObject);
var
  Graphics: LongWord;
begin
  if (GdiLogoImage <> 0) then
  begin
    if GdipCreateFromHDC(LogoPaintBox.Canvas.Handle, Graphics) = 0 then
    begin
      GdipDrawImageRectI(Graphics, GdiLogoImage, 0, 0, LogoPaintBox.Width, LogoPaintBox.Height);
      GdipDeleteGraphics(Graphics);
    end;
  end;
end;

// 5. ونڈوز وزرڈ انیشیلائزیشن
procedure InitializeWizard();
var
  TitleLabel: TLabel;
  SubTitleLabel: TLabel;
  DescLabel: TLabel;
  HwidLabel: TLabel;
  KeyLabel: TLabel;
  StoredKey: String;
  GdiInput: TGdiplusStartupInput;
  LogoPath: String;
  PW: Integer;
begin
  HwidValue := GetMachineHardwareID();

  WizardForm.ClientWidth := ScaleX(640);
  WizardForm.ClientHeight := ScaleY(460);
  WizardForm.Caption := 'مدرسہ عبد الرحمن ؓ بن عوف غفوریہ - انسٹالیشن سیٹ اپ';

  WizardForm.NextButton.Caption := '< آگے بڑھیں';
  WizardForm.CancelButton.Caption := 'منسوخ';
  WizardForm.BackButton.Visible := False;

  ActivationPage := CreateCustomPage(wpWelcome, '', '');

  WizardForm.MainPanel.Visible := False;
  WizardForm.InnerNotebook.Top := ScaleY(10);
  WizardForm.InnerNotebook.Left := ScaleX(15);
  WizardForm.InnerNotebook.Width := WizardForm.ClientWidth - ScaleX(30);
  WizardForm.InnerNotebook.Height := WizardForm.ClientHeight - ScaleY(65);

  PW := ActivationPage.SurfaceWidth;
  if PW <= 0 then PW := WizardForm.InnerNotebook.Width;

  // لوگو لوڈ کرنا (GDI+)
  try
    ExtractTemporaryFile('logo.png');
    LogoPath := ExpandConstant('{tmp}\logo.png');
    if FileExists(LogoPath) then
    begin
      GdiInput.Version := 1;
      GdiplusStartup(GdiToken, GdiInput, 0);
      GdipLoadImageFromFile(LogoPath, GdiLogoImage);
    end;
  except
  end;

  // 1. لوگو پینٹ باکس (دائیں طرف)
  LogoPaintBox := TPaintBox.Create(WizardForm);
  LogoPaintBox.Parent := ActivationPage.Surface;
  LogoPaintBox.Left := PW - ScaleX(110);
  LogoPaintBox.Top := ScaleY(10);
  LogoPaintBox.Width := ScaleX(95);
  LogoPaintBox.Height := ScaleY(95);
  LogoPaintBox.OnPaint := @LogoPaintBoxPaint;

  // 2. ہیڈر عنوان
  TitleLabel := TLabel.Create(WizardForm);
  TitleLabel.Parent := ActivationPage.Surface;
  TitleLabel.Left := ScaleX(10);
  TitleLabel.Top := ScaleY(10);
  TitleLabel.Width := PW - ScaleX(130);
  TitleLabel.Height := ScaleY(30);
  TitleLabel.AutoSize := False;
  TitleLabel.Font.Name := 'Segoe UI';
  TitleLabel.Font.Size := 13;
  TitleLabel.Font.Style := [fsBold];
  TitleLabel.Font.Color := $00465F06; // #065f46 Deep Emerald
  TitleLabel.Caption := 'مدرسہ عبد الرحمن ؓ بن عوف غفوریہ — ایکٹیویشن سسٹم';

  // ذیلی عنوان
  SubTitleLabel := TLabel.Create(WizardForm);
  SubTitleLabel.Parent := ActivationPage.Surface;
  SubTitleLabel.Left := ScaleX(10);
  SubTitleLabel.Top := ScaleY(44);
  SubTitleLabel.Width := PW - ScaleX(130);
  SubTitleLabel.Height := ScaleY(22);
  SubTitleLabel.AutoSize := False;
  SubTitleLabel.Font.Name := 'Segoe UI';
  SubTitleLabel.Font.Size := 9;
  SubTitleLabel.Font.Color := $0064748B;
  SubTitleLabel.Caption := 'ہارڈویئر لاکڈ لائسنس سسٹم (Hardware Locked Protection)';

  // وضاحتی پیراگراف
  DescLabel := TLabel.Create(WizardForm);
  DescLabel.Parent := ActivationPage.Surface;
  DescLabel.Left := ScaleX(10);
  DescLabel.Top := ScaleY(70);
  DescLabel.Width := PW - ScaleX(130);
  DescLabel.Height := ScaleY(45);
  DescLabel.AutoSize := False;
  DescLabel.WordWrap := True;
  DescLabel.Font.Name := 'Segoe UI';
  DescLabel.Font.Size := 9;
  DescLabel.Font.Color := $00334155;
  DescLabel.Caption := 'یہ سافٹ ویئر اس مخصوص کمپیوٹر پر چلنے کے لیے رجسٹرڈ ہونا لازمی ہے۔ براہِ کرم درج ذیل ہارڈویئر آئی ڈی ایڈمن (0302-7440199) کو فراہم کر کے ایکٹیویشن کی حاصل کریں۔';

  // 3. ہارڈویئر آئی ڈی سیکشن
  HwidLabel := TLabel.Create(WizardForm);
  HwidLabel.Parent := ActivationPage.Surface;
  HwidLabel.Left := ScaleX(10);
  HwidLabel.Top := ScaleY(130);
  HwidLabel.Width := PW - ScaleX(20);
  HwidLabel.Height := ScaleY(20);
  HwidLabel.AutoSize := False;
  HwidLabel.Font.Name := 'Segoe UI';
  HwidLabel.Font.Size := 10;
  HwidLabel.Font.Style := [fsBold];
  HwidLabel.Font.Color := $001E293B;
  HwidLabel.Caption := 'کمپیوٹر کی ہارڈویئر آئی ڈی (Hardware ID):';

  HwidEdit := TEdit.Create(WizardForm);
  HwidEdit.Parent := ActivationPage.Surface;
  HwidEdit.Left := ScaleX(10);
  HwidEdit.Top := ScaleY(154);
  HwidEdit.Width := PW - ScaleX(240);
  HwidEdit.Height := ScaleY(32);
  HwidEdit.ReadOnly := True;
  HwidEdit.Text := HwidValue;
  HwidEdit.Font.Name := 'Consolas';
  HwidEdit.Font.Size := 12;
  HwidEdit.Font.Style := [fsBold];
  HwidEdit.Color := $00F1F5F9;
  HwidEdit.Font.Color := $000F172A;

  // بٹن: کاپی کوڈ (Copy)
  CopyPanel := TPanel.Create(WizardForm);
  CopyPanel.Parent := ActivationPage.Surface;
  CopyPanel.Left := PW - ScaleX(220);
  CopyPanel.Top := ScaleY(154);
  CopyPanel.Width := ScaleX(100);
  CopyPanel.Height := ScaleY(32);
  CopyPanel.Color := $00C78402; // Blue
  CopyPanel.BevelOuter := bvNone;
  CopyPanel.Cursor := crHand;
  CopyPanel.OnClick := @CopyHwidClick;

  CopyLabel := TLabel.Create(WizardForm);
  CopyLabel.Parent := CopyPanel;
  CopyLabel.Left := 0;
  CopyLabel.Top := ScaleY(7);
  CopyLabel.Width := CopyPanel.Width;
  CopyLabel.Alignment := taCenter;
  CopyLabel.Caption := 'کاپی کوڈ (Copy)';
  CopyLabel.Font.Name := 'Segoe UI';
  CopyLabel.Font.Size := 9;
  CopyLabel.Font.Style := [fsBold];
  CopyLabel.Font.Color := clWhite;
  CopyLabel.Cursor := crHand;
  CopyLabel.OnClick := @CopyHwidClick;

  // بٹن: واٹس ایپ رابطہ
  WhatsAppPanel := TPanel.Create(WizardForm);
  WhatsAppPanel.Parent := ActivationPage.Surface;
  WhatsAppPanel.Left := PW - ScaleX(110);
  WhatsAppPanel.Top := ScaleY(154);
  WhatsAppPanel.Width := ScaleX(100);
  WhatsAppPanel.Height := ScaleY(32);
  WhatsAppPanel.Color := $0066D325; // WhatsApp Green
  WhatsAppPanel.BevelOuter := bvNone;
  WhatsAppPanel.Cursor := crHand;
  WhatsAppPanel.OnClick := @WhatsAppClick;

  WhatsAppLabel := TLabel.Create(WizardForm);
  WhatsAppLabel.Parent := WhatsAppPanel;
  WhatsAppLabel.Left := 0;
  WhatsAppLabel.Top := ScaleY(7);
  WhatsAppLabel.Width := WhatsAppPanel.Width;
  WhatsAppLabel.Alignment := taCenter;
  WhatsAppLabel.Caption := 'واٹس ایپ رابطہ';
  WhatsAppLabel.Font.Name := 'Segoe UI';
  WhatsAppLabel.Font.Size := 9;
  WhatsAppLabel.Font.Style := [fsBold];
  WhatsAppLabel.Font.Color := clWhite;
  WhatsAppLabel.Cursor := crHand;
  WhatsAppLabel.OnClick := @WhatsAppClick;

  // 4. ایکٹیویشن کی سیکشن
  KeyLabel := TLabel.Create(WizardForm);
  KeyLabel.Parent := ActivationPage.Surface;
  KeyLabel.Left := ScaleX(10);
  KeyLabel.Top := ScaleY(204);
  KeyLabel.Width := PW - ScaleX(20);
  KeyLabel.Height := ScaleY(20);
  KeyLabel.AutoSize := False;
  KeyLabel.Font.Name := 'Segoe UI';
  KeyLabel.Font.Size := 10;
  KeyLabel.Font.Style := [fsBold];
  KeyLabel.Font.Color := $001E293B;
  KeyLabel.Caption := 'ایکٹیویشن کی درج فرمائیں (Enter Activation Key):';

  KeyEdit := TEdit.Create(WizardForm);
  KeyEdit.Parent := ActivationPage.Surface;
  KeyEdit.Left := ScaleX(10);
  KeyEdit.Top := ScaleY(228);
  KeyEdit.Width := PW - ScaleX(20);
  KeyEdit.Height := ScaleY(34);
  KeyEdit.Font.Name := 'Consolas';
  KeyEdit.Font.Size := 11;
  KeyEdit.Font.Style := [fsBold];
  KeyEdit.Color := clWhite;
  KeyEdit.Font.Color := $000F172A;

  // 5. کسٹم آگے بڑھیں بٹن
  NextPanel := TPanel.Create(WizardForm);
  NextPanel.Parent := WizardForm;
  NextPanel.Left := WizardForm.NextButton.Left - ScaleX(15);
  NextPanel.Top := WizardForm.NextButton.Top - ScaleY(1);
  NextPanel.Width := WizardForm.NextButton.Width + ScaleX(20);
  NextPanel.Height := WizardForm.NextButton.Height + ScaleY(2);
  NextPanel.Color := $00465F06; // Deep Emerald Green
  NextPanel.BevelOuter := bvNone;
  NextPanel.Cursor := crHand;
  NextPanel.OnClick := @CustomNextClick;

  NextLabel := TLabel.Create(WizardForm);
  NextLabel.Parent := NextPanel;
  NextLabel.Left := 0;
  NextLabel.Top := ScaleY(6);
  NextLabel.Width := NextPanel.Width;
  NextLabel.Alignment := taCenter;
  NextLabel.Caption := '< آگے بڑھیں';
  NextLabel.Font.Name := 'Segoe UI';
  NextLabel.Font.Size := 10;
  NextLabel.Font.Style := [fsBold];
  NextLabel.Font.Color := clWhite;
  NextLabel.Cursor := crHand;
  NextLabel.OnClick := @CustomNextClick;

  // خودکار لوڈ کریں اگر پہلے سے رجسٹری میں موجود ہے
  StoredKey := '';
  RegQueryStringValue(HKCU, 'Software\MadrassahAbdulRehmanBinAuf', 'ActivationKey', StoredKey);
  if (StoredKey <> '') and ValidateActivationKey(StoredKey, HwidValue) then
  begin
    KeyEdit.Text := StoredKey;
  end;
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  if Assigned(NextPanel) then
  begin
    if CurPageID = ActivationPage.ID then
    begin
      NextPanel.Visible := True;
      WizardForm.NextButton.Visible := False;
    end
    else
    begin
      NextPanel.Visible := False;
      WizardForm.NextButton.Visible := True;
    end;
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  EnteredKey: String;
begin
  Result := True;

  if CurPageID = ActivationPage.ID then
  begin
    EnteredKey := Trim(KeyEdit.Text);

    if EnteredKey = '' then
    begin
      MsgBox('براہِ کرم آگے بڑھنے سے پہلے ایکٹیویشن کی درج فرمائیں!', mbError, MB_OK);
      Result := False;
      Exit;
    end;

    if not ValidateActivationKey(EnteredKey, HwidValue) then
    begin
      MsgBox('درج کردہ ایکٹیویشن کی درست نہیں ہے!' #13#10#13#10 +
             'یہ کی اس کمپیوٹر کے ہارڈویئر آئی ڈی کے ساتھ مطابقت نہیں رکھتی۔' #13#10 +
             'براہِ کرم ایڈمن (0302-7440199) سے درست کی حاصل کر کے درج فرمائیں۔', mbError, MB_OK);
      Result := False;
      Exit;
    end;

    // رجسٹری میں محفوظ کریں
    RegWriteStringValue(HKCU, 'Software\MadrassahAbdulRehmanBinAuf', 'ActivationKey', EnteredKey);
    RegWriteStringValue(HKCU, 'Software\MadrassahAbdulRehmanBinAuf', 'HardwareID', HwidValue);
  end;
end;

procedure DeinitializeSetup();
begin
  try
    if GdiLogoImage <> 0 then
      GdipDisposeImage(GdiLogoImage);
    if GdiToken <> 0 then
      GdiplusShutdown(GdiToken);
  except
  end;
end;
