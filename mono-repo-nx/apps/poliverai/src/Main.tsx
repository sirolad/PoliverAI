import './NativewindEnv';
import 'react-native-gesture-handler';
import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { ReduxProvider } from '@poliverai/intl';

console.log('[startup] Main.tsx loaded', { platform: Platform.OS });

const globalErrorUtils = (globalThis as typeof globalThis & {
	ErrorUtils?: {
		getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
		setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
	};
}).ErrorUtils;

if (globalErrorUtils?.setGlobalHandler) {
	const previousHandler = globalErrorUtils.getGlobalHandler?.();
	globalErrorUtils.setGlobalHandler((error, isFatal) => {
		console.log('[startup] GlobalErrorUtils caught', { isFatal, error });
		previousHandler?.(error, isFatal);
	});
}

const WrappedApp = () => (
	console.log('[startup] WrappedApp render', { platform: Platform.OS }),
	ReduxProvider ? (
		<ReduxProvider>
			<App />
		</ReduxProvider>
	) : (
		<App />
	)
);

AppRegistry.registerComponent('PoliverAI', () => WrappedApp);
