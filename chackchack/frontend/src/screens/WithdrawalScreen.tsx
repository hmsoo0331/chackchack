import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '../theme';

export default function WithdrawalScreen() {
  const handleOpenWithdrawalPage = async () => {
    try {
      await WebBrowser.openBrowserAsync(
        'https://chackchack.co.kr/withdrawal.html',
        {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          controlsColor: colors.primary,
        }
      );
    } catch (error) {
      Alert.alert('오류', '회원탈퇴 페이지를 열 수 없습니다.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>회원 탈퇴 안내</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>탈퇴 전 확인사항</Text>
          <Text style={styles.text}>
            • 탈퇴 시 모든 QR코드 정보가 영구적으로 삭제됩니다.{'\n'}
            • 삭제된 데이터는 복구할 수 없습니다.{'\n'}
            • 탈퇴 후 동일한 계정으로 재가입이 가능합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>탈퇴 방법</Text>
          <Text style={styles.text}>
            아래 버튼을 클릭하여 웹페이지에서 탈퇴 절차를 진행해주세요.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleOpenWithdrawalPage}
        >
          <Text style={styles.buttonText}>회원탈퇴 페이지로 이동</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    ...typography.styles.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.styles.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.styles.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  button: {
    backgroundColor: colors.error,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonText: {
    ...typography.styles.buttonPrimary,
    color: colors.white,
  },
});