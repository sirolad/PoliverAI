import './NativewindEnv';
import 'react-native-gesture-handler';
import React from 'react';
import { AppRegistry, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import App from './App';
import { ReduxProvider } from '@poliverai/intl';

type CapturedLogEntry = {
  level: 'log' | 'warn' | 'error';
  text: string;
  timestamp: string;
};

type RuntimeErrorBoundaryState = {
  error: Error | null;
  info: string | null;
};

const runtimeLogs: CapturedLogEntry[] = [];
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

function formatLogPart(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function pushRuntimeLog(level: CapturedLogEntry['level'], args: unknown[]) {
  runtimeLogs.push({
    level,
    text: args.map(formatLogPart).join(' '),
    timestamp: new Date().toISOString(),
  });

  if (runtimeLogs.length > 120) {
    runtimeLogs.splice(0, runtimeLogs.length - 120);
  }

}

const globalFlags = globalThis as typeof globalThis & {
  __POLIVERAI_CONSOLE_CAPTURED__?: boolean;
  ErrorUtils?: {
    getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
    setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
  };
};

if (!globalFlags.__POLIVERAI_CONSOLE_CAPTURED__) {
  globalFlags.__POLIVERAI_CONSOLE_CAPTURED__ = true;

  console.log = (...args: unknown[]) => {
    pushRuntimeLog('log', args);
    originalConsole.log(...args);
  };

  console.warn = (...args: unknown[]) => {
    pushRuntimeLog('warn', args);
    originalConsole.warn(...args);
  };

  console.error = (...args: unknown[]) => {
    pushRuntimeLog('error', args);
    originalConsole.error(...args);
  };
}

console.log('[startup] Main.tsx loaded', { platform: Platform.OS });

const globalErrorUtils = globalFlags.ErrorUtils;

if (globalErrorUtils?.setGlobalHandler) {
  const previousHandler = globalErrorUtils.getGlobalHandler?.();
  globalErrorUtils.setGlobalHandler((error, isFatal) => {
    console.log('[startup] GlobalErrorUtils caught', { isFatal, error });
    previousHandler?.(error, isFatal);
  });
}

class RuntimeErrorBoundary extends React.Component<React.PropsWithChildren, RuntimeErrorBoundaryState> {
  override state: RuntimeErrorBoundaryState = {
    error: null,
    info: null,
  };


  static getDerivedStateFromError(error: Error): RuntimeErrorBoundaryState {
    return {
      error,
      info: null,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('[startup] RuntimeErrorBoundary caught', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.setState({
      error,
      info: errorInfo.componentStack ?? null,
    });
  }

  override render() {
    if (this.state.error == null) {
      return this.props.children;
    }

    const recentLogs = runtimeLogs.slice(-40);

    return (
      <View style={styles.errorRoot}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>App Render Error</Text>
          <Text style={styles.errorSubtitle}>
            A failure was caught before DevTools attached.
          </Text>
          <ScrollView style={styles.errorScroll} contentContainerStyle={styles.errorScrollContent}>
            <Text style={styles.errorLabel}>Message</Text>
            <Text style={styles.errorBody}>{this.state.error.message || String(this.state.error)}</Text>
            {this.state.error.stack ? <Text style={styles.errorBody}>{this.state.error.stack}</Text> : null}
            {this.state.info ? (
              <>
                <Text style={styles.errorLabel}>Component Stack</Text>
                <Text style={styles.errorBody}>{this.state.info}</Text>
              </>
            ) : null}
            {recentLogs.length > 0 ? (
              <>
                <Text style={styles.errorLabel}>Recent Logs</Text>
                {recentLogs.map((entry, index) => (
                  <Text key={entry.timestamp + String(index)} style={styles.errorBody}>
                    [{entry.level.toUpperCase()}] {entry.timestamp} {entry.text}
                  </Text>
                ))}
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    );
  }
}

const WrappedApp = () => (
  console.log('[startup] WrappedApp render', { platform: Platform.OS }),
  <RuntimeErrorBoundary>
    {ReduxProvider ? (
      <ReduxProvider>
        <App />
      </ReduxProvider>
    ) : (
      <App />
    )}
  </RuntimeErrorBoundary>
);

const appComponentProvider = () => WrappedApp;

AppRegistry.registerComponent('PoliverAI', appComponentProvider);
AppRegistry.registerComponent('poliverai', appComponentProvider);

const styles = StyleSheet.create({
  errorRoot: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    maxWidth: 900,
    maxHeight: '88%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    padding: 24,
  },
  errorTitle: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorSubtitle: {
    color: '#475569',
    fontSize: 15,
    marginBottom: 16,
  },
  errorScroll: {
    flexGrow: 0,
  },
  errorScrollContent: {
    gap: 12,
  },
  errorLabel: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBody: {
    color: '#111827',
    fontSize: 13,
    lineHeight: 20,
  },
});
