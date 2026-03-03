import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useBiometricAuth } from '../hooks/useBiometricAuth';

/**
 * Example component showing how to use biometric authentication
 * for sensitive actions in your app
 */
export default function BiometricExample() {
    const { requireAuth } = useBiometricAuth();

    const handleDeleteData = async () => {
        await requireAuth(async () => {
            // Perform the actual delete operation
            Alert.alert('Success', 'Data deleted successfully');
        }, 'Authenticate to delete your data');
    };

    const handleExportData = async () => {
        await requireAuth(async () => {
            // Perform the actual export operation
            Alert.alert('Success', 'Data exported successfully');
        }, 'Authenticate to export your health data');
    };

    const handleChangeGoal = async () => {
        await requireAuth(async () => {
            // Perform the actual goal change
            Alert.alert('Success', 'Goal updated successfully');
        }, 'Authenticate to change your weight goal');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Biometric Protected Actions</Text>
            
            <TouchableOpacity style={styles.button} onPress={handleDeleteData}>
                <Text style={styles.buttonText}>Delete All Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleExportData}>
                <Text style={styles.buttonText}>Export Health Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleChangeGoal}>
                <Text style={styles.buttonText}>Change Weight Goal</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F7F2',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A241B',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});
