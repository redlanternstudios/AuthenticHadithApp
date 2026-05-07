import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { COLORS } from '../../lib/styles/colors'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
}

export function LoadingSpinner({ size = 'large', color = COLORS.emeraldMid }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
})
