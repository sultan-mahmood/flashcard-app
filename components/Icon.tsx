import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform } from 'react-native';
import WebIcon from './WebIcon';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export default function Icon({ name, size = 24, color = '#000', style }: IconProps) {
  if (Platform.OS === 'web') {
    return <WebIcon name={name} size={size} color={color} style={style} />;
  }
  
  return <Ionicons name={name as any} size={size} color={color} style={style} />;
} 