import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { localFoodClashesDB } from '../assets/local_ai_db';
import { addActivityLog } from '../api';
import { useAppStore } from '../store/useAppStore';
import { useFontSize } from '@/hooks/use-font-size';
import { useDoctorMode } from '@/hooks/use-doctor-mode';
import { useSound } from '@/hooks/use-sound';
import { SafetyStatusCard, SeniorButton } from '@/components/senior-ui';
import { useTranslation } from '../constants/translations';
import { SafetySeverity, SeniorColors } from '@/constants/senior-theme';

export default function FoodClashScreen() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<any>(null);
  
  const profile = useAppStore((state) => state.profile);
  const cabinet = useAppStore((state) => state.cabinet);

  const { fontOffset } = useFontSize();
  const { doctorMode } = useDoctorMode();
  const { handleSpeak } = useSound();
  const { t, language } = useTranslation();

  const navigation = useNavigation();

  useEffect(() => {
    handleSpeak('เข้าสู่หน้าจอเช็กของแสลงค่ะ พิมพ์ชื่ออาหารหรือสมุนไพรเพื่อตรวจสอบได้เลยค่ะ');
  }, []);

  const getDiseaseThName = (d: string) => {
    const mapping: { [key: string]: string } = {
      hypertension: 'โรคความดันสูง',
      diabetes: 'โรคเบาหวาน',
      heart: 'โรคหัวใจ',
      lipid: 'โรคไขมันสูง',
      kidney: 'โรคไต',
      stomach: 'โรคกระเพาะ',
      liver: 'โรคตับ'
    };
    return mapping[d] || d;
  };

  const checkFood = async () => {
    const food = inputText.trim().toLowerCase();
    if (!food) return;

    try {
      // 2. โหลดโรคประจำตัว
      const diseases = profile ? profile.diseases || [] : [];

      // 3. ค้นหาในฐานข้อมูลของแสลง
      const foundFood = localFoodClashesDB.find(f => 
        f.keywords.some(k => food.includes(k.toLowerCase()) || k.toLowerCase().includes(food))
      );

      if (!foundFood) {
        const safeRes = {
          severity: 'green',
          descTh: `ปลอดภัย ทานได้สบายใจค่ะ ไม่พบประวัติการขัดกับยาในตู้หรือโรคประจำตัวของคุณตาเกี่ยวกับ "${inputText}" ในคลังข้อมูลเครื่องค่ะ`,
          speechTh: `ปลอดภัยค่ะคุณตา ทาน ${inputText} ได้ปกติเลยนะคะ`
        };
        setResult(safeRes);
        handleSpeak(safeRes.speechTh);
        await addActivityLog(`เช็กของแสลง: "${inputText}" (ปลอดภัย ทานได้)`);
        return;
      }

      // 4. เช็กว่าตีกับโรคประจำตัวไหม
      const clashDiseases = diseases.filter((d: string) => 
        foundFood.conditions?.diseases?.includes(d)
      );

      // 5. เช็กว่าตีกับยาในตู้ยาไหม
      const clashMeds = cabinet.filter((med: any) => {
        const medName = med.name.toLowerCase();
        
        const inMeds = foundFood.conditions?.meds?.some((k: string) => 
          medName.includes(k.toLowerCase()) || k.toLowerCase().includes(medName)
        );
        const inClash = foundFood.clashWith?.some((k: string) => 
          medName.includes(k.toLowerCase()) || k.toLowerCase().includes(medName)
        );
        return inMeds || inClash;
      });

      if (clashDiseases.length > 0 || clashMeds.length > 0) {
        // มีการขัดกันจริง!
        let listInfo = [];
        if (clashDiseases.length > 0) {
          listInfo.push(`เกี่ยวข้องกับโรคประจำตัวที่บันทึกไว้`);
        }
        if (clashMeds.length > 0) {
          listInfo.push(`เกี่ยวข้องกับยาในตู้ของคุณตา`);
        }

        const isRed = foundFood.severity === 'red';
        const clashDesc = isRed
          ? `คำเตือน! ระบบจัดรายการนี้เป็นกลุ่มห้ามทานร่วมกัน\n${listInfo.join('\n')}\n\nคำแนะนำ: หยุดก่อน อย่าทดลองทานเอง และติดต่อแพทย์ เภสัชกร หรือลูกหลานเพื่อยืนยันความปลอดภัยค่ะ`
          : `คำเตือน! พบข้อควรระวัง:\n${listInfo.join('\n')}\n\nคำแนะนำ: ${foundFood.descTh}`;

        const clashRes = {
          severity: foundFood.severity,
          descTh: clashDesc,
          speechTh: isRed
            ? 'รายการนี้อยู่ในกลุ่มห้ามทานร่วมกันค่ะ หยุดก่อนและให้แพทย์ เภสัชกร หรือลูกหลานช่วยตรวจสอบก่อนนะคะ'
            : foundFood.speechTh
        };
        setResult(clashRes);
        handleSpeak(clashRes.speechTh);
        await addActivityLog(`เช็กของแสลง: "${inputText}" (พบจุดขัดกันความเสี่ยงสูงระดับ: ${foundFood.severity})`);

      } else {
        // ของแสลงตัวนี้มีในฐานข้อมูล แต่คุณตาไม่มีโรคประจำตัวหรือยาที่ห้ามกินคู่กับมัน
        const detailInfo = [];
        if (foundFood.conditions?.diseases) {
          detailInfo.push(`โรคประจำตัว (${foundFood.conditions.diseases.map(d => getDiseaseThName(d)).join(', ')})`);
        }
        if (foundFood.conditions?.meds || foundFood.clashWith) {
          const list = [...(foundFood.conditions?.meds || []), ...(foundFood.clashWith || [])];
          detailInfo.push(`ยา (${list.join(', ')})`);
        }

        const safeDesc = `🟢 **ปลอดภัย ทานได้ค่ะคุณตา**\n\nของแสลงนี้อาจส่งผลไม่ดีกับผู้ที่ทาน ${detailInfo.join(' หรือ ')} แต่คุณตาไม่มีประวัติโรคหรือยาเหล่านี้ในระบบตู้ยาปัจจุบันค่ะ`;

        const safeRes = {
          severity: 'green',
          descTh: safeDesc,
          speechTh: `คุณตาทานได้ค่ะ อาหารนี้ไม่ตีกับโรคหรือยาในตู้ของคุณตานะคะ`
        };
        setResult(safeRes);
        handleSpeak(safeRes.speechTh);
        await addActivityLog(`เช็กของแสลง: "${inputText}" (ไม่มีประวัติขัดกับคุณตา - ทานได้)`);
      }

    } catch (e) {
      console.error(e);
      handleSpeak('ระบบเช็กของแสลงขัดข้องชั่วคราวค่ะ');
    }
  };

  const getFoodTone = (severity: string): {
    severity: SafetySeverity;
    title: string;
    description: string;
    action: string;
  } => {
    if (severity === 'red') {
      return {
        severity: 'red',
        title: language === 'th' ? 'ควรเลี่ยง' : 'Avoid',
        description: language === 'th' ? 'ระบบจัดรายการนี้เป็นกลุ่มห้ามทานร่วมกัน' : 'High danger interaction level.',
        action: language === 'th' ? 'หยุดก่อน อย่าทดลองทานเอง และติดต่อแพทย์ เภสัชกร หรือลูกหลานเพื่อยืนยันความปลอดภัย' : 'Do not take this together. Consult a doctor or pharmacist for safety.',
      };
    }
    if (severity === 'yellow') {
      return {
        severity: 'yellow',
        title: language === 'th' ? 'ทานอย่างระวัง' : 'Caution',
        description: language === 'th' ? 'มีข้อควรระวังบางอย่าง ควรทานน้อยและสังเกตอาการ' : 'Precautions found. Take in small amounts and monitor.',
        action: language === 'th' ? 'ทานแต่น้อย เว้นระยะจากยา และดื่มน้ำตามเหมาะสม' : 'Space from medications, consume in moderation and stay hydrated.',
      };
    }
    return {
      severity: 'green',
      title: language === 'th' ? 'ทานได้' : 'Safe',
      description: language === 'th' ? 'ไม่พบความเสี่ยงสำคัญกับข้อมูลในตู้ยาขณะนี้' : 'No registered risk detected with your current cabinet.',
      action: language === 'th' ? 'ทานได้ตามปกติ แต่ยังควรยึดคำแนะนำแพทย์เป็นหลัก' : 'Safe to consume normally. Always follow your doctor\'s advice.',
    };
  };

  const translateFoodText = (text: string) => {
    if (language === 'th') return text;
    let translated = text;
    // Replace safe messages
    translated = translated.replace(/ปลอดภัย ทานได้สบายใจค่ะ ไม่พบประวัติการขัดกับยาในตู้หรือโรคประจำตัวของคุณตาเกี่ยวกับ "(.*?)" ในคลังข้อมูลเครื่องค่ะ/g, 'Safe to consume. No registered risks or interactions detected with your current cabinet medications or diseases regarding "$1".');
    translated = translated.replace(/ปลอดภัย ทานได้ค่ะคุณตา/g, 'Safe to consume, Grandpa');
    translated = translated.replace(/ของแสลงนี้อาจส่งผลไม่ดีกับผู้ที่ทาน/g, 'This food or herb may cause adverse reactions for patients who take');
    translated = translated.replace(/แต่คุณตาไม่มีประวัติโรคหรือยาเหล่านี้ในระบบตู้ยาปัจจุบันค่ะ/g, 'but you do not have a history of these diseases or medications in your current cabinet.');
    
    // Replace warning messages
    translated = translated.replace(/คำเตือน! พบข้อควรระวัง:/g, 'Warning! Precautions detected:');
    translated = translated.replace(/เกี่ยวข้องกับโรคประจำตัวที่บันทึกไว้/g, 'Clashes with registered medical conditions');
    translated = translated.replace(/เกี่ยวข้องกับยาในตู้ของคุณตา/g, 'Clashes with medications in cabinet');
    translated = translated.replace(/คำแนะนำ:/g, 'Recommendation:');
    
    // Replace conditions translations
    translated = translated.replace(/โรคประจำตัว/g, 'Medical condition');
    translated = translated.replace(/ยา/g, 'Medication');
    translated = translated.replace(/โรคความดันสูง/g, 'Hypertension');
    translated = translated.replace(/โรคเบาหวาน/g, 'Diabetes');
    translated = translated.replace(/โรคหัวใจ/g, 'Heart Disease');
    translated = translated.replace(/โรคไขมันสูง/g, 'Hyperlipidemia');
    translated = translated.replace(/โรคไต/g, 'Kidney Disease');
    translated = translated.replace(/โรคกระเพาะ/g, 'Stomach Disease');
    translated = translated.replace(/โรคตับ/g, 'Liver Disease');
    translated = translated.replace(/หรือ/g, ' or ');

    // Specific food warnings
    translated = translated.replace(/โสมเกาหลี/g, 'Korean Ginseng');
    translated = translated.replace(/ชะเอมเทศ/g, 'Licorice');
    translated = translated.replace(/กระเทียมโทน/g, 'Garlic');
    translated = translated.replace(/น้ำเกรปฟรุต/g, 'Grapefruit juice');
    translated = translated.replace(/ผักกระเฉด/g, 'Water Mimosa');
    translated = translated.replace(/หน่อไม้ดอง/g, 'Pickled Bamboo Shoot');
    translated = translated.replace(/ของหมักดอง/g, 'Pickled/Fermented Food');
    translated = translated.replace(/ห้ามทานโสมเกาหลีร่วมกับยาเบาหวาน หรือยาความดัน เพราะจะทำให้ความดันโลหิตตกอย่างรุนแรงและเกิดภาวะน้ำตาลในเลือดต่ำขั้นวิกฤตได้ค่ะ/g, 'Strictly avoid Korean Ginseng while taking Diabetes or Hypertension medications, as it can cause a severe drop in blood pressure and critical hypoglycemia.');
    translated = translated.replace(/ห้ามทานชะเอมเทศร่วมกับยาลดความดัน เพราะชะเอมเทศจะไปล้างฤทธิ์ยาและทำให้ความดันของปลอดภัยสูงขึ้นจนอันตรายค่ะ/g, 'Strictly avoid Licorice with Hypertension medications, as Licorice neutralizes the drug efficacy and can cause dangerously high blood pressure.');
    translated = translated.replace(/หลีกเลี่ยงการทานอาหารเค็มจัดร่วมกับยาลดความดันและโรคไต เพราะเกลือจะดึงน้ำส่งผลให้หัวใจทำงานหนักและความดันโลหิตสูงขึ้นอย่างรุนแรงค่ะ/g, 'Avoid very salty foods while taking Hypertension or Kidney Disease medications, as high sodium causes severe water retention and dangerous blood pressure spikes.');
    return translated;
  };

  const cleanFoodDescription = (text?: string) => {
    if (!text) return language === 'th' ? 'ไม่มีรายละเอียดเพิ่มเติม' : 'No additional details';
    return text.replace(/[🚨🟢]/g, '').replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n').trim();
  };

  const getFoodReason = (severity: string, text?: string) => {
    if (severity === 'red') {
      return language === 'th' ? 'ระบบพบข้อมูลที่อยู่ในกลุ่มห้ามทานร่วมกัน จึงไม่แสดงรายละเอียดผลกระทบเพิ่มเติมเพื่อความปลอดภัยค่ะ' : 'High interaction detected. Details hidden for safety.';
    }
    return cleanFoodDescription(text);
  };

  return (
    <SafeAreaView style={[styles.safeArea, doctorMode && { backgroundColor: '#37474F' }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, doctorMode && { backgroundColor: '#E0E0E0' }]}>
        <View style={[styles.header, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
          <FontAwesome5 name="lemon" size={32} color="#000" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { fontSize: 26 + fontOffset }, doctorMode && { color: '#000' }]}>{t('foodClashTitle')}</Text>
            <Text style={[styles.headerSubtitle, { fontSize: 15 + fontOffset }, doctorMode && { color: '#333' }]}>
              {language === 'th' ? 'ดูว่าอาหารหรือสมุนไพรขัดกับยาในตู้ไหม' : 'Check if foods or herbs clash with your cabinet'}
            </Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { fontSize: 18 + fontOffset }, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}
            placeholder={language === 'th' ? 'พิมพ์ชื่ออาหารหรือผลไม้... (เช่น ส้มโอ, ของเค็ม)' : 'Type food name... (e.g., Grapefruit)'}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={checkFood}
          />
          <TouchableOpacity style={[styles.searchBtn, doctorMode && { backgroundColor: '#111', borderColor: '#000' }]} onPress={checkFood}>
            <Feather name="search" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {!result ? (
            <View style={styles.emptyState}>
              <Text selectable style={[styles.emptyText, { fontSize: 18 + fontOffset }, doctorMode && { color: '#000' }]}>
                {language === 'th' 
                  ? 'พิมพ์ชื่ออาหาร ผลไม้ หรือสมุนไพร\nหลานจะเช็กให้อย่างรวดเร็วออฟไลน์ว่าขัดกับยาในตู้หรือโรคประจำตัวของคุณตาไหมค่ะ!' 
                  : 'Type foods, fruits, or herbs.\nI will check if they clash with your current medications or conditions offline.'}
              </Text>

              {/* Demo help items */}
              <View style={[styles.demoBox, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FontAwesome5 name="lightbulb" size={18} color={doctorMode ? '#000' : '#FBC02D'} />
                  <Text style={[styles.demoTitle, { fontSize: 16 + fontOffset }]}>
                    {language === 'th' ? 'คำค้นหาที่พบบ่อย' : 'Common Queries'}
                  </Text>
                </View>
                {[
                  language === 'th' ? 'ส้มโอ' : 'Grapefruit',
                  language === 'th' ? 'ของเค็มจัด (มาม่า, ปลาร้า)' : 'Salty foods (Noodles, Pickled Fish)',
                  language === 'th' ? 'ของหวานจัด (ทุเรียน, น้ำผึ้ง)' : 'Sweet foods (Durian, Honey)',
                  language === 'th' ? 'ผักใบเขียว (คะน้า, บรอกโคลี)' : 'Green veg (Kale, Broccoli)',
                  language === 'th' ? 'นมสด / แคลเซียม' : 'Fresh Milk / Calcium',
                  language === 'th' ? 'ชา / กาแฟ' : 'Tea / Coffee'
                ].map((item) => (
                  <TouchableOpacity 
                    key={item} 
                    style={[styles.demoItemBtn, doctorMode && { borderColor: '#000', backgroundColor: '#ECEFF1' }]}
                    onPress={() => {
                      setInputText(item.split(' (')[0]);
                      handleSpeak(item.split(' (')[0]);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Feather name="arrow-right" size={16} color="#000" />
                      <Text style={[styles.demoItemText, { fontSize: 16 + fontOffset }]}>{item}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <SafetyStatusCard
              severity={getFoodTone(result.severity).severity}
              title={getFoodTone(result.severity).title}
              description={getFoodTone(result.severity).description}
              doctorMode={doctorMode}
              fontOffset={fontOffset}
              sections={[
                { label: language === 'th' ? 'อาหารที่เช็ก' : 'Checked Food', value: inputText || 'Selected food' },
                { label: language === 'th' ? 'เหตุผล' : 'Reason', value: translateFoodText(getFoodReason(result.severity, result.descTh)) },
                { label: language === 'th' ? 'สิ่งที่ควรทำ' : 'What you should do', value: getFoodTone(result.severity).action },
              ]}
              action={
                <SeniorButton
                  label={language === 'th' ? 'เช็กอาหารอย่างอื่นต่อ' : 'Check another food'}
                  icon={{ name: 'refresh-cw' }}
                  onPress={() => setResult(null)}
                  doctorMode={doctorMode}
                  fontOffset={fontOffset}
                  variant="secondary"
                />
              }
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SeniorColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: SeniorColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SeniorColors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderColor: SeniorColors.border,
  },
  headerIcon: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: SeniorColors.text,
  },
  headerSubtitle: {
    fontWeight: '700',
    color: SeniorColors.textSecondary,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    minHeight: 56,
    color: SeniorColors.text,
  },
  searchBtn: {
    backgroundColor: SeniorColors.primary,
    borderWidth: 0,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  emptyState: {
    padding: 20,
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 20,
    boxShadow: '0px 8px 22px rgba(31, 122, 92, 0.10)',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: SeniorColors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  demoBox: {
    borderTopWidth: 2,
    borderColor: SeniorColors.border,
    paddingTop: 16,
    gap: 8,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: SeniorColors.text,
    marginBottom: 4,
  },
  demoItemBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 12,
    backgroundColor: SeniorColors.surfaceWarm,
    minHeight: 52,
    justifyContent: 'center',
  },
  demoItemText: {
    fontSize: 16,
    fontWeight: '800',
    color: SeniorColors.text,
  },
  resultCard: {
    borderWidth: 4,
    boxShadow: '6px 6px 0px #000',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  resultHeader: {
    marginBottom: 8,
  },
  resultText: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 28,
  },
  backBtn: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
});
