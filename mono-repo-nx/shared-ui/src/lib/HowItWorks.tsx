import React from 'react';
import { View, Text } from 'react-native';
import { twFromTokens } from './styleTokens';

const HowItWorks: React.FC = () => (
  <View style={twFromTokens('py-8')}> 
    <Text style={twFromTokens('text-lg font-bold text-center')}>How It Works (Section coming soon)</Text>
  </View>
);

export default HowItWorks;
