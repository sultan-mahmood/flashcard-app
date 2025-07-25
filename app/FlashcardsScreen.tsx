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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [setToDelete, setSetToDelete] = useState<CardSet | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
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
      
      // Extract filename without extension and use as default set name
      const fileName = asset.name || 'Untitled';
      const fileNameWithoutExtension = fileName.replace(/\.csv$/i, '');
      setNewSetName(fileNameWithoutExtension);
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

  const handleLongPress = (set: CardSet) => {
    setSetToDelete(set);
    setDeleteModalVisible(true);
  };

  const enterDeleteMode = () => {
    setIsDeleteMode(true);
  };

  const exitDeleteMode = () => {
    setIsDeleteMode(false);
  };

  const handleDeletePress = (set: CardSet) => {
    setSetToDelete(set);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!setToDelete) return;
    
    const newSets = sets.filter(s => s.id !== setToDelete.id);
    setSets(newSets);
    
    // Clean up persisted data for this set
    const bookmarksKey = `bookmarks_${setToDelete.id}`;
    const learnedKey = `learned_${setToDelete.id}`;
    const currentPositionKey = `current_position_${setToDelete.id}`;
    const shuffledOrderKey = `shuffled_order_${setToDelete.id}`;
    const starredOrderKey = `starred_items_${setToDelete.id}`;
    const starredPositionKey = `starred_position_${setToDelete.id}`;
    
    try {
      await AsyncStorage.removeItem(bookmarksKey);
      await AsyncStorage.removeItem(learnedKey);
      await AsyncStorage.removeItem(currentPositionKey);
      await AsyncStorage.removeItem(shuffledOrderKey);
      await AsyncStorage.removeItem(starredOrderKey);
      await AsyncStorage.removeItem(starredPositionKey);
    } catch (error) {
      console.error('Error cleaning up set data:', error);
    }
    
    setDeleteModalVisible(false);
    setSetToDelete(null);
    exitDeleteMode();
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setSetToDelete(null);
    exitDeleteMode();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ position: 'relative', width: '100%', marginBottom: 8, marginTop: 8, alignItems: 'center' }}>
        {isDeleteMode ? (
          <TouchableOpacity onPress={exitDeleteMode} style={{ position: 'absolute', right: 0, top: 0, padding: 6 }}>
            <Text style={{ color: '#007aff', fontSize: 18, fontWeight: '600' }}>Done</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setShowAddSetModal(true)} style={{ position: 'absolute', right: 0, top: 0, padding: 6 }}>
            <Ionicons name="add" size={28} color="#007aff" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={sets}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={{ 
          alignItems: sets.length > 0 ? 'flex-start' : 'center', 
          justifyContent: 'flex-start', 
          marginTop: 16,
          flexGrow: 1 
        }}
        renderItem={({ item }) => (
          <View style={{ position: 'relative' }}>
            <TouchableOpacity 
              style={[styles.setCard, isDeleteMode && { transform: [{ scale: 1.05 }] }]}
              onPress={() => {
                if (isDeleteMode) {
                  exitDeleteMode();
                } else {
                  router.push({ pathname: '/set', params: { id: item.id } });
                }
              }}
              onLongPress={() => {
                if (!isDeleteMode) {
                  enterDeleteMode();
                }
              }}
              delayLongPress={500}
            >
              <Text style={styles.setName}>{item.name}</Text>
              <Text style={styles.setCount}>{Array.isArray(item.items) ? item.items.length : 0} terms</Text>
            </TouchableOpacity>
            {isDeleteMode && (
              <TouchableOpacity 
                onPress={() => handleDeletePress(item)}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#ff3b30',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 10,
                  borderWidth: 2,
                  borderColor: 'white',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 20, width: '100%', flex: 1 }}>
            <Ionicons name="library-outline" size={64} color="#ccc" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#666', marginBottom: 8, textAlign: 'center', maxWidth: 280 }}>
              Welcome to Flashcard App!
            </Text>
            <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 20, maxWidth: 300 }}>
              Create your first flashcard set by tapping the + button above. You can upload a CSV file with your terms and definitions.
            </Text>
            <TouchableOpacity 
              onPress={() => setShowAddSetModal(true)} 
              style={{ 
                backgroundColor: '#007aff', 
                paddingHorizontal: 24, 
                paddingVertical: 12, 
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Ionicons name="add" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Create Your First Set</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {/* Add Set Modal */}
      <Modal visible={showAddSetModal} transparent animationType="slide">
        <View style={styles.importModalBg}>
          <View style={styles.importModalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Create New Set</Text>
            
            {/* CSV format hint - shown before upload */}
            <Text style={{ fontSize: 11, color: '#888', marginBottom: 12, fontStyle: 'italic', textAlign: 'center' }}>
              CSV columns should be: term, definition, example (optional)
            </Text>
            
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
                  style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginVertical: 8, width: '100%', minHeight: 50 }}
                />
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  {processCSVData(pendingItems, importHasHeader).length} items will be created
                </Text>
                <Button title="Create Set" onPress={handleAddSet} disabled={!newSetName.trim()} />
              </>
            )}
            
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
      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="slide">
        <View style={styles.importModalBg}>
          <View style={styles.importModalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: '#d00' }}>Delete Set</Text>
            <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
              Are you sure you want to delete "{setToDelete?.name}"?
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
              This action cannot be undone. All progress and starred items will be lost.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity 
                onPress={cancelDelete}
                style={{ 
                  backgroundColor: '#888', 
                  paddingHorizontal: 20, 
                  paddingVertical: 12, 
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 10
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={confirmDelete}
                style={{ 
                  backgroundColor: '#d00', 
                  paddingHorizontal: 20, 
                  paddingVertical: 12, 
                  borderRadius: 8,
                  flex: 1,
                  marginLeft: 10
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 