import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Image, TextInput, ScrollView, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useNavigation } from 'expo-router';
import { checkInteraction, saveCustomMed, getAllMeds, addActivityLog } from '../api';
import { useFontSize } from '@/hooks/use-font-size';
import { useDoctorMode } from '@/hooks/use-doctor-mode';
import { useSound } from '@/hooks/use-sound';
import { useCustomAlert } from '@/hooks/use-custom-alert';
import { useAppStore } from '../store/useAppStore';
import { CustomAlertModal } from '../components/CustomAlertModal';

const DEMO_IMAGES: Record<string, any> = {
  case1: require('../../assets/images/demo/pill_ibuprofen_1782351438429.png'),
  case2: require('../../assets/images/demo/pill_amlodipine_1782351383168.png'),
  case3: require('../../assets/images/demo/pill_ibuprofen_1782351438429.png'),
  case4: require('../../assets/images/demo/pill_ibuprofen_1782351438429.png'),
  unknown: null,
};

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const [activeCase, setActiveCase] = useState<'case1' | 'case2' | 'case3' | 'case4' | 'unknown'>('case1');

  // States for medication selection modal
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dbMeds, setDbMeds] = useState<any[]>([]);
  const [filteredMeds, setFilteredMeds] = useState<any[]>([]);

  // States for new medication form
  const [newMedModalVisible, setNewMedModalVisible] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedShape, setNewMedShape] = useState('');
  const [newMedNotes, setNewMedNotes] = useState('');
  const [newMedStorage, setNewMedStorage] = useState('');
  const [newMedSeverity, setNewMedSeverity] = useState<'green' | 'yellow' | 'red'>('green');
  const [newMedClashInput, setNewMedClashInput] = useState('');
  const [newMedDiseaseInput, setNewMedDiseaseInput] = useState<string[]>([]);

  // User Profile + shared settings from store
  const profile = useAppStore((state) => state.profile);
  const cabinet = useAppStore((state) => state.cabinet);
  const setActiveChallenge = useAppStore((state) => state.setActiveChallenge);

  const { doctorMode } = useDoctorMode();
  const { fontOffset } = useFontSize();
  const { handleSpeak } = useSound();
  const { customAlert, setCustomAlert } = useCustomAlert();

  const navigation = useNavigation();

  useEffect(() => {
    handleSpeak('เปิดกล้องแล้วค่ะ โปรดวางซองยาไว้ตรงหน้ากล้อง ถ่ายรูปเพื่อให้หลานวิเคราะห์ออฟไลน์ได้เลยนะคะ');
    loadDbMeds();
  }, []);

  const loadDbMeds = async () => {
    const meds = await getAllMeds();
    setDbMeds(meds);
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>ต้องอนุญาตให้ใช้กล้องก่อนนะคะคุณตา</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={requestPermission}>
          <Text style={styles.actionBtnText}>อนุญาต</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!isScanning) {
      setIsScanning(true);
      try {
        if (cameraRef.current) {
          try {
            await cameraRef.current.takePictureAsync({ quality: 0.1 });
          } catch (e) {
            console.log('Shutter audio mock bypass');
          }
        }
        
        handleSpeak('ถ่ายภาพเสร็จแล้วค่ะ กำลังวิเคราะห์รูปภาพยาด้วยระบบเอไอออฟไลน์นะคะ');
        
        setTimeout(async () => {
          let caseResult: any = {};
          
          if (activeCase === 'case1') {
            caseResult = {
              name: 'Ibuprofen (ยาไอบูโพรเฟน)',
              severity: 'red',
              descTh: '❌ ตรวจพบอันตรายร้ายแรง (Contraindication)!\n\nยาที่สแกน: Ibuprofen (ยาแก้ปวดอักเสบ)\nยาในตู้ของคุณตา: Warfarin (ยาต้านการแข็งตัวของเลือด)\n\nผลการวิเคราะห์: ยาทั้ง 2 ชนิดนี้ตีกันห้ามกินร่วมกันเด็ดขาด! การรับประทานร่วมกันจะเพิ่มความเสี่ยงต่อภาวะเลือดออกในกระเพาะอาหารอย่างรุนแรงและมีเลือดออกภายในจนเป็นอันตรายถึงชีวิตค่ะ!',
              speechTh: 'ตรวจพบอันตรายร้ายแรงค่ะ ยาไอบูโพรเฟนตีกับยาวาร์ฟารินในตู้ยาของคุณตา ห้ามกินร่วมกันเด็ดขาดนะคะ'
            };
          } else if (activeCase === 'case2') {
            caseResult = {
              name: 'Amlodipine (ยาแอมโลดิพีน)',
              severity: 'green',
              descTh: '✅ ปลอดภัย ทานร่วมกันได้!\n\nยาที่สแกน: Amlodipine (ยาลดความดันโลหิต)\nยาในตู้ของคุณตา: Simvastatin (ยาลดไขมันในเลือด)\n\nผลการวิเคราะห์: ยาทั้ง 2 ชนิดนี้สามารถรับประทานร่วมกันได้อย่างปลอดภัยตามขนาดและเวลาที่แพทย์สั่งค่ะคุณตา',
              speechTh: 'ยาแอมโลดิพีนสามารถทานร่วมกับยาซิมวาสตาตินในตู้ยาได้อย่างปลอดภัยค่ะคุณตา'
            };
          } else if (activeCase === 'case3') {
            caseResult = {
              name: 'Ibuprofen (ยาไอบูโพรเฟน)',
              severity: 'yellow',
              descTh: '⚠️ ควรระวังและเว้นระยะห่าง!\n\nยาที่สแกน: Ibuprofen (ยาแก้ปวดอักเสบ)\nยาในตู้ของคุณตา: Metformin (ยาเบาหวาน)\n\nผลการวิเคราะห์: ควรระวัง! ยา 2 ชนิดนี้ควรทานห่างกันอย่างน้อย 2 ชั่วโมง และควรจิบน้ำสะอาดบ่อย ๆ ระหว่างวัน เพื่อป้องกันความดันโลหิตและถนอมการทำงานของไตค่ะ',
              speechTh: 'ควรระวังค่ะ ยาไอบูโพรเฟนควรทานห่างจากยาเบาหวานอย่างน้อยสองชั่วโมงพร้อมจิบน้ำบ่อยๆ นะคะคุณตา'
            };
          } else if (activeCase === 'case4') {
            caseResult = {
              name: 'Ibuprofen (ยาไอบูโพรเฟน)',
              severity: 'red',
              descTh: '❌ ตรวจพบข้อห้ามใช้กับโรคประจำตัวคุณตา!\n\nยาที่สแกน: Ibuprofen (ยาแก้ปวดอักเสบ)\nโรคประจำตัวของคุณตา: โรคไต (Chronic Kidney Disease)\n\nผลการวิเคราะห์: ห้ามรับประทานยานี้เด็ดขาด! เนื่องจากคุณตามีประวัติโรคไตวายเรื้อรัง ยาไอบูโพรเฟนซึ่งเป็นยาแก้ปวดอักเสบกลุ่ม NSAIDs จะทำให้เลือดไปเลี้ยงไตลดลงอย่างมาก ส่งผลให้ไตวายเฉียบพลันได้ค่ะ!',
              speechTh: 'ตรวจพบข้อห้ามใช้ทางการแพทย์ค่ะ คุณตามีโรคประจำตัวเป็นโรคไต ห้ามทานยาไอบูโพรเฟนโดยเด็ดขาดนะคะ'
            };
          } else {
            caseResult = {
              name: 'ไม่พบข้อมูลยาในระบบ',
              severity: 'unknown',
              error: 'ไม่มีในฐานข้อมูลของระบบ',
              descTh: '🔍 ไม่พบข้อมูลซองยา!\n\nผลการวิเคราะห์: รูปภาพซองยาที่สแกนอยู่นี้ ไม่มีในฐานข้อมูลของระบบตู้นะคะ\n\nคำแนะนำ: กรุณาติดต่อลูกหลานหรือแพทย์ผู้รักษาเพื่อเพิ่มข้อมูลยาตัวใหม่นี้ลงตู้ยาผ่านหน้าหลักค่ะ',
              speechTh: 'ขออภัยค่ะ ไม่มีข้อมูลซองยานี้ในฐานข้อมูลของระบบค่ะ'
            };
          }
          
          setResult({
            photo: DEMO_IMAGES[activeCase],
            ...caseResult
          });
          
          await addActivityLog(`คุณตาสแกนทดสอบกรณีจัดฉาก: ${activeCase} (${caseResult.name}) - ผลลัพธ์: ${caseResult.severity}`);
          setIsScanning(false);
        }, 1500);
      } catch (e: any) {
        console.error(e);
        setIsScanning(false);
      }
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredMeds([]);
      return;
    }
    const filtered = dbMeds.filter(med => 
      med.keywords.some((kw: string) => kw.toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredMeds(filtered);
  };

  const selectMed = async (medName: string) => {
    setSelectModalVisible(false);
    setIsScanning(true);
    handleSpeak(`กำลังวิเคราะห์ความปลอดภัยของยา ${medName} รอสักครู่นะคะ`);

    try {
      // ดึงโรคประจำตัวคุณตา
      const diseases = profile ? profile.diseases : [];
      const allergies = profile ? profile.allergies : [];

      // วิเคราะห์
      const safetyResult = await checkInteraction(medName, cabinet, diseases, allergies);

      setResult({
        photo: photoUri,
        name: medName,
        ...safetyResult
      });

      await addActivityLog(`คุณตาสแกนเช็กยา: "${medName}" (ผลลัพธ์ระดับสี: ${safetyResult?.severity})`);
      handleSpeak(safetyResult?.speechTh || 'ตรวจสอบเรียบร้อยแล้วค่ะ');

    } catch (e: any) {
      console.error(e);
      handleSpeak('ระบบขัดข้องไม่สามารถวิเคราะห์ได้ค่ะ');
      setResult({ error: 'ไม่สามารถตรวจวิเคราะห์ยาได้: ' + e.message });
    } finally {
      setIsScanning(false);
    }
  };

  const saveAndSelectNewMed = async () => {
    if (!newMedName.trim()) {
      setCustomAlert({
        visible: true,
        title: 'ข้อมูลไม่ครบ',
        message: 'กรุณาระบุชื่อยาที่คุณตาต้องการบันทึกก่อนนะคะ',
        type: 'warning'
      });
      return;
    }

    const clashes = newMedClashInput ? newMedClashInput.split(',').map(s => s.trim().toLowerCase()) : [];

    const newMed = {
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      shape: newMedShape.trim(),
      notes: newMedNotes.trim(),
      storageTh: newMedStorage.trim(),
      severity: newMedSeverity,
      clashWith: clashes,
      diseases: newMedDiseaseInput,
      descTh: `ยาใหม่ระบุโดยคุณตา/ลูกหลาน: ห้ามกินคู่กับยา: [${clashes.join(', ')}] | วิธีทาน: ${newMedNotes.trim()}`,
      speechTh: newMedSeverity === 'red' 
        ? `ยาตัวนี้เป็นยาอันตราย ห้ามทานคู่กับยาในตู้นะคะคุณตา` 
        : `ทานได้อย่างปลอดภัยค่ะ แต่ถ้าปวดเมื่อยหรือคลื่นไส้ให้แจ้งหลานทันทีนะคะ`
    };

    await saveCustomMed(newMed);
    await loadDbMeds(); // รีโหลด DB เพื่อให้มีรายการยาใหม่
    
    setNewMedModalVisible(false);
    setSelectModalVisible(false);
    
    // รีเซ็ตค่าฟอร์ม
    setNewMedName('');
    setNewMedDosage('');
    setNewMedShape('');
    setNewMedNotes('');
    setNewMedStorage('');
    setNewMedSeverity('green');
    setNewMedClashInput('');
    setNewMedDiseaseInput([]);

    // ดำเนินการวิเคราะห์
    await selectMed(newMed.name);
  };

  const toggleDiseaseSelection = (dId: string) => {
    if (newMedDiseaseInput.includes(dId)) {
      setNewMedDiseaseInput(newMedDiseaseInput.filter(id => id !== dId));
    } else {
      setNewMedDiseaseInput([...newMedDiseaseInput, dId]);
    }
  };

  const startMedSpacingChallenge = async () => {
    if (!result) return;
    try {
      // บันทึกสถานะเพื่อบอกว่าเริ่มภารกิจ
      const challenge = {
        medName: result.name,
        timeLeft: 7200, // 2 ชม. (7200 วินาที)
        maxTime: 7200,
        waterCups: 0
      };
      await setActiveChallenge(challenge as any);
      await addActivityLog(`เริ่มชาเลนจ์ความปลอดภัยของยาแก้ปวด: "${result.name}"`);
      handleSpeak('เริ่มชาเลนจ์จิบน้ำและเว้นระยะยาแก้ปวด 2 ชั่วโมงให้คุณตาแล้วค่ะ');
      setCustomAlert({
        visible: true,
        title: 'ภารกิจเริ่มต้นแล้ว!',
        message: 'เริ่มภารกิจจำลองความปลอดภัยแล้วค่ะ คุณตาสามารถดูแถบเวลานับถอยหลังและกดบันทึกจิบน้ำสะสมได้ที่หน้าจอหลักนะคะ!',
        type: 'success',
        onDismiss: () => {
          router.replace('/');
        }
      });

    } catch (e) {
      console.error(e);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setPhotoUri(null);
    handleSpeak('พร้อมสแกนยาซองต่อไปแล้วค่ะคุณตา');
  };

  const renderModals = () => {
    return (
      <>
        {/* Select Med Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectModalVisible}
          onRequestClose={() => setSelectModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="search" size={22} color="#000" />
                  <Text style={styles.modalTitle}>ระบุชื่อยาที่แสกน</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectModalVisible(false)}>
                  <Feather name="x" size={26} color="#000" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalSearchInput}
                placeholder="พิมพ์ชื่อยาที่นี่... (เช่น พารา, ไอบู)"
                value={searchText}
                onChangeText={handleSearchChange}
              />

              <ScrollView style={styles.suggestionScroll}>
                {filteredMeds.length > 0 ? (
                  filteredMeds.map(med => (
                    <TouchableOpacity 
                      key={med.id || med.keywords[0]} 
                      style={styles.suggestionItem}
                      onPress={() => selectMed(med.keywords[0])}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Image 
                          source={require('../../assets/images/icons/icon_pill.png')} 
                          style={{ width: 20, height: 20, resizeMode: 'contain' }} 
                        />
                        <Text style={styles.suggestionText}>{med.formalName || med.keywords[0]}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : searchText.trim().length > 0 ? (
                  <View style={styles.noMedContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Feather name="x-circle" size={22} color="#D32F2F" />
                      <Text style={styles.noMedText}>ไม่พบข้อมูลยานี้ในระบบเครื่องค่ะ</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.addNewMedBtn}
                      onPress={() => setNewMedModalVisible(true)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Feather name="plus-circle" size={18} color="#FFF" />
                        <Text style={styles.addNewMedBtnText}>เพิ่มข้อมูลยาตัวใหม่ลงระบบ</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.helpContainer}>
                    <Text style={styles.helpText}>ลองเลือกยาสามัญด้านล่างเพื่อสาธิต:</Text>
                    {dbMeds.slice(0, 6).map(med => (
                      <TouchableOpacity 
                        key={med.id || med.keywords[0]} 
                        style={styles.demoMedBtn}
                        onPress={() => selectMed(med.keywords[0])}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Feather name="arrow-right" size={16} color="#0288D1" />
                          <Text style={styles.demoMedText}>{med.formalName || med.keywords[0]}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Add New Custom Med Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={newMedModalVisible}
          onRequestClose={() => setNewMedModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
            <ScrollView contentContainerStyle={styles.newMedModalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="plus-circle" size={22} color="#000" />
                  <Text style={styles.modalTitle}>ลงทะเบียนข้อมูลยาใหม่</Text>
                </View>
                <TouchableOpacity onPress={() => setNewMedModalVisible(false)}>
                  <Feather name="x" size={26} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Image source={require('../../assets/images/icons/icon_pill.png')} style={{ width: 18, height: 18, resizeMode: 'contain' }} />
                  <Text style={styles.formLabel}>ชื่อยาภาษาอังกฤษ/ไทย (จำเป็น)</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder="ตัวอย่าง: Diclofenac หรือ ไดโคลฟีแนค"
                  value={newMedName}
                  onChangeText={setNewMedName}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <FontAwesome5 name="info-circle" size={14} color="#000" />
                    <Text style={styles.formLabel}>ขนาดของยา</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    placeholder="เช่น 50 มก."
                    value={newMedDosage}
                    onChangeText={setNewMedDosage}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <FontAwesome5 name="eye" size={14} color="#000" />
                    <Text style={styles.formLabel}>ลักษณะเม็ดยา</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    placeholder="เช่น เม็ดกลมสีเหลือง"
                    value={newMedShape}
                    onChangeText={setNewMedShape}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FontAwesome5 name="stethoscope" size={14} color="#000" />
                  <Text style={styles.formLabel}>คำสั่งแพทย์ / วิธีรับประทาน</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder="เช่น ทานหลังอาหารทันทีเช้า-เย็น"
                  value={newMedNotes}
                  onChangeText={setNewMedNotes}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FontAwesome5 name="box" size={14} color="#000" />
                  <Text style={styles.formLabel}>วิธีการเก็บรักษายา</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder="เช่น เก็บพ้นแสงแดดและห้ามแช่ตู้เย็น"
                  value={newMedStorage}
                  onChangeText={setNewMedStorage}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Feather name="alert-triangle" size={16} color="#000" />
                  <Text style={styles.formLabel}>ตีกับยาตัวไหนบ้าง (ระบุคำสำคัญคั่นด้วยเครื่องหมายจุลภาค ,)</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder="เช่น warfarin, aspirin"
                  value={newMedClashInput}
                  onChangeText={setNewMedClashInput}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Feather name="slash" size={16} color="#000" />
                  <Text style={styles.formLabel}>ห้ามใช้ในโรคประจำตัวประเภทไหนบ้าง</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  {[
                    { id: 'hypertension', name: 'ความดันสูง' },
                    { id: 'diabetes', name: 'เบาหวาน' },
                    { id: 'heart', name: 'โรคหัวใจ' },
                    { id: 'lipid', name: 'ไขมันสูง' },
                    { id: 'kidney', name: 'โรคไต' },
                    { id: 'stomach', name: 'โรคกระเพาะ' },
                    { id: 'liver', name: 'โรคตับ' }
                  ].map(d => {
                    const isSelected = newMedDiseaseInput.includes(d.id);
                    return (
                      <TouchableOpacity
                        key={d.id}
                        style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                        onPress={() => toggleDiseaseSelection(d.id)}
                      >
                        <Text style={[styles.checkboxText, isSelected && styles.checkboxTextSelected]}>
                          {d.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Image source={require('../../assets/images/icons/icon_siren.png')} style={{ width: 18, height: 18, resizeMode: 'contain' }} />
                  <Text style={styles.formLabel}>ระดับความอันตราย</Text>
                </View>
                <View style={styles.radioGroup}>
                  {(['green', 'yellow', 'red'] as const).map((level) => {
                    const isSelected = newMedSeverity === level;
                    const color = level === 'red' ? '#D32F2F' : level === 'yellow' ? '#FBC02D' : '#4CAF50';
                    const label = level === 'red' ? 'ห้ามกินคู่เด็ดขาด' : level === 'yellow' ? 'ต้องเว้นระยะห่าง' : 'ปลอดภัยใช้ทั่วไป';
                    
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[styles.radioButton, isSelected && { backgroundColor: color, borderColor: '#000' }]}
                        onPress={() => setNewMedSeverity(level)}
                      >
                        <Text style={[styles.radioText, isSelected && { color: '#FFF' }]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveAndSelectNewMed}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="save" size={20} color="#FFF" />
                  <Text style={styles.saveBtnText}>บันทึกข้อมูลและตรวจวิเคราะห์ทันที</Text>
                </View>
              </TouchableOpacity>

            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

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
      </>
    );
  };

  // Result Screen
  if (result) {
    const isError = !!result.error;
    const isUnknown = result.severity === 'unknown';
    const bgColor = doctorMode 
      ? '#FFF' 
      : (isError ? '#FFCDD2' : result.severity === 'red' ? '#FFCDD2' : result.severity === 'yellow' ? '#FFF9C4' : '#C8E6C9');
    const borderThemeColor = doctorMode 
      ? '#000' 
      : (result.severity === 'red' ? '#D32F2F' : result.severity === 'yellow' ? '#F57F17' : '#2E7D32');
    const textColor = '#000';

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }, doctorMode && { backgroundColor: '#37474F' }]}>
        <ScrollView contentContainerStyle={styles.resultScrollContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            {!isError && (
              <FontAwesome5 
                name={result.severity === 'red' ? 'exclamation-triangle' : result.severity === 'yellow' ? 'exclamation-circle' : 'check-circle'} 
                size={26} 
                color={borderThemeColor} 
              />
            )}
            <Text style={[styles.resultHeader, { color: borderThemeColor, marginBottom: 0 }]}>
              {result.severity === 'unknown' ? 'ไม่มีในฐานข้อมูล' : result.severity === 'red' ? 'ตรวจพบอันตราย!' : result.severity === 'yellow' ? 'ควรระวัง!' : 'ปลอดภัย ทานได้'}
            </Text>
          </View>
          
          <View style={[styles.resultCard, { borderColor: borderThemeColor }, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
            {result.photo ? (
              <Image source={typeof result.photo === 'number' ? result.photo : { uri: result.photo }} style={styles.previewImg} />
            ) : (
              <View style={[styles.previewImg, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECEFF1', borderWidth: 3, borderColor: '#000' }]}>
                <Feather name="help-circle" size={80} color="#78909C" />
              </View>
            )}
            <Text style={styles.medNameText}>{result.name}</Text>
            
            {!isError && (
              <TouchableOpacity 
                style={[styles.changeMedNameBtn, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]}
                onPress={() => {
                  handleSpeak('เลือกหรือพิมพ์ชื่อยาที่ถูกต้องได้เลยค่ะ');
                  setSearchText('');
                  setFilteredMeds([]);
                  setSelectModalVisible(true);
                }}
              >
                <Feather name="edit" size={15} color="#000" style={{ marginRight: 6 }} />
                <Text style={styles.changeMedNameBtnText}>ไม่ใช่ยาตัวนี้? กดสลับ/เปลี่ยนชื่อยา</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.descContainer}>
              <Text style={styles.descText}>{isError ? result.error : result.descTh}</Text>
            </View>

            {/* If Yellow, present Spacing Challenge option */}
            {result.severity === 'yellow' && (
              <TouchableOpacity style={[styles.challengeBtn, doctorMode && { backgroundColor: '#37474F', borderColor: '#000' }]} onPress={startMedSpacingChallenge}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Image source={require('../../assets/images/icons/icon_water_drop.png')} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
                  <Text style={styles.challengeBtnText}>เริ่มภารกิจเว้นระยะยาและจิบน้ำ</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={[styles.resetBtn, doctorMode && { backgroundColor: '#ECEFF1', borderColor: '#000' }]} onPress={resetScanner}>
            <Feather name="refresh-cw" size={24} color="#000" />
            <Text style={styles.resetBtnText}>สแกนอีกครั้ง</Text>
          </TouchableOpacity>
        </ScrollView>

        {renderModals()}

      </SafeAreaView>
    );
  }

  // Camera Screen
  return (
    <SafeAreaView style={styles.safeAreaDark}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <View style={styles.overlay}>
          {/* Staged Presentation Case Selector */}
          <View style={styles.demoSelectorContainer}>
            <Text style={styles.demoSelectorTitle}>🎭 เลือกเคสจัดฉาก (คลิกก่อนกดถ่ายภาพ):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.demoSelectorScroll}>
              <TouchableOpacity 
                style={[styles.demoSelectBtn, activeCase === 'case1' && styles.demoSelectBtnActive]} 
                onPress={() => {
                  setActiveCase('case1');
                  handleSpeak('เลือกเคสที่หนึ่ง ยาตีกัน ห้ามกินร่วมกันเด็ดขาดค่ะ');
                }}
              >
                <Text style={[styles.demoSelectBtnText, activeCase === 'case1' && styles.demoSelectBtnTextActive]}>1. ยาตีกัน (แดง)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.demoSelectBtn, activeCase === 'case2' && styles.demoSelectBtnActive]} 
                onPress={() => {
                  setActiveCase('case2');
                  handleSpeak('เลือกเคสที่สอง ยาทานร่วมกันได้อย่างปลอดภัยค่ะ');
                }}
              >
                <Text style={[styles.demoSelectBtnText, activeCase === 'case2' && styles.demoSelectBtnTextActive]}>2. ทานร่วมกันได้ (เขียว)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.demoSelectBtn, activeCase === 'case3' && styles.demoSelectBtnActive]} 
                onPress={() => {
                  setActiveCase('case3');
                  handleSpeak('เลือกเคสที่สาม ยาควรทานห่างกันสองชั่วโมงค่ะ');
                }}
              >
                <Text style={[styles.demoSelectBtnText, activeCase === 'case3' && styles.demoSelectBtnTextActive]}>3. ทานห่างกัน (เหลือง)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.demoSelectBtn, activeCase === 'case4' && styles.demoSelectBtnActive]} 
                onPress={() => {
                  setActiveCase('case4');
                  handleSpeak('เลือกเคสที่สี่ ยาห้ามกินกับโรคไตค่ะ');
                }}
              >
                <Text style={[styles.demoSelectBtnText, activeCase === 'case4' && styles.demoSelectBtnTextActive]}>4. ยาต้องห้ามกับโรคไต (แดง)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.demoSelectBtn, activeCase === 'unknown' && styles.demoSelectBtnActive]} 
                onPress={() => {
                  setActiveCase('unknown');
                  handleSpeak('เลือกเคสที่ห้า ยานอกฐานข้อมูลระบบค่ะ');
                }}
              >
                <Text style={[styles.demoSelectBtnText, activeCase === 'unknown' && styles.demoSelectBtnTextActive]}>5. ยานอกฐานข้อมูล (เทา)</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.frame}>
            <View style={styles.frameCornerTL} />
            <View style={styles.frameCornerTR} />
            <View style={styles.frameCornerBL} />
            <View style={styles.frameCornerBR} />
          </View>
          <Text style={styles.guideText}>วางซองยาไว้ในกรอบแล้วกดปุ่มถ่ายรูป</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.captureBtn, isScanning && styles.captureBtnDisabled]} 
            onPress={takePicture}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <Feather name="camera" size={48} color="#000" />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>

      {renderModals()}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  resultScrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeAreaDark: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D32F2F',
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: '#FFEB3B',
    borderWidth: 3,
    borderColor: '#000',
    padding: 16,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 20,
    fontWeight: '800',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  frame: {
    width: 280,
    height: 380,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
  },
  frameCornerTL: { position: 'absolute', top: -2, left: -2, width: 40, height: 40, borderTopWidth: 6, borderLeftWidth: 6, borderColor: '#FFF' },
  frameCornerTR: { position: 'absolute', top: -2, right: -2, width: 40, height: 40, borderTopWidth: 6, borderRightWidth: 6, borderColor: '#FFF' },
  frameCornerBL: { position: 'absolute', bottom: -2, left: -2, width: 40, height: 40, borderBottomWidth: 6, borderLeftWidth: 6, borderColor: '#FFF' },
  frameCornerBR: { position: 'absolute', bottom: -2, right: -2, width: 40, height: 40, borderBottomWidth: 6, borderRightWidth: 6, borderColor: '#FFF' },
  guideText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 30,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  controls: {
    backgroundColor: '#000',
    padding: 30,
    alignItems: 'center',
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEB3B',
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnDisabled: {
    backgroundColor: '#9E9E9E',
  },
  resultHeader: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    boxShadow: '4px 4px 0px #000',
  },
  previewImg: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#000',
    marginBottom: 16,
  },
  medNameText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  descContainer: {
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 12,
  },
  descText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    lineHeight: 28,
  },
  challengeBtn: {
    backgroundColor: '#2196F3',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    boxShadow: '2px 2px 0px #000',
  },
  challengeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
    padding: 16,
    borderRadius: 16,
    marginTop: 30,
    boxShadow: '3px 3px 0px #000',
  },
  resetBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },

  // Modal styling
  modalBg: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 5,
    borderColor: '#000',
    padding: 20,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
  },
  modalSearchInput: {
    backgroundColor: '#FFFDE7',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    height: 54,
    marginBottom: 16,
  },
  suggestionScroll: {
    flex: 1,
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    backgroundColor: '#F9FBE7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000',
  },
  noMedContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  noMedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D32F2F',
  },
  addNewMedBtn: {
    backgroundColor: '#FF5252',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    boxShadow: '3px 3px 0px #000',
  },
  addNewMedBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  helpContainer: {
    paddingVertical: 10,
  },
  helpText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#555',
    marginBottom: 10,
  },
  demoMedBtn: {
    padding: 10,
    marginBottom: 8,
  },
  demoMedText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0288D1',
  },

  // Form styles
  newMedModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 5,
    borderColor: '#000',
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    height: 46,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkbox: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  checkboxSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  checkboxTextSelected: {
    color: '#FFF',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  radioButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#CCC',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  radioText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '3px 3px 0px #000',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
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
  changeMedNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEFF1',
    borderWidth: 2.5,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    boxShadow: '2px 2px 0px #000',
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'center',
  },
  changeMedNameBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  
  // Staged Presentation Selector Styles
  demoSelectorContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 3,
    borderColor: '#FFEB3B',
    zIndex: 100,
  },
  demoSelectorTitle: {
    color: '#FFEB3B',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  demoSelectorScroll: {
    paddingHorizontal: 4,
    gap: 8,
  },
  demoSelectBtn: {
    backgroundColor: '#ECEFF1',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 6,
  },
  demoSelectBtnActive: {
    backgroundColor: '#FFEB3B',
    borderColor: '#000',
  },
  demoSelectBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  demoSelectBtnTextActive: {
    fontWeight: '900',
  },
});
