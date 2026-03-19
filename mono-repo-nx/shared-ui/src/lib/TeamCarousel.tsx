import React from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { t } from '@poliverai/intl';
import { appAlphaColors, appColors } from './colorTokens';
import { teamMemberAssets } from './landingAssets';

type Member = {
  id: number;
  name: string;
  title: string;
  quote: string;
};

const members: Member[] = [
  { id: 1, name: 'Gabriel Dagadu', title: 'Team Member 1', quote: 'When we teach machines to think, we must also teach them to care.' },
  { id: 2, name: 'Surajudeen Akande', title: 'Team Member 2', quote: 'AI amplifies human creativity and helps us solve previously intractable problems.' },
  { id: 3, name: 'El-Moatasem Madani', title: 'Team Member 3', quote: 'Automation liberates humans to focus on what matters most.' },
  { id: 4, name: 'Labius Ramono Disemelo', title: 'Team Member 4', quote: 'Robust systems and compassionate design go hand in hand.' },
  { id: 5, name: 'Hafiz Syed Ashir Hassan', title: 'Team Member 5', quote: 'Open data and AI can build a fairer future for everyone.' },
  { id: 6, name: 'Foster Luh', title: 'Team Member 6', quote: 'AI must be built with empathy and a focus on human dignity.' },
  { id: 7, name: 'Syed Abrar Ahmad', title: 'Team Member 7', quote: 'Security and privacy are the foundations of trust in AI.' },
  { id: 8, name: 'Timothy Kasenge', title: 'Team Member 8', quote: 'Efficient algorithms enable meaningful AI at scale.' },
  { id: 9, name: 'Keplet Saintil', title: 'Team Member 9', quote: 'Language is the bridge between human intent and machine understanding.' },
  { id: 10, name: 'Elijah Rwothoromo', title: 'Team Member 10', quote: 'Innovation combines curiosity with disciplined engineering.' },
  { id: 11, name: 'Roger Okello', title: 'Team Member 11', quote: 'Quality assurance ensures reliability and user confidence.' },
  { id: 12, name: 'Seun Odewale', title: 'Team Member 12', quote: 'Strong IT foundations make resilient products possible.' },
  { id: 13, name: 'Abraham Omomoh', title: 'Team Member 13', quote: 'Inspiration drives teams to turn ideas into impact.' },
];

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function TeamCarousel() {
  const [index, setIndex] = React.useState(0);
  const { width } = useWindowDimensions();
  const perView = width < 768 ? 1 : 3;
  const maxIndex = Math.max(0, Math.ceil(members.length / perView) - 1);
  const slice = members.slice(index * perView, index * perView + perView);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>{copy('team_carousel.title', 'Meet the Team')}</Text>
        <Text style={styles.subheading}>
          {copy('team_carousel.subtitle', 'Building responsible AI tools to protect privacy and empower organizations.')}
        </Text>
      </View>

      <View style={styles.carouselWrap}>
        <Pressable onPress={() => setIndex((current) => Math.max(0, current - 1))} style={styles.arrowButton}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <View style={styles.cardsWrap}>
          {slice.map((member) => (
            <View key={member.id} style={styles.card}>
              <Image source={teamMemberAssets[member.id as keyof typeof teamMemberAssets]} style={styles.avatar} resizeMode="cover" />
              <Text style={styles.name}>{member.name}</Text>
              <Text style={styles.role}>{member.title}</Text>
              <Text style={styles.quote}>“{member.quote}”</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => setIndex((current) => Math.min(maxIndex, current + 1))} style={styles.arrowButton}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    maxWidth: 1120,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 34,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heading: {
    color: appColors.ink900,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
    textAlign: 'center',
  },
  subheading: {
    marginTop: 12,
    maxWidth: 720,
    color: appColors.slate600,
    fontSize: 18,
    lineHeight: 29,
    textAlign: 'center',
  },
  carouselWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appAlphaColors.borderSoftStrong,
    backgroundColor: appColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: appColors.ink900,
    fontSize: 24,
    fontWeight: '700',
  },
  cardsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
    flex: 1,
  },
  card: {
    width: 300,
    borderRadius: 22,
    backgroundColor: appColors.white,
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  name: {
    marginTop: 14,
    color: appColors.ink900,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  role: {
    marginTop: 4,
    color: appColors.slate500,
    fontSize: 14,
    textAlign: 'center',
  },
  quote: {
    marginTop: 14,
    color: appColors.slate600,
    fontSize: 15,
    lineHeight: 26,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
