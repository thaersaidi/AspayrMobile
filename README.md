# Aspayr Mobile - React Native Application

A mobile banking and financial management application built with React Native, featuring AI-powered insights and seamless bank integration via Yapily API.

## Overview

Aspayr Mobile is the React Native version of the Aspayr web application, providing users with:

- **Multi-Bank Integration**: Link accounts from 200+ financial institutions
- **AI-Powered Insights**: Intelligent financial advice and analysis
- **Transaction Management**: Track and categorize spending
- **Visual Dashboards**: Charts and graphs for financial data
- **Payment Initiation**: Make domestic payments (SEPA/IBAN)
- **Financial Profiling**: Personalized onboarding and recommendations
- **Secure Authentication**: PIN, biometric, and Microsoft SSO

## Tech Stack

- **Framework**: React Native 0.82.1
- **Language**: TypeScript 5.8.3
- **Navigation**: React Navigation 7.x
- **UI Library**: React Native Paper 5.x
- **State Management**: React Hooks + React Query
- **Charts**: React Native Chart Kit
- **Authentication**: react-native-msal, react-native-biometrics
- **Storage**: AsyncStorage, react-native-keychain
- **HTTP Client**: Axios

## Prerequisites

- Node.js >= 20
- npm or yarn
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS)

## Installation

### 1. Clone the Repository

```bash
cd aspayr-react-native/AspayrMobile
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Expo (for Web and iPhone testing)

```bash
npm install -g expo-cli
npx expo install react-native-web react-dom @expo/webpack-config
```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
API_BASE_URL=https://your-api-url.com
MSAL_CLIENT_ID=your-microsoft-client-id
MSAL_AUTHORITY=https://login.microsoftonline.com/common
```

## Running the Application

### 🌐 Web (Recommended - Works on Windows!)

**Fastest way to develop and test:**

```bash
npx expo start --web
```

The app will open in your browser at `http://localhost:19006`

**Features:**
- ✅ Works on Windows, Mac, Linux
- ✅ Fast hot reload
- ✅ Chrome DevTools for debugging
- ✅ No device/emulator needed

### 📱 iPhone (via Expo Go)

**Test on your actual iPhone from Windows:**

1. Install **Expo Go** app from the App Store on your iPhone
2. Run the development server:
   ```bash
   npx expo start
   ```
3. Scan the QR code with your iPhone's camera or Expo Go app
4. App loads on your device!

**Note:** Computer and iPhone must be on the same WiFi network.

### 🤖 Android

#### Using Emulator:

```bash
npm run android
```

#### Or open in Android Studio:

```bash
# Open the android folder in Android Studio
```

### 🍎 iOS (Requires Mac)

```bash
cd ios
pod install
cd ..
npm run ios
```

Or open in Xcode:

```bash
open ios/AspayrMobile.xcworkspace
```

**Windows Users:** See [RUNNING_ON_WINDOWS.md](../RUNNING_ON_WINDOWS.md) for detailed instructions on testing iOS without a Mac.

## Project Structure

```
src/
├── api/                    # API service layer
│   ├── client.ts          # Axios instance & interceptors
│   ├── auth.ts            # Authentication endpoints
│   ├── banking.ts         # Yapily banking endpoints
│   └── ai.ts              # AI chat endpoints
│
├── components/            # Reusable components
│   ├── common/           # Generic UI components
│   ├── auth/             # Authentication components
│   ├── banking/          # Banking-specific components
│   ├── charts/           # Chart components
│   └── chat/             # Chat interface components
│
├── screens/              # Screen components
│   ├── auth/            # Authentication screens
│   ├── main/            # Main app screens
│   ├── banking/         # Banking screens
│   ├── onboarding/      # Onboarding flow
│   └── chat/            # Chat screen
│
├── navigation/           # Navigation configuration
│   ├── AppNavigator.tsx # Root navigator
│   ├── AuthStack.tsx    # Auth flow navigation
│   ├── MainStack.tsx    # Main app navigation
│   └── BottomTabNavigator.tsx
│
├── hooks/               # Custom React hooks
│   ├── useAuth.ts      # Authentication hook
│   ├── useBanking.ts   # Banking operations hook
│   └── useStorage.ts   # Storage hook
│
├── utils/              # Utility functions
│   ├── formatters.ts  # Data formatting
│   ├── validators.ts  # Input validation
│   └── constants.ts   # App constants
│
├── types/              # TypeScript type definitions
│   ├── auth.ts        # Auth types
│   ├── banking.ts     # Banking types
│   └── navigation.ts  # Navigation types
│
└── theme/              # Theme configuration
    ├── colors.ts      # Color palette
    ├── lightTheme.ts  # Light theme
    └── darkTheme.ts   # Dark theme
```

