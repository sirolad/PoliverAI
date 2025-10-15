import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { twFromTokens } from './styleTokens';

const CTASection: React.FC = () => (
  <View style={twFromTokens('py-8 items-center')}> 
    <Text style={twFromTokens('text-lg font-bold text-center mb-2')}>Ready to get started?</Text>
    <TouchableOpacity style={twFromTokens('bg-blue-600 px-6 py-2 rounded')}> 
      <Text style={twFromTokens('text-white font-semibold')}>Sign Up</Text>
    </TouchableOpacity>
  </View>
);

export default CTASection;
