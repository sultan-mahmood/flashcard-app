import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface WebIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const iconMap: { [key: string]: string } = {
  'chevron-back': '←',
  'add': '+',
  'library-outline': '📚',
  'checkbox': '☑️',
  'square-outline': '☐',
  'ellipsis-horizontal': '⋯',
  'create-outline': '✏️',
  'cloud-upload-outline': '☁️',
  'star': '⭐',
  'star-outline': '☆',
  'refresh': '🔄',
  'trash': '🗑️',
  'close': '✕',
  'volume-high': '🔊',
  'volume-medium': '🔉',
  'document-text': '📄',
  'language': '🌐',
  'house.fill': '🏠',
};

export default function WebIcon({ name, size = 24, color = '#000', style }: WebIconProps) {
  const icon = iconMap[name] || '?';
  
  return (
    <Text 
      style={[
        styles.icon, 
        { 
          fontSize: size, 
          color: color,
          lineHeight: size,
          textAlign: 'center',
        },
        style
      ]}
    >
      {icon}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontFamily: 'system-ui',
    fontWeight: 'normal',
  },
}); 