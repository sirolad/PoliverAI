import React from 'react';
import { View, Text } from 'react-native';
import { twFromTokens } from './styleTokens';

interface FooterProps {
  hasBackground?: boolean;
}

const Footer: React.FC<FooterProps> = ({ hasBackground }) => (
  <View style={twFromTokens('py-4', hasBackground ? 'bg-gray-100' : '')}>
    <Text style={twFromTokens('text-xs text-center text-gray-500')}>© 2025 PoliverAI. All rights reserved.</Text>
  </View>
);

export default Footer;
