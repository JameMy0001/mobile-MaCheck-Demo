import { Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice from '@react-native-voice/voice';
import { useMicrophonePermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { useNavigation } from 'expo-router';
import { addActivityLog } from '../api';
import { useSound } from '@/hooks/use-sound';
import { useFontSize } from '@/hooks/use-font-size';
import { useDoctorMode } from '@/hooks/use-doctor-mode';
import { useAppStore } from '../store/useAppStore';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

const QUICK_VOICE_COMMANDS = [
  'สวัสดีจ้าหลานรัก สบายดีไหม',
  'ในตู้ยามียาอะไรบ้างจ๊ะ',
  'วันนี้คุณตาดื่มน้ำไปกี่แก้วแล้ว',
  'ปวดหัว ทานยาแก้ปวดไอบูโพรเฟนได้ไหม',
  'โรคประจำตัวของฉันมีอะไรบ้าง'
];

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'สวัสดีค่ะคุณตา วันนี้มีอะไรให้หลานช่วยดูให้ไหมคะ?', sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Microphone / Voice Modal States
  const [micModalVisible, setMicModalVisible] = useState(false);
  const [waveHeights, setWaveHeights] = useState([20, 40, 15, 30, 50, 25, 45, 20]);
  
  const profile = useAppStore((state) => state.profile);
  const cabinet = useAppStore((state) => state.cabinet);
  
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const { isSoundMuted, handleSpeak, toggleSound } = useSound();
  const { fontOffset } = useFontSize();
  const { doctorMode } = useDoctorMode();

  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const navigation = useNavigation();

  useEffect(() => {
    loadProfileAndCabinet();

    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileAndCabinet();
    });
    // return listiner inside cleanups
    // Wait, since we are returning voice cleanup below, let's keep the return clean.
    
    // Set up voice listeners
    Voice.onSpeechStart = () => {
      setIsListening(true);
      setVoiceError(null);
    };
    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };
    Voice.onSpeechError = (e: any) => {
      console.log('[Voice Error]', e);
      setIsListening(false);
      
      let msg = 'เกิดข้อผิดพลาดในการดักฟังเสียง';
      const code = e.error?.code || e.code || (e.error && String(e.error));
      const message = e.error?.message || e.message;
      
      if (message?.toLowerCase().includes('permission') || code === '209' || code === '1700') {
        msg = 'กรุณาเปิดสิทธิ์เข้าถึงไมโครโฟนและการแปลงเสียง (Settings -> Privacy -> Microphone & Speech Recognition) เพื่อเริ่มคุยค่ะ';
      } else if (code === '203') {
        msg = 'ไม่ได้ยินเสียงพูด หรือพูดเบาเกินไปจ้า กรุณาลองพูดใหม่อีกครั้งนะคะ';
      } else if (message) {
        msg = `${msg}: ${message}`;
      } else {
        msg = `${msg} (รหัสข้อผิดพลาด: ${code || 'unknown'})`;
      }
      setVoiceError(msg);
    };
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value[0]) {
        setRecognizedText(e.value[0]);
        setVoiceError(null);
      }
    };
    Voice.onSpeechPartialResults = (e) => {
      if (e.value && e.value[0]) {
        setRecognizedText(e.value[0]);
        setVoiceError(null);
      }
    };
    Voice.onSpeechVolumeChanged = (e) => {
      if (e.value) {
        const volume = e.value;
        setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * Math.min(volume * 8, 45)) + 10));
      }
    };

    return () => {
      unsubscribe();
      Voice.destroy().then(() => {
        Voice.removeAllListeners();
      }).catch(err => console.error('[Voice Cleanup Error]', err));
    };
  }, [navigation]);

  useEffect(() => {
    if (micModalVisible) {
      startRecognizing();
    } else {
      stopRecognizing();
    }
  }, [micModalVisible]);

  const startRecognizing = async () => {
    try {
      setRecognizedText('');
      setVoiceError(null);
      
      // Request mic permission first if not granted
      if (!micPermission || !micPermission.granted) {
        const res = await requestMicPermission();
        if (!res.granted) {
          setVoiceError('คุณตายังไม่ได้อนุญาตให้หลานเข้าถึงไมโครโฟนค่ะ กรุณากดอนุญาตสิทธิ์เพื่อคุยนะคะ');
          return;
        }
      }

      await Voice.start('th-TH');
    } catch (e: any) {
      console.error('[Voice Start Error]', e);
      setVoiceError('ไม่สามารถเปิดใช้งานไมโครโฟนได้: ' + (e.message || String(e)));
    }
  };

  const stopRecognizing = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error('[Voice Stop Error]', e);
    }
  };

  const loadProfileAndCabinet = async () => {};

  const sendTextMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMessages: Message[] = [...messages, { id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`, text, sender: 'user' }];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // 1. ดึงข้อมูลบริบทจากเครื่อง
      const patientName = profile?.name || 'คุณตา';
      const cabinetList = cabinet.length > 0 
        ? cabinet.map(m => m.name).join(', ') 
        : 'ไม่มีเลยค่ะ';
      
      const diseaseMap: { [key: string]: string } = {
        hypertension: 'ความดันสูง',
        diabetes: 'เบาหวาน',
        heart: 'โรคหัวใจ',
        lipid: 'ไขมันสูง',
        kidney: 'โรคไต',
        stomach: 'โรคกระเพาะ',
        liver: 'โรคตับ'
      };
      const diseases = profile?.diseases && profile.diseases.length > 0
        ? profile.diseases.map((d: string) => diseaseMap[d] || d).join(', ')
        : 'ไม่มีโรคประจำตัวร้ายแรง';

      // 2. เรียกใช้ระบบหลังบ้าน (Node.js API) หากออนไลน์ หรือออฟไลน์ใช้ Local NLP Rule Engine
      const { checkBackendOnline, getBackendUrl } = require('../api');
      let online = await checkBackendOnline();
      let reply = '';

      if (online) {
        try {
          const url = await getBackendUrl();
          const phone = profile?.phone || 'unknown';
          const res = await fetch(`${url}/chatbot/${phone}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              context: {
                patientName,
                diseases,
                cabinetList
              }
            })
          });
          if (res.ok) {
            const data = await res.json();
            reply = data.reply;
          } else {
            throw new Error('API failed');
          }
        } catch (apiErr) {
          console.error('[Backend AI error, falling back to local NLP]', apiErr);
          online = false; // Fallback to offline rule engine
        }
      }

      if (!online) {
        const query = text.toLowerCase();
        if (query.includes('ตู้ยา') || query.includes('มียาอะไร') || query.includes('รายชื่อยา')) {
          reply = `ในตู้ยาของคุณตามียาอยู่ ${cabinet.length} ตัว ได้แก่: ${cabinetList} ค่ะ อย่าลืมทานให้ตรงเวลานะคะ`;
        } else if (query.includes('น้ำ') || query.includes('ดื่มน้ำ') || query.includes('จิบน้ำ')) {
          const storedChallenge = await AsyncStorage.getItem('@active_challenge');
          if (storedChallenge) {
            const ch = JSON.parse(storedChallenge);
            reply = `วันนี้คุณตาบันทึกจิบน้ำสะสมในชาเลนจ์ไปแล้ว ${ch.waterCups || 0} แก้วค่ะ พยายามดื่มน้ำบ่อยๆ นะคะ`;
          } else {
            reply = `ตอนนี้ยังไม่มีภารกิจทานยา แต่คุณตาก็ควรจิบน้ำเรื่อยๆ วันละ 6-8 แก้ว เพื่อสุขภาพที่ดีของไตนะคะ`;
          }
        } else if (query.includes('โรค') || query.includes('โรคประจำตัว')) {
          reply = `คุณตามีโรคประจำตัวที่แจ้งหลานไว้คือ: ${diseases} ค่ะ ต้องระมัดระวังของแสลงโรคและควบคุมอาหารเค็ม อาหารหวานเสมอนะคะ`;
        } else if (query.includes('สวัสดี') || query.includes('ดีจ้า') || query.includes('จ๊ะเอ๋')) {
          reply = `จ๊ะเอ๋คุณตา ${patientName} ขา! วันนี้สบายดีไหมคะ? ชวนหนูคุยหรือถามเรื่องยาในตู้ยาได้เลยนะคะ หลานพร้อมตอบค่ะ`;
        } else if (query.includes('เหงา') || query.includes('คิดถึง') || query.includes('รัก')) {
          reply = `หลานก็รักและคิดถึงคุณตาที่สุดเลยค่ะ! วันนี้อยู่บ้านยิ้มกว้างๆ ดื่มน้ำเยอะๆ น้า เดี๋ยวหลานทำงานเสร็จจะรีบโทรหาคุณตาเลยค่ะ`;
        } else if (query.includes('ยาแก้ปวด') || query.includes('ไอบู') || query.includes('ibuprofen')) {
          reply = `คุณตาคะ! ยาแก้ปวดไอบูโพรเฟนอันตรายมาก ห้ามทานคู่กับยาละลายลิ่มเลือดนะคะ และต้องทานหลังอาหารทันทีเพราะมันกัดกระเพาะอย่างรุนแรงค่ะ`;
        } else {
          reply = `คุณตาจ๋า หลานได้ยินแล้วค่ะ แต่หัวข้อนี้หลานอาจจะยังไม่ค่อยเข้าใจ ลองถามหลานเรื่อง "ยาในตู้ยา" หรือถามเรื่อง "โรคประจำตัว" ดูดีไหมคะ?`;
        }
      }

      setMessages([...newMessages, { id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`, text: reply, sender: 'ai' }]);
      handleSpeak(reply);
      await addActivityLog(`คุณตาคุยกับบอท: "${text}"`);
      
    } catch (e) {
      console.error(e);
      const errMsg = 'หลานระบบขัดข้องนิดหน่อยค่ะ รบกวนคุณตาถามใหม่อีกครั้งนะคะ';
      setMessages([...newMessages, { id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`, text: errMsg, sender: 'ai' }]);
      handleSpeak(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceCommandSelect = (cmd: string) => {
    setMicModalVisible(false);
    sendTextMessage(cmd);
  };

  return (
    <SafeAreaView style={[styles.safeArea, doctorMode && { backgroundColor: '#37474F' }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, doctorMode && { backgroundColor: '#E0E0E0' }]}>
        
        <View style={[styles.header, doctorMode && { backgroundColor: '#E0E0E0', borderColor: '#000' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={styles.avatarContainer}>
              <Image 
                source={require('../../assets/images/icons/icon_nurse_girl.png')} 
                style={{ width: 38, height: 38, resizeMode: 'contain' }} 
              />
            </View>
            <Text style={[styles.headerTitle, { fontSize: 24 + fontOffset }, doctorMode && { color: '#000' }]}>คุยกับหลานรัก AI</Text>
          </View>
          <TouchableOpacity 
            style={{ 
              backgroundColor: '#FFF', 
              borderWidth: 3, 
              borderColor: '#000', 
              borderRadius: 12, 
              width: 44, 
              height: 44, 
              justifyContent: 'center', 
              alignItems: 'center', 
              boxShadow: '2px 2px 0px #000' 
            }} 
            onPress={() => toggleSound()}
          >
            <Feather name={isSoundMuted ? "volume-x" : "volume-2"} size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.chatList}>
          {messages.map((msg, index) => (
            <View 
              key={`${msg.id}_${index}`} 
              style={[
                styles.messageBubble, 
                msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                doctorMode && msg.sender === 'user' && { backgroundColor: '#37474F', borderColor: '#000' },
                doctorMode && msg.sender === 'ai' && { backgroundColor: '#FFF', borderColor: '#000' }
              ]}
            >
              <Text style={[
                styles.messageText, 
                { fontSize: 18 + fontOffset }, 
                msg.sender === 'user' ? styles.userText : styles.aiText,
                doctorMode && msg.sender === 'user' && { color: '#FFF' },
                doctorMode && msg.sender === 'ai' && { color: '#000' }
              ]}>
                {msg.text}
              </Text>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.messageBubble, styles.aiBubble, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }, { width: 80, alignItems: 'center' }]}>
              <ActivityIndicator size="small" color="#000" />
            </View>
          )}
        </ScrollView>

        {/* Input area with MIC button */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={[styles.micBtn, doctorMode && { backgroundColor: '#37474F', borderColor: '#000' }]} onPress={() => setMicModalVisible(true)}>
            <FontAwesome5 name="microphone" size={22} color="#FFF" />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { fontSize: 18 + fontOffset }, doctorMode && { backgroundColor: '#FFF', borderColor: '#000' }]}
            placeholder="พิมพ์ถามหลานได้เลยค่ะ..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendTextMessage(inputText)}
          />
          <TouchableOpacity style={[styles.sendBtn, doctorMode && { backgroundColor: '#37474F', borderColor: '#000' }]} onPress={() => sendTextMessage(inputText)} disabled={isLoading}>
            <Feather name="send" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* Voice Recognition Modal Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={micModalVisible}
        onRequestClose={() => setMicModalVisible(false)}
      >
        <View style={styles.micModalBg}>
          <View style={styles.micModalContent}>
            
            {/* Visualizer Wave */}
            <View style={styles.micHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                <Feather name="mic" size={24} color="#E65100" />
                <Text style={[styles.micTitle, { fontSize: 20 + fontOffset }]}>หลานกำลังฟังคุณตาพูด...</Text>
              </View>
              <Text style={[styles.micSubtitle, { fontSize: 14 + fontOffset }]}>กรุณาพูด หรือแตะที่ประโยคด่วนเพื่อพูดจ้า</Text>
            </View>

            {/* Sound Wave Bars */}
            <View style={styles.waveContainer}>
              {waveHeights.map((h, i) => (
                <View key={`wave_${i}`} style={[styles.waveBar, { height: h }]} />
              ))}
            </View>

            {/* Spoken Text Preview or Error Details */}
            {voiceError ? (
              <View style={{ backgroundColor: '#FFEBEE', borderWidth: 3, borderColor: '#000', borderRadius: 16, padding: 14, width: '100%', alignItems: 'center', boxShadow: '3px 3px 0px #000', marginVertical: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Feather name="alert-triangle" size={16} color="#C62828" />
                  <Text style={{ fontSize: 14 + fontOffset, fontWeight: '900', color: '#C62828' }}>พบปัญหาไมโครโฟน:</Text>
                </View>
                <Text style={{ fontSize: 16 + fontOffset, fontWeight: '900', color: '#000', textAlign: 'center', lineHeight: 22 }}>{voiceError}</Text>
                <TouchableOpacity 
                  style={{ backgroundColor: '#FF5722', borderWidth: 2.5, borderColor: '#000', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, marginTop: 10, boxShadow: '2px 2px 0px #000' }}
                  onPress={startRecognizing}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="refresh-cw" size={14} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 14 + fontOffset, fontWeight: '900' }}>แตะเพื่อเปิดไมค์พูดใหม่</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : recognizedText ? (
              <View style={{ backgroundColor: '#E3F2FD', borderWidth: 3, borderColor: '#000', borderRadius: 16, padding: 14, width: '100%', alignItems: 'center', boxShadow: '3px 3px 0px #000', marginVertical: 8 }}>
                <Text style={{ fontSize: 14 + fontOffset, fontWeight: '900', color: '#0d47a1', marginBottom: 6 }}>คุณตาพูดว่า:</Text>
                <Text style={{ fontSize: 18 + fontOffset, fontWeight: '900', color: '#000', textAlign: 'center', lineHeight: 24 }}>"{recognizedText}"</Text>
                <TouchableOpacity 
                  style={{ backgroundColor: '#4CAF50', borderWidth: 2.5, borderColor: '#000', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, marginTop: 10, flexDirection: 'row', gap: 6, alignItems: 'center', boxShadow: '2px 2px 0px #000' }}
                  onPress={() => {
                    setMicModalVisible(false);
                    sendTextMessage(recognizedText);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="send" size={16} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 16 + fontOffset, fontWeight: '900' }}>ส่งข้อความนี้คุยกับหลาน</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ fontSize: 14 + fontOffset, fontWeight: '800', color: '#E65100', fontStyle: 'italic', marginVertical: 8 }}>
                {isListening ? "กำลังดักฟังเสียงพูดของคุณตา..." : "กรุณาเริ่มพูดคุยได้เลยค่ะ..."}
              </Text>
            )}

            {/* Shortcut triggers list */}
            <ScrollView style={styles.shortcutScroll}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <FontAwesome5 name="lightbulb" size={16} color="#E65100" />
                <Text style={[styles.shortcutTitle, { fontSize: 15 + fontOffset }]}>แตะเลือกเพื่อพูดทันที:</Text>
              </View>
              {QUICK_VOICE_COMMANDS.map((cmd, idx) => (
                <TouchableOpacity 
                  key={`${cmd}_${idx}`} 
                  style={styles.shortcutBtn}
                  onPress={() => handleVoiceCommandSelect(cmd)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name="message-square" size={16} color="#E65100" />
                    <Text style={[styles.shortcutText, { fontSize: 16 + fontOffset }]}>"{cmd}"</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeMicBtn} onPress={() => setMicModalVisible(false)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="x-circle" size={18} color="#000" />
                <Text style={[styles.closeMicBtnText, { fontSize: 16 + fontOffset }]}>ปิดไมโครโฟน</Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FF9800' },
  container: { flex: 1, backgroundColor: '#FFF3E0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FF9800',
    padding: 20,
    borderBottomWidth: 4,
    borderColor: '#000',
  },
  avatarContainer: {
    backgroundColor: '#FFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 },
  chatList: { padding: 16, gap: 16, paddingBottom: 40 },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#000',
    boxShadow: '4px 4px 0px #000',
  },
  userBubble: { backgroundColor: '#2196F3', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 18, fontWeight: '700', lineHeight: 26 },
  userText: { color: '#FFF' },
  aiText: { color: '#000' },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFB74D',
    borderTopWidth: 4,
    borderColor: '#000',
    alignItems: 'center',
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
  micBtn: {
    backgroundColor: '#FF5722',
    borderWidth: 3,
    borderColor: '#000',
    boxShadow: '3px 3px 0px #000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
  },
  sendBtn: {
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#000',
    boxShadow: '3px 3px 0px #000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
  },

  // Mic Modal styles
  micModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  micModalContent: {
    backgroundColor: '#FFF8E1',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 5,
    borderColor: '#000',
    padding: 20,
    maxHeight: '80%',
    alignItems: 'center',
    gap: 16,
  },
  micHeader: {
    alignItems: 'center',
    gap: 6,
  },
  micTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D84315',
  },
  micSubtitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#555',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 6,
    marginVertical: 10,
  },
  waveBar: {
    width: 6,
    backgroundColor: '#FF5722',
    borderRadius: 3,
  },
  shortcutScroll: {
    width: '100%',
    maxHeight: 250,
  },
  shortcutTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginBottom: 10,
  },
  shortcutBtn: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    boxShadow: '2px 2px 0px #000',
  },
  shortcutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  closeMicBtn: {
    backgroundColor: '#E53935',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '3px 3px 0px #000',
    marginTop: 10,
  },
  closeMicBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
});
