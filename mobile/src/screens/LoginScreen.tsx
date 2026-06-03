import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { colors } from '../theme';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // On success the navigator switches automatically.
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'เข้าสู่ระบบไม่สำเร็จ';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>YourFin Rider</Text>
          <Text style={styles.subtitle}>ระบบติดตามงานขายภาคสนาม</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>อีเมล</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@yourfin.co"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>รหัสผ่าน</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            editable={!loading}
            onSubmitEditing={onSubmit}
            returnKeyType="go"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            title="เข้าสู่ระบบ"
            onPress={onSubmit}
            loading={loading}
            style={styles.button}
          />

          <Text style={styles.hint}>ทดสอบ: somchai@yourfin.co / sales1234</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: colors.textMuted,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  button: {
    marginTop: 20,
  },
  error: {
    color: colors.danger,
    marginTop: 12,
    fontSize: 14,
  },
  hint: {
    marginTop: 16,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
  },
});
