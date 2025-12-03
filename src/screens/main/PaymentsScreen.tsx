import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { TextInput, Button, Card, useTheme, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
type Props = NativeStackScreenProps<MainStackParamList, 'Payments'>;

// Mock institutions data
const mockInstitutions = [
  { id: 'modelo-sandbox', name: 'Modelo Sandbox (GB)', features: ['DOMESTIC_SINGLE_PAYMENT'] },
  { id: 'deutsche-bank', name: 'Deutsche Bank (EU)', features: ['INITIATE_DOMESTIC'] },
  { id: 'test-bank', name: 'Test Bank', features: [] },
];

export const PaymentsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const institutions = mockInstitutions;
  const institutionsLoading = false;

  // Payment form state
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('10.00');
  const [paymentCurrency, setPaymentCurrency] = useState('EUR');
  const [paymentReference, setPaymentReference] = useState('Test payment from Aspayr');
  const [payeeName, setPayeeName] = useState('');
  const [payeeIban, setPayeeIban] = useState('');

  // Payment flow state
  const [loading, setLoading] = useState(false);
  const [paymentAuthResponse, setPaymentAuthResponse] = useState<any>(null);
  const [paymentConsentId, setPaymentConsentId] = useState('');
  const [paymentConsentStatus, setPaymentConsentStatus] = useState('');
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const selectedInst = institutions.find(i => i.id === selectedInstitutionId);
  const supportsPIS = selectedInst?.features?.some(f =>
    f.includes('DOMESTIC_SINGLE_PAYMENT') || f.includes('INITIATE_DOMESTIC')
  );

  const startPaymentAuth = async () => {
    if (!selectedInstitutionId || !paymentAmount || !payeeName || !payeeIban) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Mock API call - simulate payment initiation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockResponse = {
        consentId: `consent-${Date.now()}`,
        authorisationUrl: 'https://bank.example.com/authorize',
        status: 'PENDING',
      };

      setPaymentAuthResponse(mockResponse);
      setPaymentConsentId(mockResponse.consentId);
      setPaymentConsentStatus('PENDING');

      Alert.alert(
        'Payment Initiated',
        'In a production app, you would be redirected to your bank to authorize this payment.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentConsentStatus = async () => {
    if (!paymentConsentId) return;

    setLoading(true);
    try {
      // Mock API call - simulate status check
      await new Promise(resolve => setTimeout(resolve, 500));
      setPaymentConsentStatus('AUTHORIZED');
      Alert.alert('Success', 'Payment has been authorized!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check payment status');
    } finally {
      setLoading(false);
    }
  };

  const executePayment = async () => {
    if (!paymentConsentId) return;

    setLoading(true);
    try {
      // Mock API call - simulate payment execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResult = {
        paymentId: `payment-${Date.now()}`,
        status: 'COMPLETED',
        amount: parseFloat(paymentAmount),
        currency: paymentCurrency,
        reference: paymentReference,
      };
      setPaymentResult(mockResult);
      Alert.alert('Success', 'Payment executed successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to execute payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AUTHORIZED':
        return '#10B981';
      case 'PENDING':
        return '#F59E0B';
      case 'REJECTED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'IBAN copied to clipboard');
  };

  if (institutionsLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading banks...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Step 1: Initiate Payment */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, { backgroundColor: theme.colors.primary + '40' }]}>
              <Text style={[styles.stepBadgeText, { color: theme.colors.primary }]}>1</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Initiate Payment
            </Text>
          </View>

          {/* Bank Selection */}
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Bank for payment
          </Text>
          <View style={styles.pickerContainer}>
            {institutions.map((inst) => {
              const hasPIS = inst.features?.some(f =>
                f.includes('DOMESTIC_SINGLE_PAYMENT') || f.includes('INITIATE_DOMESTIC')
              );
              return (
                <TouchableOpacity
                  key={inst.id}
                  style={[
                    styles.bankOption,
                    { borderColor: theme.colors.outline },
                    selectedInstitutionId === inst.id && {
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.primary + '20',
                    },
                  ]}
                  onPress={() => setSelectedInstitutionId(inst.id)}
                >
                  <Text style={[styles.bankName, { color: theme.colors.onSurface }]}>
                    {inst.name}
                  </Text>
                  {hasPIS && (
                    <Chip mode="flat" compact textStyle={{ fontSize: 10 }}>
                      PIS
                    </Chip>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedInstitutionId && !supportsPIS && (
            <Text style={styles.warningText}>
              ⚠️ This institution may not support payments
            </Text>
          )}

          {/* Amount and Currency */}
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                Amount
              </Text>
              <TextInput
                mode="outlined"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="decimal-pad"
                placeholder="10.00"
                style={styles.input}
              />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                Currency
              </Text>
              <View style={styles.currencyRow}>
                {['EUR', 'GBP', 'USD'].map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={[
                      styles.currencyButton,
                      { borderColor: theme.colors.outline },
                      paymentCurrency === curr && {
                        borderColor: theme.colors.primary,
                        backgroundColor: theme.colors.primary + '20',
                      },
                    ]}
                    onPress={() => setPaymentCurrency(curr)}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        { color: theme.colors.onSurface },
                        paymentCurrency === curr && { color: theme.colors.primary },
                      ]}
                    >
                      {curr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Payment Reference */}
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Payment Reference
          </Text>
          <TextInput
            mode="outlined"
            value={paymentReference}
            onChangeText={setPaymentReference}
            placeholder="Test payment from Aspayr"
            style={styles.input}
          />

          {/* Payee Details */}
          <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          <Text style={[styles.subsectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            Payee (Recipient)
          </Text>

          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Name</Text>
          <TextInput
            mode="outlined"
            value={payeeName}
            onChangeText={setPayeeName}
            placeholder="John Doe"
            style={styles.input}
          />

          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>IBAN</Text>
          <TextInput
            mode="outlined"
            value={payeeIban}
            onChangeText={setPayeeIban}
            placeholder="GB29NWBK60161331926819"
            style={[styles.input, styles.monoFont]}
          />

          <Button
            mode="contained"
            onPress={startPaymentAuth}
            disabled={
              !selectedInstitutionId ||
              !paymentAmount ||
              !payeeName ||
              !payeeIban ||
              loading
            }
            loading={loading}
            style={styles.primaryButton}
          >
            Start Payment Authorization
          </Button>
        </Card.Content>
      </Card>

      {/* Step 2: Authorize Payment */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, { backgroundColor: theme.colors.primary + '40' }]}>
              <Text style={[styles.stepBadgeText, { color: theme.colors.primary }]}>2</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Authorize Payment
            </Text>
          </View>

          {paymentAuthResponse ? (
            <View>
              {paymentConsentId && (
                <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View style={styles.statusRow}>
                    <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Payment Consent ID
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(paymentConsentStatus) + '40' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(paymentConsentStatus) },
                        ]}
                      >
                        {paymentConsentStatus || 'PENDING'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.consentId, { color: theme.colors.onSurface }]}>
                    {paymentConsentId}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={checkPaymentConsentStatus}
                    disabled={loading}
                    loading={loading}
                    style={styles.checkButton}
                  >
                    Check Payment Status
                  </Button>
                </View>
              )}

              <View style={[styles.codeBlock, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.codeText, { color: theme.colors.onSurface }]}>
                  {JSON.stringify(paymentAuthResponse, null, 2)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>↓</Text>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                Fill in payment details and click "Start Payment Authorization"
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Step 3: Execute Payment */}
      {paymentConsentStatus === 'AUTHORIZED' && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: '#10B98140' }]}>
                <Text style={[styles.stepBadgeText, { color: '#10B981' }]}>3</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Execute Payment
              </Text>
            </View>

            <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
              Payment authorized! Now execute the payment to complete the transaction.
            </Text>

            <Button
              mode="contained"
              onPress={executePayment}
              disabled={loading}
              loading={loading}
              style={[styles.primaryButton, { backgroundColor: '#10B981' }]}
            >
              Execute Payment
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Payment Result */}
      {paymentResult && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Payment Result
            </Text>
            <View style={[styles.codeBlock, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.codeText, { color: theme.colors.onSurface }]}>
                {JSON.stringify(paymentResult, null, 2)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Test Data Guide */}
      <Card style={[styles.card, styles.testDataCard]}>
        <Card.Content>
          <Text style={styles.testDataTitle}>ℹ Test Payment Details</Text>
          <Text style={styles.testDataSubtitle}>
            Use these details to test payments in the sandbox environment:
          </Text>

          <View style={styles.testDataBox}>
            <Text style={styles.testDataRegion}>GB · UK (GBP)</Text>
            <Text style={styles.testDataBank}>Modelo Sandbox</Text>
            <View style={styles.ibanRow}>
              <Text style={styles.ibanText}>GB29NWBK60161331926819</Text>
              <TouchableOpacity onPress={() => copyToClipboard('GB29NWBK60161331926819')}>
                <Text style={styles.copyButton}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.testDataBox}>
            <Text style={styles.testDataRegion}>EU · Europe (EUR)</Text>
            <Text style={styles.testDataBank}>Deutsche Bank</Text>
            <View style={styles.ibanRow}>
              <Text style={styles.ibanText}>DE12345678901234567890</Text>
              <TouchableOpacity onPress={() => copyToClipboard('DE12345678901234567890')}>
                <Text style={styles.copyButton}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    marginBottom: 8,
  },
  monoFont: {
    fontFamily: 'monospace',
  },
  pickerContainer: {
    marginBottom: 8,
  },
  bankOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  bankName: {
    fontSize: 14,
    flex: 1,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  currencyButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 16,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  consentId: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  checkButton: {
    marginTop: 4,
  },
  codeBlock: {
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  codeText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    marginBottom: 12,
  },
  testDataCard: {
    borderColor: '#3B82F640',
    backgroundColor: '#3B82F610',
  },
  testDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  testDataSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  testDataBox: {
    backgroundColor: '#1F293720',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  testDataRegion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  testDataBank: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  ibanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ibanText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#F3F4F6',
    backgroundColor: '#00000040',
    padding: 6,
    borderRadius: 4,
  },
  copyButton: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '600',
  },
});
