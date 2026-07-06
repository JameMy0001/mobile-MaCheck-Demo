import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { CustomAlertState } from '../hooks/use-custom-alert';
import { SeniorColors } from '@/constants/senior-theme';
import { translateDynamicText, useTranslation } from '../constants/translations';

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
  const { language } = useTranslation();
  const displayTitle = translateDynamicText(alert.title, language);
  const displayMessage = translateDynamicText(alert.message, language);

  const alertTone =
    alert.type === 'error' || alert.type === 'call'
      ? SeniorColors.danger
      : alert.type === 'warning' || alert.type === 'confirm'
        ? SeniorColors.warning
        : alert.type === 'success'
          ? SeniorColors.success
          : alert.type === 'water'
            ? SeniorColors.info
            : SeniorColors.primary;

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
            <Text style={[styles.waterAlertTitle, { fontSize: 24 + fontOffset }]}>{displayTitle}</Text>
            <Text style={[styles.waterAlertMessage, { fontSize: 16 + fontOffset }]}>{displayMessage}</Text>
            <TouchableOpacity 
              style={[styles.waterOkBtn, doctorMode && { backgroundColor: '#555' }]} 
              onPress={onClose}
            >
              <Text style={[styles.waterOkBtnText, { fontSize: 16 + fontOffset }]}>
                {language === 'th' ? 'ชื่นใจจ้าคุณตา 👍' : 'Refreshing! 👍'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : alert.type === 'confirm' ? (
          <View style={[styles.alertCard, doctorMode && styles.grayCard]}>
            <View style={[styles.alertHeaderBadge, { backgroundColor: doctorMode ? '#555' : SeniorColors.warning }]}>
              <FontAwesome5 name="exclamation-circle" size={32} color="#FFF" />
            </View>
            <Text style={[styles.alertTitle, { fontSize: 22 + fontOffset }]}>{displayTitle}</Text>
            <Text style={[styles.alertMessage, { fontSize: 16 + fontOffset }]}>{displayMessage}</Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.btnCancel, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]} 
                onPress={onClose}
              >
                <Text style={[styles.btnCancelText, { fontSize: 16 + fontOffset }, doctorMode && { color: '#000' }]}>
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.btnConfirm, doctorMode && { backgroundColor: '#555', borderColor: '#000' }]} 
                onPress={() => {
                  if (alert.onConfirm) alert.onConfirm();
                  onClose();
                }}
              >
                <Text style={[styles.btnConfirmText, { fontSize: 16 + fontOffset }]}>
                  {language === 'th' ? 'ตกลง' : 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : alert.type === 'call' ? (
          <View style={[styles.alertCard, styles.emergencyCallCard, doctorMode && styles.grayCard]}>
            <View style={styles.sirenWrapper}>
              <Image source={IconSiren} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
            </View>
            <Text style={[styles.emergencyCallTitle, { fontSize: 24 + fontOffset }]}>
              {language === 'th' ? 'กำลังโทรออกฉุกเฉิน' : 'Emergency Call in Progress'}
            </Text>
            <View style={styles.dialNumbers}>
              <Text style={[styles.dialLabel, { fontSize: 16 + fontOffset }]}>
                {language === 'th' ? 'เบอร์ลูกหลาน: ' : 'Caregiver Phone: '}<Text style={styles.dialValue}>{alert.phone}</Text>
              </Text>
              <Text style={[styles.dialLabel, { fontSize: 16 + fontOffset }]}>
                {language === 'th' ? 'เบอร์สายด่วน: ' : 'Emergency Hotline: '}<Text style={styles.dialValue}>1669 {language === 'th' ? '(โรงพยาบาล)' : '(Hospital)'}</Text>
              </Text>
            </View>
            <Text style={[styles.dialWarning, { fontSize: 14 + fontOffset }]}>
              {language === 'th' ? 'หลานสาว AI ได้ส่งบันทึกกิจกรรมไปให้ลูกหลานทราบแล้วค่ะ' : 'AI Assistant has notified your caregiver of this event.'}
            </Text>
            <TouchableOpacity 
              style={[styles.hangUpBtn, doctorMode && { backgroundColor: '#555' }]} 
              onPress={onClose}
            >
              <Feather name="phone-off" size={20} color="#FFF" />
              <Text style={[styles.hangUpBtnText, { fontSize: 16 + fontOffset }]}>
                {language === 'th' ? 'วางสาย / ยกเลิก' : 'Hang Up / Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.alertCard, doctorMode && styles.grayCard]}>
            <View style={[
              styles.alertHeaderBadge, 
              { backgroundColor: doctorMode ? '#555' : alertTone }
            ]}>
              <FontAwesome5 
                name={alert.type === 'error' ? 'times-circle' : alert.type === 'warning' ? 'exclamation-triangle' : alert.type === 'success' ? 'check-circle' : 'info-circle'} 
                size={32} 
                color="#FFF" 
              />
            </View>
            <Text style={[styles.alertTitle, { fontSize: 22 + fontOffset }]}>{displayTitle}</Text>
            <Text style={[styles.alertMessage, { fontSize: 16 + fontOffset }]}>{displayMessage}</Text>
            <TouchableOpacity 
              style={[
                styles.alertBtn, 
                { backgroundColor: doctorMode ? '#555' : alertTone }
              ]} 
              onPress={onClose}
            >
              <Text style={[styles.alertBtnText, { fontSize: 16 + fontOffset }]}>
                {language === 'th' ? 'ตกลง/รับทราบ' : 'OK / Acknowledge'}
              </Text>
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
    backgroundColor: SeniorColors.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0px 10px 28px rgba(20, 50, 42, 0.18)',
  },
  grayCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000',
  },
  waterAlertCard: {
    borderColor: SeniorColors.info,
  },
  waterWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: SeniorColors.infoSoft,
    borderWidth: 1.5,
    borderColor: SeniorColors.info,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  waterAlertTitle: {
    fontWeight: '900',
    color: SeniorColors.info,
    textAlign: 'center',
    marginBottom: 10,
  },
  waterAlertMessage: {
    textAlign: 'center',
    color: SeniorColors.textSecondary,
    marginBottom: 20,
    lineHeight: 24,
  },
  waterOkBtn: {
    backgroundColor: SeniorColors.info,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 0,
    minHeight: 56,
  },
  waterOkBtnText: {
    color: '#FFF',
    fontWeight: '900',
  },
  alertHeaderBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontWeight: '900',
    color: SeniorColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    textAlign: 'center',
    color: SeniorColors.textSecondary,
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
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    alignItems: 'center',
    minHeight: 56,
  },
  btnCancel: {
    backgroundColor: SeniorColors.surfaceMuted,
  },
  btnCancelText: {
    fontWeight: '900',
    color: SeniorColors.text,
  },
  btnConfirm: {
    backgroundColor: SeniorColors.primary,
  },
  btnConfirmText: {
    fontWeight: '900',
    color: '#FFF',
  },
  emergencyCallCard: {
    borderColor: SeniorColors.danger,
  },
  sirenWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: SeniorColors.dangerSoft,
    borderWidth: 1.5,
    borderColor: SeniorColors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyCallTitle: {
    fontWeight: '900',
    color: SeniorColors.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  dialNumbers: {
    backgroundColor: SeniorColors.surfaceMuted,
    borderWidth: 1,
    borderColor: SeniorColors.border,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  dialLabel: {
    fontWeight: '600',
    color: SeniorColors.text,
    marginBottom: 8,
  },
  dialValue: {
    fontWeight: '900',
    color: SeniorColors.danger,
  },
  dialWarning: {
    color: SeniorColors.danger,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  hangUpBtn: {
    backgroundColor: SeniorColors.danger,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 0,
    minHeight: 56,
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
    borderWidth: 0,
    minHeight: 56,
    width: '100%',
    alignItems: 'center',
  },
  alertBtnText: {
    color: '#FFF',
    fontWeight: '900',
  },
});
