import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@poliverai/shared-ui';

interface Inquiry {
  id: string;
  subject: string;
  from: string;
  email: string;
  date: string;
  status: 'new' | 'in-progress' | 'completed';
  message: string;
}

const mockInquiries: Inquiry[] = [
  {
    id: '1',
    subject: 'Product Demo Request',
    from: 'Alice Cooper',
    email: 'alice@techcorp.com',
    date: '2024-01-15',
    status: 'new',
    message: 'Hi, I\'m interested in scheduling a product demo for our team. We are looking for a solution that can handle our current workflow needs.',
  },
  {
    id: '2',
    subject: 'Partnership Opportunity',
    from: 'Bob Smith',
    email: 'bob@business.com',
    date: '2024-01-14',
    status: 'in-progress',
    message: 'We would like to explore a potential partnership opportunity. Our company specializes in digital marketing and we see synergies with your platform.',
  },
  {
    id: '3',
    subject: 'Technical Support',
    from: 'Carol Johnson',
    email: 'carol@company.org',
    date: '2024-01-13',
    status: 'completed',
    message: 'I\'m experiencing issues with the integration API. Could you please provide some technical assistance?',
  },
  {
    id: '4',
    subject: 'Pricing Information',
    from: 'Dan Williams',
    email: 'dan@startup.io',
    date: '2024-01-12',
    status: 'new',
    message: 'Could you please send me detailed pricing information for your enterprise plan? We are a growing startup with 50+ employees.',
  },
  {
    id: '5',
    subject: 'Feature Request',
    from: 'Eva Brown',
    email: 'eva@agency.com',
    date: '2024-01-11',
    status: 'in-progress',
    message: 'We would love to see a new feature that allows for better collaboration between team members. Is this something on your roadmap?',
  },
];

export const InquiriesScreen = () => {
  const [selectedInquiry, setSelectedInquiry] = useState<string | null>(null);

  const handleInquiryPress = (inquiryId: string) => {
    setSelectedInquiry(selectedInquiry === inquiryId ? null : inquiryId);
  };

  const getStatusColor = (status: Inquiry['status']) => {
    switch (status) {
      case 'new':
        return '#EF4444'; // red
      case 'in-progress':
        return '#F59E0B'; // amber
      case 'completed':
        return '#10B981'; // green
      default:
        return '#6B7280'; // gray
    }
  };

  const getStatusText = (status: Inquiry['status']) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inquiries</Text>
        <Text style={styles.subtitle}>Manage customer inquiries and requests</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {mockInquiries.map((inquiry) => (
          <Card
            key={inquiry.id}
            style={[
              styles.inquiryCard,
              selectedInquiry === inquiry.id && styles.selectedCard,
            ]}
            onPress={() => handleInquiryPress(inquiry.id)}
          >
            <View style={styles.inquiryHeader}>
              <View style={styles.inquiryInfo}>
                <Text style={styles.inquirySubject}>{inquiry.subject}</Text>
                <Text style={styles.inquiryFrom}>From: {inquiry.from}</Text>
                <Text style={styles.inquiryDate}>{new Date(inquiry.date).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(inquiry.status) }]}>
                <Text style={styles.statusText}>{getStatusText(inquiry.status)}</Text>
              </View>
            </View>
            
            {selectedInquiry === inquiry.id && (
              <View style={styles.inquiryDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{inquiry.email}</Text>
                </View>
                <View style={styles.messageContainer}>
                  <Text style={styles.detailLabel}>Message:</Text>
                  <Text style={styles.messageText}>{inquiry.message}</Text>
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
  inquiryCard: {
    marginBottom: 12,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  inquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  inquiryInfo: {
    flex: 1,
    marginRight: 12,
  },
  inquirySubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  inquiryFrom: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  inquiryDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  inquiryDetails: {
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
  messageContainer: {
    marginTop: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    marginTop: 4,
  },
});