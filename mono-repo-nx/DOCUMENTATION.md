# poliverai-mono-repo

An NX monorepo with React Native Expo app and shared components library.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start web development server
npx nx serve poliverai

# Build for web
npx nx build poliverai

# Run tests (currently has configuration issues)
npx nx test poliverai

# View project structure
npx nx graph
```

## 📱 Demo Login

Use any email and password combination to sign in to the demo app.

**Web Demo**: Run `npx nx serve poliverai` and navigate to http://localhost:4200

## 🏗 Architecture

### Monorepo Structure
```
├── apps/
│   ├── poliverai/                 # Main React Native app
│   │   ├── src/
│   │   │   ├── screens/        # App screens
│   │   │   ├── navigation/     # Navigation setup
│   │   │   └── app/            # Main app component
│   │   ├── android/            # Android native files
│   │   ├── ios/                # iOS native files
│   │   └── vite.config.ts      # Web build configuration
│   └── poliverai-e2e/            # E2E tests
└── shared-ui/                  # Shared component library
    └── src/lib/
        ├── auth-context.tsx    # Authentication provider
        ├── button.tsx          # Button component
        ├── input.tsx           # Input component
        └── card.tsx            # Card component
```

### Key Features

- **🔐 Authentication Flow**: Login screen with persistent auth state
- **📱 React Native**: Expo-ready React Native app with iOS/Android support
- **🌐 Web Support**: Vite-powered web build using React Native Web
- **🎨 Design System**: Tailwind-inspired components with consistent styling
- **📚 Shared Library**: Reusable components for future web variant
- **🧭 Navigation**: React Navigation v6 with bottom tabs and stack navigation

## 📱 Screens

### 🏠 Home Screen
- Dashboard overview with welcome message
- Quick stats display (Projects, Contacts, Inquiries)
- Recent activity feed
- Sign out functionality

### 👥 Contacts Screen
- Expandable contact cards
- Contact details (email, phone, company)
- Professional avatar placeholders

### 💬 Inquiries Screen
- Status-based inquiry management
- Expandable inquiry details
- Status indicators (New, In Progress, Completed)

### 🔑 Login Screen
- Email and password authentication
- Demo login (accepts any credentials)
- Professional, clean design

## 🎨 Design System

### Colors
- Primary: `#3B82F6` (Blue)
- Secondary: `#6B7280` (Gray)
- Background: `#F9FAFB` (Light Gray)
- Text: `#111827` (Dark Gray)

### Components
- **Button**: Primary, secondary, and outline variants
- **Input**: With validation, labels, and secure text entry
- **Card**: Shadow, padding, and press handling
- **Auth Provider**: Context-based authentication with AsyncStorage

## 🛠 Development

### Technologies Used
- **NX**: Monorepo tooling and build system
- **React Native**: 0.79.3 with Expo support
- **React Navigation**: v6 for navigation
- **TypeScript**: Full type safety
- **Vite**: Fast web development and builds
- **Metro**: React Native bundler
- **AsyncStorage**: Persistent authentication
- **React Native Web**: Web compatibility layer

### Commands
```bash
# Development
npx nx serve poliverai              # Start web dev server
npx nx start poliverai              # Start Metro bundler (for mobile)

# Building
npx nx build poliverai              # Build for web
npx nx run poliverai:build-ios      # Build for iOS
npx nx run poliverai:build-android  # Build for Android

# Linting and Testing
npx nx lint poliverai               # Lint the app
npx nx test poliverai               # Run tests (needs config fixes)

# Utilities
npx nx graph                     # View project dependency graph
npx nx show project poliverai       # Show project details
```

## 🚧 Known Issues

1. **Jest Configuration**: Test environment needs babel/typescript fixes
2. **Navigation Transitions**: Some React Native Web compatibility issues
3. **Native Dependencies**: Need `pod install` for iOS development

## 🎯 Future Enhancements

- **React Web App**: Create web-specific app using shared components
- **Real Authentication**: Integrate with actual auth service
- **Data Management**: Add state management (Redux/Zustand)
- **Testing**: Fix test configuration and add comprehensive tests
- **CI/CD**: Add GitHub Actions for automated builds and tests

## 📄 License

MIT