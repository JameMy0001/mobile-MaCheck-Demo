import { useAppStore } from '../store/useAppStore';

export const translations = {
  th: {
    appName: "ตู้ยาอุ่นใจ MaCheck",
    appSubtitle: "พร้อมดูแลความปลอดภัยยา วันนี้",
    homeTitle: "หน้าแรก",
    cabinetTitle: "ตู้ยาของฉัน",
    scannerTitle: "สแกนเช็กยาตีกัน",
    caregiverTitle: "ผู้ดูแล",
    foodClashTitle: "ของแสลงคุณตา",
    callCaregiver: "โทรหาผู้ดูแล",
    voiceOpen: "เปิดเสียง",
    voiceMute: "ปิดเสียง",
    patientName: "ชื่อคนไข้",
    emergencyPhone: "เบอร์ติดต่อฉุกเฉินผู้ดูแล",
    backendServer: "เซิร์ฟเวอร์หลังบ้าน (Backend URL)",
    selectedDiseases: "โรคประจำตัวที่คุณตาเลือกไว้",
    noDiseases: "ไม่มีโรคประจำตัวที่บันทึกไว้",
    allergyHistory: "ประวัติแพ้ยาของคุณตา",
    doctorMode: "โหมดสำหรับแพทย์ (Doctor Mode)",
    doctorModeDesc: "เปิดระดับความคมชัดสูงและขาวดำพิเศษเพื่อช่วยให้แพทย์ตรวจประวัติยาได้สะดวก",
    devMode: "แผงทดสอบระบบ (Developer Mode)",
    devModeDesc: "เปิดใช้งานแผงสาธิตการแจ้งเตือน 3 ระดับบนหน้าหลักเพื่อใช้สำหรับตรวจประเมิน",
    openDoctorPortal: "เปิดแดชบอร์ดแพทย์ (Doctor Portal)",
    saveSettings: "บันทึกข้อมูลการตั้งค่า",
    fontSizeTitle: "ขนาดอักษร:",
    backToHome: "กลับหน้าหลัก",
    settingsTab: "ข้อมูลและตั้งค่า",
    registerTab: "ลงทะเบียนใหม่",
    loginTab: "เข้าสู่ระบบ",
    otherDiseases: "โรคประจำตัวอื่น ๆ (ระบุคั่นด้วยจุลภาค ,)",
    otherAllergies: "ยาอื่น ๆ ที่แพ้ (ระบุคั่นด้วยจุลภาค ,)",
    statusActive: "เปิดอยู่",
    statusInactive: "ปิดอยู่",
    enterPatientName: "ชื่อเล่นของคุณตา/คุณยาย...",
    enterCgPhone: "กรอกเบอร์โทรศัพท์ลูกหลาน...",
    enterBackendUrl: "http://localhost:5001/api",
    enterOtherDiseases: "เช่น ความดันลูกตา, ไมเกรน...",
    enterOtherAllergies: "เช่น ยาเพนิซิลลิน, ซัลฟา...",
    changeLanguage: "ภาษา / Language",
    saveSuccess: "บันทึกข้อมูลการตั้งค่าเรียบร้อยแล้วค่ะ",

    // Added translation keys
    nicknameLabel: "ชื่อเล่นของคุณตา / คุณยาย",
    phoneUsernameLabel: "เบอร์โทรศัพท์ (ใช้เป็น Username)",
    birthdatePasswordLabel: "วันเดือนปีเกิด (ใช้เป็น Password)",
    patientDiseasesLabel: "โรคประจำตัวของคุณตา / คุณยาย",
    allergiesTitleLabel: "ประวัติแพ้ยา (ถ้ามี กดเลือกยาที่แพ้ได้เลยค่ะ)",
    severeLabel: "รุนแรง",
    moderateLabel: "ปานกลาง",
    saveAndStartButton: "บันทึกและเริ่มใช้งาน",
    loginPhoneLabel: "เบอร์โทรศัพท์ (Username)",
    loginBirthdateLabel: "วันเดือนปีเกิด (Password)",
    enterLoginPhonePlaceholder: "กรอกเบอร์โทรศัพท์ที่ลงทะเบียนไว้...",
    enterLoginBirthdatePlaceholder: "กรอกวันเดือนปีเกิด (เช่น 15/08/2495)",
    loginButtonText: "เข้าสู่ระบบตู้ยา",
    quickLoginLabel: "ผู้ป่วยในเครื่องนี้ (แตะเพื่อสลับเข้าด่วน):",
    noCabinetMedInstructions: "ไม่พบข้อมูลคำแนะนำเพิ่มเติมเกี่ยวกับยานี้ในระบบเครื่องค่ะ",
  },
  en: {
    appName: "MaCheck Cabinet",
    appSubtitle: "Ready for your medication safety today",
    homeTitle: "Home",
    cabinetTitle: "My Cabinet",
    scannerTitle: "Drug Scanner",
    caregiverTitle: "Caregiver",
    foodClashTitle: "Food Clash",
    callCaregiver: "Call Caregiver",
    voiceOpen: "Voice ON",
    voiceMute: "Mute Voice",
    patientName: "Patient Name",
    emergencyPhone: "Emergency Caregiver Phone",
    backendServer: "Backend Server URL",
    selectedDiseases: "Selected Diseases",
    noDiseases: "No registered diseases",
    allergyHistory: "Drug Allergy History",
    doctorMode: "Doctor Mode",
    doctorModeDesc: "Enables high contrast grayscale layout to assist clinical inspections.",
    devMode: "Developer Mode / Test Panel",
    devModeDesc: "Enables simulated alerts panel on home screen for evaluation.",
    openDoctorPortal: "Open Doctor Portal",
    saveSettings: "Save Settings & Config",
    fontSizeTitle: "Font Size:",
    backToHome: "Back to Home",
    settingsTab: "Settings & Config",
    registerTab: "New Register",
    loginTab: "Login",
    otherDiseases: "Other Diseases (comma-separated ,)",
    otherAllergies: "Other Drug Allergies (comma-separated ,)",
    statusActive: "Active",
    statusInactive: "Inactive",
    enterPatientName: "Nickname of grandpa/grandma...",
    enterCgPhone: "Enter caregiver phone number...",
    enterBackendUrl: "http://localhost:5001/api",
    enterOtherDiseases: "e.g., Glaucoma, Migraine...",
    enterOtherAllergies: "e.g., Penicillin, Sulfa...",
    changeLanguage: "Language",
    saveSuccess: "Settings saved successfully",

    // Added translation keys
    nicknameLabel: "Elderly's Nickname",
    phoneUsernameLabel: "Phone Number (Username)",
    birthdatePasswordLabel: "Date of Birth (Password)",
    patientDiseasesLabel: "Chronic Diseases",
    allergiesTitleLabel: "Drug Allergies (Optional, tap to select)",
    severeLabel: "Severe",
    moderateLabel: "Moderate",
    saveAndStartButton: "Save & Start Using",
    loginPhoneLabel: "Phone Number (Username)",
    loginBirthdateLabel: "Date of Birth (Password)",
    enterLoginPhonePlaceholder: "Enter registered phone number...",
    enterLoginBirthdatePlaceholder: "Enter date of birth (e.g., 15/08/2495)",
    loginButtonText: "Log In to Cabinet",
    quickLoginLabel: "Patients on this device (tap to quick login):",
    noCabinetMedInstructions: "No additional instructions found in local database.",
  }
};

