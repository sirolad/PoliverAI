import './NativewindEnv.js';
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './app/App.js';
import { ReduxProvider } from '@poliverai/intl';

const WrappedApp = () => (
	ReduxProvider ? (
		<ReduxProvider>
			<App />
		</ReduxProvider>
	) : (
		<App />
	)
);

AppRegistry.registerComponent('PoliverAI', () => WrappedApp);
