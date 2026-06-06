import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { SummaryCard } from '../components/SummaryCard';
import { WithdrawalBadge } from '../components/WithdrawalBadge';
import * as api from '../api/client';
import { ApiError } from '../api/client';
import type { CommissionEntry, Wallet, Withdrawal } from '../types';
import {
  colors,
  commissionTypeLabel,
  formatBaht,
  formatDateTime,
} from '../theme';

/** True when the rider has a saved receiving bank account. */
function hasBankAccount(settings: Wallet['settings']): boolean {
  return Boolean(settings.bankName && settings.bankAccountNumber);
}

/** "ธนาคาร •••1234" — masks all but the last 4 digits of the account number. */
function maskedAccount(settings: Wallet['settings']): string {
  const number = settings.bankAccountNumber ?? '';
  const last4 = number.replace(/\D/g, '').slice(-4) || number.slice(-4);
  return `${settings.bankName ?? ''} •••${last4}`.trim();
}

export function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [bankFormVisible, setBankFormVisible] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [w, ws] = await Promise.all([
        api.getWallet(),
        api.getMyWithdrawals(),
      ]);
      setWallet(w);
      setWithdrawals(ws);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'โหลดข้อมูลไม่สำเร็จ';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  const handleSubmitted = useCallback(() => {
    setFormVisible(false);
    Alert.alert('ส่งคำขอแล้ว', 'ระบบบันทึกคำขอถอนเงินของคุณเรียบร้อยแล้ว');
    load('refresh');
  }, [load]);

  const handleBankSaved = useCallback(() => {
    setBankFormVisible(false);
    Alert.alert('บันทึกบัญชีแล้ว', 'บันทึกบัญชีรับเงินของคุณเรียบร้อยแล้ว');
    load('refresh');
  }, [load]);

  // Pressing "ขอถอนเงิน": guide to set a bank account first if none is saved.
  const handleWithdrawPress = useCallback(() => {
    if (wallet && !hasBankAccount(wallet.settings)) {
      Alert.alert(
        'ยังไม่ได้ตั้งบัญชีรับเงิน',
        'กรุณาตั้งบัญชีรับเงินก่อน จึงจะขอถอนเงินได้',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'ตั้งบัญชีรับเงิน', onPress: () => setBankFormVisible(true) },
        ],
      );
      return;
    }
    setFormVisible(true);
  }, [wallet]);

  // Defensive: backend says the account is missing (stale local state).
  const handleNeedBankAccount = useCallback(() => {
    setFormVisible(false);
    Alert.alert(
      'ยังไม่ได้ตั้งบัญชีรับเงิน',
      'กรุณาตั้งบัญชีรับเงินก่อน จึงจะขอถอนเงินได้',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ตั้งบัญชีรับเงิน', onPress: () => setBankFormVisible(true) },
      ],
    );
    load('refresh');
  }, [load]);

  const balance = wallet?.balance;
  const bankSet = wallet ? hasBankAccount(wallet.settings) : false;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.title}>กระเป๋าเงิน</Text>

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color={colors.primary}
          />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <PrimaryButton title="ลองใหม่" onPress={() => load('initial')} />
          </View>
        ) : wallet && balance ? (
          <>
            {/* Available balance hero card */}
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>ยอดถอนได้</Text>
              <Text style={styles.heroValue}>{formatBaht(balance.available)}</Text>
              <PrimaryButton
                title="ขอถอนเงิน"
                onPress={handleWithdrawPress}
                color={colors.white}
                style={styles.heroButton}
                textColor={colors.primary}
                disabled={balance.available <= 0}
              />
            </View>

            {/* Receiving bank account (single account) */}
            <BankAccountCard
              settings={wallet.settings}
              onEdit={() => setBankFormVisible(true)}
            />

            {/* Secondary balance stats */}
            <View style={styles.cards}>
              <SummaryCard
                label="รายได้สะสม"
                value={formatBaht(balance.totalEarned)}
              />
              <SummaryCard
                label="กำลังดำเนินการ/รออนุมัติ"
                value={formatBaht(balance.pending)}
                accent={colors.pending}
              />
              <SummaryCard
                label="จ่ายแล้ว"
                value={formatBaht(balance.totalPaid)}
                accent={colors.success}
              />
            </View>

            {/* Commission breakdown */}
            <View style={styles.panel}>
              <BreakdownRow
                label="คอมจากการปิดดีล"
                value={formatBaht(wallet.earnedFromDeals)}
              />
              <BreakdownRow
                label="ค่าแนะนำ/Affiliate"
                value={formatBaht(wallet.earnedFromReferral)}
              />
              <BreakdownRow
                label="จำนวนลูกทีมที่แนะนำ"
                value={`${wallet.directReferrals} คน`}
              />
              <BreakdownRow
                label="คอมต่อดีล"
                value={formatBaht(wallet.settings.commissionPerDeal)}
                last
              />
            </View>

            {/* Withdrawal history */}
            <Text style={styles.sectionTitle}>ประวัติการถอน</Text>
            {withdrawals.length > 0 ? (
              withdrawals.map((w) => <WithdrawalRow key={w.id} withdrawal={w} />)
            ) : (
              <Text style={styles.empty}>ยังไม่มีรายการถอนเงิน</Text>
            )}

            {/* Commission ledger */}
            <Text style={styles.sectionTitle}>บัญชีรายการคอม</Text>
            {wallet.recentEntries.length > 0 ? (
              wallet.recentEntries.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))
            ) : (
              <Text style={styles.empty}>ยังไม่มีรายการคอมมิชชั่น</Text>
            )}
          </>
        ) : null}
      </ScrollView>

      {wallet ? (
        <>
          <WithdrawalForm
            visible={formVisible}
            available={wallet.balance.available}
            settings={wallet.settings}
            onClose={() => setFormVisible(false)}
            onSubmitted={handleSubmitted}
            onNeedBankAccount={handleNeedBankAccount}
          />
          <BankAccountForm
            visible={bankFormVisible}
            settings={wallet.settings}
            isNew={!bankSet}
            onClose={() => setBankFormVisible(false)}
            onSaved={handleBankSaved}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
}

function BankAccountCard({
  settings,
  onEdit,
}: {
  settings: Wallet['settings'];
  onEdit: () => void;
}) {
  const isSet = hasBankAccount(settings);

  if (!isSet) {
    return (
      <View style={[styles.bankCard, styles.bankCardEmpty]}>
        <Text style={styles.bankTitle}>บัญชีรับเงิน</Text>
        <Text style={styles.bankPrompt}>ยังไม่ได้ตั้งบัญชีรับเงิน</Text>
        <Text style={styles.bankPromptHint}>
          ตั้งบัญชีรับเงินเพื่อใช้รับเงินถอนของคุณ
        </Text>
        <PrimaryButton
          title="ตั้งบัญชีรับเงิน"
          onPress={onEdit}
          style={styles.bankButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.bankCard}>
      <View style={styles.bankHeader}>
        <Text style={styles.bankTitle}>บัญชีรับเงิน</Text>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={styles.bankEditLink}>แก้ไขบัญชี</Text>
        </Pressable>
      </View>
      <BankInfoRow label="ธนาคาร" value={settings.bankName ?? '-'} />
      <BankInfoRow label="เลขบัญชี" value={settings.bankAccountNumber ?? '-'} />
      <BankInfoRow
        label="ชื่อบัญชี"
        value={settings.bankAccountName ?? '-'}
        last
      />
    </View>
  );
}

function BankInfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.breakdownRow, last ? styles.breakdownRowLast : null]}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>{value}</Text>
    </View>
  );
}

function BreakdownRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.breakdownRow, last ? styles.breakdownRowLast : null]}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>{value}</Text>
    </View>
  );
}

function WithdrawalRow({ withdrawal }: { withdrawal: Withdrawal }) {
  const openSlip = () => {
    if (withdrawal.slipUrl) Linking.openURL(withdrawal.slipUrl);
  };
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowAmount}>{formatBaht(withdrawal.amount)}</Text>
        <Text style={styles.rowDate}>{formatDateTime(withdrawal.requestedAt)}</Text>
        {withdrawal.status === 'PAID' && withdrawal.slipUrl ? (
          <Pressable onPress={openSlip} style={styles.slipRow}>
            <Image
              source={{ uri: withdrawal.slipUrl }}
              style={styles.slipThumb}
            />
            <Text style={styles.slipLink}>ดูสลิป</Text>
          </Pressable>
        ) : null}
      </View>
      <WithdrawalBadge status={withdrawal.status} />
    </View>
  );
}

function LedgerRow({ entry }: { entry: CommissionEntry }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.ledgerType}>
          {commissionTypeLabel(entry.type, entry.level)}
        </Text>
        <Text style={styles.rowDate}>{formatDateTime(entry.createdAt)}</Text>
      </View>
      <Text style={styles.ledgerAmount}>+{formatBaht(entry.amount)}</Text>
    </View>
  );
}

