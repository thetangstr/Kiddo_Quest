import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import useStore from '../store/useStore';
import Button from '../components/Button';

const EditChildScreen = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const { children, updateChild, deleteChild } = useStore();
  const navigation = useNavigation();
  const route = useRoute();
  const { childId } = route.params;

  useEffect(() => {
    const child = children.find(c => c.id === childId);
    if (child) {
      setName(child.name);
      setAge(child.age.toString());
    }
  }, [childId, children]);

  const handleUpdateChild = async () => {
    if (name && age) {
      await updateChild(childId, { name, age: parseInt(age) });
      navigation.goBack();
    }
  };

  const handleDeleteChild = async () => {
    await deleteChild(childId);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Child</Text>
      <TextInput
        style={styles.input}
        placeholder="Child's Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Child's Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <Button onPress={handleUpdateChild} variant="primary">
        Update Child
      </Button>
      <Button onPress={handleDeleteChild} variant="danger">
        Delete Child
      </Button>
      <Button onPress={() => navigation.goBack()} variant="secondary">
        Cancel
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});

export default EditChildScreen;
