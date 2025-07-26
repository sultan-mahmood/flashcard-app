import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { IconSymbol } from './ui/IconSymbol';
import TabBarBackground from './ui/TabBarBackground';

interface FooterNavProps {
  showHome?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
}

export default function FooterNav({ showHome = true, showBack = false, onBackPress }: FooterNavProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleGoHome = () => {
    router.back();
  };

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={{
      position: 'absolute',
      bottom: 10,
      left: 10,
      right: 10,
      backgroundColor: TabBarBackground ? undefined : 'rgba(255, 255, 255, 0.9)',
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
      paddingVertical: 4,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === 'ios' ? 15 : 8,
      borderRadius: 10,
      ...Platform.select({
        ios: {
          position: 'absolute',
        },
        default: {},
      }),
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {showBack && (
          <TouchableOpacity 
            onPress={handleBack} 
            style={{ 
              alignItems: 'center', 
              paddingVertical: 4,
              minWidth: 60
            }}
          >
            <Ionicons name="chevron-back" size={20} color={Colors[colorScheme ?? 'light'].tint} />
            <Text style={{ color: Colors[colorScheme ?? 'light'].tint, fontSize: 10, fontWeight: '600', marginTop: 2 }}>Back</Text>
          </TouchableOpacity>
        )}
        {showHome && (
          <TouchableOpacity 
            onPress={handleGoHome} 
            style={{ 
              alignItems: 'center', 
              paddingVertical: 4,
              minWidth: 60
            }}
          >
            <IconSymbol size={20} name="house.fill" color={Colors[colorScheme ?? 'light'].tint} />
            <Text style={{ color: Colors[colorScheme ?? 'light'].tint, fontSize: 10, fontWeight: '600', marginTop: 2 }}>Home</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
} 