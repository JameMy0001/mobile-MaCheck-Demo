import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, FlatList, Modal, Image } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { getAllMeds, syncCabinetWithBackend, checkBackendOnline, addActivityLog } from '../api';
import { localDrugInteractions } from '../assets/local_ai_db';
import { useSound } from '@/hooks/use-sound';
import { useFontSize } from '@/hooks/use-font-size';
import { useDoctorMode } from '@/hooks/use-doctor-mode';
import { useCustomAlert } from '@/hooks/use-custom-alert';
import { useAppStore, CabinetMed } from '../store/useAppStore';
import { CustomAlertModal } from '../components/CustomAlertModal';
import { MedCard } from '../components/MedCard';
import { SeniorColors } from '@/constants/senior-theme';

export default function CabinetScreen() {
  const profile = useAppStore((state) => state.profile);
  const medicines = useAppStore((state) => state.cabinet) as CabinetMed[];
  const setCabinetStore = useAppStore((state) => state.setCabinet);
  const addLog = useAppStore((state) => state.addLog);

  const [inputText, setInputText] = useState('');
  const [dbMeds, setDbMeds] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedMedDetails, setSelectedMedDetails] = useState<any>(null);
  
  const { isSoundMuted, handleSpeak, toggleSound } = useSound();
  const { fontOffset } = useFontSize();
  const { doctorMode } = useDoctorMode();
  
  const [matrixModalVisible, setMatrixModalVisible] = useState(false);
  const { customAlert, setCustomAlert } = useCustomAlert();
  const allergies = profile?.allergies || [];

  const navigation = useNavigation();

  useEffect(() => {
    loadCabinet();
    loadDbMeds();
  }, []);

  const loadDbMeds = async () => {
    const meds = await getAllMeds();
    setDbMeds(meds);
  };

  const loadCabinet = async () => {
    try {
      if (profile && profile.phone) {
        const online = await checkBackendOnline();
        if (online) {
          const { getBackendUrl } = require('../api');
          const url = await getBackendUrl();
          const res = await fetch(`${url}/cabinet/${profile.phone}`);
          if (res.ok) {
            const remoteMeds = await res.json();
            if (remoteMeds && remoteMeds.length > 0) {
              const syncedMeds = remoteMeds.map((m: any) => ({
                id: m.id,
                name: m.name,
                medId: m.med_id || undefined
              }));
              await setCabinetStore(syncedMeds);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load cabinet', e);
    }
  };

  const saveCabinet = async (newMeds: CabinetMed[]) => {
    try {
      await setCabinetStore(newMeds);
      if (profile && profile.phone) {
        await syncCabinetWithBackend(profile.phone, newMeds);
      }
    } catch (e) {
      console.error('Failed to save cabinet', e);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }

    // แนะนำชื่อยาตามที่พิมพ์
    const filtered = dbMeds.filter(med => 
      med.keywords.some((kw: string) => kw.toLowerCase().includes(text.toLowerCase()))
    );
    setSuggestions(filtered.slice(0, 5));
  };

  const selectSuggestion = (med: any) => {
    setInputText(med.formalName || med.keywords[0].toUpperCase());
    setSuggestions([]);
    setSelectedMedDetails(med);
    handleSpeak(`เลือกยา ${med.formalName || med.keywords[0]} ค่ะ`);
  };

  const addMedicine = () => {
    const name = inputText.trim();
    if (!name) return;
    
    // Check duplicate
    if (medicines.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      setCustomAlert({
        visible: true,
        title: 'ยาซ้ำในตู้ยา',
        message: `ยา "${name}" มีอยู่ในตู้ยาเรียบร้อยแล้วค่ะคุณตา`,
        type: 'warning'
      });
      handleSpeak(`ยา ${name} มีอยู่ในตู้ยาเรียบร้อยแล้วค่ะ`);
      return;
    }

    // ตรวจสอบประวัติการแพ้ยา (Allergy Check)
    const ALLERGY_DRUG_KEYWORDS: Record<string, string[]> = {
      aspirin: ['aspirin', 'แอสไพริน'],
      ibuprofen: ['ibuprofen', 'ไอบูโพรเฟน', 'ไอบู'],
      simvastatin: ['simvastatin', 'ซิมวาสแตติน', 'ซิมวาส'],
      warfarin: ['warfarin', 'วาร์ฟาริน'],
      metformin: ['metformin', 'เมทฟอร์มิน', 'เมตฟอร์มิน'],
      amlodipine: ['amlodipine', 'แอมโลดิปีน', 'แอมโล'],
      lisinopril: ['lisinopril', 'ไลสิโนพริล'],
      digoxin: ['digoxin', 'ไดจอกซิน']
    };

    let matchedAllergy: any = null;
    const lowerName = name.toLowerCase();
    for (const allergy of allergies) {
      const keywords = ALLERGY_DRUG_KEYWORDS[allergy.medId];
      if (keywords && keywords.some(kw => lowerName.includes(kw.toLowerCase()))) {
        matchedAllergy = allergy;
        break;
      }
    }

    const proceedAdding = () => {
      // ค้นหารายละเอียดเพื่อเก็บคีย์เชื่อมโยง
      const matched = dbMeds.find(m => 
        name.toLowerCase().includes(m.keywords[0].toLowerCase()) || 
        m.keywords[0].toLowerCase().includes(name.toLowerCase())
      );

      const newMeds = [...medicines, { 
        id: Date.now().toString(), 
        name,
        medId: matched ? matched.id || matched.keywords[0] : undefined
      }];

      saveCabinet(newMeds);
      addActivityLog(`คุณตาเพิ่มยา "${name}" เข้าตู้ยา`);
      setInputText('');
      setSuggestions([]);
      setSelectedMedDetails(null);
      handleSpeak(`เพิ่ม ${name} เข้าตู้ยาเรียบร้อยค่ะ`);
    };

    if (matchedAllergy) {
      if (matchedAllergy.severity === 'severe') {
        // แพ้รุนแรง (Severe) -> บล็อก 100%
        setCustomAlert({
          visible: true,
          title: '🚨 ตรวจพบประวัติแพ้ยารุนแรง!',
          message: `คุณตามีประวัติแพ้ยา "${name}" อย่างรุนแรง (Severe) ห้ามเพิ่มและรับประทานยานี้โดยเด็ดขาดเพื่อความปลอดภัยค่ะ!`,
          type: 'error'
        });
        handleSpeak(`ห้ามรับประทานยานี้เด็ดขาดเนื่องจากตรวจพบประวัติแพ้ยารุนแรงค่ะ`);
        return;
      } else {
        // แพ้ปานกลาง (Moderate) -> เตือนให้ยืนยัน
        setCustomAlert({
          visible: true,
          title: '⚠️ แจ้งเตือนประวัติแพ้ยา',
          message: `คุณตามีประวัติแพ้ยา "${name}" ในระดับปานกลาง (Moderate) คุณตายืนยันที่จะเพิ่มยานี้ลงตู้ยาตามใบสั่งแพทย์ใช่ไหมคะ?`,
          type: 'confirm',
          onConfirm: () => {
            proceedAdding();
          }
        });
        handleSpeak(`โปรดระมัดระวังเนื่องจากเป็นยากลุ่มที่มีประวัติแพ้ปานกลางค่ะ คุณตายืนยันที่จะเพิ่มเข้าตู้ยาใช่ไหมคะ`);
        return;
      }
    }

    // กรณีไม่พบประวัติแพ้ยา
    proceedAdding();
  };

  const removeMedicine = (id: string, name: string) => {
    setCustomAlert({
      visible: true,
      title: 'ลบยาออกจากตู้ยา',
      message: `คุณตาต้องการลบยา "${name}" ออกจากตู้ยาใช่ไหมคะ?`,
      type: 'confirm',
      onConfirm: () => {
        const newMeds = medicines.filter(m => m.id !== id);
        saveCabinet(newMeds);
        addActivityLog(`คุณตาลบยา "${name}" ออกจากตู้ยา`);
        handleSpeak(`ลบ ${name} ออกจากตู้แล้วค่ะ`);
      }
    });
  };

  // ค้นหารายละเอียดของยาที่จะแสดงในตู้ยา
  const getMedInfo = (med: CabinetMed) => {
    if (!med.medId) {
      // ค้นหาเผื่อไม่มี id ตรงๆ
      return dbMeds.find(m => 
        med.name.toLowerCase().includes(m.keywords[0].toLowerCase()) ||
        m.keywords[0].toLowerCase().includes(med.name.toLowerCase())
      );
    }
    return dbMeds.find(m => m.id === med.medId || m.keywords[0] === med.medId);
  };

  const findSeverity = (med1: CabinetMed, med2: CabinetMed) => {
    if (med1.id === med2.id) return 'self';

    const info1 = getMedInfo(med1);
    const info2 = getMedInfo(med2);

    const name1 = med1.name.toLowerCase();
    const name2 = med2.name.toLowerCase();

    // 1. ค้นหาระดับความรุนแรงจากตารางคู่ยาตีกันหลัก (localDrugInteractions)
    for (const pair of localDrugInteractions) {
      const isDrug1_Matched1 = pair.drug1.some((k: string) => name1.includes(k.toLowerCase()) || k.toLowerCase().includes(name1));
      const isDrug2_Matched2 = pair.drug2.some((k: string) => name2.includes(k.toLowerCase()) || k.toLowerCase().includes(name2));

      const isDrug1_Matched2 = pair.drug1.some((k: string) => name2.includes(k.toLowerCase()) || k.toLowerCase().includes(name2));
      const isDrug2_Matched1 = pair.drug2.some((k: string) => name1.includes(k.toLowerCase()) || k.toLowerCase().includes(name1));

      if ((isDrug1_Matched1 && isDrug2_Matched2) || (isDrug1_Matched2 && isDrug2_Matched1)) {
        return pair.severity; // 'red' | 'yellow'
      }
    }

    // 2. ค้นหาระดับความรุนแรงจาก clashWith ในข้อมูลยา
    if (info1 && info1.clashWith) {
      const isClash = info1.clashWith.some((kw: string) => 
        name2.includes(kw.toLowerCase()) || kw.toLowerCase().includes(name2)
      );
      if (isClash) {
        return info1.severity || 'yellow';
      }
    }

    if (info2 && info2.clashWith) {
      const isClash = info2.clashWith.some((kw: string) => 
        name1.includes(kw.toLowerCase()) || kw.toLowerCase().includes(name1)
      );
      if (isClash) {
        return info2.severity || 'yellow';
      }
    }

    return 'green';
  };

  return (
    <SafeAreaView style={[styles.safeArea, doctorMode && { backgroundColor: '#37474F' }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={[styles.container, doctorMode && { backgroundColor: '#E0E0E0' }]}
      >
        <View style={[styles.header, doctorMode && { backgroundColor: '#E0E0E0', borderColor: '#000' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <FontAwesome5 name="pills" size={32} color="#000" />
            <Text style={[styles.headerTitle, { fontSize: 28 + fontOffset }, doctorMode && { color: '#000' }]}>ตู้ยาของฉัน</Text>
          </View>
          <TouchableOpacity style={[{ padding: 8 }, doctorMode && { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#000', borderRadius: 8 }]} onPress={() => toggleSound()}>
            <Feather name={isSoundMuted ? "volume-x" : "volume-2"} size={26} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Input Form with Auto-Suggestion */}
        <View style={styles.inputContainer}>
          <View style={{ flex: 1, zIndex: 10 }}>
            <TextInput
              style={[styles.input, { fontSize: 18 + fontOffset }, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}
              placeholder="พิมพ์ชื่อยา หรือเลือกคำแนะนำ..."
              value={inputText}
              onChangeText={handleTextChange}
            />
            {suggestions.length > 0 && (
              <View style={[styles.suggestionBox, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
                {suggestions.map((item) => (
                  <TouchableOpacity 
                    key={item.id || item.keywords[0]} 
                    style={[styles.suggestionItem, doctorMode && { backgroundColor: '#FFF', borderBottomColor: '#000' }]}
                    onPress={() => selectSuggestion(item)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Image 
                        source={require('../../assets/images/icons/icon_pill.png')} 
                        style={{ width: 20, height: 20, resizeMode: 'contain' }} 
                      />
                      <Text style={[styles.suggestionText, { fontSize: 16 + fontOffset }, doctorMode && { color: '#000' }]}>{item.formalName || item.keywords[0]}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <TouchableOpacity style={[styles.addBtn, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]} onPress={addMedicine}>
            <Text style={[styles.addBtnText, { fontSize: 18 + fontOffset }, doctorMode && { color: '#000' }]}>เพิ่ม</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.listContent}>
          
          {/* Interaction Matrix Button */}
          {medicines.length >= 2 && (
            <TouchableOpacity 
              style={[
                styles.matrixBtn, 
                doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }
              ]} 
              onPress={() => {
                setMatrixModalVisible(true);
                addActivityLog('คุณตาเปิดดูตารางปฏิกิริยายาตีกัน (Interaction Matrix)');
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FontAwesome5 name="th" size={18} color="#000" />
                <Text style={[styles.matrixBtnText, { fontSize: 16 + fontOffset }, doctorMode && { color: '#000' }]}>
                  🧪 ตารางเมทริกซ์ยาตีกัน (Interaction Matrix)
                </Text>
              </View>
            </TouchableOpacity>
          )}
          
          {/* Many Meds Caution Warning */}
          {/* Many Meds Caution Warning */}
          {medicines.length >= 3 && (
            <View style={[styles.cautionBanner, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]}>
              <FontAwesome5 name="exclamation-triangle" size={24} color={doctorMode ? '#000' : '#D32F2F'} />
              <Text style={[styles.cautionText, { fontSize: 15 + fontOffset }, doctorMode && { color: '#000' }]}>
                คุณตามียาในตู้ยา {medicines.length} ตัว แล้วนะคะ เวลาทานแนะนำให้ทานเว้นระยะห่าง เพื่อถนอมกระเพาะและไตค่ะ
              </Text>
            </View>
          )}

          {medicines.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { fontSize: 18 + fontOffset }, doctorMode && { color: '#000' }]}>ตู้ยาว่างเปล่าจ้า!{"\n"}ลองพิมพ์ค้นหาชื่อยาแล้วกดปุ่มเพิ่มดูนะคะคุณตา</Text>
            </View>
          ) : (
            medicines.map((med) => (
              <MedCard
                key={med.id}
                med={med}
                info={getMedInfo(med)}
                doctorMode={doctorMode}
                fontOffset={fontOffset}
                onDelete={removeMedicine}
              />
            ))
          )}
        </ScrollView>

        {/* Custom Alert Modal */}
        <CustomAlertModal
          visible={customAlert.visible}
          alert={customAlert}
          onClose={() => {
            setCustomAlert(prev => ({ ...prev, visible: false }));
            if (customAlert.onDismiss) customAlert.onDismiss();
          }}
          doctorMode={doctorMode}
          fontOffset={fontOffset}
        />

        {/* Interaction Matrix Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={matrixModalVisible}
          onRequestClose={() => setMatrixModalVisible(false)}
        >
          <SafeAreaView style={[styles.matrixModalBg, doctorMode && { backgroundColor: '#37474F' }]}>
            <View style={[styles.matrixModalContent, doctorMode && { backgroundColor: '#E0E0E0', borderColor: '#000' }]}>
              
              <View style={[styles.matrixModalHeader, doctorMode && { borderColor: '#000' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FontAwesome5 name="th" size={24} color="#000" />
                  <Text style={[styles.matrixModalTitle, { fontSize: 22 + fontOffset }]}>ตารางยาตีกัน (Matrix)</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.closeMatrixBtn, doctorMode && { backgroundColor: '#000', borderColor: '#000' }]} 
                  onPress={() => setMatrixModalVisible(false)}
                >
                  <Feather name="x" size={24} color={doctorMode ? '#FFF' : '#000'} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }}>
                <View style={{ padding: 12 }}>
                  <Text style={[styles.matrixSubtitle, { fontSize: 16 + fontOffset }]}>
                    ตารางวิเคราะห์การกินยาคู่กันระหว่างยาทุกตัวในตู้ยา ณ ปัจจุบันของคุณตา:
                  </Text>
                  
                  {/* Grid Container */}
                  <ScrollView horizontal={true} style={{ marginTop: 12, borderWidth: 3, borderColor: '#000', borderRadius: 12, backgroundColor: '#FFF' }}>
                    <View style={{ flexDirection: 'column' }}>
                      
                      {/* Header Row */}
                      <View style={{ flexDirection: 'row', borderBottomWidth: 3, borderColor: '#000', backgroundColor: '#37474F' }}>
                        <View style={[styles.matrixHeaderCell, { width: 120, borderRightWidth: 2, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 }}>ยา ↓ / ยา →</Text>
                        </View>
                        {medicines.map((colMed) => {
                          const shortName = colMed.name.split(' ')[0].slice(0, 8);
                          return (
                            <View key={`col_${colMed.id}`} style={[styles.matrixHeaderCell, { width: 85, borderRightWidth: 2, borderColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 6 }]}>
                              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12, textAlign: 'center' }} numberOfLines={1}>{shortName}</Text>
                            </View>
                          );
                        })}
                      </View>

                      {/* Data Rows */}
                      {medicines.map((rowMed) => {
                        const rowShortName = rowMed.name.split(' ')[0].slice(0, 10);
                        return (
                          <View key={`row_${rowMed.id}`} style={{ flexDirection: 'row', borderBottomWidth: 2, borderColor: '#000' }}>
                            {/* Row Header */}
                            <View style={[styles.matrixRowHeaderCell, { width: 120, borderRightWidth: 2, borderColor: '#000', backgroundColor: '#ECEFF1', padding: 8, justifyContent: 'center' }]}>
                              <Text style={{ fontWeight: '900', fontSize: 13, color: '#333' }} numberOfLines={2}>{rowShortName}</Text>
                            </View>
                            {/* Cells */}
                            {medicines.map((colMed) => {
                              const severity = findSeverity(rowMed, colMed);
                              let cellBg = '#C8E6C9'; // green
                              let cellBorder = '#388E3C';
                              let cellEmoji = '🟢';
                              
                              if (severity === 'red') {
                                cellBg = '#FFCDD2';
                                cellBorder = '#D32F2F';
                                cellEmoji = '🔴';
                              } else if (severity === 'yellow') {
                                cellBg = '#FFF9C4';
                                cellBorder = '#F9A825';
                                cellEmoji = '🟡';
                              } else if (severity === 'self') {
                                cellBg = '#E0E0E0';
                                cellBorder = '#9E9E9E';
                                cellEmoji = '—';
                              }

                              if (doctorMode) {
                                // Grayscale color mapping under Doctor Mode
                                cellBorder = '#000';
                                if (severity === 'red') {
                                  cellBg = '#9E9E9E'; // dark gray
                                } else if (severity === 'yellow') {
                                  cellBg = '#B0BEC5'; // mid gray
                                } else if (severity === 'green') {
                                  cellBg = '#FFF'; // white
                                } else if (severity === 'self') {
                                  cellBg = '#ECEFF1'; // light gray
                                }
                              }

                              return (
                                <View 
                                  key={`cell_${rowMed.id}_${colMed.id}`} 
                                  style={{ 
                                    width: 85, 
                                    borderRightWidth: 2, 
                                    borderColor: cellBorder, 
                                    backgroundColor: cellBg, 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    height: 52 
                                  }}
                                >
                                  <Text style={{ fontSize: 18, fontWeight: '900' }}>{cellEmoji}</Text>
                                </View>
                              );
                            })}
                          </View>
                        );
                      })}

                    </View>
                  </ScrollView>

                  {/* Legend explanation */}
                  <View style={[styles.matrixLegend, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <FontAwesome5 name="info-circle" size={16} color="#000" />
                      <Text style={{ fontWeight: '800', fontSize: 15 }}>คำอธิบายระดับสัญลักษณ์:</Text>
                    </View>
                    <View style={{ gap: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: doctorMode ? '#000' : '#D32F2F' }}>
                        🔴 อันตรายสูง (ห้ามกินยาคู่กันโดยเด็ดขาด)
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: doctorMode ? '#000' : '#F57F17' }}>
                        🟡 ควรระวังเว้นระยะ (ควรห่างกันอย่างน้อย 2 ชม.)
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: doctorMode ? '#000' : '#2E7D32' }}>
                        🟢 ปลอดภัยดี (สามารถกินร่วมกันได้ปกติ)
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#757575' }}>
                        — ยาตัวเดียวกัน
                      </Text>
                    </View>
                  </View>

                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>

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
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: SeniorColors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    zIndex: 100,
  },
  input: {
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
  suggestionBox: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: SeniorColors.borderStrong,
    borderRadius: 12,
    boxShadow: '0px 8px 22px rgba(31, 122, 92, 0.12)',
    zIndex: 200,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: SeniorColors.border,
    backgroundColor: SeniorColors.surface,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '800',
    color: SeniorColors.text,
  },
  addBtn: {
    backgroundColor: SeniorColors.primary,
    borderWidth: 0,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: 56,
    boxShadow: '0px 6px 14px rgba(31, 122, 92, 0.18)',
  },
  addBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  listContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  cautionBanner: {
    flexDirection: 'row',
    backgroundColor: SeniorColors.dangerSoft,
    borderWidth: 1.5,
    borderColor: SeniorColors.danger,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  cautionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: SeniorColors.danger,
    lineHeight: 23,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: SeniorColors.primaryDark,
    textAlign: 'center',
    lineHeight: 30,
  },
  medCard: {
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
    boxShadow: '4px 4px 0px #000',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  medCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  medIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medIcon: {
    fontSize: 24,
  },
  medName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
  },
  formalName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginTop: 2,
  },
  deleteBtn: {
    backgroundColor: '#F44336',
    borderWidth: 2,
    borderColor: '#000',
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medDetails: {
    borderTopWidth: 2,
    borderColor: '#EEEEEE',
    paddingTop: 10,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  detailsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444',
  },
  notesBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderColor: '#4CAF50',
    padding: 8,
  },
  notesText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E7D32',
  },
  storageBox: {
    backgroundColor: '#FFFDE7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderColor: '#FBC02D',
    padding: 8,
  },
  storageText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F57F17',
  },
  
  // Custom Alert Styles
  alertModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    borderRadius: 20,
    boxShadow: '6px 6px 0px #000',
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 16,
  },
  alertHeaderBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -48,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#444',
    textAlign: 'center',
    lineHeight: 24,
  },
  alertBtn: {
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    boxShadow: '3px 3px 0px #000',
  },
  alertBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },

  // Confirm Alert Styles
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '2px 2px 0px #000',
  },
  btnCancel: {
    backgroundColor: '#ECEFF1',
  },
  btnCancelText: {
    color: '#37474F',
    fontSize: 16,
    fontWeight: '900',
  },
  btnConfirm: {
    backgroundColor: '#D32F2F',
  },
  btnConfirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  matrixBtn: {
    backgroundColor: SeniorColors.primary,
    borderWidth: 0,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  matrixBtnText: {
    color: '#FFF',
    fontWeight: '900',
  },
  matrixModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  matrixModalContent: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 20,
    boxShadow: '0px 10px 28px rgba(20, 50, 42, 0.18)',
    width: '100%',
    height: '90%',
    paddingBottom: 16,
    overflow: 'hidden',
  },
  matrixModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: SeniorColors.border,
    backgroundColor: SeniorColors.surfaceMuted,
  },
  matrixModalTitle: {
    fontWeight: '900',
    color: SeniorColors.text,
  },
  closeMatrixBtn: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matrixSubtitle: {
    fontWeight: '700',
    color: SeniorColors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  matrixHeaderCell: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matrixRowHeaderCell: {
    height: 52,
    justifyContent: 'center',
  },
  matrixLegend: {
    marginTop: 16,
    backgroundColor: SeniorColors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: SeniorColors.border,
    borderRadius: 12,
    padding: 12,
  },
});
