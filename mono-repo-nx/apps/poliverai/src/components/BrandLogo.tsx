import React from 'react';
import { Image, Platform, StyleProp, Text, TextStyle, View, ViewStyle, type ImageStyle } from 'react-native';

type BrandLogoProps = {
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
};

type PartnerLogoProps = {
  width: number;
  height: number;
  imageStyle?: StyleProp<ImageStyle>;
  textStyle?: StyleProp<TextStyle>;
  fallbackStyle?: StyleProp<ViewStyle>;
};

export function BrandLogo({ width, height, style }: BrandLogoProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        <Image source={{ uri: '/poliverai-icon-transparent.svg' }} style={{ width, height }} resizeMode="contain" />
      </View>
    );
  }

  if (Platform.OS === 'macos') {
    const nativePoliveraiLogoPng = require('../../public/poliverai-logo.png') as number;

    return (
      <View style={style}>
        <Image source={nativePoliveraiLogoPng} style={{ width, height }} resizeMode="contain" />
      </View>
    );
  }

  const NativePoliveraiIconTransparent = require('../../assets/brand/poliverai-icon-transparent.svg').default as React.ComponentType<{
    width: number;
    height: number;
  }>;

  return (
    <View style={style}>
      <NativePoliveraiIconTransparent width={width} height={height} />
    </View>
  );
}

export function FullBrandLogo({ width, height, style }: BrandLogoProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        <Image source={{ uri: '/poliverai-logo.png' }} style={{ width, height }} resizeMode="contain" />
      </View>
    );
  }

  const nativePoliveraiLogoPng = require('../../public/poliverai-logo.png') as number;

  return (
    <View style={style}>
      <Image source={nativePoliveraiLogoPng} style={{ width, height }} resizeMode="contain" />
    </View>
  );
}

export function AndelaLogo({ width, height, imageStyle, textStyle, fallbackStyle }: PartnerLogoProps) {
  if (Platform.OS === 'web') {
    return <Image source={{ uri: '/andela-logo-transparent.png' }} style={[{ width, height }, imageStyle]} resizeMode="contain" />;
  }

  const nativeAndelaLogoPng = require('../../public/andela-logo-transparent.png') as number;

  return (
    <View style={fallbackStyle}>
      <Image source={nativeAndelaLogoPng} style={[{ width, height }, imageStyle]} resizeMode="contain" />
    </View>
  );
}
