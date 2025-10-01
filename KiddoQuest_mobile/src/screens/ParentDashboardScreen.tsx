import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useStore from '../store/useStore';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const ParentDashboardScreen = () => {
  const { user, children, logoutParent, isLoading } = useStore((state: any) => ({
    user: state.user,
    children: state.children,
    logoutParent: state.logoutParent,
    isLoading: state.isLoading
  }));
  
  const navigation = useNavigation();
  
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#F9FAFB',
      padding: 16
    }}>
      <View style={{ 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 16
      }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
          Parent Dashboard
        </Text>
        <Button
          onPress={logoutParent}
          variant="secondary"
          size="small"
        >
          Log Out
        </Button>
      </View>
      
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '500', color: '#4B5563', marginBottom: 8 }}>
          Welcome back, {user?.displayName || user?.email || 'Parent'}
        </Text>
      </View>

      {/* Management Section */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginBottom: 12 }}>
          Management
        </Text>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          gap: 8
        }}>
          <Button
            onPress={() => navigation.navigate('ManageQuests' as never)}
            variant="primary"
            style={{ flex: 1 }}
            size="small"
          >
            Quests
          </Button>
          <Button
            onPress={() => navigation.navigate('ManageRewards' as never)}
            variant="primary"
            style={{ flex: 1 }}
            size="small"
          >
            Rewards
          </Button>
          <Button
            onPress={() => navigation.navigate('ManagePenalties' as never)}
            variant="danger"
            style={{ flex: 1 }}
            size="small"
          >
            Penalties
          </Button>
        </View>
      </View>
      
      {children && children.length > 0 ? (
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginBottom: 12 }}>
            Your Children
          </Text>
          <FlatList
            data={children}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={{ marginBottom: 12 }}>
                <View style={{ padding: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
                    Age: {item.age}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <Button 
                      onPress={() => navigation.navigate('EditChild', { childId: item.id })}
                      variant="secondary"
                      size="small"
                      style={{ marginRight: 8 }}
                    >
                      Edit
                    </Button>
                    <Button 
                      onPress={() => {
                        // Navigate to child dashboard
                        useStore.getState().selectChild(item);
                      }}
                      variant="primary"
                      size="small"
                    >
                      View Dashboard
                    </Button>
                  </View>
                </View>
              </Card>
            )}
            ListEmptyComponent={(
              <View style={{ alignItems: 'center', marginVertical: 24 }}>
                <Text style={{ color: '#6B7280', marginBottom: 16 }}>No children added yet</Text>
              </View>
            )}
          />
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 16 }}>
            You haven't added any children yet
          </Text>
          <Button
            onPress={() => {
              // Navigate to add child screen (will implement later)
              // navigation.navigate('AddChild');
            }}
            variant="primary"
          >
            Add a Child
          </Button>
        </View>
      )}
      
      {isLoading && (
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.7)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <LoadingSpinner message="Loading..." />
        </View>
      )}
    </View>
  );
};

export default ParentDashboardScreen;