## Key Features

### Authentication

- **Email/Password**: Traditional authentication
- **Microsoft SSO**: Enterprise login via MSAL
- **PIN Security**: 6-digit PIN for quick access
- **Biometric Auth**: Face ID, Touch ID, fingerprint

### Banking Integration

- **Link Accounts**: OAuth-based consent flow
- **View Balances**: Real-time balance information
- **Transaction History**: Fetch and display transactions
- **Multiple Banks**: Link accounts from different institutions

### Financial Insights

- **Spending Analysis**: Categorized transaction insights
- **Visual Charts**: Interactive graphs and charts
- **Budget Tracking**: Set and monitor budgets
- **Goal Setting**: Define and track financial goals

### AI Chat Assistant

- **Multiple Agents**: Specialized AI for different tasks
- **Context-Aware**: Uses your financial data for insights
- **Natural Language**: Conversational interface
- **Persistent History**: Chat history saved locally

### Payments

- **Domestic Payments**: Initiate SEPA/IBAN transfers
- **Payment Authorization**: Secure OAuth consent
- **Status Tracking**: Real-time payment status updates

## Configuration

### Deep Linking

The app supports deep linking for OAuth callbacks:

**iOS** (`ios/AspayrMobile/Info.plist`):
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>aspayr</string>
    </array>
  </dict>
</array>
```

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="aspayr" />
</intent-filter>
```

### Biometric Authentication

**iOS**: Add to `Info.plist`:
```xml
<key>NSFaceIDUsageDescription</key>
<string>We use Face ID to secure your account</string>
```

**Android**: Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

## Migration from Web

This project is migrated from the Vite React web application. Key differences:

1. **Navigation**: React Navigation replaces tab-based navigation
2. **Styling**: React Native Paper + StyleSheet replaces TailwindCSS
3. **Storage**: AsyncStorage + Keychain replaces localStorage
4. **Charts**: react-native-chart-kit replaces recharts
5. **OAuth**: WebView + deep linking for consent flows

See [INSTRUCTIONS.md](../INSTRUCTIONS.md) for the complete migration guide.

## API Integration

The app connects to a backend API that provides:

- User management
- Yapily API integration (banking)
- Azure AI services (chat agents)
- CosmosDB (data persistence)

Ensure your backend is running and the `API_BASE_URL` is correctly configured.

## Security Considerations

- **Secure Storage**: Sensitive data (PIN, tokens) stored in Keychain
- **Certificate Pinning**: (TODO) Implement for production
- **Jailbreak Detection**: (TODO) Add for production
- **Code Obfuscation**: (TODO) Add for production

## Troubleshooting

### iOS Build Issues

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
```

### Metro Bundler Issues

```bash
npm start -- --reset-cache
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions:
- GitHub Issues: [repository-url]
- Email: support@aspayr.com

## Roadmap

- [ ] Push notifications
- [ ] Offline mode with sync
- [ ] Receipt scanning (OCR)
- [ ] Budgeting tools
- [ ] Bill reminders
- [ ] Investment tracking
- [ ] Multi-currency support
- [ ] Export reports (CSV, PDF)

---

**Version**: 0.0.1
**Last Updated**: 2025-12-02
