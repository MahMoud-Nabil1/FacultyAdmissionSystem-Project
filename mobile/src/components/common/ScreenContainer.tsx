import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

export default function ScreenContainer({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});
