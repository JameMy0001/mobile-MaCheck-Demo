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

export default function FoodClashScreen() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<any>(null);
  
  const profile = useAppStore((state) => state.profile);
  const cabinet = useAppStore((state) => state.cabinet);

  const { fontOffset } = useFontSize();
  const { doctorMode } = useDoctorMode();
  const { handleSpeak } = useSound();

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
        const diseaseNames = clashDiseases.map((d: string) => getDiseaseThName(d)).join(', ');
        const medNames = clashMeds.map((m: any) => m.name).join(', ');

        let details = foundFood.descTh;
        let speakText = foundFood.speechTh;

        let listInfo = [];
        if (clashDiseases.length > 0) {
          listInfo.push(`ตีกับโรคประจำตัวของคุณตา: ${diseaseNames}`);
        }
        if (clashMeds.length > 0) {
          listInfo.push(`ตีกับยาในตู้ของคุณตา: ${medNames}`);
        }

        const clashDesc = `🚨 **คำเตือน! พบความเสี่ยง:**\n${listInfo.join('\n')}\n\n**ผลกระทบ:** ${details}`;

        const clashRes = {
          severity: foundFood.severity,
          descTh: clashDesc,
          speechTh: speakText
        };
        setResult(clashRes);
        handleSpeak(speakText);
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

  return (
    <SafeAreaView style={[styles.safeArea, doctorMode && { backgroundColor: '#37474F' }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, doctorMode && { backgroundColor: '#E0E0E0' }]}>
        <View style={[styles.header, doctorMode && { backgroundColor: '#E0E0E0', borderColor: '#000' }]}>
          <FontAwesome5 name="lemon" size={32} color="#000" />
          <Text style={[styles.headerTitle, doctorMode && { color: '#000' }]}>เช็กของแสลง</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}
            placeholder="พิมพ์ชื่ออาหารหรือผลไม้... (เช่น ส้มโอ, ของเค็ม)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={checkFood}
          />
          <TouchableOpacity style={[styles.searchBtn, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]} onPress={checkFood}>
            <Feather name="search" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {!result ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, doctorMode && { color: '#000' }]}>
                พิมพ์ชื่ออาหาร ผลไม้ หรือสมุนไพร{"\n"}หลานจะเช็กให้อย่างรวดเร็วออฟไลน์ว่าขัดกับยาในตู้หรือโรคประจำตัวของคุณตาไหมค่ะ!
              </Text>

              {/* Demo help items */}
              <View style={[styles.demoBox, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FontAwesome5 name="lightbulb" size={18} color={doctorMode ? '#000' : '#FBC02D'} />
                  <Text style={styles.demoTitle}>คำชี้แนะค้นหาที่พบบ่อย:</Text>
                </View>
                {[
                  'ส้มโอ',
                  'ของเค็มจัด (มาม่า, ปลาร้า)',
                  'ของหวานจัด (ทุเรียน, น้ำผึ้ง)',
                  'ผักใบเขียว (คะน้า, บรอกโคลี)',
                  'นมสด / แคลเซียม',
                  'ชา / กาแฟ'
                ].map((item) => (
                  <TouchableOpacity 
                    key={item} 
                    style={[styles.demoItemBtn, doctorMode && { borderColor: '#000', backgroundColor: '#ECEFF1' }]}
                    onPress={() => {
                      setInputText(item);
                      // Simulate a small delay for speech guidance
                      handleSpeak(item);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Feather name="arrow-right" size={16} color="#000" />
                      <Text style={styles.demoItemText}>{item}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={[
              styles.resultCard, 
              { 
                backgroundColor: doctorMode 
                  ? '#FFF' 
                  : (result.severity === 'red' ? '#FFCDD2' : result.severity === 'yellow' ? '#FFF9C4' : '#C8E6C9'),
                borderColor: doctorMode 
                  ? '#000' 
                  : (result.severity === 'red' ? '#D32F2F' : result.severity === 'yellow' ? '#F57F17' : '#2E7D32')
              }
            ]}>
              <View style={styles.resultHeader}>
                <FontAwesome5 
                  name={result.severity === 'red' ? 'exclamation-triangle' : result.severity === 'yellow' ? 'exclamation-circle' : 'check-circle'} 
                  size={48} 
                  color={doctorMode ? '#000' : (result.severity === 'red' ? '#D32F2F' : result.severity === 'yellow' ? '#F57F17' : '#2E7D32')} 
                />
              </View>
              <Text style={[
                styles.resultText, 
                { color: '#000' }
              ]}>
                {result.descTh}
              </Text>
              
              <TouchableOpacity style={[styles.backBtn, doctorMode && { backgroundColor: '#37474F', borderColor: '#000' }]} onPress={() => setResult(null)}>
                <Text style={styles.backBtnText}>↩️ เช็กอาหารอย่างอื่นต่อ</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFEB3B',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFDE7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFEB3B',
    padding: 20,
    borderBottomWidth: 4,
    borderColor: '#000',
  },
  headerIcon: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
    boxShadow: '3px 3px 0px #000',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    height: 56,
  },
  searchBtn: {
    backgroundColor: '#FF5252',
    borderWidth: 3,
    borderColor: '#000',
    boxShadow: '3px 3px 0px #000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    padding: 20,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 16,
    boxShadow: '4px 4px 0px #000',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  demoBox: {
    borderTopWidth: 2,
    borderColor: '#F5F5F5',
    paddingTop: 16,
    gap: 8,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  demoItemBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    backgroundColor: '#FFFDE7',
  },
  demoItemText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
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
