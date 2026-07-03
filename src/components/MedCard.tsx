import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { SeniorColors } from '@/constants/senior-theme';

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
          <Text selectable style={[styles.medName, { fontSize: 21 + fontOffset }, doctorMode && { color: '#000' }]}>{med.name}</Text>
          {info?.formalName && (
            <Text selectable style={[styles.formalName, { fontSize: 15 + fontOffset }, doctorMode && { color: '#555' }]}>{info.formalName}</Text>
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
                ขนาด/ลักษณะ: {info.dosage} {info.shape ? `| ${info.shape}` : ''}
              </Text>
            </View>
          )}
          {info.notes && (
            <View style={[styles.notesBox, doctorMode && styles.grayNotesBox]}>
              <View style={styles.detailRow}>
                <FontAwesome5 name="stethoscope" size={16} color={doctorMode ? '#000' : '#2E7D32'} />
                <Text selectable style={[styles.notesText, { fontSize: 16 + fontOffset }, doctorMode && { color: '#000' }]}>คำสั่งแพทย์: {info.notes}</Text>
              </View>
            </View>
          )}
          {info.storageTh && (
            <View style={[styles.storageBox, doctorMode && styles.grayStorageBox]}>
              <View style={styles.detailRow}>
                <FontAwesome5 name="box" size={16} color={doctorMode ? '#000' : '#F57F17'} />
                <Text selectable style={[styles.storageText, { fontSize: 15 + fontOffset }, doctorMode && { color: '#000' }]}>วิธีเก็บรักษา: {info.storageTh}</Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.medDetails, doctorMode && { borderColor: '#000' }]}>
          <View style={styles.detailRow}>
            <Feather name="info" size={16} color={doctorMode ? '#000' : '#757575'} />
            <Text selectable style={[styles.detailsText, { fontSize: 16 + fontOffset }, doctorMode && { color: '#000' }]}>ไม่พบข้อมูลคำแนะนำเพิ่มเติมเกี่ยวกับยานี้ในระบบเครื่องค่ะ</Text>
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