function WithdrawalForm({
  visible,
  available,
  settings,
  onClose,
  onSubmitted,
  onNeedBankAccount,
}: {
  visible: boolean;
  available: number;
  settings: Wallet['settings'];
  onClose: () => void;
  onSubmitted: () => void;
  onNeedBankAccount: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset the form whenever it is (re)opened.
  useEffect(() => {
    if (visible) {
      setAmount('');
      setNote('');
    }
  }, [visible]);

  const onSubmit = async () => {
    const value = Number(amount.replace(/,/g, ''));
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      Alert.alert('จำนวนเงินไม่ถูกต้อง', 'กรุณาระบุจำนวนเงินที่ต้องการถอน');
      return;
    }
    if (value > available) {
      Alert.alert(
        'ยอดคงเหลือไม่พอ',
        `ถอนได้สูงสุด ${formatBaht(available)}`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.requestWithdrawal({
        amount: value,
        note: note.trim() || undefined,
      });
      onSubmitted();
    } catch (e) {
      // Defensive: backend rejects if no bank account is set on the profile.
      if (
        e instanceof ApiError &&
        (e.details as { needBankAccount?: boolean } | undefined)?.needBankAccount
      ) {
        onNeedBankAccount();
        return;
      }
      const msg = e instanceof ApiError ? e.message : 'ขอถอนเงินไม่สำเร็จ';
      Alert.alert('ผิดพลาด', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>ขอถอนเงิน</Text>

            {/* Receiving account is locked to the saved profile account */}
            <View style={styles.lockedBank}>
              <Text style={styles.lockedBankLabel}>โอนเข้า</Text>
              <Text style={styles.lockedBankValue}>{maskedAccount(settings)}</Text>
              <Text style={styles.lockedBankName}>
                {settings.bankAccountName ?? ''}
              </Text>
            </View>

            <Text style={styles.label}>จำนวนเงิน (บาท) *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              editable={!submitting}
            />
            <Text style={styles.hint}>ยอดถอนได้ {formatBaht(available)}</Text>

            <Text style={styles.label}>หมายเหตุ</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={note}
              onChangeText={setNote}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />

            <PrimaryButton
              title="ยืนยันขอถอนเงิน"
              onPress={onSubmit}
              loading={submitting}
              style={styles.modalSubmit}
            />
            <Pressable
              onPress={onClose}
              disabled={submitting}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>ยกเลิก</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BankAccountForm({
  visible,
  settings,
  isNew,
  onClose,
  onSaved,
}: {
  visible: boolean;
  settings: Wallet['settings'];
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Prefill from the saved account whenever the form is (re)opened.
  useEffect(() => {
    if (visible) {
      setBankName(settings.bankName ?? '');
      setBankAccountNumber(settings.bankAccountNumber ?? '');
      setBankAccountName(settings.bankAccountName ?? '');
    }
  }, [visible, settings]);

  const onSubmit = async () => {
    const name = bankName.trim();
    const number = bankAccountNumber.trim();
    const accountName = bankAccountName.trim();
    if (!name || !number || !accountName) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอก ธนาคาร เลขบัญชี และชื่อบัญชี ให้ครบ');
      return;
    }

    setSubmitting(true);
    try {
      await api.updateBankAccount({
        bankName: name,
        bankAccountNumber: number,
        bankAccountName: accountName,
      });
      onSaved();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'บันทึกบัญชีไม่สำเร็จ';
      Alert.alert('ผิดพลาด', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>
              {isNew ? 'ตั้งบัญชีรับเงิน' : 'แก้ไขบัญชีรับเงิน'}
            </Text>
            <Text style={styles.modalSubtitle}>
              คุณมีบัญชีรับเงินได้เพียง 1 บัญชี
              การบันทึกจะแทนที่บัญชีเดิมทั้งหมด
            </Text>

            <Text style={styles.label}>ธนาคาร *</Text>
            <TextInput
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
              placeholder="เช่น กสิกรไทย"
              placeholderTextColor={colors.textMuted}
              editable={!submitting}
            />

            <Text style={styles.label}>เลขบัญชี *</Text>
            <TextInput
              style={styles.input}
              value={bankAccountNumber}
              onChangeText={setBankAccountNumber}
              placeholder="เลขที่บัญชี"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              editable={!submitting}
            />

            <Text style={styles.label}>ชื่อบัญชี *</Text>
            <TextInput
              style={styles.input}
              value={bankAccountName}
              onChangeText={setBankAccountName}
              placeholder="ชื่อเจ้าของบัญชี"
              placeholderTextColor={colors.textMuted}
              editable={!submitting}
            />

            <PrimaryButton
              title="บันทึกบัญชี"
              onPress={onSubmit}
              loading={submitting}
              style={styles.modalSubmit}
            />
            <Pressable
              onPress={onClose}
              disabled={submitting}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>ยกเลิก</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  loader: { marginTop: 40 },
  errorBox: { marginTop: 24, gap: 12 },
  errorText: { color: colors.danger, fontSize: 15 },

  hero: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  heroLabel: { color: '#e0e7ff', fontSize: 14, fontWeight: '600' },
  heroValue: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '800',
    marginTop: 6,
  },
  heroButton: { marginTop: 16 },

  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Receiving bank account card
  bankCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bankCardEmpty: {
    padding: 16,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  bankEditLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  bankPrompt: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  bankPromptHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  bankButton: { marginTop: 16 },

  panel: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  breakdownRowLast: { borderBottomWidth: 0 },
  breakdownLabel: { fontSize: 15, color: colors.textMuted },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  empty: {
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  rowMain: { flex: 1 },
  rowAmount: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowDate: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  slipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  slipThumb: {
    width: 32,
    height: 44,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  slipLink: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  ledgerType: { fontSize: 15, fontWeight: '600', color: colors.text },
  ledgerAmount: { fontSize: 16, fontWeight: '700', color: colors.success },

  // Withdrawal / bank form modal
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 8,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  modalContent: { padding: 20, paddingBottom: 32 },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  lockedBank: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  lockedBankLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  lockedBankValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  lockedBankName: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
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
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalSubmit: { marginTop: 28 },
  cancelButton: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  cancelText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
});
