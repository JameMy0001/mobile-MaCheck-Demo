import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

import {
  getSafetyTone,
  SeniorColors,
  SeniorRadius,
  seniorShadow,
  SeniorSpacing,
  SeniorTouch,
  SafetySeverity,
} from '@/constants/senior-theme';

type IconFamily = 'feather' | 'fontAwesome5';

interface IconSpec {
  family?: IconFamily;
  name: string;
}

function RenderIcon({
  icon,
  size,
  color,
}: {
  icon: IconSpec;
  size: number;
  color: string;
}) {
  if (icon.family === 'fontAwesome5') {
    return <FontAwesome5 name={icon.name as any} size={size} color={color} />;
  }
  return <Feather name={icon.name as any} size={size} color={color} />;
}

export function SeniorHeader({
  title,
  subtitle,
  right,
  doctorMode,
  fontOffset,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  doctorMode: boolean;
  fontOffset: number;
}) {
  return (
    <View style={[styles.header, doctorMode && styles.doctorBorder]}>
      <View style={styles.headerTextWrap}>
        <Text
          selectable
          style={[styles.headerTitle, { fontSize: 24 + fontOffset }, doctorMode && styles.doctorText]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            selectable
            style={[styles.headerSubtitle, { fontSize: 15 + fontOffset }, doctorMode && styles.doctorSubText]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

export function SeniorButton({
  label,
  icon,
  onPress,
  doctorMode,
  fontOffset,
  variant = 'primary',
  style,
}: {
  label?: string;
  icon?: IconSpec;
  onPress: () => void;
  doctorMode: boolean;
  fontOffset: number;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: ViewStyle;
}) {
  const bg =
    doctorMode
      ? variant === 'ghost'
        ? SeniorColors.doctorSurface
        : '#111111'
      : variant === 'danger'
        ? SeniorColors.danger
        : variant === 'secondary'
          ? SeniorColors.primarySoft
          : variant === 'ghost'
            ? SeniorColors.surface
            : SeniorColors.primary;
  const fg = doctorMode ? (variant === 'ghost' ? '#111111' : '#FFFFFF') : variant === 'secondary' || variant === 'ghost' ? SeniorColors.primaryDark : '#FFFFFF';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[
        styles.seniorButton,
        { backgroundColor: bg, borderColor: doctorMode ? '#111111' : variant === 'ghost' ? SeniorColors.border : bg },
        !label && { paddingHorizontal: 12, minWidth: 48, gap: 0 },
        style,
      ]}
      onPress={onPress}
    >
      {icon ? <RenderIcon icon={icon} size={20} color={fg} /> : null}
      {label ? (
        <Text style={[styles.seniorButtonText, { color: fg, fontSize: 17 + fontOffset }]}>{label}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export function PrimaryActionTile({
  title,
  description,
  actionLabel,
  icon,
  image,
  onPress,
  doctorMode,
  fontOffset,
  severity = 'info',
  compact = false,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  icon?: IconSpec;
  image?: ImageSourcePropType;
  onPress: () => void;
  doctorMode: boolean;
  fontOffset: number;
  severity?: SafetySeverity;
  compact?: boolean;
}) {
  const tone = getSafetyTone(severity, doctorMode);

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      style={[
        styles.actionTile,
        compact && styles.actionTileCompact,
        { backgroundColor: doctorMode ? SeniorColors.doctorSurface : tone.bg, borderColor: tone.border },
      ]}
      onPress={onPress}
    >
      <View style={[styles.actionIconBadge, { backgroundColor: doctorMode ? '#ECEFF1' : tone.soft, borderColor: tone.border }]}>
        {image ? (
          <Image source={image} style={styles.actionImage} />
        ) : icon ? (
          <RenderIcon icon={icon} size={compact ? 24 : 34} color={tone.text} />
        ) : null}
      </View>
      <View style={styles.actionCopy}>
        <Text
          selectable
          style={[styles.actionTitle, { fontSize: (compact ? 18 : 24) + fontOffset }, doctorMode && styles.doctorText]}
        >
          {title}
        </Text>
        {description ? (
          <Text
            selectable
            style={[styles.actionDescription, { fontSize: (compact ? 14 : 16) + fontOffset }, doctorMode && styles.doctorSubText]}
          >
            {description}
          </Text>
        ) : null}
        {actionLabel ? (
          <Text style={[styles.actionLabel, { color: tone.text, fontSize: 14 + fontOffset }, doctorMode && styles.doctorText]}>
            {actionLabel}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function InfoBanner({
  title,
  description,
  icon,
  doctorMode,
  fontOffset,
  severity = 'info',
  children,
}: {
  title: string;
  description?: string;
  icon?: IconSpec;
  doctorMode: boolean;
  fontOffset: number;
  severity?: SafetySeverity;
  children?: React.ReactNode;
}) {
  const tone = getSafetyTone(severity, doctorMode);

  return (
    <View style={[styles.infoBanner, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: tone.soft, borderColor: tone.border }]}>
        {icon ? <RenderIcon icon={icon} size={22} color={tone.text} /> : null}
      </View>
      <View style={styles.infoCopy}>
        <Text selectable style={[styles.infoTitle, { color: tone.text, fontSize: 18 + fontOffset }]}>
          {title}
        </Text>
        {description ? (
          <Text selectable style={[styles.infoDescription, { fontSize: 15 + fontOffset }, doctorMode && styles.doctorSubText]}>
            {description}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}

export function SafetyStatusCard({
  severity,
  title,
  description,
  sections,
  action,
  doctorMode,
  fontOffset,
}: {
  severity: SafetySeverity;
  title: string;
  description?: string;
  sections?: { label: string; value: string }[];
  action?: React.ReactNode;
  doctorMode: boolean;
  fontOffset: number;
}) {
  const tone = getSafetyTone(severity, doctorMode);
  const iconName = severity === 'red' ? 'alert-triangle' : severity === 'yellow' ? 'clock' : severity === 'green' ? 'check-circle' : 'help-circle';

  return (
    <View style={[styles.safetyCard, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={styles.safetyTop}>
        <View style={[styles.safetyIcon, { backgroundColor: tone.soft, borderColor: tone.border }]}>
          <Feather name={iconName as any} size={32} color={tone.text} />
        </View>
        <View style={styles.safetyTitleWrap}>
          <Text selectable style={[styles.safetyTitle, { color: tone.text, fontSize: 25 + fontOffset }]}>
            {title}
          </Text>
          {description ? (
            <Text selectable style={[styles.safetyDescription, { fontSize: 16 + fontOffset }]}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      {sections?.map((section) => (
        <View key={section.label} style={styles.safetySection}>
          <Text selectable style={[styles.safetySectionLabel, { fontSize: 14 + fontOffset }]}>
            {section.label}
          </Text>
          <Text selectable style={[styles.safetySectionValue, { fontSize: 17 + fontOffset }]}>
            {section.value}
          </Text>
        </View>
      ))}
      {action ? <View style={styles.safetyAction}>{action}</View> : null}
    </View>
  );
}

export function LargeTextInput({
  children,
  doctorMode,
}: {
  children: React.ReactNode;
  doctorMode: boolean;
}) {
  return <View style={[styles.largeInputShell, doctorMode && styles.doctorBorder]}>{children}</View>;
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: SeniorColors.surface,
    borderBottomWidth: 1,
    borderColor: SeniorColors.border,
    paddingHorizontal: SeniorSpacing.md,
    paddingVertical: SeniorSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SeniorSpacing.md,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: SeniorColors.text,
    fontWeight: '900',
    lineHeight: 34,
  },
  headerSubtitle: {
    color: SeniorColors.textSecondary,
    fontWeight: '700',
    lineHeight: 23,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SeniorSpacing.sm,
  },
  seniorButton: {
    minHeight: SeniorTouch.min,
    borderRadius: SeniorRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: SeniorSpacing.md,
    paddingVertical: SeniorSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SeniorSpacing.sm,
  },
  seniorButtonText: {
    fontWeight: '900',
    textAlign: 'center',
  },
  actionTile: {
    minHeight: 150,
    borderRadius: SeniorRadius.xl,
    borderWidth: 1.5,
    padding: SeniorSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SeniorSpacing.md,
    boxShadow: seniorShadow,
  },
  actionTileCompact: {
    flex: 1,
    minHeight: 180,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: SeniorSpacing.md,
  },
  actionIconBadge: {
    width: SeniorTouch.large,
    height: SeniorTouch.large,
    borderRadius: SeniorRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionImage: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
  },
  actionCopy: {
    flex: 1,
    gap: SeniorSpacing.xs,
    alignSelf: 'stretch',
  },
  actionTitle: {
    color: SeniorColors.text,
    fontWeight: '900',
    lineHeight: 32,
  },
  actionDescription: {
    color: SeniorColors.textSecondary,
    fontWeight: '700',
    lineHeight: 23,
  },
  actionLabel: {
    fontWeight: '900',
    marginTop: 2,
  },
  infoBanner: {
    borderWidth: 1.5,
    borderRadius: SeniorRadius.lg,
    padding: SeniorSpacing.md,
    flexDirection: 'row',
    gap: SeniorSpacing.md,
  },
  infoIcon: {
    width: SeniorTouch.min,
    height: SeniorTouch.min,
    borderRadius: SeniorRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
    gap: SeniorSpacing.xs,
  },
  infoTitle: {
    fontWeight: '900',
    lineHeight: 25,
  },
  infoDescription: {
    color: SeniorColors.textSecondary,
    fontWeight: '700',
    lineHeight: 23,
  },
  safetyCard: {
    width: '100%',
    borderWidth: 2,
    borderRadius: SeniorRadius.xl,
    padding: SeniorSpacing.md,
    gap: SeniorSpacing.md,
    boxShadow: seniorShadow,
  },
  safetyTop: {
    flexDirection: 'row',
    gap: SeniorSpacing.md,
    alignItems: 'center',
  },
  safetyIcon: {
    width: SeniorTouch.large,
    height: SeniorTouch.large,
    borderRadius: SeniorRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyTitleWrap: {
    flex: 1,
    gap: 4,
  },
  safetyTitle: {
    fontWeight: '900',
    lineHeight: 34,
  },
  safetyDescription: {
    color: SeniorColors.textSecondary,
    fontWeight: '800',
    lineHeight: 24,
  },
  safetySection: {
    backgroundColor: SeniorColors.surface,
    borderWidth: 1,
    borderColor: SeniorColors.border,
    borderRadius: SeniorRadius.md,
    padding: SeniorSpacing.md,
    gap: 4,
  },
  safetySectionLabel: {
    color: SeniorColors.textSecondary,
    fontWeight: '900',
  },
  safetySectionValue: {
    color: SeniorColors.text,
    fontWeight: '700',
    lineHeight: 26,
  },
  safetyAction: {
    gap: SeniorSpacing.sm,
  },
  largeInputShell: {
    minHeight: SeniorTouch.min,
    borderWidth: 1.5,
    borderColor: SeniorColors.borderStrong,
    borderRadius: SeniorRadius.md,
    backgroundColor: SeniorColors.surface,
  },
  doctorBorder: {
    borderColor: SeniorColors.doctorBorder,
  },
  doctorText: {
    color: SeniorColors.doctorText,
  },
  doctorSubText: {
    color: '#333333',
  },
});
