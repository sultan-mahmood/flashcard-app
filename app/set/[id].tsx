import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { CardSet } from '../FlashcardsScreen';

const STORAGE_KEY = 'flashcardAppSets';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '98%',
    minHeight: 260,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 36,
    shadowColor: '#888',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
    marginVertical: 22,
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
});

export default function SetPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [set, setSet] = useState<CardSet | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [learned, setLearned] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          const found = (parsed.sets || []).find((s: CardSet) => s.id === id);
          setSet(found || null);
        }
      } catch {}
    })();
  }, [id]);

  if (!set) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: 20 }}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text>Set not found.</Text>
      </SafeAreaView>
    );
  }

  const items = set.items || [];
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

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: 20 }}>
        <Ionicons name="chevron-back" size={28} color="#333" />
      </TouchableOpacity>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>{set.name}</Text>
      {current && (
        <>
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <TouchableOpacity onPress={pronounce} style={{ padding: 4 }}>
              <Ionicons name="volume-high" size={28} color="#007aff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleBookmark} style={{ padding: 4 }}>
              <Ionicons name={bookmarks.includes(currentIdx) ? "star" : "star-outline"} size={28} color={bookmarks.includes(currentIdx) ? '#FFD700' : '#bbb'} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.card} onPress={() => setFlipped(f => !f)} activeOpacity={0.9}>
            {!flipped ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.word}>{current.word}</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.definition}>{current.definition}</Text>
                <Text style={styles.example}>{current.example}</Text>
              </View>
            )}
          </TouchableOpacity>
        </>
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