import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import Papa from 'papaparse';
import React, { useEffect, useState } from 'react';
import { Button, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';

import type { CardSet } from '../FlashcardsScreen';

export const options = {
  headerShown: false,
};

const STORAGE_KEY = 'flashcardAppSets';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  card: {
    width: '90%',
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 36,
    shadowColor: '#888',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
  },
  word: {
    fontSize: 28,
    fontWeight: '800',
    color: '#22223b',
    marginBottom: 18,
    fontFamily: 'System',
    letterSpacing: 1.2,
    textAlign: 'center',
    alignSelf: 'center',
    flex: 0,
  },
  definition: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3a3a40',
    marginBottom: 14,
    fontFamily: 'System',
    letterSpacing: 0.8,
    textAlign: 'center',
    maxWidth: 320,
    alignSelf: 'center',
  },
  example: {
    fontSize: 16,
    color: '#4a4e69',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
    fontFamily: 'System',
    opacity: 0.85,
    maxWidth: 320,
    alignSelf: 'center',
  },
  importModalBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  importModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
});

export default function SetPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [set, setSet] = useState<CardSet | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [learned, setLearned] = useState<number[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [importHasHeader, setImportHasHeader] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [pendingImport, setPendingImport] = useState<any[]>([]);
  const [starredOnly, setStarredOnly] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          const found = (parsed.sets || []).find((s: CardSet) => s.id === id);
          if (found) {
            // Shuffle the items array
            const shuffled = [...found.items].sort(() => Math.random() - 0.5);
            setSet({ ...found, items: shuffled });
          } else {
            setSet(null);
          }
        }
      } catch {}
    })();
  }, [id]);

  if (!set) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Simple Navigation Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, paddingTop: 50 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={{ padding: 8 }}>
            <Ionicons name="ellipsis-horizontal" size={30} color="#333" />
          </TouchableOpacity>
        </View>
        {/* Set Name */}
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center', backgroundColor: 'red', padding: 10, marginTop: 120 }}>
          Loading set...
        </Text>
      </SafeAreaView>
    );
  }

  const items = set ? (starredOnly ? set.items.filter((_, idx) => bookmarks.includes(idx)) : set.items) : [];
  const current = items[currentIdx];

  const pronounce = () => {
    if (!current) return;
    Speech.speak(current.word);
  };

  const toggleBookmark = () => {
    if (currentIdx === null) return;
    if (bookmarks.includes(currentIdx)) {
      setBookmarks(bookmarks.filter(idx => idx !== currentIdx));
    } else {
      setBookmarks([...bookmarks, currentIdx]);
    }
  };

  // Menu actions
  const handleMenu = (action: string) => {
    if (action === 'edit') {
      setEditName(set?.name || '');
      setEditModalVisible(true);
    } else if (action === 'import') {
      setImportModalVisible(true);
    } else if (action === 'starred') {
      setStarredOnly(true);
      if (bookmarks.length > 0) {
        setCurrentIdx(bookmarks[0]);
      }
    } else if (action === 'reset') {
      setLearned([]);
      setBookmarks([]);
      setStarredOnly(false);
    } else if (action === 'delete') {
      (async () => {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          const newSets = (parsed.sets || []).filter((s: CardSet) => s.id !== id);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sets: newSets }));
        }
        router.back();
      })();
    }
  };

  // Edit set name logic
  const handleEditSetName = async () => {
    if (!set) return;
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const newSets = (parsed.sets || []).map((s: CardSet) =>
        s.id === id ? { ...s, name: editName } : s
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sets: newSets }));
      setSet({ ...set, name: editName });
    }
    setEditModalVisible(false);
  };

  // Import CSV logic
  const handlePickCSV = async () => {
    setImportLoading(true);
    const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
    if (!result.canceled && 'assets' in result && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const csv = await response.text();
      const parsed = Papa.parse(csv, { header: importHasHeader });
      let newItems: any[] = [];
      if (importHasHeader) {
        newItems = parsed.data.map((row: any) => {
          const norm: any = {};
          Object.keys(row).forEach(k => {
            norm[k.trim().toLowerCase()] = row[k];
          });
          return {
            word: norm.word || '',
            definition: norm.definition || '',
            example: norm.example || ''
          };
        }).filter(item => item && item.word && item.definition);
      } else {
        newItems = parsed.data
          .map((row: any) => {
            if (!Array.isArray(row) || row.length < 2) return null;
            return {
              word: row[0] || '',
              definition: row[1] || '',
              example: row[2] || ''
            };
          })
          .filter((item: any) => !!item && !!item.word && !!item.definition);
      }
      setPendingImport(newItems);
    }
    setImportLoading(false);
  };
  const handleImportMerge = async () => {
    if (!set || !pendingImport) return;
    const existingWords = new Set(set.items.map(item => item.word));
    const merged = [
      ...set.items,
      ...pendingImport.filter(item => !existingWords.has(item.word))
    ];
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const newSets = (parsed.sets || []).map((s: CardSet) =>
        s.id === id ? { ...s, items: merged } : s
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sets: newSets }));
      setSet({ ...set, items: merged });
    }
    setImportModalVisible(false);
    setPendingImport([]);
  };

  const openMenu = () => {
    SheetManager.show('set-menu');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Simple Navigation Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, paddingTop: 50 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => SheetManager.show('set-menu')} style={{ padding: 8 }}>
          <Ionicons name="ellipsis-horizontal" size={30} color="#333" />
        </TouchableOpacity>
      </View>
      {/* Set Name */}
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333', textAlign: 'center', marginTop: 80 }}>
        {set ? set.name : 'Loading...'}
      </Text>
      {starredOnly && (
        <View style={{ backgroundColor: '#FFFBEA', borderRadius: 8, padding: 10, marginBottom: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#E6A700', fontWeight: 'bold', flex: 1 }}>Starred Only</Text>
          <Button title="Show All" onPress={() => setStarredOnly(false)} color="#007aff" />
        </View>
      )}
      <ActionSheet id="set-menu" gestureEnabled>
        <View style={{ paddingVertical: 12 }}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => { SheetManager.hide('set-menu'); setTimeout(() => handleMenu('edit'), 300); }}>
            <Ionicons name="create-outline" size={24} color="#444" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 18 }}>Edit set name</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => { SheetManager.hide('set-menu'); handleMenu('import'); }}>
            <Ionicons name="cloud-upload-outline" size={24} color="#444" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 18 }}>Import CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => { SheetManager.hide('set-menu'); handleMenu('starred'); }}>
            <Ionicons name="star" size={24} color="#444" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 18 }}>View starred</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => { SheetManager.hide('set-menu'); handleMenu('reset'); }}>
            <Ionicons name="refresh" size={24} color="#444" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 18 }}>Reset stats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => { SheetManager.hide('set-menu'); handleMenu('delete'); }}>
            <Ionicons name="trash" size={24} color="#d00" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 18, color: '#d00' }}>Delete set</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'center' }} onPress={() => SheetManager.hide('set-menu')}>
            <Ionicons name="close" size={24} color="#444" style={{ marginRight: 16 }} />
            <Text style={{ fontSize: 18, color: '#888' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>
      {/* Edit set name modal (always rendered) */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.importModalBg}>
          <View style={styles.importModalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Edit Set Name</Text>
            <TextInput
              placeholder="Set Name"
              value={editName}
              onChangeText={setEditName}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginVertical: 12 }}
            />
            <Button title="Save" onPress={handleEditSetName} disabled={!editName} />
            <Button title="Cancel" onPress={() => setEditModalVisible(false)} color="#888" />
          </View>
        </View>
      </Modal>
      {/* Import CSV modal */}
      <Modal visible={importModalVisible} transparent animationType="slide">
        <View style={styles.importModalBg}>
          <View style={styles.importModalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Import CSV</Text>
            <Button title={importLoading ? 'Loading...' : (pendingImport.length ? 'CSV Loaded' : 'Pick CSV File')} onPress={handlePickCSV} disabled={importLoading} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
              <Text>File has header row</Text>
              <TouchableOpacity onPress={() => setImportHasHeader(h => !h)} style={{ marginLeft: 8 }}>
                <Ionicons name={importHasHeader ? 'checkbox' : 'square-outline'} size={24} color="#007aff" />
              </TouchableOpacity>
            </View>
            {pendingImport.length > 0 && (
              <Button title="Merge" onPress={handleImportMerge} />
            )}
            <Button title="Close" onPress={() => { setImportModalVisible(false); setPendingImport([]); }} color="#888" />
          </View>
        </View>
      </Modal>
      {current && (
        <TouchableOpacity style={styles.card} onPress={() => setFlipped(f => !f)} activeOpacity={0.9}>
          {/* Audio icon: top left */}
          <TouchableOpacity onPress={pronounce} style={{ position: 'absolute', top: 12, left: 16, zIndex: 2, padding: 4 }}>
            <Ionicons name="volume-high" size={28} color="#007aff" />
          </TouchableOpacity>
          {/* Star icon: top right */}
          <TouchableOpacity onPress={toggleBookmark} style={{ position: 'absolute', top: 12, right: 16, zIndex: 2, padding: 4 }}>
            <Ionicons name={bookmarks.includes(currentIdx) ? "star" : "star-outline"} size={28} color={bookmarks.includes(currentIdx) ? '#FFD700' : '#bbb'} />
          </TouchableOpacity>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {!flipped ? (
              <Text style={styles.word}>{current.word}</Text>
            ) : (
              <>
                <Text style={styles.definition}>{current.definition}</Text>
                <Text style={styles.example}>{current.example}</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      )}
      <View style={{ flexDirection: 'row', marginTop: 20 }}>
        <TouchableOpacity onPress={() => setCurrentIdx(idx => (idx - 1 + items.length) % items.length)} style={{ marginHorizontal: 20 }}>
          <Text style={{ fontSize: 36, color: '#007aff' }}>{'‹'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentIdx(idx => (idx + 1) % items.length)} style={{ marginHorizontal: 20 }}>
          <Text style={{ fontSize: 36, color: '#007aff' }}>{'›'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ marginTop: 16, color: '#888' }}>Card {currentIdx + 1} of {items.length}</Text>
    </SafeAreaView>
  );
} 