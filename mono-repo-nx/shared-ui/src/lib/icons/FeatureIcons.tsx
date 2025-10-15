import React from 'react';
import { Svg, Path } from 'react-native-svg';

export const FileCheck = (props: any) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M4 4h16v16H4V4zm2 8l4 4 6-6" stroke="#2563EB" strokeWidth={2} fill="none" />
  </Svg>
);

export const Clock = (props: any) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M12 8v4l3 3" stroke="#2563EB" strokeWidth={2} fill="none" />
    <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke="#2563EB" strokeWidth={2} fill="none" />
  </Svg>
);

export const Shield = (props: any) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M12 2l7 4v6c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V6l7-4z" stroke="#2563EB" strokeWidth={2} fill="none" />
  </Svg>
);

export const Zap = (props: any) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M13 2L3 14h7v8l10-12h-7V2z" stroke="#2563EB" strokeWidth={2} fill="none" />
  </Svg>
);

export const BarChart = (props: any) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M4 20V10M12 20V4M20 20v-7" stroke="#2563EB" strokeWidth={2} fill="none" />
  </Svg>
);

export default { FileCheck, Clock, Shield, Zap, BarChart };
