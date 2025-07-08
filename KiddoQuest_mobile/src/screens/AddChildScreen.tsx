import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useStore from '../store/useStore';
import Button from '../components/Button';

const AddChildScreen = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const { addChild } = useStore();
  const navigation = useNavigation();

  const handleAddChild = async () => {
    if (name && age) {
      await addChild({ name, age: parseInt(age) });
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a New Child</Text>
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
      <Button onPress={handleAddChild} variant="primary">
        Add Child
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

export default AddChildScreen;
