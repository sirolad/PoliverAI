import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import CrossPlatformModal from './CrossPlatformModal';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (amountUsd: number) => Promise<void>;
};

export default function EnterCreditsModal({ open, onClose, onConfirm }: Props) {
  const [amount, setAmount] = React.useState('1.00');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0 || isProcessing) {
      setError('Enter a valid dollar amount greater than 0.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    try {
      await onConfirm(parsed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CrossPlatformModal open={open} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconBubble}>
                <Text style={styles.iconBubbleText}>$</Text>
              </View>
              <Text style={styles.title}>Buy Credits</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          <Text style={styles.description}>Enter the dollar amount you want to purchase in credits.</Text>
          <Text style={styles.meta}>$1.00 = 10 credits</Text>

          <View style={styles.row}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="1.00"
              style={styles.input}
            />
            <Pressable onPress={handleConfirm} style={styles.confirmButton}>
              {isProcessing ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.confirmButtonText}>Buy -&gt;</Text>}
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={styles.secondaryConfirmButton}>
              <Text style={styles.secondaryConfirmText}>Proceed to Checkout</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </CrossPlatformModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.45)',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleText: {
    color: '#1d4ed8',
    fontSize: 16,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },
  meta: {
    marginTop: 8,
    fontSize: 13,
    color: '#94a3b8',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  confirmButton: {
    minWidth: 92,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: '#dc2626',
  },
  actionsRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
  cancelButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryConfirmButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
  },
  secondaryConfirmText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '800',
  },
});
