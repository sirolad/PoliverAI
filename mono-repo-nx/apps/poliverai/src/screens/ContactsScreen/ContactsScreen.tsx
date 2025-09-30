import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@poliverai/shared-ui';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Tech Corp',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@company.com',
    phone: '+1 (555) 987-6543',
    company: 'Design Studio',
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'mike.brown@business.org',
    phone: '+1 (555) 456-7890',
    company: 'Business Solutions',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@startup.io',
    phone: '+1 (555) 789-0123',
    company: 'Innovation Labs',
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'david.w@agency.com',
    phone: '+1 (555) 234-5678',
    company: 'Marketing Agency',
  },
];

export const ContactsScreen = () => {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const handleContactPress = (contactId: string) => {
    setSelectedContact(selectedContact === contactId ? null : contactId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <Text style={styles.subtitle}>Manage your business contacts</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {mockContacts.map((contact) => (
          <Card
            key={contact.id}
            style={[
              styles.contactCard,
              selectedContact === contact.id && styles.selectedCard,
            ]}
            onPress={() => handleContactPress(contact.id)}
          >
            <View style={styles.contactHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {contact.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactCompany}>{contact.company}</Text>
              </View>
            </View>
            
            {selectedContact === contact.id && (
              <View style={styles.contactDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{contact.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{contact.phone}</Text>
                </View>
              </View>
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contactCard: {
    marginBottom: 12,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  contactCompany: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
});