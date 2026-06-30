import { localDrugInteractions } from '../assets/db/interactions';
import { getAllMeds } from './storage';

export const checkInteraction = async (
  newDrugName: string, 
  currentCabinet: any[], 
  diseases: string[] = [],
  allergies: any[] = []
) => {
  const query = newDrugName.trim().toLowerCase();
  if (!query) return null;

  // 0. ตรวจสอบการแพ้ยา (Allergy Blocker check)
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
  for (const allergy of allergies) {
    const keywords = ALLERGY_DRUG_KEYWORDS[allergy.medId];
    if (keywords && keywords.some(kw => query.includes(kw.toLowerCase()) || kw.toLowerCase().includes(query))) {
      matchedAllergy = allergy;
      break;
    }
  }

  if (matchedAllergy) {
    if (matchedAllergy.severity === 'severe') {
      return {
        severity: 'red',
        descTh: `🚨 ตรวจพบประวัติแพ้ยาอย่างรุนแรง (Severe)!\nคุณตามีประวัติแพ้ยา "${newDrugName}" อย่างรุนแรง ห้ามทานยานี้เด็ดขาดค่ะ!`,
        speechTh: `ห้ามรับประทานยานี้เด็ดขาดเนื่องจากตรวจพบประวัติแพ้ยารุนแรงค่ะ`
      };
    } else {
      return {
        severity: 'yellow',
        descTh: `⚠️ แจ้งเตือนประวัติแพ้ยาปานกลาง (Moderate)!\nคุณตามีประวัติแพ้ยา "${newDrugName}" ในระดับปานกลาง ควรระมัดระวังและใช้เฉพาะแพทย์สั่งเท่านั้นค่ะ`,
        speechTh: `โปรดระมัดระวังเนื่องจากเป็นยากลุ่มที่มีประวัติแพ้ปานกลางค่ะ`
      };
    }
  }

  const allMeds = await getAllMeds();

  // ค้นหายาตัวนี้ในฐานข้อมูล (เช็กจาก keywords)
  const drugInfo = allMeds.find(item => 
    item.keywords.some((kw: string) => query.includes(kw.toLowerCase()) || kw.toLowerCase().includes(query))
  );

  if (!drugInfo) {
    return {
      severity: 'unknown',
      descTh: `ไม่พบข้อมูลยา "${newDrugName}" ในฐานข้อมูลเครื่อง กรุณาเพิ่มข้อมูลยาใหม่เข้าสู่ระบบค่ะ`,
      speechTh: `หลานไม่พบข้อมูลยา ${newDrugName} ในระบบค่ะคุณตา รบกวนคุณตาหรือลูกหลานเพิ่มข้อมูลยาเข้าระบบก่อนนะคะ`
    };
  }

  // 1. ตรวจสอบยาตีกันในระดับคู่ยาอันตราย (Drug-to-Drug Interaction)
  for (const cabinetMed of currentCabinet) {
    const cabMedName = cabinetMed.name.toLowerCase();

    // 1.1 เช็กจากตารางคู่ยาตีกันหลัก (localDrugInteractions)
    for (const pair of localDrugInteractions) {
      const isNewDrug1 = pair.drug1.some((k: string) => query.includes(k.toLowerCase()) || k.toLowerCase().includes(query));
      const isNewDrug2 = pair.drug2.some((k: string) => query.includes(k.toLowerCase()) || k.toLowerCase().includes(query));

      if (isNewDrug1 || isNewDrug2) {
        const otherDrugKeywords = isNewDrug1 ? pair.drug2 : pair.drug1;
        const matchesCabinet = otherDrugKeywords.some((k: string) => 
          cabMedName.includes(k.toLowerCase()) || k.toLowerCase().includes(cabMedName)
        );

        if (matchesCabinet) {
          return {
            severity: pair.severity,
            descTh: `พบความเสี่ยงตีกับยาในตู้: "${cabinetMed.name}"\n\n${pair.descTh}`,
            speechTh: pair.speechTh
          };
        }
      }
    }

    // 1.2 เช็กจากคุณสมบัติ clashWith ของตัวยา (รวมถึงยาลูกค้าระบุเองด้วย)
    if (drugInfo.clashWith && drugInfo.clashWith.length > 0) {
      const matchesClash = drugInfo.clashWith.some((kw: string) => 
        cabMedName.includes(kw.toLowerCase()) || kw.toLowerCase().includes(cabMedName)
      );

      if (matchesClash) {
        const severity = drugInfo.severity || 'red';
        return {
          severity: severity,
          descTh: `ยา "${newDrugName}" อาจตีกับยา "${cabinetMed.name}" ในตู้ยาของคุณตา\n\nคำแนะนำ: ${drugInfo.descTh || 'ควรปรึกษาแพทย์'}`,
          speechTh: `คุณตาคะ ยาตัวนี้อาจจะตีกับ ${cabinetMed.name} ที่กินอยู่นะคะ ต้องระวังค่ะ`
        };
      }
    }

    // 1.3 เช็กสวนกลับ
    const cabMedInfo = allMeds.find(item => 
      item.keywords.some((kw: string) => cabMedName.includes(kw.toLowerCase()))
    );
    if (cabMedInfo && cabMedInfo.clashWith) {
      const matchesClash = cabMedInfo.clashWith.some((kw: string) => 
        query.includes(kw.toLowerCase()) || kw.toLowerCase().includes(query)
      );
      if (matchesClash) {
        return {
          severity: cabMedInfo.severity || 'red',
          descTh: `ยาใหม่ "${newDrugName}" ตีกับยา "${cabinetMed.name}" ในตู้ยาของคุณตา\n\nคำแนะนำ: ${cabMedInfo.descTh}`,
          speechTh: `อันตรายค่ะคุณตา ยานี้ตีกับยา ${cabinetMed.name} ในตู้นะคะ`
        };
      }
    }
  }

  // 2. ตรวจสอบเงื่อนไขข้อห้ามเรื่องโรคประจำตัว (Diseases Conflict)
  if (drugInfo.conditions?.diseases) {
    for (const conditionDisease of drugInfo.conditions.diseases) {
      if (diseases.includes(conditionDisease)) {
        const diseaseThNames: { [key: string]: string } = {
          hypertension: 'โรคความดันโลหิตสูง',
          diabetes: 'โรคเบาหวาน',
          heart: 'โรคหัวใจ',
          lipid: 'โรคไขมันในเลือดสูง',
          kidney: 'โรคไต',
          stomach: 'โรคกระเพาะอาหาร/แผลในกระเพาะ',
          liver: 'โรคตับ'
        };

        return {
          severity: 'red',
          descTh: `ห้ามใช้ในผู้ป่วยโรค: ${diseaseThNames[conditionDisease] || conditionDisease}!\n\n${drugInfo.descTh}`,
          speechTh: drugInfo.speechTh || `ยานี้ขัดกับโรค ${diseaseThNames[conditionDisease]} ของคุณตานะคะ`
        };
      }
    }
  }

  // 3. หากปลอดภัย
  return {
    severity: drugInfo.severity || 'green',
    descTh: drugInfo.descTh || 'ปลอดภัย ทานได้ ไม่มีประวัติขัดกับโรคหรือยาในตู้ยาปัจจุบันค่ะ',
    speechTh: drugInfo.speechTh || `ปลอดภัยค่ะคุณตา ทานร่วมกันได้ไม่มีอะไรตีกันนะคะ`
  };
};

export const mockExtractMedicineNameFromImage = (photoUri: string): string => {
  const uriLower = photoUri.toLowerCase();
  if (uriLower.includes('amlodipine')) return 'amlodipine';
  if (uriLower.includes('metformin')) return 'metformin';
  if (uriLower.includes('aspirin')) return 'aspirin';
  if (uriLower.includes('ibuprofen')) return 'ibuprofen';
  if (uriLower.includes('simvastatin')) return 'simvastatin';
  if (uriLower.includes('warfarin')) return 'warfarin';
  if (uriLower.includes('enalapril')) return 'enalapril';
  
  return 'Unknown';
};
