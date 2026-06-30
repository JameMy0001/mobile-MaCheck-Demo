import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

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
          <Text style={[styles.medName, { fontSize: 20 + fontOffset }, doctorMode && { color: '#000' }]}>{med.name}</Text>
          {info?.formalName && (
            <Text style={[styles.formalName, { fontSize: 14 + fontOffset }, doctorMode && { color: '#555' }]}>{info.formalName}</Text>
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
              <Text style={[styles.detailsText, { fontSize: 16 + fontOffset }, doctorMode && { color: '#000' }]}>
                ขนาด/ลักษณะ: {info.dosage} {info.shape ? `| ${info.shape}` : ''}
              </Text>
            </View>
          )}
          {info.notes && (
            <View style={[styles.notesBox, doctorMode && styles.grayNotesBox]}>
              <View style={styles.detailRow}>
                <FontAwesome5 name="stethoscope" size={16} color={doctorMode ? '#000' : '#2E7D32'} />
                <Text style={[styles.notesText, { fontSize: 15 + fontOffset }, doctorMode && { color: '#000' }]}>คำสั่งแพทย์: {info.notes}</Text>
              </View>
            </View>
          )}
          {info.storageTh && (
            <View style={[styles.storageBox, doctorMode && styles.grayStorageBox]}>
              <View style={styles.detailRow}>
                <FontAwesome5 name="box" size={16} color={doctorMode ? '#000' : '#F57F17'} />
                <Text style={[styles.storageText, { fontSize: 14 + fontOffset }, doctorMode && { color: '#000' }]}>วิธีเก็บรักษา: {info.storageTh}</Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.medDetails, doctorMode && { borderColor: '#000' }]}>
          <View style={styles.detailRow}>
            <Feather name="info" size={16} color={doctorMode ? '#000' : '#757575'} />
            <Text style={[styles.detailsText, doctorMode && { color: '#000' }]}>ไม่พบข้อมูลคำแนะนำเพิ่มเติมเกี่ยวกับยานี้ในระบบเครื่องค่ะ</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  medCard: {
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    boxShadow: '3px 3px 0px #000',
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
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grayIconWrapper: {
    backgroundColor: '#ECEFF1',
    borderColor: '#000',
  },
  medName: {
    fontWeight: '900',
    color: '#000',
  },
  formalName: {
    color: '#E65100',
    fontWeight: '600',
    marginTop: 2,
  },
  deleteBtn: {
    backgroundColor: '#D32F2F',
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '2px 2px 0px #000',
  },
  grayDeleteBtn: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  medDetails: {
    marginTop: 12,
    borderTopWidth: 2,
    borderColor: '#000',
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsText: {
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  notesBox: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 6,
    borderLeftColor: '#2E7D32',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    marginTop: 4,
  },
  grayNotesBox: {
    backgroundColor: '#ECEFF1',
    borderLeftColor: '#000',
    borderColor: '#000',
    borderWidth: 1,
  },
  notesText: {
    fontWeight: '900',
    color: '#1B5E20',
    flex: 1,
  },
  storageBox: {
    backgroundColor: '#FFFDE7',
    borderLeftWidth: 6,
    borderLeftColor: '#F57F17',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
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
    color: '#E65100',
    flex: 1,
  },
});
