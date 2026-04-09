import React from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';

type CrossPlatformModalProps = {
  open: boolean;
  onRequestClose?: () => void;
  animationType?: 'none' | 'slide' | 'fade';
  children: React.ReactNode;
};

export default function CrossPlatformModal({
  open,
  onRequestClose,
  animationType = 'fade',
  children,
}: CrossPlatformModalProps) {
  if (Platform.OS === 'macos') {
    if (!open) return null;

    return (
      <View pointerEvents="box-none" style={styles.macosHost}>
        {children}
      </View>
    );
  }

  return (
    <Modal visible={open} animationType={animationType} transparent onRequestClose={onRequestClose}>
      {children}
    </Modal>
  );
}

const styles = StyleSheet.create({
  macosHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