export type TranslationKey = keyof typeof translations['th'];
export type AppLanguage = 'th' | 'en';

const hasThaiText = (text: string) => /[ก-๙]/.test(text);

export const translateMedicationName = (text: string, language: AppLanguage) => {
  if (language === 'th' || !text) return text;
  let translated = text;

  translated = translated.replace(/ยาแก้แพ้เม็ดสีเหลือง \(ลดน้ำมูก \/ แก้แพ้คัน \/ ช่วยให้นอนหลับง่าย\)/g, 'Yellow Allergy Pill (CPM / Antihistamine)');
  translated = translated.replace(/ยาแก้แพ้เม็ดสีเหลือง \(ลดน้ำมูก\/แก้แพ้คัน\/ช่วยให้นอนหลับง่าย\)/g, 'Yellow Allergy Pill (CPM / Antihistamine)');
  translated = translated.replace(/ยาแก้แพ้เม็ดสีขาว \(แก้แพ้คัน \/ ลดน้ำมูก \/ ชนิดไม่ง่วงนอน\)/g, 'White Allergy Pill (Cetirizine / Non-drowsy)');
  translated = translated.replace(/ยาแก้แพ้เม็ดสีขาว \(แก้แพ้คัน\/ลดน้ำมูก\/ชนิดไม่ง่วงนอน\)/g, 'White Allergy Pill (Cetirizine / Non-drowsy)');
  translated = translated.replace(/ยาแก้ปวดอักเสบข้อ\/กล้ามเนื้อ/g, 'NSAID Pain Reliever');
  translated = translated.replace(/ยาแก้ปวดอักเสบไอบูโพรเฟน \(แก้ปวดกล้ามเนื้อ\/กระดูกอักเสบชนิดรุนแรง\)/g, 'Ibuprofen (NSAID Pain Reliever)');
  translated = translated.replace(/ยาแก้ปวดอักเสบไอบูโพรเฟน/g, 'Ibuprofen');
  translated = translated.replace(/ยาแก้ปวดข้อ \(Ibuprofen\)/g, 'Ibuprofen');
  translated = translated.replace(/ยาแก้ปวดข้อ \(Aspirin\)/g, 'Aspirin');
  translated = translated.replace(/ยาแอสไพริน \(Aspirin\)/g, 'Aspirin');
  translated = translated.replace(/ยาต้านการแข็งตัวของเลือด \/ ยาต้านลิ่มเลือดอุดตันในเส้นเลือด/g, 'Blood Thinner (Warfarin / Aspirin)');
  translated = translated.replace(/ยาต้านการแข็งตัวของเลือด \(Warfarin\)/g, 'Blood Thinner (Warfarin)');
  translated = translated.replace(/ยาละลายลิ่มเลือด \(Warfarin\)/g, 'Warfarin');
  translated = translated.replace(/ยาต้านการแข็งตัวของเลือด/g, 'Blood Thinner');
  translated = translated.replace(/ยาลดไขมันในเส้นเลือด ซิมวาสแตติน/g, 'Cholesterol Lowering (Simvastatin)');
  translated = translated.replace(/ยาลดไขมัน \(Simvastatin\)/g, 'Simvastatin');
  translated = translated.replace(/ยาลดไขมันในเลือด/g, 'Cholesterol Lowering');
  translated = translated.replace(/ยาลดไขมันในเส้นเลือด/g, 'Cholesterol Lowering');
  translated = translated.replace(/ยาลดความดันโลหิตสูง \(ยาความดันปกติประจำวัน\)/g, 'Hypertension Med (Daily)');
  translated = translated.replace(/ยาลดความดันโลหิตสูง/g, 'Hypertension Med');
  translated = translated.replace(/ยาลดความดัน \(Amlodipine\)/g, 'Amlodipine');
  translated = translated.replace(/ยาลดความดัน \(Lisinopril\)/g, 'Lisinopril');
  translated = translated.replace(/ยาโรคเบาหวาน เมทฟอร์มิน \(ยาลดระดับน้ำตาลในเลือด\)/g, 'Diabetes Med (Metformin)');
  translated = translated.replace(/ยาโรคเบาหวาน \(Metformin\)/g, 'Metformin');
  translated = translated.replace(/ยาควบคุมเบาหวาน\/ยาลดน้ำตาล/g, 'Diabetes Med');
  translated = translated.replace(/ยาโรคเบาหวาน/g, 'Diabetes Med');
  translated = translated.replace(/ยาพาราเซตามอล \(แก้ปวด \/ ลดไข้\)/g, 'Paracetamol (Pain/Fever)');
  translated = translated.replace(/ยาพาราเซตามอล/g, 'Paracetamol');
  translated = translated.replace(/ยาแก้ปวดพอนสแตน \(แก้ปวดฟัน \/ ปวดประจำเดือน \/ ปวดข้อกระดูก\)/g, 'Ponstan (Mefenamic Acid)');
  translated = translated.replace(/ยาแก้ปวดพอนสแตน \(แก้ปวดฟัน\/ปวดประจำเดือน\/ปวดข้อกระดูก\)/g, 'Ponstan (Mefenamic Acid)');
  translated = translated.replace(/ยาโรคหัวใจ \(Digoxin\)/g, 'Digoxin');
  translated = translated.replace(/ยาคุมชีพจร \(Digoxin\)/g, 'Digoxin');
  translated = translated.replace(/ยาฆ่าเชื้อแก้อักเสบ อะม็อกซีซิลลิน/g, 'Antibiotic (Amoxicillin)');
  translated = translated.replace(/ยาฆ่าเชื้อแก้อักเสบตัวแรง \(สำหรับคออักเสบ\/ทางเดินหายใจติดเชื้อ\)/g, 'Strong Antibiotic (Roxithromycin)');
  translated = translated.replace(/ยาลดกรดเคลือบกระเพาะอาหาร \(ชนิดน้ำขาว\/ชนิดเม็ดเคี้ยว\)/g, 'Antacid (Liquid / Chewable)');
  translated = translated.replace(/ยาลดกรดก่อนอาหาร โอเมพราโซล/g, 'Pre-meal Antacid (Omeprazole)');
  translated = translated.replace(/ยาลดไขมันในเส้นเลือด เจมไฟโบรซิล/g, 'Cholesterol Med (Gemfibrozil)');
  translated = translated.replace(/ยาแก้โรคเก๊าท์ \(ลดกรดยูริกเพื่อแก้ปวดตามข้อ\)/g, 'Gout Medication (Uric Acid Control)');
  translated = translated.replace(/ยาแก้ปวดชนิดรุนแรงพิเศษทรามาดอล \(ยาแคปซูลเขียวเหลือง\)/g, 'Tramadol (Strong Pain Reliever)');
  translated = translated.replace(/ยาแก้ปวดหัวไมเกรน คาเฟอร์กอต/g, 'Migraine Medication (Cafergot)');
  translated = translated.replace(/ยาฆ่าเชื้อรา \(ยาฆ่าเชื้อราแบบเม็ดทาน\)/g, 'Antifungal Medication');
  translated = translated.replace(/ยาขับปัสสาวะและควบคุมเกลือแร่ สไปโรโนแลคโตน/g, 'Diuretic / Electrolyte Control (Spironolactone)');
  translated = translated.replace(/ยาควบคุมอาการชัก ฟีโนบาร์บิทัล/g, 'Seizure Control Medication (Phenobarbital)');
  translated = translated.replace(/ยาฆ่าเชื้อเมโทรนิดาโซล \(แก้ท้องเสีย \/ แก้ติดเชื้อทางเดินอาหาร\)/g, 'Antibiotic (Metronidazole)');
  translated = translated.replace(/ยาควบคุมจังหวะการเต้นของหัวใจ อะมิโอดาโรน/g, 'Heart Rhythm Medication (Amiodarone)');
  translated = translated.replace(/ยาฆ่าเชื้อแก้อักเสบ ไซโปรฟลอกซาซิน \(สำหรับติดเชื้อทางเดินปัสสาวะ\)/g, 'Antibiotic (Ciprofloxacin)');
  translated = translated.replace(/ยาลดความดันโลหิตและควบคุมจังหวะชีพจร/g, 'Blood Pressure / Pulse Control Medication');
  translated = translated.replace(/ยาขับปัสสาวะแรงขับสูง ฟูโรซีไมด์ \(ยาลดอาการบวมน้ำ\)/g, 'Diuretic (Furosemide)');
  translated = translated.replace(/ยาลดความดันและลดชีพจรเต้นเร็ว โพรพราโนลอล/g, 'Blood Pressure / Pulse Control (Propranolol)');
  translated = translated.replace(/น้ำมันกัญชาทางการแพทย์/g, 'Medical Cannabis Oil');
  translated = translated.replace(/ยามอร์ฟีน \(ยาแก้ปวดชนิดรุนแรงพิเศษ\)/g, 'Morphine (Strong Pain Reliever)');
  translated = translated.replace(/ไม่พบข้อมูลยาในระบบ \(ไม่สามารถระบุการใช้งาน\)/g, 'Medication not found in system (unable to identify usage)');
  translated = translated.replace(/ไม่ระบุขนาด/g, 'unspecified dosage');

  return translated;
};

