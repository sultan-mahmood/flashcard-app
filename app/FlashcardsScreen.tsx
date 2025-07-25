import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import Papa from 'papaparse';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { DocumentPickerAsset } from 'expo-document-picker';

export type Item = {
  word: string;
  definition: string;
  example: string;
};

export type CardSet = {
  id: string;
  name: string;
  items: Item[];
};

const STORAGE_KEY = 'flashcardAppSets';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  setCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  setName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  setCount: {
    fontSize: 14,
    color: '#666',
  },
  importModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  importModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
});

export default function FlashcardsScreen() {
  const [sets, setSets] = useState<CardSet[]>([]);
  const [showAddSetModal, setShowAddSetModal] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [pendingItems, setPendingItems] = useState<Item[] | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          setSets(parsed.sets || []);
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sets }));
  }, [sets]);

  const handlePickCSV = async () => {
    setCsvLoading(true);
    const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
    if (!result.canceled && 'assets' in result && result.assets && result.assets.length > 0) {
      const asset = result.assets[0] as DocumentPickerAsset;
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
        .filter(item => item && item.word && item.definition);
      if (newItems.length > 0) {
        setPendingItems(newItems);
      }
    }
    setCsvLoading(false);
  };

  const handleAddSet = () => {
    if (!newSetName || !pendingItems) return;
    const newSet: CardSet = {
      id: Date.now().toString(),
      name: newSetName,
      items: pendingItems,
    };
    setSets([...sets, newSet]);
    setShowAddSetModal(false);
    setNewSetName('');
    setPendingItems(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ position: 'relative', width: '100%', marginBottom: 8, marginTop: 8, alignItems: 'center' }}>
        <Text style={[styles.title, { textAlign: 'center', width: '100%' }]}>Your Sets</Text>
        <TouchableOpacity onPress={() => setShowAddSetModal(true)} style={{ position: 'absolute', right: 0, top: 0, padding: 6 }}>
          <Ionicons name="add" size={28} color="#007aff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={sets}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={{ alignItems: 'flex-start', marginTop: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.setCard} onPress={() => router.push({ pathname: '/set/[id]', params: { id: item.id } })}>
            <Text style={styles.setName}>{item.name}</Text>
            <Text style={styles.setCount}>{Array.isArray(item.items) ? item.items.length : 0} terms</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No sets yet. Tap + to create your first set.</Text>}
      />
      {/* Add Set Modal */}
      <Modal visible={showAddSetModal} transparent animationType="slide">
        <View style={styles.importModalBg}>
          <View style={styles.importModalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Add New Set</Text>
            <Button title={csvLoading ? 'Loading...' : (pendingItems ? 'CSV Loaded' : 'Pick CSV File')} onPress={handlePickCSV} disabled={csvLoading} />
            {pendingItems && (
              <>
                <TextInput
                  placeholder="Set Name"
                  value={newSetName}
                  onChangeText={setNewSetName}
                  style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginVertical: 12 }}
                />
                <Button title="Add Set" onPress={handleAddSet} disabled={!newSetName} />
              </>
            )}
            <Button title="Close" onPress={() => { setShowAddSetModal(false); setPendingItems(null); setNewSetName(''); }} color="#888" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 