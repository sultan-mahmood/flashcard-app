import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import FooterNav from '../../components/FooterNav';
import type { CardSet } from '../FlashcardsScreen';

const STORAGE_KEY = 'flashcardAppSets';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  startStudyButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  startStudyText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemDefinition: {
    fontSize: 16,
    color: '#666',
    marginBottom: 6,
  },
  itemExample: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  itemNumber: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  homeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  homeButtonText: {
    color: '#007aff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default function SetListPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [set, setSet] = useState<CardSet | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          const found = (parsed.sets || []).find((s: CardSet) => s.id === id);
          if (found) {
            setSet(found);
          }
        }
      } catch (error) {
        console.error('Error loading set:', error);
      }
    })();
  }, [id]);

  const handleStartStudy = () => {
    router.push({ pathname: '/set/flashcard', params: { id: id as string } });
  };



  if (!set) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading set...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{set.name}</Text>
        <TouchableOpacity onPress={handleStartStudy} style={styles.startStudyButton}>
          <Text style={styles.startStudyText}>Start Study</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: 50 }]}>
        <FlatList
          data={set.items}
          keyExtractor={(item, index) => `${item.word}-${index}`}
          renderItem={({ item, index }) => (
            <View style={styles.itemCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Text style={styles.itemWord}>{item.word}</Text>
                <Text style={styles.itemNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.itemDefinition}>{item.definition}</Text>
              {item.example && item.example.trim() && (
                <Text style={styles.itemExample}>Example: {item.example}</Text>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Bottom Navigation */}
      <FooterNav />
    </SafeAreaView>
  );
} 