export const translateDynamicText = (text: string | undefined | null, language: AppLanguage) => {
  if (!text) return '';
  if (language === 'th' || !hasThaiText(text)) return text;

  let translated = translateMedicationName(text, language);

  const replacements: [RegExp, string][] = [
    [/เปิดเสียงนำทางแล้วจ้าคุณตา/g, 'Voice guidance is now on.'],
    [/เปิดเสียงนำทางแล้วจ้า/g, 'Voice guidance is now on.'],
    [/🚨 ถึงเวลาทานยาแล้วจ้า/g, '🚨 Time to Take Medicine'],
    [/💧 ดื่มน้ำกันหน่อยนะจ้า/g, '💧 Time to Drink Water'],
    [/💬 ข้อความจากลูกหลาน/g, '💬 Message from Caregiver'],
    [/ครบเวลา 1 ชั่วโมงแล้วค่ะคุณตา สามารถทานยาชุดที่ 2 ได้อย่างปลอดภัยแล้วค่ะ/g, 'The 1-hour wait is complete. You can safely take the second medication set.'],
    [/ครบเวลาเว้นระยะห่าง 2 ชั่วโมงแล้วค่ะคุณตา สามารถทานยาแก้ปวด (.*?) ได้อย่างปลอดภัยแล้วค่ะ/g, 'The 2-hour spacing is complete. You can safely take $1 now.'],
    [/ปรับขนาดตัวอักษรแล้วค่ะ/g, 'Font size updated.'],
    [/ปรับขนาดตัวอักษรเป็นระดับ เล็ก แล้วค่ะ/g, 'Font size changed to small.'],
    [/ปรับขนาดตัวอักษรเป็นระดับ ปกติ แล้วค่ะ/g, 'Font size changed to normal.'],
    [/ปรับขนาดตัวอักษรเป็นระดับ กลาง แล้วค่ะ/g, 'Font size changed to medium.'],
    [/ปรับขนาดตัวอักษรเป็นระดับ ใหญ่ แล้วค่ะ/g, 'Font size changed to large.'],
    [/ปรับขนาดตัวอักษรเป็นระดับ ใหญ่มาก แล้วค่ะ/g, 'Font size changed to extra large.'],
    [/เข้าสู่หน้าจอลูกหลานเพื่อติดตามอาการค่ะ/g, 'Opened caregiver tracking screen.'],
    [/เข้าสู่หน้าจอเช็กของแสลงค่ะ พิมพ์ชื่ออาหารหรือสมุนไพรเพื่อตรวจสอบได้เลยค่ะ/g, 'Opened food clash checker. Type a food or herb to check.'],
    [/เปิดกล้องแล้วค่ะ โปรดวางซองยาไว้ตรงหน้ากล้อง ถ่ายรูปเพื่อให้หลานวิเคราะห์ออฟไลน์ได้เลยนะคะ/g, 'Camera opened. Place the medicine package in frame and capture to analyze offline.'],
    [/ถ่ายภาพเสร็จแล้วค่ะ กำลังวิเคราะห์รูปภาพยาด้วยระบบเอไอออฟไลน์นะคะ/g, 'Photo captured. Analyzing the medication image offline.'],
    [/ตรวจสอบเรียบร้อยแล้วค่ะ/g, 'Check complete.'],
    [/ระบบขัดข้องไม่สามารถวิเคราะห์ได้ค่ะ/g, 'The system could not analyze right now.'],
    [/ระบบเช็กของแสลงขัดข้องชั่วคราวค่ะ/g, 'Food clash checker is temporarily unavailable.'],
    [/พร้อมสแกนยาซองต่อไปแล้วค่ะคุณตา/g, 'Ready to scan the next medication package.'],
    [/กำลังวิเคราะห์ความปลอดภัยของยา (.*?) รอสักครู่นะคะ/g, 'Analyzing medication safety for $1. Please wait.'],
    [/ข้อมูลไม่ครบ/g, 'Incomplete information'],
    [/กรุณาระบุชื่อยาที่คุณตาต้องการบันทึกก่อนนะคะ/g, 'Please enter a medication name before saving.'],
    [/ภารกิจเริ่มต้นแล้ว!/g, 'Challenge started!'],
    [/เริ่มภารกิจจำลองความปลอดภัยแล้วค่ะ คุณตาสามารถดูแถบเวลานับถอยหลังและกดบันทึกจิบน้ำสะสมได้ที่หน้าจอหลักนะคะ!/g, 'Safety challenge started. You can view the countdown and log water intake on the home screen.'],
    [/เริ่มชาเลนจ์จิบน้ำและเว้นระยะยาแก้ปวด 2 ชั่วโมงให้คุณตาแล้วค่ะ/g, 'Started the 2-hour medication spacing and water intake challenge.'],

    [/ล้างประวัติกิจกรรม/g, 'Clear Activity Logs'],
    [/คุณตา\/ลูกหลานต้องการล้างประวัติกิจกรรมทั้งหมดใช่ไหมคะ\?/g, 'Do you want to clear all activity logs?'],
    [/ล้างประวัติกิจกรรมเรียบร้อยแล้วค่ะ/g, 'Activity logs cleared.'],
    [/เบอร์โทรไม่ถูกต้อง/g, 'Invalid phone number'],
    [/กรุณากรอกเบอร์โทรคุณตา 10 หลักให้ถูกต้องค่ะ/g, 'Please enter a valid 10-digit patient phone number.'],
    [/กรุณากรอกเบอร์โทรศัพท์ของคุณตาให้ถูกต้องค่ะ/g, 'Please enter a valid patient phone number.'],
    [/กำลังเชื่อมโยงข้อมูลกับคลาวด์ของคุณตาค่ะ/g, 'Connecting to the patient cloud data.'],
    [/ไม่พบผู้ป่วย/g, 'Patient not found'],
    [/ไม่พบข้อมูลผู้ป่วยที่ใช้เบอร์โทร "(.*?)" ในฐานข้อมูลคลาวด์ค่ะ คุณตาได้เปิดเน็ตหรือลงทะเบียนหรือยังคะ\?/g, 'No patient with phone "$1" was found in cloud data. Please check registration and internet connection.'],
    [/ไม่พบข้อมูลคุณตาในระบบค่ะ/g, 'Patient data was not found in the system.'],
    [/เชื่อมต่อสำเร็จ 🟢/g, 'Connected Successfully 🟢'],
    [/เชื่อมโยงข้อมูลคลาวด์ของคุณตา "(.*?)" เรียบร้อยแล้วค่ะ ลูกหลานสามารถสอดส่องและส่งสะกิดเตือนได้เลยนะคะ/g, 'Cloud data for "$1" is connected. Caregivers can monitor and send nudges now.'],
    [/เชื่อมต่อระบบติดตามคุณตา (.*?) สำเร็จเรียบร้อยแล้วค่ะ/g, 'Connected to tracking for $1 successfully.'],
    [/การเชื่อมต่อกับระบบคลาวด์ขัดข้องค่ะ/g, 'Cloud connection failed.'],
    [/ยกเลิกการติดตามทางไกลแล้วค่ะ/g, 'Remote tracking disconnected.'],
    [/ส่งสัญญาณสะกิดสำเร็จ/g, 'Nudge sent successfully'],
    [/ส่งสัญญาณสะกิดแบบ "(.*?)" ไปที่เครื่องของคุณตาเรียบร้อยแล้วค่ะ เครื่องคุณตาจะดังเตือนทันที!/g, 'Sent "$1" nudge to the patient device. The alert will appear immediately.'],
    [/ส่งสัญญาณเตือน (.*?) เรียบร้อยแล้วค่ะ/g, 'Sent $1 alert successfully.'],
    [/ส่งล้มเหลว/g, 'Send failed'],
    [/ไม่สามารถส่งสัญญาณสะกิดได้เนื่องจากระบบคลาวด์ขัดข้องค่ะ/g, 'Could not send the nudge because the cloud service failed.'],
    [/ระบบขัดข้องไม่สามารถส่งสัญญาณได้ค่ะ/g, 'The system could not send the nudge.'],
    [/ยืนยันลบยาระยะไกล/g, 'Confirm Remote Medication Removal'],
    [/คุณต้องการลบยา "(.*?)" ออกจากตู้ยาของคุณตาจากระยะไกลใช่ไหมคะ\? \(ข้อมูลจะอัปเดตไปที่เครื่องคุณตาเมื่อคุณตาเชื่อมต่ออินเทอร์เน็ต\)/g, 'Do you want to remove "$1" from the remote cabinet? The patient device will update after it reconnects to the internet.'],
    [/ลบยา (.*?) ออกจากตู้ยาคุณตาทางไกลเรียบร้อยแล้วค่ะ/g, 'Removed $1 from the remote cabinet.'],
    [/ยาซ้ำในตู้ยาคุณตา/g, 'Duplicate Medication'],
    [/ยา "(.*?)" มีอยู่ในตู้ยาคุณตาเรียบร้อยแล้วค่ะ/g, 'Medication "$1" is already in the patient cabinet.'],
    [/เพิ่มยา (.*?) เข้าตู้ยาคุณตาทางไกลเรียบร้อยแล้วค่ะ/g, 'Added $1 to the remote cabinet.'],
    [/สะกิดกินยา/g, 'Medication Reminder'],
    [/สะกิดจิบน้ำ/g, 'Water Reminder'],
    [/ส่งข้อความเตือนใจ/g, 'Custom Message'],
    [/🔔 ถึงเวลากินยาแล้วครับคุณตา! อย่าลืมกินยาประจำตัวด้วยนะครับ ลูกหลานส่งสัญญาณสะกิดมาจ้า/g, '🔔 It is time to take your medicine. Your caregiver sent a reminder.'],
    [/💧 คุณตาครับ ดื่มน้ำสักแก้วนะครับ ร่างกายจะได้สดชื่น ลูกหลานส่งสัญญาณเตือนมาจ้า/g, '💧 Please drink a glass of water. Your caregiver sent a reminder.'],

    [/ลงทะเบียนซ้ำ/g, 'Duplicate Registration'],
    [/เบอร์โทรศัพท์นี้ลงทะเบียนในเครื่องแล้วจ้า กรุณาสลับไปแท็บเข้าสู่ระบบ/g, 'This phone number is already registered on this device. Please switch to the login tab.'],
    [/เข้าสู่ระบบไม่สำเร็จ/g, 'Login Failed'],
    [/ไม่พบข้อมูลผู้ป่วย หรือวันเกิด \(รหัสผ่าน\) ไม่ถูกต้องค่ะ/g, 'Patient not found or birthdate passcode is incorrect.'],
    [/บันทึกสำเร็จ/g, 'Success'],
    [/กรุณากรอกชื่อเล่นของคุณตาด้วยนะคะ/g, 'Please enter the patient nickname.'],
    [/กรุณากรอกชื่อเล่นด้วยนะคะ/g, 'Please enter a nickname.'],
    [/กรุณากรอกเบอร์โทรศัพท์ด้วยนะคะ/g, 'Please enter a phone number.'],
    [/กรุณากรอกวันเดือนปีเกิดเป็นรหัสผ่านด้วยนะคะ/g, 'Please enter date of birth as the passcode.'],
    [/เบอร์โทรศัพท์นี้เคยลงทะเบียนแล้วค่ะ กรุณาสลับหน้าเพื่อเข้าสู่ระบบนะคะ/g, 'This phone number is already registered. Please switch to login.'],
    [/ลงทะเบียนสำเร็จเรียบร้อยแล้วค่ะ ยินดีต้อนรับนะคะคุณตา (.*)/g, 'Registration complete. Welcome, $1.'],
    [/เกิดข้อผิดพลาดในการลงทะเบียนค่ะ/g, 'Registration failed.'],
    [/เกิดข้อผิดพลาดในการบันทึกค่ะ/g, 'Could not save settings.'],
    [/กรุณากรอกเบอร์โทรศัพท์ที่ลงทะเบียนไว้ด้วยนะคะ/g, 'Please enter the registered phone number.'],
    [/กรุณากรอกวันเกิดเป็นรหัสผ่านด้วยนะคะ/g, 'Please enter date of birth as the passcode.'],
    [/ไม่พบข้อมูลผู้ใช้ หรือวันเกิดรหัสผ่านไม่ถูกต้องค่ะ ลองตรวจสอบใหม่อีกครั้งนะคะ/g, 'User not found or birthdate passcode is incorrect. Please check again.'],
    [/ยินดีต้อนรับกลับเข้าสู่ระบบค่ะคุณตา (.*)/g, 'Welcome back, $1.'],
    [/เกิดข้อผิดพลาดในการเข้าสู่ระบบค่ะ/g, 'Login failed.'],
    [/เปิดแผงทดสอบระบบแล้วค่ะ/g, 'Developer test panel enabled.'],
    [/ปิดแผงทดสอบระบบแล้วค่ะ/g, 'Developer test panel disabled.'],
    [/เปลี่ยนภาษาเป็นภาษาไทยแล้วค่ะ/g, 'Changed language to Thai.'],

    [/ปลอดภัย ทานได้สบายใจค่ะ ไม่พบประวัติการขัดกับยาในตู้หรือโรคประจำตัวของคุณตาเกี่ยวกับ "(.*?)" ในคลังข้อมูลเครื่องค่ะ/g, 'Safe to consume. No registered risks or interactions detected for "$1" with current cabinet medications or conditions.'],
    [/ปลอดภัยค่ะคุณตา ทาน (.*?) ได้ปกติเลยนะคะ/g, '$1 is safe to consume normally.'],
    [/คำเตือน! ระบบจัดรายการนี้เป็นกลุ่มห้ามทานร่วมกัน/g, 'Warning! This item is classified as prohibited to take together.'],
    [/คำเตือน! พบข้อควรระวัง:/g, 'Warning! Precautions detected:'],
    [/เกี่ยวข้องกับโรคประจำตัวที่บันทึกไว้/g, 'Related to registered medical conditions'],
    [/เกี่ยวข้องกับยาในตู้ของคุณตา/g, 'Related to medications in cabinet'],
    [/คำแนะนำ: หยุดก่อน อย่าทดลองทานเอง และติดต่อแพทย์ เภสัชกร หรือลูกหลานเพื่อยืนยันความปลอดภัยค่ะ/g, 'Recommendation: Stop. Do not try it yourself. Contact a doctor, pharmacist, or caregiver to confirm safety.'],
    [/ระบบพบข้อมูลที่อยู่ในกลุ่มห้ามทานร่วมกัน จึงไม่แสดงรายละเอียดผลกระทบเพิ่มเติมเพื่อความปลอดภัยค่ะ/g, 'The system detected a prohibited item and hides further effect details for safety.'],
    [/ระบบพบข้อมูลที่อยู่ในกลุ่มห้ามใช้หรือห้ามทานร่วมกัน จึงไม่แสดงรายละเอียดผลกระทบเพิ่มเติมเพื่อความปลอดภัยค่ะ/g, 'The system detected a prohibited medication or drug clash and hides further effect details for safety.'],
    [/ไม่มีรายละเอียดเพิ่มเติม/g, 'No additional details available'],
    [/ปลอดภัย ทานได้ค่ะคุณตา/g, 'Safe to consume'],
    [/ของแสลงนี้อาจส่งผลไม่ดีกับผู้ที่ทาน/g, 'This food or herb may cause adverse reactions for patients who take'],
    [/แต่คุณตาไม่มีประวัติโรคหรือยาเหล่านี้ในระบบตู้ยาปัจจุบันค่ะ/g, 'but you do not have these conditions or medications in the current cabinet.'],
    [/โรคประจำตัว/g, 'Medical condition'],
    [/โรคความดันสูง/g, 'Hypertension'],
    [/โรคความดันโลหิตสูง/g, 'Hypertension'],
    [/โรคเบาหวาน/g, 'Diabetes'],
    [/โรคหัวใจ/g, 'Heart Disease'],
    [/โรคไขมันสูง/g, 'Hyperlipidemia'],
    [/ไขมันในเลือดสูง/g, 'Hyperlipidemia'],
    [/โรคไต/g, 'Kidney Disease'],
    [/โรคกระเพาะอาหาร/g, 'Stomach Disease'],
    [/โรคกระเพาะ/g, 'Stomach Disease'],
    [/โรคตับ/g, 'Liver Disease'],
    [/หรือ/g, ' or '],

    [/ตรวจพบคู่ยาที่ระบบจัดเป็นกลุ่มห้ามทานร่วมกันค่ะ/g, 'Detected a prohibited medication combination.'],
    [/ตรวจพบข้อห้ามใช้กับข้อมูลสุขภาพที่บันทึกไว้ค่ะ/g, 'Detected contraindication with saved health data.'],
    [/คำแนะนำ: ห้ามกินร่วมกันเด็ดขาด หยุดก่อน และให้แพทย์ เภสัชกร หรือลูกหลานช่วยตรวจสอบก่อนนะคะ/g, 'Recommendation: Do not take together. Stop and ask a doctor, pharmacist, or caregiver to review.'],
    [/คำแนะนำ: ห้ามรับประทานยานี้เอง หยุดก่อน และให้แพทย์ เภสัชกร หรือลูกหลานช่วยตรวจสอบก่อนนะคะ/g, 'Recommendation: Do not take this yourself. Stop and ask a doctor, pharmacist, or caregiver to review.'],
    [/ไม่พบข้อมูลซองยา!/g, 'Medication Not Found!'],
    [/ผลการวิเคราะห์: รูปภาพซองยาที่สแกนอยู่นี้ ไม่มีในฐานข้อมูลของระบบตู้นะคะ/g, 'Analysis: This scanned medication package is not in the local database.'],
    [/คำแนะนำ: กรุณาติดต่อลูกหลานหรือแพทย์ผู้รักษาเพื่อเพิ่มข้อมูลยาตัวใหม่นี้ลงตู้ยาผ่านหน้าหลักค่ะ/g, 'Recommendation: Ask a caregiver or doctor to add this medication from the home screen.'],
    [/ไม่มีในฐานข้อมูลของระบบ/g, 'Not in system database'],
    [/ยาที่สแกน:/g, 'Scanned medication:'],
    [/ยาในตู้ของคุณตา:/g, 'Cabinet medication:'],
    [/ผลการวิเคราะห์:/g, 'Analysis:'],
    [/ปลอดภัย ทานร่วมกันได้!/g, 'Safe to take together!'],
    [/ยาทั้ง 2 ชนิดนี้สามารถรับประทานร่วมกันได้อย่างปลอดภัยตามขนาดและเวลาที่แพทย์สั่งค่ะคุณตา/g, 'These two medications can be taken together safely according to the prescribed dose and schedule.'],
    [/ควรระวังและเว้นระยะห่าง!/g, 'Caution: spacing required!'],
    [/ควรระวัง! ยา 2 ชนิดนี้ควรทานห่างกันอย่างน้อย 2 ชั่วโมง และควรจิบน้ำสะอาดบ่อย ๆ ระหว่างวัน เพื่อป้องกันความดันโลหิตและถนอมการทำงานของไตค่ะ/g, 'Caution. These two medications should be spaced at least 2 hours apart. Drink clean water during the day.'],
    [/ไม่สามารถตรวจวิเคราะห์ยาได้:/g, 'Could not analyze medication:'],
  ];

  for (const [pattern, replacement] of replacements) {
    translated = translated.replace(pattern, replacement);
  }

  return translated;
};

export function useTranslation() {
  const language = useAppStore((state) => state.language);
  const t = (key: TranslationKey) => {
    return translations[language][key] || translations['th'][key] || key;
  };
  return { t, language };
}
