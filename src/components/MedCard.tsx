import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { SeniorColors } from '@/constants/senior-theme';
import { useTranslation } from '../constants/translations';

interface MedCardProps {
  med: any;
  info: any;
  doctorMode: boolean;
  fontOffset: number;
  onDelete: (id: string, name: string) => void;
}

export function MedCard({
  med,
  info,
  doctorMode,
  fontOffset,
  onDelete
}: MedCardProps) {
  const { t, language } = useTranslation();

  const translateMedName = (name: string) => {
    if (language === 'th') return name;
    let translated = name;
    // CPM (Yellow)
    translated = translated.replace(/ยาแก้แพ้เม็ดสีเหลือง \(ลดน้ำมูก \/ แก้แพ้คัน \/ ช่วยให้นอนหลับง่าย\)/g, 'Yellow Allergy Pill (CPM / Anti-histamine)');
    translated = translated.replace(/ยาแก้แพ้เม็ดสีเหลือง \(ลดน้ำมูก\/แก้แพ้คัน\/ช่วยให้นอนหลับง่าย\)/g, 'Yellow Allergy Pill (CPM / Anti-histamine)');
    // Cetirizine (White)
    translated = translated.replace(/ยาแก้แพ้เม็ดสีขาว \(แก้แพ้คัน \/ ลดน้ำมูก \/ ชนิดไม่ง่วงนอน\)/g, 'White Allergy Pill (Cetirizine / Non-drowsy)');
    translated = translated.replace(/ยาแก้แพ้เม็ดสีขาว \(แก้แพ้คัน\/ลดน้ำมูก\/ชนิดไม่ง่วงนอน\)/g, 'White Allergy Pill (Cetirizine / Non-drowsy)');
    // Ibuprofen
    translated = translated.replace(/ยาแก้ปวดอักเสบไอบูโพรเฟน \(แก้ปวดกล้ามเนื้อ\/กระดูกอักเสบชนิดรุนแรง\)/g, 'Ibuprofen (NSAIDs Pain Reliever)');
    translated = translated.replace(/ยาแก้ปวดอักเสบไอบูโพรเฟน/g, 'Ibuprofen');
    // Warfarin
    translated = translated.replace(/ยาต้านการแข็งตัวของเลือด \(Warfarin\)/g, 'Blood Thinner (Warfarin)');
    translated = translated.replace(/ยาต้านการแข็งตัวของเลือด \/ ยาต้านลิ่มเลือดอุดตันในเส้นเลือด/g, 'Blood Thinner (Warfarin / Aspirin)');
    translated = translated.replace(/ยาต้านการแข็งตัวของเลือด/g, 'Blood Thinner');
    // Simvastatin
    translated = translated.replace(/ยาลดไขมัน \(Simvastatin\)/g, 'Cholesterol Lowering (Simvastatin)');
    translated = translated.replace(/ยาลดไขมันในเส้นเลือด ซิมวาสแตติน/g, 'Cholesterol Lowering (Simvastatin)');
    translated = translated.replace(/ยาลดไขมันในเส้นเลือด/g, 'Cholesterol Lowering');
    // Amlodipine
    translated = translated.replace(/ยาลดความดัน \(Amlodipine\)/g, 'Hypertension Med (Amlodipine)');
    translated = translated.replace(/ยาลดความดันโลหิตสูง \(ยาความดันปกติประจำวัน\)/g, 'Hypertension Med (Amlodipine / Daily)');
    translated = translated.replace(/ยาลดความดันโลหิตสูง/g, 'Hypertension Med');
    // Lisinopril
    translated = translated.replace(/ยาลดความดัน \(Lisinopril\)/g, 'Hypertension Med (Lisinopril)');
    // Metformin
    translated = translated.replace(/ยาโรคเบาหวาน \(Metformin\)/g, 'Diabetes Med (Metformin)');
    translated = translated.replace(/ยาโรคเบาหวาน เมทฟอร์มิน \(ยาลดระดับน้ำตาลในเลือด\)/g, 'Diabetes Med (Metformin)');
    translated = translated.replace(/ยาโรคเบาหวาน/g, 'Diabetes Med');
    // Paracetamol
    translated = translated.replace(/ยาพาราเซตามอล \(แก้ปวด \/ ลดไข้\)/g, 'Paracetamol (Pain/Fever)');
    translated = translated.replace(/ยาพาราเซตามอล/g, 'Paracetamol');
    // Ponstan
    translated = translated.replace(/ยาแก้ปวดพอนสแตน \(แก้ปวดฟัน \/ ปวดประจำเดือน \/ ปวดข้อกระดูก\)/g, 'Ponstan (Mefenamic Acid / Pain Reliever)');
    translated = translated.replace(/ยาแก้ปวดพอนสแตน \(แก้ปวดฟัน\/ปวดประจำเดือน\/ปวดข้อกระดูก\)/g, 'Ponstan (Mefenamic Acid / Pain Reliever)');
    // Digoxin
    translated = translated.replace(/ยาโรคหัวใจ \(Digoxin\)/g, 'Heart Disease Med (Digoxin)');
    // Amoxicillin
    translated = translated.replace(/ยาฆ่าเชื้อแก้อักเสบ อะม็อกซีซิลลิน/g, 'Antibiotic (Amoxicillin)');
    // Roxithromycin (Strong antibiotics)
    translated = translated.replace(/ยาฆ่าเชื้อแก้อักเสบตัวแรง \(สำหรับคออักเสบ\/ทางเดินหายใจติดเชื้อ\)/g, 'Strong Antibiotic (Roxithromycin)');
    // Antacid
    translated = translated.replace(/ยาลดกรดเคลือบกระเพาะอาหาร \(ชนิดน้ำขาว\/ชนิดเม็ดเคี้ยว\)/g, 'Antacid (Liquid / Chewable)');
    // Omeprazole
    translated = translated.replace(/ยาลดกรดก่อนอาหาร โอเมพราโซล/g, 'Pre-meal Antacid (Omeprazole)');
    // Gemfibrozil
    translated = translated.replace(/ยาลดไขมันในเส้นเลือด เจมไฟโบรซิล/g, 'Cholesterol Med (Gemfibrozil)');
    return translated;
  };

  return (
    <View style={[styles.medCard, doctorMode && styles.grayMedCard]}>
      <View style={styles.medCardTop}>
        <View style={[styles.medIconWrapper, doctorMode && styles.grayIconWrapper]}>
          <Image 
            source={require('../../assets/images/icons/icon_pill.png')} 
            style={{ width: 32, height: 32, resizeMode: 'contain' }} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text selectable style={[styles.medName, { fontSize: 21 + fontOffset }, doctorMode && { color: '#000' }]}>
            {translateMedName(med.name)}
          </Text>
          {info?.formalName && (
            <Text selectable style={[styles.formalName, { fontSize: 15 + fontOffset }, doctorMode && { color: '#555' }]}>
              {language === 'th' ? info.formalName : translateMedName(info.formalName)}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.deleteBtn, doctorMode && styles.grayDeleteBtn]} 
          onPress={() => onDelete(med.id, med.name)}
        >
          <Feather name="trash-2" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Display Extra Medicine Details if Available */}
      {info ? (
        <View style={[styles.medDetails, doctorMode && { borderColor: '#000' }]}>
          {info.dosage && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="info-circle" size={16} color={doctorMode ? '#000' : '#0288D1'} />
              <Text selectable style={[styles.detailsText, { fontSize: 16 + fontOffset }, doctorMode && { color: '#000' }]}>
                {language === 'th' ? 'ขนาด/ลักษณะ: ' : 'Dosage/Appearance: '}
                {language === 'th' ? info.dosage : info.dosage} {info.shape ? `| ${info.shape}` : ''}
              </Text>
            </View>
          )}
          {info.notes && (
            <View style={[styles.notesBox, doctorMode && styles.grayNotesBox]}>
              <View style={styles.detailRow}>
                <FontAwesome5 name="stethoscope" size={16} color={doctorMode ? '#000' : '#2E7D32'} />
                <Text selectable style={[styles.notesText, { fontSize: 16 + fontOffset }, doctorMode && { color: '#000' }]}>
                  {language === 'th' ? 'คำสั่งแพทย์: ' : 'Physician Notes: '}
                  {language === 'th' ? info.notes : info.notes}
                </Text>
              </View>
            </View>
          )}
          {info.storageTh && (
            <View style={[styles.storageBox, doctorMode && styles.grayStorageBox]}>
              <View style={styles.detailRow}>
                <FontAwesome5 name="box" size={16} color={doctorMode ? '#000' : '#F57F17'} />
                <Text selectable style={[styles.storageText, { fontSize: 15 + fontOffset }, doctorMode && { color: '#000' }]}>
                  {language === 'th' ? 'วิธีเก็บรักษา: ' : 'Storage: '}
                  {language === 'th' ? info.storageTh : info.storageTh}
                </Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.medDetails, doctorMode && { borderColor: '#000' }]}>
          <View style={styles.detailRow}>
            <Feather name="info" size={16} color={doctorMode ? '#000' : '#757575'} />
            <Text selectable style={[styles.detailsText, { fontSize: 16 + fontOffset }, doctorMode && { color: '#000' }]}>
              {t('noCabinetMedInstructions')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  medCard: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 8px 22px rgba(31, 122, 92, 0.10)',
  },
  grayMedCard: {
    backgroundColor: '#FFF',
    borderColor: '#000',
  },
  medCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medIconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: SeniorColors.primarySoft,
    borderWidth: 1.5,
    borderColor: SeniorColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grayIconWrapper: {
    backgroundColor: '#ECEFF1',
    borderColor: '#000',
  },
  medName: {
    fontWeight: '900',
    color: SeniorColors.text,
    lineHeight: 30,
  },
  formalName: {
    color: SeniorColors.textSecondary,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 22,
  },
  deleteBtn: {
    backgroundColor: SeniorColors.danger,
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grayDeleteBtn: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  medDetails: {
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: SeniorColors.border,
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsText: {
    fontWeight: '700',
    color: SeniorColors.text,
    flex: 1,
    lineHeight: 25,
  },
  notesBox: {
    backgroundColor: SeniorColors.successSoft,
    borderLeftWidth: 5,
    borderLeftColor: SeniorColors.success,
    padding: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  grayNotesBox: {
    backgroundColor: '#ECEFF1',
    borderLeftColor: '#000',
    borderColor: '#000',
    borderWidth: 1,
  },
  notesText: {
    fontWeight: '800',
    color: SeniorColors.success,
    flex: 1,
    lineHeight: 24,
  },
  storageBox: {
    backgroundColor: SeniorColors.warningSoft,
    borderLeftWidth: 5,
    borderLeftColor: SeniorColors.warning,
    padding: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  grayStorageBox: {
    backgroundColor: '#ECEFF1',
    borderLeftColor: '#000',
    borderColor: '#000',
    borderWidth: 1,
  },
  storageText: {
    fontWeight: '700',
    color: SeniorColors.warning,
    flex: 1,
    lineHeight: 23,
  },
});

export const MedicationCard = MedCard;
