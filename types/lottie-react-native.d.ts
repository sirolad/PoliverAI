declare module 'lottie-react-native' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';
  export default class LottieView extends Component<ViewProps & { source?: any; autoPlay?: boolean; loop?: boolean }>{}
}

export {};
