export type SafetySeverity = 'red' | 'yellow' | 'green' | 'unknown' | 'info';

export const SeniorColors = {
  background: '#F7FBF8',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF7F1',
  surfaceWarm: '#FFF8EA',
  border: '#D5E3DA',
  borderStrong: '#8AA596',
  text: '#14322A',
  textSecondary: '#49635A',
  primary: '#1F7A5C',
  primaryDark: '#0F513D',
  primarySoft: '#DDF2E8',
  danger: '#B42318',
  dangerSoft: '#FDE8E5',
  warning: '#A15C07',
  warningSoft: '#FFF3D6',
  success: '#1F7A3F',
  successSoft: '#E5F5EA',
  info: '#1D5F83',
  infoSoft: '#E4F2F8',
  doctorBg: '#F2F3F4',
  doctorSurface: '#FFFFFF',
  doctorText: '#111111',
  doctorBorder: '#111111',
};

export const SeniorRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const SeniorSpacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const SeniorTouch = {
  min: 56,
  large: 72,
};

export const seniorShadow = '0px 8px 22px rgba(31, 122, 92, 0.10)';

export function getSafetyTone(severity: SafetySeverity, doctorMode = false) {
  if (doctorMode) {
    return {
      bg: SeniorColors.doctorSurface,
      border: SeniorColors.doctorBorder,
      text: SeniorColors.doctorText,
      soft: '#ECEFF1',
    };
  }

  if (severity === 'red') {
    return {
      bg: SeniorColors.dangerSoft,
      border: SeniorColors.danger,
      text: SeniorColors.danger,
      soft: '#FFF6F4',
    };
  }

  if (severity === 'yellow') {
    return {
      bg: SeniorColors.warningSoft,
      border: SeniorColors.warning,
      text: SeniorColors.warning,
      soft: '#FFF9E8',
    };
  }

  if (severity === 'green') {
    return {
      bg: SeniorColors.successSoft,
      border: SeniorColors.success,
      text: SeniorColors.success,
      soft: '#F2FAF4',
    };
  }

  return {
    bg: SeniorColors.infoSoft,
    border: SeniorColors.info,
    text: SeniorColors.info,
    soft: '#F4FAFD',
  };
}
