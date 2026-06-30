import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { CustomAlertState } from '../hooks/use-custom-alert';

const IconGlassWater = require('../../assets/images/icons/icon_glass_water.png');
const IconSiren = require('../../assets/images/icons/icon_siren.png');

interface CustomAlertModalProps {
  visible: boolean;
  alert: CustomAlertState;
  onClose: () => void;
  doctorMode: boolean;
  fontOffset: number;
}

export function CustomAlertModal({
  visible,
  alert,
  onClose,
  doctorMode,
  fontOffset
}: CustomAlertModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.alertModalBg}>
        {alert.type === 'water' ? (
          <View style={[styles.alertCard, styles.waterAlertCard, doctorMode && styles.grayCard]}>
            <View style={styles.waterWrapper}>
              <Image source={IconGlassWater} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
            </View>
            <Text style={[styles.waterAlertTitle, { fontSize: 24 + fontOffset }]}>{alert.title}</Text>
            <Text style={[styles.waterAlertMessage, { fontSize: 16 + fontOffset }]}>{alert.message}</Text>
            <TouchableOpacity 
              style={[styles.waterOkBtn, doctorMode && { backgroundColor: '#555' }]} 
              onPress={onClose}
            >
              <Text style={[styles.waterOkBtnText, { fontSize: 16 + fontOffset }]}>ชื่นใจจ้าคุณตา 👍</Text>
            </TouchableOpacity>
          </View>
        ) : alert.type === 'confirm' ? (
          <View style={[styles.alertCard, doctorMode && styles.grayCard]}>
            <View style={[styles.alertHeaderBadge, { backgroundColor: doctorMode ? '#555' : '#FF8F00' }]}>
              <FontAwesome5 name="exclamation-circle" size={32} color="#FFF" />
            </View>
            <Text style={[styles.alertTitle, { fontSize: 22 + fontOffset }]}>{alert.title}</Text>
            <Text style={[styles.alertMessage, { fontSize: 16 + fontOffset }]}>{alert.message}</Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.btnCancel, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]} 
                onPress={onClose}
              >
                <Text style={[styles.btnCancelText, { fontSize: 16 + fontOffset }, doctorMode && { color: '#000' }]}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.btnConfirm, doctorMode && { backgroundColor: '#555', borderColor: '#000' }]} 
                onPress={() => {
                  if (alert.onConfirm) alert.onConfirm();
                  onClose();
                }}
              >
                <Text style={[styles.btnConfirmText, { fontSize: 16 + fontOffset }]}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : alert.type === 'call' ? (
          <View style={[styles.alertCard, styles.emergencyCallCard, doctorMode && styles.grayCard]}>
            <View style={styles.sirenWrapper}>
              <Image source={IconSiren} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
            </View>
            <Text style={[styles.emergencyCallTitle, { fontSize: 24 + fontOffset }]}>กำลังโทรออกฉุกเฉิน</Text>
            <View style={styles.dialNumbers}>
              <Text style={[styles.dialLabel, { fontSize: 16 + fontOffset }]}>
                เบอร์ลูกหลาน: <Text style={styles.dialValue}>{alert.phone}</Text>
              </Text>
              <Text style={[styles.dialLabel, { fontSize: 16 + fontOffset }]}>
                เบอร์สายด่วน: <Text style={styles.dialValue}>1669 (โรงพยาบาล)</Text>
              </Text>
            </View>
            <Text style={[styles.dialWarning, { fontSize: 14 + fontOffset }]}>
              หลานสาว AI ได้ส่งบันทึกกิจกรรมไปให้ลูกหลานทราบแล้วค่ะ
            </Text>
            <TouchableOpacity 
              style={[styles.hangUpBtn, doctorMode && { backgroundColor: '#555' }]} 
              onPress={onClose}
            >
              <Feather name="phone-off" size={20} color="#FFF" />
              <Text style={[styles.hangUpBtnText, { fontSize: 16 + fontOffset }]}>วางสาย / ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.alertCard, doctorMode && styles.grayCard]}>
            <View style={[
              styles.alertHeaderBadge, 
              { backgroundColor: doctorMode ? '#555' : alert.type === 'error' ? '#FF5252' : alert.type === 'warning' ? '#FFA726' : alert.type === 'success' ? '#4CAF50' : '#2196F3' }
            ]}>
              <FontAwesome5 
                name={alert.type === 'error' ? 'times-circle' : alert.type === 'warning' ? 'exclamation-triangle' : alert.type === 'success' ? 'check-circle' : 'info-circle'} 
                size={32} 
                color="#FFF" 
              />
            </View>
            <Text style={[styles.alertTitle, { fontSize: 22 + fontOffset }]}>{alert.title}</Text>
            <Text style={[styles.alertMessage, { fontSize: 16 + fontOffset }]}>{alert.message}</Text>
            <TouchableOpacity 
              style={[
                styles.alertBtn, 
                { backgroundColor: doctorMode ? '#555' : alert.type === 'error' ? '#FF5252' : alert.type === 'warning' ? '#FFA726' : alert.type === 'success' ? '#4CAF50' : '#2196F3' }
              ]} 
              onPress={onClose}
            >
              <Text style={[styles.alertBtnText, { fontSize: 16 + fontOffset }]}>ตกลง/รับทราบ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  alertModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertCard: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#000',
    padding: 24,
    alignItems: 'center',
    boxShadow: '4px 4px 0px #000',
  },
  grayCard: {
    backgroundColor: '#E0E0E0',
  },
  waterAlertCard: {
    borderColor: '#0288D1',
  },
  waterWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E1F5FE',
    borderWidth: 3,
    borderColor: '#0288D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  waterAlertTitle: {
    fontWeight: '900',
    color: '#0288D1',
    textAlign: 'center',
    marginBottom: 10,
  },
  waterAlertMessage: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
    lineHeight: 24,
  },
  waterOkBtn: {
    backgroundColor: '#0288D1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#000',
    boxShadow: '3px 3px 0px #000',
  },
  waterOkBtnText: {
    color: '#FFF',
    fontWeight: '900',
  },
  alertHeaderBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    textAlign: 'center',
    color: '#333',
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    boxShadow: '3px 3px 0px #000',
  },
  btnCancel: {
    backgroundColor: '#FFCDD2',
  },
  btnCancelText: {
    fontWeight: '900',
    color: '#B71C1C',
  },
  btnConfirm: {
    backgroundColor: '#4CAF50',
  },
  btnConfirmText: {
    fontWeight: '900',
    color: '#FFF',
  },
  emergencyCallCard: {
    borderColor: '#D32F2F',
  },
  sirenWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFEBEE',
    borderWidth: 3,
    borderColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyCallTitle: {
    fontWeight: '900',
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  dialNumbers: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  dialLabel: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dialValue: {
    fontWeight: '900',
    color: '#B71C1C',
  },
  dialWarning: {
    color: '#D32F2F',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  hangUpBtn: {
    backgroundColor: '#D32F2F',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#000',
    boxShadow: '3px 3px 0px #000',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  hangUpBtnText: {
    color: '#FFF',
    fontWeight: '900',
  },
  alertBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#000',
    boxShadow: '3px 3px 0px #000',
    width: '100%',
    alignItems: 'center',
  },
  alertBtnText: {
    color: '#FFF',
    fontWeight: '900',
  },
});
