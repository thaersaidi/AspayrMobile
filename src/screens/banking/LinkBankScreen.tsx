import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { Text, useTheme, Surface, Searchbar, ActivityIndicator, Button, Divider } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { decode as base64Decode } from 'base-64';
import { MainStackParamList } from '../../types/navigation';
import { bankingApi } from '../../api';
import { userStorage } from '../../utils/storage';
import { Institution, AuthRequest } from '../../types/banking';
import { User } from '../../types/auth';

type Props = StackScreenProps<MainStackParamList, 'LinkBank'>;

interface AuthStep {
  step: 'select' | 'authorizing' | 'success' | 'error';
  message?: string;
}

// Some banks return the consent token (JWT) in the callback instead of the consent ID
const parseJwtForConsentId = (token: string): string | null => {
  try {
    // Check if it looks like a JWT (has 3 parts separated by dots)
    if (!token.includes('.') || token.split('.').length !== 3) {
      return null;
    }
    
    // Decode the payload (second part)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Pad the base64 string if needed
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    
    const decoded = base64Decode(padded);
    const payload = JSON.parse(decoded);
    console.log('[LinkBank] Decoded JWT payload:', payload);
    
    // The consent ID is stored in the CONSENT field
    return payload.CONSENT || null;
  } catch (error) {
    console.error('[LinkBank] Failed to parse JWT:', error);
    return null;
  }
};;

