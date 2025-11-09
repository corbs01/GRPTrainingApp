import React from "react";
import { Image, ImageStyle, StyleSheet, View, ViewStyle, StyleProp } from "react-native";

import {
  getIllustrationSource,
  IllustrationKey,
  resolveIllustrationKey
} from "@lib/illustrations";
import { useTheme } from "@theme/index";

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
  const theme = useTheme();
  const resolvedKey = React.useMemo<IllustrationKey>(() => resolveIllustrationKey(name), [name]);

  const source = React.useMemo(() => getIllustrationSource(resolvedKey), [resolvedKey]);
  const resolvedBackground = backgroundColor ?? theme.palette.softMist;
  const borderRadius = React.useMemo(
    () => (rounded ? Math.max(theme.radius.md, size / 3) : theme.radius.xs),
    [rounded, size, theme.radius.md, theme.radius.xs]
  );

  return (
    <View
      style={[
        styles.container,
        { borderRadius },
        {
          width: size,
          height: size,
          backgroundColor: resolvedBackground
        },
        style
      ]}
    >
      <Image
        source={source}
        resizeMode="cover"
        style={[
          styles.image,
          { borderRadius },
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
