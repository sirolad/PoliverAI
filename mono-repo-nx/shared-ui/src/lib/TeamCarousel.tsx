import React from 'react';
import { View, Text } from 'react-native';
import { twFromTokens } from './styleTokens';

const TeamCarousel: React.FC = () => (
  <View style={twFromTokens('py-8')}> 
    <Text style={twFromTokens('text-lg font-bold text-center')}>Meet the Team (Carousel coming soon)</Text>
  </View>
);

export default TeamCarousel;
