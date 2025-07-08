import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  closeOnBackdropPress?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  testID?: string;
}

export const Modal = ({
  isVisible,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnBackdropPress = true,
  animationType = 'fade',
  testID,
}: ModalProps) => {
  // Handle escape key press on web platform
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEscKeyPress = (event: KeyboardEvent) => {
        if (isVisible && event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscKeyPress);
      return () => {
        document.removeEventListener('keydown', handleEscKeyPress);
      };
    }
    return undefined;
  }, [isVisible, onClose]);

  // Get modal width based on size prop
  const getModalWidth = () => {
    const { width } = Dimensions.get('window');
    switch (size) {
      case 'small':
        return Platform.OS === 'web' ? 320 : width * 0.8;
      case 'medium':
        return Platform.OS === 'web' ? 480 : width * 0.9;
      case 'large':
        return Platform.OS === 'web' ? 640 : width * 0.95;
      case 'full':
        return width * 0.95;
      default:
        return Platform.OS === 'web' ? 480 : width * 0.9;
    }
  };

  return (
    <RNModal
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      animationType={animationType}
      statusBarTranslucent
    >
      <View style={styles.centeredView} testID={testID}>
        <TouchableWithoutFeedback
          onPress={closeOnBackdropPress ? onClose : undefined}
        >
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.modalView, { width: getModalWidth() }]}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.content}>
            {children}
          </View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        maxHeight: '90vh',
        maxWidth: '90vw',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // gray-900
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    ...Platform.select({
      web: {
        overflowY: 'auto',
      },
    }),
  },
});

export default Modal;
