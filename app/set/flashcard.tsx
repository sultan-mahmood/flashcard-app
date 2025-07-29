import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import Papa from 'papaparse';
import React, { useEffect, useState } from 'react';
import { Button, Modal, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import FooterNav from '../../components/FooterNav';
import type { CardSet, Item } from '../FlashcardsScreen';

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  backButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
  },
});

export default function SetPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [set, setSet] = useState<CardSet | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [importHasHeader, setImportHasHeader] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [pendingImport, setPendingImport] = useState<any[]>([]);
  const [starredOnly, setStarredOnly] = useState(false);
  const [starredCurrentIdx, setStarredCurrentIdx] = useState(0);
  const [starredItems, setStarredItems] = useState<Item[]>([]);
  const [starredItemsInitialized, setStarredItemsInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          const found = (parsed.sets || []).find((s: CardSet) => s.id === id);
          if (found) {
            // Check if we have a stored shuffled order for this set
            const shuffledOrderKey = `shuffled_order_${id}`;
            const shuffledOrderData = await AsyncStorage.getItem(shuffledOrderKey);
            
            let shuffledItems;
            if (shuffledOrderData) {
              // Use the stored shuffled order
              const shuffledOrder = JSON.parse(shuffledOrderData);
              shuffledItems = shuffledOrder.map((index: number) => found.items[index]);
            } else {
              // First time loading this set - create and store shuffled order
              const shuffledOrder = Array.from({ length: found.items.length }, (_, i) => i)
                .sort(() => Math.random() - 0.5);
              shuffledItems = shuffledOrder.map((index: number) => found.items[index]);
              await AsyncStorage.setItem(shuffledOrderKey, JSON.stringify(shuffledOrder));
            }
            
            setSet({ ...found, items: shuffledItems });
            
            // Load bookmarks and learned states for this set
            const bookmarksKey = `bookmarks_${id}`;
            const learnedKey = `learned_${id}`;
            const currentPositionKey = `current_position_${id}`;
            
            const bookmarksData = await AsyncStorage.getItem(bookmarksKey);
            const currentPositionData = await AsyncStorage.getItem(currentPositionKey);
            
            if (bookmarksData) {
              setBookmarks(JSON.parse(bookmarksData));
            }

            if (currentPositionData) {
              setCurrentIdx(JSON.parse(currentPositionData));
            }
            
            // Load starred items order and position
            const starredOrderKey = `starred_items_${id}`;
            const starredPositionKey = `starred_position_${id}`;
            
            const starredOrderData = await AsyncStorage.getItem(starredOrderKey);
            const starredPositionData = await AsyncStorage.getItem(starredPositionKey);
            
            if (starredOrderData) {
              const starredItemsList = JSON.parse(starredOrderData);
              setStarredItems(starredItemsList);
              setStarredItemsInitialized(true);
            }
            if (starredPositionData) {
              setStarredCurrentIdx(JSON.parse(starredPositionData));
            }
          } else {
            setSet(null);
          }
        }
      } catch {}
    })();
  }, [id]);

  // Save bookmarks to AsyncStorage whenever they change
  const saveBookmarks = async (newBookmarks: number[]) => {
    try {
      const bookmarksKey = `bookmarks_${id}`;
      await AsyncStorage.setItem(bookmarksKey, JSON.stringify(newBookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  };



  // Save current position to AsyncStorage
  const saveCurrentPosition = async (position: number) => {
    try {
      const currentPositionKey = `current_position_${id}`;
      await AsyncStorage.setItem(currentPositionKey, JSON.stringify(position));
    } catch (error) {
      console.error('Error saving current position:', error);
    }
  };

  // Save starred position to AsyncStorage
  const saveStarredPosition = async (position: number) => {
    try {
      const starredPositionKey = `starred_position_${id}`;
      await AsyncStorage.setItem(starredPositionKey, JSON.stringify(position));
    } catch (error) {
      console.error('Error saving starred position:', error);
    }
  };

  // Update starred items order and save it
  const updateStarredItems = async (newBookmarks: number[]) => {
    if (newBookmarks.length === 0) {
      setStarredItems([]);
      // Clear starred items from storage when no bookmarks
      try {
        const starredOrderKey = `starred_items_${id}`;
        const starredPositionKey = `starred_position_${id}`;
        await AsyncStorage.removeItem(starredOrderKey);
        await AsyncStorage.removeItem(starredPositionKey);
      } catch (error) {
        console.error('Error clearing starred items:', error);
      }
      return;
    }
    
    // Get the actual starred items from the current set order
    const starredItemsFromSet = newBookmarks.map((index: number) => set!.items[index]);
    
    // Create a new shuffled order for starred items
    const shuffledStarredItems = [...starredItemsFromSet].sort(() => Math.random() - 0.5);
    
    setStarredItems(shuffledStarredItems);
    setStarredCurrentIdx(0); // Reset to first starred item
    setStarredItemsInitialized(true);
    
    // Save the starred items directly (not indices)
    try {
      const starredOrderKey = `starred_items_${id}`;
      const starredPositionKey = `starred_position_${id}`;
      await AsyncStorage.setItem(starredOrderKey, JSON.stringify(shuffledStarredItems));
      await AsyncStorage.setItem(starredPositionKey, JSON.stringify(0));
    } catch (error) {
      console.error('Error saving starred items:', error);
    }
  };

  // Initialize starred items only if they don't exist and we have bookmarks
  const initializeStarredItems = async () => {
    if (starredItems.length === 0 && bookmarks.length > 0) {
      // Get the actual starred items from the current set order
      const starredItemsFromSet = bookmarks.map((index: number) => set!.items[index]);
      const shuffledStarredItems = [...starredItemsFromSet].sort(() => Math.random() - 0.5);
      setStarredItems(shuffledStarredItems);
      
      // Save the starred items directly
      try {
        const starredOrderKey = `starred_items_${id}`;
        const starredPositionKey = `starred_position_${id}`;
        await AsyncStorage.setItem(starredOrderKey, JSON.stringify(shuffledStarredItems));
        await AsyncStorage.setItem(starredPositionKey, JSON.stringify(0));
      } catch (error) {
        console.error('Error saving starred items:', error);
      }
    }
  };

  if (!set) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        {/* Simple Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => SheetManager.show('set-menu')} style={styles.menuButton}>
            <Icon name="ellipsis-horizontal" size={30} color="#333" />
          </TouchableOpacity>
        </View>
        {/* Set Name */}
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center', backgroundColor: 'red', padding: 10, marginTop: Platform.OS === 'ios' ? 170 : 150 }}>
          Loading set...
        </Text>
      </SafeAreaView>
    );
  }

  const items = starredOnly ? starredItems : (set ? set.items : []);
  const current = starredOnly ? starredItems[starredCurrentIdx] : (set ? set.items[currentIdx] : null);
  const currentPosition = starredOnly ? starredCurrentIdx : currentIdx;

  const pronounce = () => {
    if (!current) return;
    Speech.speak(current.word);
  };

  const toggleBookmark = () => {
    if (currentIdx === null) return;
    
    let newBookmarks;
    if (starredOnly) {
      // In starred mode, we're viewing a starred item, so remove it from bookmarks
      // We need to find the original index of this starred item in the full set
      const currentStarredItem = starredItems[starredCurrentIdx];
      const originalIndex = set!.items.findIndex(item => 
        item.word === currentStarredItem.word && 
        item.definition === currentStarredItem.definition
      );
      
      if (originalIndex !== -1) {
        newBookmarks = bookmarks.filter(idx => idx !== originalIndex);
      } else {
        return; // Couldn't find the original item
      }
    } else {
      // In full set mode, toggle the bookmark for the current item
      newBookmarks = bookmarks.includes(currentIdx) 
        ? bookmarks.filter(idx => idx !== currentIdx)
        : [...bookmarks, currentIdx];
    }
    
    setBookmarks(newBookmarks);
    saveBookmarks(newBookmarks);
    updateStarredItems(newBookmarks);
  };

  // Swipe gesture handling
  const onGestureEvent = (event: any) => {
    // This will be called during the gesture
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const swipeThreshold = 50; // Minimum distance to trigger swipe
      
      if (translationX > swipeThreshold) {
        // Swipe right - go to previous card
        const newIndex = (currentPosition - 1 + items.length) % items.length;
        if (starredOnly) {
          setStarredCurrentIdx(newIndex);
          saveStarredPosition(newIndex);
        } else {
          setCurrentIdx(newIndex);
          saveCurrentPosition(newIndex);
        }
        setFlipped(false); // Reset card to front side
      } else if (translationX < -swipeThreshold) {
        // Swipe left - go to next card
        const newIndex = (currentPosition + 1) % items.length;
        if (starredOnly) {
          setStarredCurrentIdx(newIndex);
          saveStarredPosition(newIndex);
        } else {
          setCurrentIdx(newIndex);
          saveCurrentPosition(newIndex);
        }
        setFlipped(false); // Reset card to front side
      }
    }
  };

  // Menu actions
  const handleMenu = async (action: string) => {
    if (action === 'edit') {
      setEditName(set?.name || '');
      setEditModalVisible(true);
    } else if (action === 'import') {
      setImportModalVisible(true);
    } else if (action === 'starred') {
      setStarredOnly(true);
      if (bookmarks.length > 0) {
        // Initialize starred items only if they haven't been initialized yet
        if (!starredItemsInitialized) {
          await initializeStarredItems();
          setStarredItemsInitialized(true);
          // Only reset position when initializing new starred items
          setStarredCurrentIdx(0);
          saveStarredPosition(0);
        }
        // Don't reset position if starred items already exist
      }
    } else if (action === 'reset') {
      setBookmarks([]);
      setStarredOnly(false);
      setCurrentIdx(0);
      setStarredItems([]);
      setStarredItemsInitialized(false);
      // Clear persisted data
      const bookmarksKey = `bookmarks_${id}`;
      const learnedKey = `learned_${id}`;
      const currentPositionKey = `current_position_${id}`;
      const shuffledOrderKey = `shuffled_order_${id}`;
      const starredOrderKey = `starred_items_${id}`;
      const starredPositionKey = `starred_position_${id}`;
      AsyncStorage.removeItem(bookmarksKey);
      AsyncStorage.removeItem(learnedKey);
      AsyncStorage.removeItem(currentPositionKey);
      AsyncStorage.removeItem(shuffledOrderKey);
      AsyncStorage.removeItem(starredOrderKey);
      AsyncStorage.removeItem(starredPositionKey);
      
      // Re-shuffle the cards for a fresh start
      if (set) {
        const newShuffledOrder = Array.from({ length: set.items.length }, (_, i) => i)
          .sort(() => Math.random() - 0.5);
        const newShuffledItems = newShuffledOrder.map((index: number) => set.items[index]);
        setSet({ ...set, items: newShuffledItems });
        AsyncStorage.setItem(shuffledOrderKey, JSON.stringify(newShuffledOrder));
      }
    } else if (action === 'delete') {
      (async () => {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          const newSets = (parsed.sets || []).filter((s: CardSet) => s.id !== id);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sets: newSets }));
        }
        // Clean up persisted data for this set
        const bookmarksKey = `bookmarks_${id}`;
        const learnedKey = `learned_${id}`;
        const currentPositionKey = `current_position_${id}`;
        const shuffledOrderKey = `shuffled_order_${id}`;
        const starredOrderKey = `starred_items_${id}`;
        const starredPositionKey = `starred_position_${id}`;
        await AsyncStorage.removeItem(bookmarksKey);
        await AsyncStorage.removeItem(learnedKey);
        await AsyncStorage.removeItem(currentPositionKey);
        await AsyncStorage.removeItem(shuffledOrderKey);
        await AsyncStorage.removeItem(starredOrderKey);
        await AsyncStorage.removeItem(starredPositionKey);
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
      const parsed = Papa.parse(csv, { header: false }); // Always parse as arrays
      
      // Store the raw parsed data
      setPendingImport(parsed.data);
    }
    setImportLoading(false);
  };

  const processCSVDataForImport = (rawData: any[], hasHeader: boolean): Item[] => {
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

  const handleImportMerge = async () => {
    if (!set || !pendingImport) return;
    
    // Process the CSV data based on current header setting
    const processedItems = processCSVDataForImport(pendingImport, importHasHeader);
    
    if (processedItems.length === 0) {
      return;
    }
    
    // Create a map of existing items by word for quick lookup
    const existingItemsMap = new Map();
    set.items.forEach(item => {
      existingItemsMap.set(item.word.toLowerCase(), item);
    });
    
    // Process new items, replacing duplicates with new data
    const mergedItems = [...set.items]; // Start with existing items
    
    processedItems.forEach(newItem => {
      const existingItem = existingItemsMap.get(newItem.word.toLowerCase());
      if (existingItem) {
        // Replace existing item with new item
        const index = mergedItems.findIndex(item => item.word.toLowerCase() === newItem.word.toLowerCase());
        if (index !== -1) {
          mergedItems[index] = newItem;
        }
      } else {
        // Add new item
        mergedItems.push(newItem);
      }
    });
    
    // Update the set in AsyncStorage and local state
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const newSets = (parsed.sets || []).map((s: CardSet) =>
        s.id === id ? { ...s, items: mergedItems } : s
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sets: newSets }));
      setSet({ ...set, items: mergedItems });
    }
    setImportModalVisible(false);
    setPendingImport([]);
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      {/* Simple Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => SheetManager.show('set-menu')} style={styles.menuButton}>
          <Icon name="ellipsis-horizontal" size={30} color="#333" />
        </TouchableOpacity>
      </View>
      {/* Set Name */}
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333', textAlign: 'center', marginTop: Platform.OS === 'ios' ? 130 : 110 }}>
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
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} onPress={() => { SheetManager.hide('set-menu'); setTimeout(() => handleMenu('import'), 300); }}>
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
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Import CSV to Set</Text>
            
            {/* CSV format hint - shown before upload */}
            <Text style={{ fontSize: 11, color: '#888', marginBottom: 12, fontStyle: 'italic', textAlign: 'center' }}>
              CSV columns should be: term, definition, example (optional)
            </Text>
            
            {/* Step 1: Upload CSV File */}
            <Button 
              title={importLoading ? 'Loading...' : (pendingImport.length ? 'CSV Loaded ✓' : 'Upload CSV File')} 
              onPress={handlePickCSV} 
              disabled={importLoading} 
            />
            
            {/* Header toggle option */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
              <Text>File has header row</Text>
              <TouchableOpacity onPress={() => setImportHasHeader(h => !h)} style={{ marginLeft: 8 }}>
                <Ionicons name={importHasHeader ? 'checkbox' : 'square-outline'} size={24} color="#007aff" />
              </TouchableOpacity>
            </View>
            
            {/* Step 2: Show merge info and button */}
            {pendingImport.length > 0 && (
              <>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  {processCSVDataForImport(pendingImport, importHasHeader).length} items ready to merge
                </Text>
                <Text style={{ fontSize: 12, color: '#007aff', marginBottom: 8 }}>
                  Duplicates will be replaced with new data
                </Text>
                <Button title="Merge with Set" onPress={handleImportMerge} />
              </>
            )}
            
            <Button 
              title="Cancel" 
              onPress={() => { 
                setImportModalVisible(false); 
                setPendingImport([]); 
              }} 
              color="#888" 
            />
          </View>
        </View>
      </Modal>
      {current && (
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <View style={styles.card}>
            {/* Audio icon: top left */}
            <TouchableOpacity onPress={pronounce} style={{ position: 'absolute', top: 12, left: 16, zIndex: 2, padding: 4 }}>
              <Ionicons name="volume-high" size={28} color="#007aff" />
            </TouchableOpacity>
            {/* Star icon: top right */}
            <TouchableOpacity onPress={toggleBookmark} style={{ position: 'absolute', top: 12, right: 16, zIndex: 2, padding: 4 }}>
              <Ionicons 
                name={starredOnly ? "star" : (bookmarks.includes(currentIdx) ? "star" : "star-outline")} 
                size={28} 
                color={starredOnly ? '#FFD700' : (bookmarks.includes(currentIdx) ? '#FFD700' : '#bbb')} 
              />
            </TouchableOpacity>
            {/* Card content with tap to flip */}
            <TouchableOpacity 
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }} 
              onPress={() => setFlipped(f => !f)} 
              activeOpacity={0.9}
            >
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {!flipped ? (
                  <Text style={styles.word}>{current.word}</Text>
                ) : (
                  <>
                    <Text style={styles.definition}>{current.definition}</Text>
                    {current.example && current.example.trim() && (
                      <Text style={styles.example}>Example: {current.example}</Text>
                    )}
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </PanGestureHandler>
      )}
      <View style={{ flexDirection: 'row', marginTop: 20, alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => {
          const newIndex = (currentPosition - 1 + items.length) % items.length;
          if (starredOnly) {
            setStarredCurrentIdx(newIndex);
            saveStarredPosition(newIndex);
          } else {
            setCurrentIdx(newIndex);
            saveCurrentPosition(newIndex);
          }
        }} style={{ marginHorizontal: 20 }}>
          <Text style={{ fontSize: 36, color: '#007aff' }}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={{ color: '#888', fontSize: 16 }}>{currentPosition + 1} of {items.length}</Text>
        <TouchableOpacity onPress={() => {
          const newIndex = (currentPosition + 1) % items.length;
          if (starredOnly) {
            setStarredCurrentIdx(newIndex);
            saveStarredPosition(newIndex);
          } else {
            setCurrentIdx(newIndex);
            saveCurrentPosition(newIndex);
          }
        }} style={{ marginHorizontal: 20 }}>
          <Text style={{ fontSize: 36, color: '#007aff' }}>{'›'}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Bottom Navigation */}
      <FooterNav />
    </SafeAreaView>
  );
} 