export const LinkBankScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  
  // State
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authRequests, setAuthRequests] = useState<AuthRequest[]>([]);
  const [authStep, setAuthStep] = useState<AuthStep>({ step: 'select' });
  const [consentId, setConsentId] = useState<string | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);

  // Load user and institutions on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle OAuth callback - check for consent param from deep link
  useEffect(() => {
    const callbackConsent = route.params?.consent;
    if (callbackConsent && userUuid) {
      console.log('[LinkBank] OAuth callback with consent param:', callbackConsent);
      
      // Check if the param is actually a JWT token (some banks return the token instead of ID)
      let finalConsentId = callbackConsent;
      if (callbackConsent.length > 50 && callbackConsent.includes('.')) {
        const extractedId = parseJwtForConsentId(callbackConsent);
        if (extractedId) {
          console.log('[LinkBank] Extracted Consent ID from JWT:', extractedId);
          finalConsentId = extractedId;
        }
      }
      
      // Set the consent ID and check status
      setConsentId(finalConsentId);
      setAuthStep({ step: 'authorizing', message: 'Checking authorization status...' });
      
      // Check the consent status inline
      (async () => {
        try {
          console.log('[LinkBank] Checking status for consent ID:', finalConsentId);
          const response = await bankingApi.getConsentStatus(finalConsentId);
          const consentData = response.data || response;
          
          console.log('[LinkBank] Consent status:', consentData);

          if (consentData.status === 'AUTHORIZED') {
            setAuthStep({
              step: 'success',
              message: 'Bank connected successfully!',
            });
            // Refresh auth requests
            if (userUuid) {
              const authData = await bankingApi.getAuthRequests(userUuid);
              const requests = authData.data || authData || [];
              setAuthRequests(Array.isArray(requests) ? requests : []);
            }
          } else if (consentData.status === 'AWAITING_AUTHORIZATION') {
            setAuthStep({
              step: 'authorizing',
              message: 'Authorization pending. Please complete the process in your browser.',
            });
          } else {
            setAuthStep({
              step: 'error',
              message: `Authorization status: ${consentData.status}`,
            });
          }
        } catch (error: any) {
          console.error('[LinkBank] Status check error:', error);
          setAuthStep({
            step: 'error',
            message: error.message || 'Failed to check authorization status',
          });
        }
      })();
    }
  }, [route.params?.consent, userUuid]);

  // Filter institutions when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredInstitutions(institutions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = institutions.filter(
        (inst) =>
          inst.name?.toLowerCase().includes(query) ||
          inst.fullName?.toLowerCase().includes(query) ||
          inst.id?.toLowerCase().includes(query)
      );
      setFilteredInstitutions(filtered);
    }
  }, [searchQuery, institutions]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Get user
      const user = await userStorage.getUser() as User | null;
      if (user?.userUuid) {
        setUserUuid(user.userUuid);
        
        // Load auth requests and institutions in parallel
        const [institutionsData, authData] = await Promise.all([
          bankingApi.getInstitutions(),
          bankingApi.getAuthRequests(user.userUuid).catch(() => ({ data: [] })),
        ]);
        
        setInstitutions(institutionsData.institutions || []);
        setFilteredInstitutions(institutionsData.institutions || []);
        
        const requests = authData.data || authData || [];
        setAuthRequests(Array.isArray(requests) ? requests : []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load banks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const getInstitutionLogo = (inst: Institution): string | null => {
    const media = inst.media || [];
    const logo = media.find((m: any) => m.type === 'logo' || m.type === 'icon');
    return logo?.source || null;
  };

  const startBankAuth = async (institution: Institution) => {
    if (!userUuid) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    setAuthStep({ step: 'authorizing', message: 'Starting authorization...' });

    try {
      const response = await bankingApi.startAccountAuth({
        institutionId: institution.id,
        userUuid,
        psuId: 'aspayr-mobile-user',
        psuUserAgent: 'Aspayr Mobile App',
      });

      const authData = response.data || response;
      console.log('[LinkBank] Auth response:', JSON.stringify(authData, null, 2));

      // Extract consent ID - could be in authData.id or authData.data.id
      const newConsentId = authData.id || (authData as any).data?.id;
      if (newConsentId) {
        console.log('[LinkBank] Setting consent ID:', newConsentId);
        setConsentId(newConsentId);
      }

      // Handle OAuth redirect
      const authUrl = authData.authorisationUrl || (authData as any).data?.authorisationUrl;
      
      if (authUrl) {
        setAuthStep({ 
          step: 'authorizing', 
          message: 'Opening bank authorization page...' 
        });
        
        // Open the authorization URL in the browser
        console.log('[LinkBank] Opening auth URL:', authUrl);
        
        const canOpen = await Linking.canOpenURL(authUrl);
        if (canOpen) {
          await Linking.openURL(authUrl);
          
          // Show instructions - user needs to manually return since callback goes to web frontend
          setAuthStep({
            step: 'authorizing',
            message: 'Complete the authorization in your browser.\n\nAfter approving access at your bank, you will be redirected to the web app.\n\nReturn here and tap "Check Status" to verify the connection.',
          });
        } else {
          throw new Error('Cannot open authorization URL');
        }
      } else {
        // No redirect needed - might be already authorized
        if (authData.status === 'AUTHORIZED' && authData.consentToken) {
          setAuthStep({
            step: 'success',
            message: 'Bank connected successfully!',
          });
          // Refresh auth requests
          await loadAuthRequests();
        } else {
          throw new Error('No authorization URL received');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthStep({
        step: 'error',
        message: error.message || 'Failed to start bank authorization',
      });
    }
  };

  const loadAuthRequests = async () => {
    if (!userUuid) return;
    
    try {
      const authData = await bankingApi.getAuthRequests(userUuid);
      console.log('[LinkBank] Raw auth requests response:', JSON.stringify(authData, null, 2));
      const requests = authData.data || authData || [];
      console.log('[LinkBank] Parsed auth requests:', requests.map((r: any) => ({ id: r.id, status: r.status, institutionId: r.institutionId })));
      setAuthRequests(Array.isArray(requests) ? requests : []);
    } catch (error) {
      console.error('[LinkBank] Error loading auth requests:', error);
    }
  };

  const checkConsentStatus = async () => {
    if (!consentId) {
      Alert.alert('Error', 'No consent ID found');
      return;
    }

    setAuthStep({ step: 'authorizing', message: 'Checking authorization status...' });

    try {
      const response = await bankingApi.getConsentStatus(consentId);
      const consentData = response.data || response;
      
      console.log('Consent status:', consentData);

      if (consentData.status === 'AUTHORIZED') {
        setAuthStep({
          step: 'success',
          message: 'Bank connected successfully!',
        });
        // Refresh auth requests
        await loadAuthRequests();
      } else if (consentData.status === 'AWAITING_AUTHORIZATION') {
        setAuthStep({
          step: 'authorizing',
          message: 'Authorization pending. Please complete the process in your browser.',
        });
      } else {
        setAuthStep({
          step: 'error',
          message: `Authorization status: ${consentData.status}`,
        });
      }
    } catch (error: any) {
      console.error('Status check error:', error);
      setAuthStep({
        step: 'error',
        message: error.message || 'Failed to check authorization status',
      });
    }
  };

  const deleteAuthRequest = async (requestId: string) => {
    console.log('[LinkBank] Delete consent requested for ID:', requestId);

    const performDelete = async () => {
      try {
        console.log('[LinkBank] Deleting consent:', requestId);
        await bankingApi.deleteConsent(requestId);
        console.log('[LinkBank] Consent deleted successfully');

        // Update local state immediately
        setAuthRequests(prev => prev.filter(r => r.id !== requestId));

        Alert.alert('Success', 'Bank connection removed');
      } catch (error: any) {
        console.error('[LinkBank] Delete consent error:', error);
        console.error('[LinkBank] Error details:', error.response?.data || error.message);
        Alert.alert(
          'Error',
          error.response?.data?.error || error.message || 'Failed to remove connection'
        );
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm('Remove Bank Connection?')
        : true;
      if (confirmed) {
        performDelete();
      }
      return;
    }

    Alert.alert(
      'Remove Bank Connection',
      'Are you sure you want to remove this bank connection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  };

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // @ts-ignore - Navigation type issue
      navigation.navigate('Home');
    }
  };

  const resetAuthFlow = () => {
    setConsentId(null);
    setAuthStep({ step: 'select' });
  };

  // Get authorized banks count
  const authorizedCount = authRequests.filter((r) => r.status === 'AUTHORIZED').length;

  const renderInstitutionItem = ({ item }: { item: Institution }) => {
    const logoUrl = getInstitutionLogo(item);
    const supportsEmbedded = item.features?.includes('INITIATE_EMBEDDED_ACCOUNT_REQUEST');
    const countryCode = item.countries?.[0]?.countryCode2 || (item as any).country || '';

    return (
      <TouchableOpacity
        style={styles.institutionItem}
        onPress={() => startBankAuth(item)}
        activeOpacity={0.7}
      >
        <View style={styles.institutionLogo}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoInitials}>
                {(item.name || item.fullName || '??').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.institutionInfo}>
          <Text style={styles.institutionName} numberOfLines={1}>
            {item.name || item.fullName}
          </Text>
          <Text style={styles.institutionMeta}>
            {countryCode}
            {supportsEmbedded ? ' • Embedded supported' : ''}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>
    );
  };

  const renderAuthRequestItem = ({ item }: { item: AuthRequest }) => {
    const institution = institutions.find((i) => i.id === item.institutionId);
    const logoUrl = institution ? getInstitutionLogo(institution) : null;
    const isAuthorized = item.status === 'AUTHORIZED';
    const expirationDate = item.reconfirmBy ? new Date(item.reconfirmBy).toLocaleDateString() : null;

    return (
      <View style={styles.authRequestItem}>
        <View style={styles.institutionLogo}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoInitials}>
                {(item.institutionId || '??').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.authRequestInfo}>
          <Text style={styles.institutionName} numberOfLines={1}>
            {institution?.name || item.institutionId}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={isAuthorized ? styles.statusBadgeAuthorized : styles.statusBadgePending}
            >
              <Text
                style={isAuthorized ? styles.statusTextAuthorized : styles.statusTextPending}
              >
                {item.status}
              </Text>
            </View>
          </View>
          {isAuthorized && expirationDate && (
            <Text style={styles.expirationText}>Expires: {expirationDate}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteAuthRequest(item.id)}
        >
          <Icon name="trash-can-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  // Render auth step content
  const renderAuthStepContent = () => {
    if (authStep.step === 'select') {
      return null;
    }

    return (
      <Surface style={styles.authStepCard} elevation={2}>
        {authStep.step === 'authorizing' && (
          <>
            <View style={styles.authStepHeader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.authStepTitle}>Authorizing</Text>
            </View>
            <Text style={styles.authStepMessage}>{authStep.message}</Text>
            {consentId && (
              <View style={styles.authActions}>
                <Button
                  mode="contained"
                  onPress={checkConsentStatus}
                  style={styles.actionButton}
                >
                  Check Status
                </Button>
                <Button
                  mode="outlined"
                  onPress={resetAuthFlow}
                  style={styles.actionButton}
                >
                  Cancel
                </Button>
              </View>
            )}
          </>
        )}

        {authStep.step === 'success' && (
          <>
            <View style={styles.authStepHeader}>
              <Icon name="check-circle" size={32} color={theme.colors.primary} />
              <Text style={styles.authStepTitleSuccess}>Success!</Text>
            </View>
            <Text style={styles.authStepMessage}>{authStep.message}</Text>
            <View style={styles.authActions}>
              <Button
                mode="contained"
                onPress={handleClose}
                style={styles.actionButton}
              >
                View Accounts
              </Button>
              <Button
                mode="outlined"
                onPress={resetAuthFlow}
                style={styles.actionButton}
              >
                Link Another Bank
              </Button>
            </View>
          </>
        )}

        {authStep.step === 'error' && (
          <>
            <View style={styles.authStepHeader}>
              <Icon name="alert-circle" size={32} color={theme.colors.error} />
              <Text style={styles.authStepTitleError}>Error</Text>
            </View>
            <Text style={styles.authStepMessage}>{authStep.message}</Text>
            <View style={styles.authActions}>
              <Button
                mode="contained"
                onPress={resetAuthFlow}
                style={styles.actionButton}
              >
                Try Again
              </Button>
            </View>
          </>
        )}
      </Surface>
    );
  };

  if (loading && institutions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading banks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Icon name="close" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Link Bank Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Existing Connections */}
        {authRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connected Banks ({authorizedCount})</Text>
            <Surface style={styles.listCard} elevation={1}>
              {authRequests.map((item, index) => (
                <React.Fragment key={item.id}>
                  {renderAuthRequestItem({ item })}
                  {index < authRequests.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Surface>
          </View>
        )}

        {/* Auth Step Card */}
        {renderAuthStepContent()}

        {/* Bank Selection */}
        {authStep.step === 'select' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Link a New Bank</Text>
            
            {/* Search */}
            <Searchbar
              placeholder="Search banks..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
              iconColor={theme.colors.onSurfaceVariant}
            />

            {/* Bank List */}
            <Surface style={styles.listCard} elevation={1}>
              {filteredInstitutions.length > 0 ? (
                <FlatList
                  data={filteredInstitutions}
                  keyExtractor={(item) => item.id}
                  renderItem={renderInstitutionItem}
                  ItemSeparatorComponent={Divider}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="bank-off" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No banks found matching your search' : 'No banks available'}
                  </Text>
                </View>
              )}
            </Surface>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>How it works</Text>
          <View style={styles.helpStep}>
            <View style={styles.helpStepNumber}>
              <Text style={styles.helpStepNumberText}>1</Text>
            </View>
            <Text style={styles.helpStepText}>Select your bank from the list above</Text>
          </View>
          <View style={styles.helpStep}>
            <View style={styles.helpStepNumber}>
              <Text style={styles.helpStepNumberText}>2</Text>
            </View>
            <Text style={styles.helpStepText}>
              Securely authorize access through your bank's website
            </Text>
          </View>
          <View style={styles.helpStep}>
            <View style={styles.helpStepNumber}>
              <Text style={styles.helpStepNumberText}>3</Text>
            </View>
            <Text style={styles.helpStepText}>
              Return here to view your accounts and transactions
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  searchBar: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 0,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  searchInput: {
    fontSize: 15,
    color: theme.colors.onSurface,
  },
  listCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  institutionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  institutionLogo: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  institutionInfo: {
    flex: 1,
  },
  institutionName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  institutionMeta: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  },
  authRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  authRequestInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeAuthorized: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  statusBadgePending: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceVariant,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextAuthorized: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  statusTextPending: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  expirationText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authStepCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  authStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  authStepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  authStepTitleSuccess: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  authStepTitleError: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.error,
  },
  authStepMessage: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  authActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  helpSection: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpStepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  helpStepText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
});
