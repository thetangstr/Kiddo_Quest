import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useStore from '../store/useStore';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

interface AddPenaltyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (penaltyData: any) => void;
  children: any[];
}

const AddPenaltyModal: React.FC<AddPenaltyModalProps> = ({ 
  visible, 
  onClose, 
  onSubmit, 
  children 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pointsDeduction: '1',
    childId: '',
    reason: ''
  });

  const handleSubmit = () => {
    if (!formData.childId || !formData.title || !formData.reason) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    onSubmit({
      ...formData,
      pointsDeduction: parseInt(formData.pointsDeduction) || 1
    });
    
    setFormData({
      title: '',
      description: '',
      pointsDeduction: '1',
      childId: '',
      reason: ''
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
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
          marginBottom: 24
        }}>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: 'bold', 
            color: '#DC2626' 
          }}>
            Apply Penalty
          </Text>
          <Button
            onPress={onClose}
            variant="secondary"
            size="small"
          >
            Cancel
          </Button>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: 8 
            }}>
              Child *
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {children.map(child => (
                <Button
                  key={child.id}
                  onPress={() => setFormData(prev => ({ ...prev, childId: child.id }))}
                  variant={formData.childId === child.id ? "primary" : "secondary"}
                  size="small"
                  style={{ marginRight: 8, marginBottom: 8 }}
                >
                  {child.name} ({child.totalPoints || 0} pts)
                </Button>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: 8 
            }}>
              Penalty Title *
            </Text>
            <TextInput
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: '#111827'
              }}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="e.g., Not listening to instructions"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: 8 
            }}>
              Description
            </Text>
            <TextInput
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: '#111827',
                minHeight: 80,
                textAlignVertical: 'top'
              }}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Detailed description of the behavior..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: 8 
            }}>
              Points to Deduct *
            </Text>
            <TextInput
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: '#111827'
              }}
              value={formData.pointsDeduction}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pointsDeduction: text }))}
              placeholder="1"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: 8 
            }}>
              Reason for Penalty *
            </Text>
            <TextInput
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: '#111827',
                minHeight: 60,
                textAlignVertical: 'top'
              }}
              value={formData.reason}
              onChangeText={(text) => setFormData(prev => ({ ...prev, reason: text }))}
              placeholder="Why is this penalty being applied?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
            />
          </View>

          <Button
            onPress={handleSubmit}
            variant="danger"
            style={{ marginBottom: 32 }}
          >
            Apply Penalty
          </Button>
        </ScrollView>
      </View>
    </Modal>
  );
};

const PenaltyManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    penalties, 
    children, 
    addPenalty,
    reversePenalty,
    deletePenalty,
    isLoading 
  } = useStore((state: any) => ({
    penalties: state.penalties || [],
    children: state.children || [],
    addPenalty: state.addPenalty,
    reversePenalty: state.reversePenalty,
    deletePenalty: state.deletePenalty,
    isLoading: state.isLoading
  }));

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const handleAddPenalty = async (penaltyData: any) => {
    try {
      await addPenalty(penaltyData);
      Alert.alert('Success', `Penalty applied. ${penaltyData.pointsDeduction} points deducted.`);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to apply penalty: ' + error.message);
    }
  };

  const handleReversePenalty = (penaltyId: string) => {
    Alert.alert(
      'Reverse Penalty',
      'Are you sure you want to reverse this penalty? This will restore the deducted points.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reverse', 
          style: 'destructive',
          onPress: async () => {
            try {
              await reversePenalty(penaltyId);
              Alert.alert('Success', 'Penalty reversed and points restored.');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to reverse penalty: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleDeletePenalty = (penaltyId: string) => {
    Alert.alert(
      'Delete Penalty',
      'Are you sure you want to delete this penalty record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deletePenalty(penaltyId)
        }
      ]
    );
  };

  const getChildName = (childId: string) => {
    const child = children.find((c: any) => c.id === childId);
    return child ? child.name : 'Unknown Child';
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
      }}>
        <View>
          <Button
            onPress={() => navigation.goBack()}
            variant="secondary"
            size="small"
          >
            ← Back
          </Button>
        </View>
        <Text style={{ 
          fontSize: 20, 
          fontWeight: 'bold', 
          color: '#111827' 
        }}>
          Penalty Management
        </Text>
        <Button
          onPress={() => setIsAddModalVisible(true)}
          variant="danger"
          size="small"
        >
          + Apply
        </Button>
      </View>

      <ScrollView 
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {penalties.length === 0 ? (
          <Card style={{ 
            padding: 24, 
            alignItems: 'center',
            marginTop: 32
          }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: '#6B7280',
              textAlign: 'center',
              marginBottom: 8
            }}>
              No Penalties Applied
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: '#9CA3AF',
              textAlign: 'center',
              marginBottom: 16
            }}>
              No penalties have been applied yet. Use the "Apply" button to add one.
            </Text>
          </Card>
        ) : (
          penalties
            .sort((a: any, b: any) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
            .map((penalty: any) => (
              <Card key={penalty.id} style={{ marginBottom: 16, padding: 16 }}>
                <View style={{ 
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 18, 
                      fontWeight: '600', 
                      color: '#111827',
                      marginBottom: 4
                    }}>
                      {penalty.title}
                    </Text>
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: penalty.status === 'active' ? '#FEE2E2' : '#F3F4F6',
                      alignSelf: 'flex-start'
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '500',
                        color: penalty.status === 'active' ? '#DC2626' : '#6B7280'
                      }}>
                        {penalty.status === 'active' ? 'Active' : 'Reversed'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 2 }}>
                    <Text style={{ fontWeight: '500' }}>Child:</Text> {getChildName(penalty.childId)}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 2 }}>
                    <Text style={{ fontWeight: '500' }}>Points Deducted:</Text> {penalty.pointsDeduction}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 2 }}>
                    <Text style={{ fontWeight: '500' }}>Reason:</Text> {penalty.reason}
                  </Text>
                  {penalty.description && (
                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 2 }}>
                      <Text style={{ fontWeight: '500' }}>Description:</Text> {penalty.description}
                    </Text>
                  )}
                  <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 2 }}>
                    <Text style={{ fontWeight: '500' }}>Applied:</Text> {formatDate(penalty.appliedAt)}
                  </Text>
                  {penalty.reversedAt && (
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                      <Text style={{ fontWeight: '500' }}>Reversed:</Text> {formatDate(penalty.reversedAt)}
                    </Text>
                  )}
                </View>

                <View style={{ 
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  gap: 8
                }}>
                  {penalty.status === 'active' && (
                    <Button
                      onPress={() => handleReversePenalty(penalty.id)}
                      variant="secondary"
                      size="small"
                    >
                      Reverse
                    </Button>
                  )}
                  <Button
                    onPress={() => handleDeletePenalty(penalty.id)}
                    variant="danger"
                    size="small"
                  >
                    Delete
                  </Button>
                </View>
              </Card>
            ))
        )}
      </ScrollView>

      <AddPenaltyModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleAddPenalty}
        children={children}
      />
    </View>
  );
};

export default PenaltyManagementScreen;