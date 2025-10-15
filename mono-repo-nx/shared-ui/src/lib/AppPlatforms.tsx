import React from 'react';
import { View, Text } from 'react-native';
import { twFromTokens } from './styleTokens';

const AppPlatforms: React.FC = () => (
  <View style={twFromTokens('flex-row justify-center py-4')}> 
    <Text style={twFromTokens('text-base font-semibold')}>Available on iOS, Android, and Web</Text>
  </View>
);

export default AppPlatforms;
