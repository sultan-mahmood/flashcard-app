import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import Papa from 'papaparse';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

// Item type from flashcards.tsx
export type Item = {
  word: string;
  definition: string;
  example: string;
};

const STORAGE_KEY = 'flashcardAppSets';

export default function AddSetScreen() {
  const [step, setStep] = useState<'pick' | 'name'>('pick');
  const [items, setItems] = useState<Item[]>([]);
  const [setName, setSetName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickCSV = async () => {
    setLoading(true);
    const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
    if (!result.canceled && 'assets' in result && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const csv = await response.text();
      const parsed = Papa.parse(csv, { header: true });
      const newItems: Item[] = parsed.data
        .map((row: any) => {
          if (!row) return null;
          const norm: any = {};
          Object.keys(row).forEach(k => {
            norm[k.trim().toLowerCase()] = row[k];
          });
          return {
            word: norm.word || '',
            definition: norm.definition || '',
            example: norm.example || ''
          };
        })
        .filter((item): item is Item => !!item && item.word && item.definition);
      if (newItems.length > 0) {
        setItems(newItems);
        setStep('name');
      } else {
        Alert.alert('No valid items found in file.');
      }
    }
    setLoading(false);
  };

  const createSet = async () => {
    if (!setName.trim() || items.length === 0) return;
    setLoading(true);
    const id = Date.now().toString();
    let sets = [];
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        sets = parsed.sets || [];
      }
    } catch {}
    sets.push({ id, name: setName.trim(), items });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sets }));
    setLoading(false);
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {step === 'pick' && (
        <>
          <Text style={styles.title}>Upload a CSV file to create a set</Text>
          <Button title={loading ? 'Loading...' : 'Pick CSV File'} onPress={pickCSV} disabled={loading} />
        </>
      )}
      {step === 'name' && (
        <>
          <Text style={styles.title}>Name Your Set</Text>
          <TextInput
            placeholder="Set name"
            value={setName}
            onChangeText={setSetName}
            style={styles.input}
          />
          <Button title={loading ? 'Creating...' : 'Create Set'} onPress={createSet} disabled={loading} />
          <Button title="Cancel" onPress={() => router.replace('/')} color="#888" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 18,
  },
}); 