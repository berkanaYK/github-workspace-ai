declare module 'react-native-video' {
  import type {ComponentType} from 'react';
  import type {StyleProp, ViewStyle} from 'react-native';

  type VideoResizeMode = 'contain' | 'cover' | 'stretch' | 'none';

  export interface VideoProps {
    source: {uri: string; headers?: Record<string, string>};
    style?: StyleProp<ViewStyle>;
    controls?: boolean;
    resizeMode?: VideoResizeMode;
    paused?: boolean;
    onLoadStart?: () => void;
    onLoad?: () => void;
    onError?: (error: unknown) => void;
  }

  const Video: ComponentType<VideoProps>;
  export default Video;
}
