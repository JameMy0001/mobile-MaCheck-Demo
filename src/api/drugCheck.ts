import { localDrugInteractions } from '../assets/db/interactions';
import { getAllMeds } from './storage';

const redBlockMessage = (drugName: string, context?: string) => {
  const contextLine = context ? `\n${context}` : '';
  return {
    descTh: `ห้ามใช้หรือห้ามทานร่วมกันเด็ดขาดค่ะ${contextLine}\n\nคำแนะนำ: หยุดก่อน อย่าทดลองทานเอง และติดต่อแพทย์ เภสัชกร หรือลูกหลานเพื่อยืนยันความปลอดภัยค่ะ`,
    speechTh: `ห้ามทาน ${drugName} ค่ะ หยุดก่อนและให้แพทย์ เภสัชกร หรือลูกหลานช่วยตรวจสอบก่อนนะคะ`
  };
};

const redactRedResult = (
  severity: string,
  drugName: string,
  descTh: string,
  speechTh: string,
  context?: string
) => {
  if (severity !== 'red') {
    return { descTh, speechTh };
  }
  return redBlockMessage(drugName, context);
};

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
      const red = redBlockMessage(newDrugName, `ตรวจพบประวัติแพ้ยารุนแรงของผู้ใช้`);
      return {
        severity: 'red',
        descTh: red.descTh,
        speechTh: red.speechTh
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
          const resultText = redactRedResult(
            pair.severity,
            newDrugName,
            `พบความเสี่ยงตีกับยาในตู้: "${cabinetMed.name}"\n\n${pair.descTh}`,
            pair.speechTh,
            `พบคู่ยาที่ระบบจัดเป็นกลุ่มห้ามทานร่วมกัน`
          );
          return {
            severity: pair.severity,
            descTh: resultText.descTh,
            speechTh: resultText.speechTh
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
        const resultText = redactRedResult(
          severity,
          newDrugName,
          `ยา "${newDrugName}" อาจตีกับยา "${cabinetMed.name}" ในตู้ยาของคุณตา\n\nคำแนะนำ: ${drugInfo.descTh || 'ควรปรึกษาแพทย์'}`,
          `คุณตาคะ ยาตัวนี้อาจจะตีกับ ${cabinetMed.name} ที่กินอยู่นะคะ ต้องระวังค่ะ`,
          `พบคู่ยาที่ระบบจัดเป็นกลุ่มห้ามทานร่วมกัน`
        );
        return {
          severity: severity,
          descTh: resultText.descTh,
          speechTh: resultText.speechTh
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
        const severity = cabMedInfo.severity || 'red';
        const resultText = redactRedResult(
          severity,
          newDrugName,
          `ยาใหม่ "${newDrugName}" ตีกับยา "${cabinetMed.name}" ในตู้ยาของคุณตา\n\nคำแนะนำ: ${cabMedInfo.descTh}`,
          `อันตรายค่ะคุณตา ยานี้ตีกับยา ${cabinetMed.name} ในตู้นะคะ`,
          `พบคู่ยาที่ระบบจัดเป็นกลุ่มห้ามทานร่วมกัน`
        );
        return {
          severity,
          descTh: resultText.descTh,
          speechTh: resultText.speechTh
        };
      }
    }
  }

  // 2. ตรวจสอบเงื่อนไขข้อห้ามเรื่องโรคประจำตัว (Diseases Conflict)
  if (drugInfo.conditions?.diseases) {
    for (const conditionDisease of drugInfo.conditions.diseases) {
      if (diseases.includes(conditionDisease)) {
        const red = redBlockMessage(newDrugName, `พบข้อห้ามใช้กับโรคประจำตัวของผู้ใช้`);
        return {
          severity: 'red',
          descTh: red.descTh,
          speechTh: red.speechTh
        };
      }
    }
  }

  // 3. หากปลอดภัย
  const finalSeverity = drugInfo.severity || 'green';
  const finalText = redactRedResult(
    finalSeverity,
    newDrugName,
    drugInfo.descTh || 'ปลอดภัย ทานได้ ไม่มีประวัติขัดกับโรคหรือยาในตู้ยาปัจจุบันค่ะ',
    drugInfo.speechTh || `ปลอดภัยค่ะคุณตา ทานร่วมกันได้ไม่มีอะไรตีกันนะคะ`,
    `ระบบจัดรายการนี้เป็นกลุ่มห้ามใช้โดยไม่ควรทดลองเอง`
  );

  return {
    severity: finalSeverity,
    descTh: finalText.descTh,
    speechTh: finalText.speechTh
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
