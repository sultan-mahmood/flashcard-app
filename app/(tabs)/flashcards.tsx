import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as Speech from 'expo-speech';
import Papa from 'papaparse';
import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, Modal, PanResponder, SafeAreaView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { DocumentPickerAsset } from 'expo-document-picker';

// Card with word, definition, example
export type Flashcard = {
  word: string;
  definition: string;
  example: string;
};

export type CardSet = {
  id: string;
  name: string;
  cards: Flashcard[];
};

const STORAGE_KEY = 'flashcardAppSets';

// Place styles here
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    width: '98%',
    minHeight: 260,
    backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', // fallback for RN: use a light color
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e7ef',
    justifyContent: 'center', // vertical centering
  },
  word: {
    fontSize: 28, // smaller than before
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
    fontSize: 18, // smaller than before
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  menuBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  fabIcon: {
    fontSize: 30,
    color: '#fff',
  },
});

export default function FlashcardsScreen() {
  const [sets, setSets] = useState<CardSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [learned, setLearned] = useState<number[]>([]);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetModal, setShowSetModal] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [hasHeader, setHasHeader] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);

  // Load from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          setSets(parsed.sets || []);
          setSelectedSetId(parsed.selectedSetId || null);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Save to AsyncStorage
  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sets, selectedSetId })
      );
    }
  }, [sets, selectedSetId, loading]);

  // Get selected set and cards
  const selectedSet = sets.find(s => s.id === selectedSetId) || null;
  const cards = selectedSet ? selectedSet.cards : [];

  // Filter cards if starredOnly
  const displayCards = starredOnly ? cards.filter((_, idx) => bookmarks.includes(idx)) : cards;

  // When set changes, pick a random card
  useEffect(() => {
    if (selectedSet && cards.length > 0) {
      const available = cards.map((_, idx) => idx).filter(idx => !learned.includes(idx));
      if (available.length > 0) {
        const randomIdx = available[Math.floor(Math.random() * available.length)];
        setCurrentIdx(randomIdx);
        setShowAnswer(false);
        setFlipped(false);
      } else {
        setCurrentIdx(null);
      }
    } else {
      setCurrentIdx(null);
    }
  }, [selectedSetId, sets]);

  // Next/Back navigation
  const goToNext = () => {
    if (!cards.length) return;
    if (currentIdx === null) return;
    let idx = currentIdx + 1;
    if (idx >= cards.length) idx = 0;
    setCurrentIdx(idx);
    setShowAnswer(false);
    setFlipped(false);
  };
  const goToPrev = () => {
    if (!cards.length) return;
    if (currentIdx === null) return;
    let idx = currentIdx - 1;
    if (idx < 0) idx = cards.length - 1;
    setCurrentIdx(idx);
    setShowAnswer(false);
    setFlipped(false);
  };

  // Swipe gesture
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 20,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -20) goToNext();
      else if (gestureState.dx > 20) goToPrev();
    },
  });

  // Handle CSV upload and merge
  const pickCSV = async () => {
    if (!selectedSet) {
      Alert.alert('Select a set first');
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
    if (!result.canceled && 'assets' in result && result.assets && result.assets.length > 0) {
      const asset = result.assets[0] as DocumentPickerAsset;
      const response = await fetch(asset.uri);
      const csv = await response.text();
      const parsed = Papa.parse(csv, { header: hasHeader });
      let newCards: Flashcard[] = [];
      if (hasHeader) {
        // Normalize keys in each row
        newCards = parsed.data.map((row: any) => {
          const norm: any = {};
          Object.keys(row).forEach(k => {
            norm[k.trim().toLowerCase()] = row[k];
          });
          return {
            word: norm.word || '',
            definition: norm.definition || '',
            example: norm.example || ''
          };
        }).filter(card => card && card.word && card.definition);
      } else {
        newCards = parsed.data
          .map((row: any) => {
            if (!Array.isArray(row) || row.length < 2) return null;
            return {
              word: row[0] || '',
              definition: row[1] || '',
              example: row[2] || ''
            };
          })
          .filter((card): card is Flashcard => !!card && !!card.word && !!card.definition);
      }
      const existingWords = new Set(selectedSet.cards.map(card => card.word));
      const merged = [
        ...selectedSet.cards,
        ...newCards.filter(card => !existingWords.has(card.word))
      ];
      setSets(sets.map(s => s.id === selectedSet.id ? { ...s, cards: merged } : s));
      setCurrentIdx(null);
      setShowAnswer(false);
      setFlipped(false);
      setLearned([]);
      setBookmarks([]);
    }
  };

  // Mark as learned
  const markAsLearned = () => {
    if (currentIdx !== null && !learned.includes(currentIdx)) {
      setLearned([...learned, currentIdx]);
      // pickRandomCard(); // This function is no longer used
    }
  };

  // Toggle bookmark
  const toggleBookmark = () => {
    if (currentIdx === null) return;
    if (bookmarks.includes(currentIdx)) {
      setBookmarks(bookmarks.filter(idx => idx !== currentIdx));
    } else {
      setBookmarks([...bookmarks, currentIdx]);
    }
  };

  // Pronounce word
  const pronounce = async () => {
    if (currentIdx === null) return;
    const card = cards[currentIdx];
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
      // Play a short silent audio file to wake up the speaker
      // const { sound } = await Audio.Sound.createAsync(require('../../assets/silence.mp3'));
      // await sound.playAsync();
      // await sound.unloadAsync();
    } catch (e) {}
    Speech.speak(card.word);
  };

  // Show bookmarks
  const showBookmarks = () => {
    if (bookmarks.length === 0) return;
    const idx = bookmarks[Math.floor(Math.random() * bookmarks.length)];
    setCurrentIdx(idx);
    setShowAnswer(false);
    setFlipped(false);
  };

  // Add new set
  const addSet = () => {
    if (!newSetName.trim()) return;
    const id = Date.now().toString();
    setSets([...sets, { id, name: newSetName.trim(), cards: [] }]);
    setNewSetName('');
    setShowSetModal(false);
    setSelectedSetId(id);
    setCurrentIdx(null);
    setLearned([]);
    setBookmarks([]);
    setShowAnswer(false);
    setFlipped(false);
  };

  // Select set
  const selectSet = (id: string) => {
    setSelectedSetId(id);
    setCurrentIdx(null);
    setLearned([]);
    setBookmarks([]);
    setShowAnswer(false);
    setFlipped(false);
  };

  // Delete set
  const deleteSet = (id: string) => {
    Alert.alert('Delete Set', 'Are you sure you want to delete this set?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setSets(sets.filter(s => s.id !== id));
        if (selectedSetId === id) {
          setSelectedSetId(null);
          setCurrentIdx(null);
          setLearned([]);
          setBookmarks([]);
          setShowAnswer(false);
          setFlipped(false);
        }
      }},
    ]);
  };

  // Card flip
  const flipCard = () => setFlipped(f => !f);

  // Menu actions
  const handleMenu = (action: string) => {
    setMenuVisible(false);
    if (action === 'edit') {
      setShowSetModal(true);
    } else if (action === 'import') {
      setImportModalVisible(true);
    } else if (action === 'delete') {
      deleteSet(selectedSetId!);
    } else if (action === 'starred') {
      setStarredOnly(true);
    } else if (action === 'reset') {
      setLearned([]);
      setBookmarks([]);
    }
  };
  const closeStarred = () => setStarredOnly(false);

  // UI
  if (!selectedSet) {
    // Show carousel of sets if no set is selected
    return (
      <SafeAreaView style={[styles.container, { position: 'relative' }]}>
        <Text style={styles.title}>Your Sets</Text>
        <FlatList
          data={sets}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          contentContainerStyle={{ alignItems: 'center', flexGrow: 1, justifyContent: sets.length === 0 ? 'center' : 'flex-start' }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.setCard} onPress={() => selectSet(item.id)}>
              <Text style={styles.setName}>{item.name}</Text>
              <Text style={styles.setCount}>{item.cards.length} cards</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No sets yet. Tap + to create your first set.</Text>}
        />
        <TouchableOpacity style={[styles.fab, { top: 32, right: 32, bottom: undefined, backgroundColor: 'red', borderWidth: 2, borderColor: 'yellow', zIndex: 100, position: 'absolute' }]} onPress={() => setShowSetModal(true)}>
          <Ionicons name="add" size={36} color="#fff" />
        </TouchableOpacity>
        <Modal visible={showSetModal} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Create New Set</Text>
              <TextInput
                placeholder="New set name"
                value={newSetName}
                onChangeText={setNewSetName}
                style={styles.input}
              />
              <Button title="Add Set" onPress={addSet} />
              <Button title="Close" onPress={() => setShowSetModal(false)} color="#888" />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }
  return (
    <View style={styles.container}>
      {/* Top bar with set title, back button, and menu */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => setSelectedSetId(null)} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>{selectedSet.name}</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ padding: 8 }}>
          <Ionicons name="ellipsis-vertical" size={28} color="#333" />
        </TouchableOpacity>
      </View>
      {/* Menu modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.menuBg} onPress={() => setMenuVisible(false)} activeOpacity={1}>
          <View style={styles.menuContent}>
            <TouchableOpacity onPress={() => handleMenu('edit')} style={styles.menuItem}><Text>Edit set name</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenu('import')} style={styles.menuItem}><Text>Import CSV</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenu('starred')} style={styles.menuItem}><Text>View starred</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenu('reset')} style={styles.menuItem}><Text>Reset stats</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenu('delete')} style={styles.menuItem}><Text style={{ color: '#d00' }}>Delete set</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Import modal */}
      <Modal visible={importModalVisible} transparent animationType="slide">
        <View style={styles.importModalBg}>
          <View style={styles.importModalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Import CSV</Text>
            <Switch value={hasHeader} onValueChange={setHasHeader} />
            <Text style={{ marginBottom: 12 }}>File has header row</Text>
            <Button title="Pick CSV File" onPress={pickCSV} />
            <Button title="Close" onPress={() => setImportModalVisible(false)} color="#888" />
          </View>
        </View>
      </Modal>
      {/* Starred only view */}
      {starredOnly && (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', color: '#007aff' }}>Starred Only</Text>
          <Button title="Show All" onPress={closeStarred} />
        </View>
      )}
      {/* Flashcard carousel */}
      {currentIdx !== null && displayCards.length > 0 && displayCards[currentIdx] && (
        <View {...panResponder.panHandlers} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <TouchableOpacity onPress={goToPrev} style={{ padding: 16 }}>
            <Text style={{ fontSize: 36, color: '#007aff' }}>{'‹'}</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', width: '80%' }}>
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <TouchableOpacity onPress={pronounce} style={{ padding: 4 }}>
                <Ionicons name="volume-high" size={28} color="#007aff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleBookmark} style={{ padding: 4 }}>
                <Ionicons name={bookmarks.includes(currentIdx) ? "star" : "star-outline"} size={28} color={bookmarks.includes(currentIdx) ? '#FFD700' : '#bbb'} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.card} onPress={flipCard} activeOpacity={0.9}>
              {!flipped ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.word}>{displayCards[currentIdx].word}</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.definition}>{displayCards[currentIdx].definition}</Text>
                  <Text style={styles.example}>{displayCards[currentIdx].example}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={goToNext} style={{ padding: 16 }}>
            <Text style={{ fontSize: 36, color: '#007aff' }}>{'›'}</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={{ margin: 20 }}>
        <Text>Cards: {cards.length}</Text>
        <Text>Learned: {learned.length}</Text>
        <Text>Bookmarks: {bookmarks.length}</Text>
      </View>
      <Text style={{ fontSize: 12, color: '#888', marginTop: 16 }}>
        Upload a CSV file with columns: &quot;word,definition,example&quot; (header required).
      </Text>
      {/* Set Modal */}
      <Modal visible={showSetModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Sets</Text>
            <FlatList
              data={sets}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => { selectSet(item.id); setShowSetModal(false); }} style={{ padding: 8 }}>
                  <Text style={{ fontSize: 16 }}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text>No sets yet.</Text>}
            />
            <TextInput
              placeholder="New set name"
              value={newSetName}
              onChangeText={setNewSetName}
              style={styles.input}
            />
            <Button title="Add Set" onPress={addSet} />
            <Button title="Close" onPress={() => setShowSetModal(false)} color="#888" />
          </View>
        </View>
      </Modal>
    </View>
  );
}