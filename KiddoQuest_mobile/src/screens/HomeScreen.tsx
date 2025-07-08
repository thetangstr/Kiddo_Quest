import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Platform,
  useWindowDimensions,
  ImageBackground 
} from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';

// Feature card component
const FeatureCard = ({ title, description, icon }: { title: string, description: string, icon: string }) => (
  <Card style={styles.featureCard}>
    <View style={styles.featureIconContainer}>
      <Text style={styles.featureIcon}>{icon}</Text>
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>
  </Card>
);

// Testimonial component
const Testimonial = ({ quote, author, role }: { quote: string, author: string, role: string }) => (
  <Card style={styles.testimonialCard}>
    <Text style={styles.testimonialQuote}>"{quote}"</Text>
    <Text style={styles.testimonialAuthor}>{author}</Text>
    <Text style={styles.testimonialRole}>{role}</Text>
  </Card>
);

const HomeScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  // Navigate to login screen
  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  return (
    <ScrollView style={styles.scrollView}>
      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <View style={[styles.heroContent, isMobile ? styles.heroContentMobile : {}]}>
          <Text style={styles.heroTitle}>Empower Your Kids to Achieve Their Goals</Text>
          <Text style={styles.heroSubtitle}>
            The fun, interactive, and rewarding way for children to learn responsibility and achieve their dreams.
          </Text>
          <View style={styles.heroCTAContainer}>
            <Button 
              onPress={handleGetStarted} 
              variant="primary"
              size="large"
            >
              Get Started for FREE
            </Button>
            <View style={styles.platformContainer}>
              <Text style={styles.platformText}>Available on Web, iOS, and Android</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Features Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Why Parents Love Kiddo Quest</Text>
        <View style={[styles.featuresGrid, isMobile ? styles.featuresGridMobile : {}]}>
          <FeatureCard 
            title="Goal Setting" 
            description="Help kids set achievable goals and track their progress with visual indicators."
            icon="🎯" 
          />
          <FeatureCard 
            title="Reward System" 
            description="Motivate children with a customizable reward system that parents can control."
            icon="🏆" 
          />
          <FeatureCard 
            title="Habit Building" 
            description="Foster positive habits through consistent task completion and streaks."
            icon="📅" 
          />
          <FeatureCard 
            title="Parental Control" 
            description="Maintain full oversight with parent-controlled quest approval and reward redemption."
            icon="👨‍👩‍👧‍👦" 
          />
        </View>
      </View>

      {/* Parent Testimonials */}
      <View style={[styles.sectionContainer, styles.testimonialSection]}>
        <Text style={styles.sectionTitle}>What Parents Are Saying</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.testimonialScroll}
        >
          <Testimonial 
            quote="Kiddo Quest has completely transformed how my children approach their responsibilities. They're excited to complete tasks now!"
            author="Sarah M."
            role="Mother of 3"
          />
          <Testimonial 
            quote="The combination of goal-setting and rewards has made such a difference in our home. My son is learning valuable life skills."
            author="Michael T."
            role="Father of 2"
          />
          <Testimonial 
            quote="I love that I can use this on my phone or laptop, and the kids can access it on their tablets. So convenient!"
            author="Jessica K."
            role="Mother of 1"
          />
        </ScrollView>
      </View>

      {/* Download Section */}
      <View style={styles.downloadSection}>
        <Text style={styles.downloadTitle}>Start Your Family's Quest Today</Text>
        <Text style={styles.downloadSubtitle}>
          Join thousands of families using Kiddo Quest to build responsibility, 
          achieve goals, and create positive habits that last a lifetime.
        </Text>
        <Button 
          onPress={handleGetStarted} 
          variant="primary"
          size="large"
        >
          Get Started for FREE
        </Button>
        <View style={styles.platformsRow}>
          <Text style={styles.platformIcon}>🖥️</Text>
          <Text style={styles.platformIcon}>📱</Text>
          <Text style={styles.platformIcon}>📲</Text>
        </View>
        <Text style={styles.platformsCaption}>Available on Web, iOS, and Android</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB', // light gray background
  },
  heroContainer: {
    backgroundColor: '#4F46E5', // primary indigo
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
    alignItems: 'center',
  },
  heroContent: {
    maxWidth: 1024,
    width: '100%',
    alignItems: 'center',
    padding: 16,
  },
  heroContentMobile: {
    padding: 0,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#E0E7FF', // indigo-100
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 600,
  },
  heroCTAContainer: {
    alignItems: 'center',
  },
  platformContainer: {
    marginTop: 16,
  },
  platformText: {
    color: '#E0E7FF', // indigo-100
    fontSize: 14,
  },
  sectionContainer: {
    padding: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937', // gray-800
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 1200,
  },
  featuresGridMobile: {
    flexDirection: 'column',
  },
  featureCard: {
    width: 250,
    margin: 12,
    padding: 24,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2FF', // indigo-50
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937', // gray-800
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280', // gray-500
    textAlign: 'center',
  },
  testimonialSection: {
    backgroundColor: '#F3F4F6', // gray-100
    paddingTop: 40,
    paddingBottom: 40,
  },
  testimonialScroll: {
    maxWidth: '100%',
  },
  testimonialCard: {
    width: 300,
    margin: 12,
    padding: 24,
  },
  testimonialQuote: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    fontStyle: 'italic',
    marginBottom: 16,
  },
  testimonialAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937', // gray-800
  },
  testimonialRole: {
    fontSize: 14,
    color: '#6B7280', // gray-500
  },
  downloadSection: {
    backgroundColor: '#EEF2FF', // indigo-50
    padding: 48,
    alignItems: 'center',
  },
  downloadTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937', // gray-800
    marginBottom: 16,
    textAlign: 'center',
  },
  downloadSubtitle: {
    fontSize: 18,
    color: '#4B5563', // gray-600
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 600,
  },
  platformsRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 8,
  },
  platformIcon: {
    fontSize: 24,
    marginHorizontal: 8,
  },
  platformsCaption: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
});

export default HomeScreen;
