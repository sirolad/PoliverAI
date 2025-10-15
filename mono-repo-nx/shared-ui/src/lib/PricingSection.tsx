import React from 'react';
import { View, Text } from 'react-native';
import { twFromTokens } from './styleTokens';

const PricingSection: React.FC = () => (
  <View style={twFromTokens('py-8')}> 
    <Text style={twFromTokens('text-lg font-bold text-center')}>Pricing (Section coming soon)</Text>
  </View>
);

export default PricingSection;
