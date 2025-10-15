declare module '@gorhom/bottom-sheet' {
  import React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export interface BottomSheetModalProps {
    snapPoints?: Array<string | number> | (() => Array<string | number>);
    index?: number;
    backgroundStyle?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  }

  export interface BottomSheetModalRef {
    present: () => void;
    dismiss?: () => void;
    expand?: () => void;
    collapse?: () => void;
  }

  export const BottomSheetModalProvider: React.FC<{ children?: React.ReactNode }>;

  export const BottomSheetModal: React.ForwardRefExoticComponent<
    BottomSheetModalProps & React.RefAttributes<BottomSheetModalRef>
  >;

  export default BottomSheetModal;
}
