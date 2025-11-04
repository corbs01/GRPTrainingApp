import React from "react";
import { Image, ImageStyle, StyleSheet, View, ViewStyle, StyleProp } from "react-native";

import {
  getIllustrationSource,
  IllustrationKey,
  ILLUSTRATION_FALLBACK,
  isIllustrationKey
} from "@lib/illustrations";

type IllustrationProps = {
  name?: IllustrationKey | string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  rounded?: boolean;
  backgroundColor?: string;
};

/**
 * Lightweight helper component for rendering training illustrations.
 * Falls back to a default asset if the requested key is missing.
 */
export const Illustration: React.FC<IllustrationProps> = ({
  name,
  size = 96,
  style,
  imageStyle,
  rounded = true,
  backgroundColor
}) => {
  const resolvedKey = React.useMemo<IllustrationKey>(
    () => (name && isIllustrationKey(name) ? name : ILLUSTRATION_FALLBACK),
    [name]
  );

  const source = React.useMemo(() => getIllustrationSource(resolvedKey), [resolvedKey]);

  return (
    <View
      style={[
        styles.container,
        rounded ? { borderRadius: size / 3 } : null,
        {
          width: size,
          height: size,
          backgroundColor
        },
        style
      ]}
    >
      <Image
        source={source}
        resizeMode="cover"
        style={[
          styles.image,
          rounded ? { borderRadius: size / 3 } : null,
          {
            width: size,
            height: size
          },
          imageStyle
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden"
  },
  image: {
    width: "100%",
    height: "100%"
  }
});

export default Illustration;
