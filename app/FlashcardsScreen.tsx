import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import Papa from 'papaparse';
import React, { useCallback, useEffect, useState } from 'react';
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
  const [pendingItems, setPendingItems] = useState<any[] | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [importHasHeader, setImportHasHeader] = useState(true);
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

  // Refresh sets when screen comes back into focus (e.g., after deleting a set)
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const data = await AsyncStorage.getItem(STORAGE_KEY);
          if (data) {
            const parsed = JSON.parse(data);
            setSets(parsed.sets || []);
          }
        } catch (e) {}
      })();
    }, [])
  );

  const handlePickCSV = async () => {
    setCsvLoading(true);
    const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
    if (!result.canceled && 'assets' in result && result.assets && result.assets.length > 0) {
      const asset = result.assets[0] as DocumentPickerAsset;
      const response = await fetch(asset.uri);
      const csv = await response.text();
      const parsed = Papa.parse(csv, { header: false }); // Always parse as arrays
      
      // Store the raw parsed data
      setPendingItems(parsed.data);
      console.log('Raw CSV data stored:', parsed.data.length, 'rows');
    }
    setCsvLoading(false);
  };

  const processCSVData = (rawData: any[], hasHeader: boolean): Item[] => {
    let dataRows = rawData;
    
    if (hasHeader) {
      // Skip the first row (header) and process remaining rows as data
      dataRows = rawData.slice(1);
    }
    
    return dataRows
      .map((row: any) => {
        if (!Array.isArray(row) || row.length < 2) return null;
        return {
          word: row[0] || '',
          definition: row[1] || '',
          example: row[2] || ''
        };
      })
      .filter((item): item is Item => item !== null && item.word && item.definition);
  };

  const handleAddSet = () => {
    if (!newSetName || !pendingItems) return;
    
    // Process the CSV data based on current header setting
    const processedItems = processCSVData(pendingItems, importHasHeader);
    
    if (processedItems.length === 0) {
      console.log('No valid items found after processing');
      return;
    }
    
    const newSet: CardSet = {
      id: Date.now().toString(),
      name: newSetName,
      items: processedItems,
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
          <TouchableOpacity style={styles.setCard} onPress={() => router.push({ pathname: '/set', params: { id: item.id } })}>
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
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Create New Set</Text>
            
            {/* Step 1: Upload CSV File */}
            <Button 
              title={csvLoading ? 'Loading...' : (pendingItems ? 'CSV Loaded ✓' : 'Upload CSV File')} 
              onPress={handlePickCSV} 
              disabled={csvLoading} 
            />
            
            {/* Header toggle option */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
              <Text>File has header row</Text>
              <TouchableOpacity onPress={() => setImportHasHeader(h => !h)} style={{ marginLeft: 8 }}>
                <Ionicons name={importHasHeader ? 'checkbox' : 'square-outline'} size={24} color="#007aff" />
              </TouchableOpacity>
            </View>
            
            {/* Step 2: Enter Set Name (only show after CSV is loaded) */}
            {pendingItems && (
              <>
                <Text style={{ marginTop: 16, marginBottom: 8, fontWeight: 'bold' }}>
                  Set Name:
                </Text>
                <TextInput
                  placeholder="Enter set name"
                  value={newSetName}
                  onChangeText={setNewSetName}
                  style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginVertical: 8, width: '100%' }}
                />
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                  {processCSVData(pendingItems, importHasHeader).length} items will be created
                </Text>
                <Button title="Create Set" onPress={handleAddSet} disabled={!newSetName.trim()} />
              </>
            )}
            
            {/* Debug info */}
            <Text style={{ fontSize: 10, color: '#999', marginTop: 8 }}>
              Debug: raw rows = {pendingItems ? pendingItems.length : 'null'}, processed = {pendingItems ? processCSVData(pendingItems, importHasHeader).length : 'null'}
            </Text>
            
            <Button 
              title="Cancel" 
              onPress={() => { 
                setShowAddSetModal(false); 
                setPendingItems(null); 
                setNewSetName(''); 
              }} 
              color="#888" 
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 