import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

interface BiometricPromptProps {
    visible: boolean;
    onSuccess: () => void;
    onCancel: () => void;
    message?: string;
}

export default function BiometricPrompt({
    visible,
    onSuccess,
    onCancel,
    message = 'Authenticate to continue',
}: BiometricPromptProps) {
    const { authenticateWithBiometric } = useAuthStore();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        if (visible && !isAuthenticating) {
            handleAuthenticate();
        }
    }, [visible]);

    const handleAuthenticate = async () => {
        setIsAuthenticating(true);
        const success = await authenticateWithBiometric(message);
        setIsAuthenticating(false);

        if (success) {
            onSuccess();
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="finger-print" size={64} color="#4CAF50" />
                    </View>

                    <Text style={styles.title}>Authentication Required</Text>
                    <Text style={styles.message}>{message}</Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleAuthenticate}
                        disabled={isAuthenticating}
                    >
                        <Text style={styles.retryButtonText}>
                            {isAuthenticating ? 'Authenticating...' : 'Try Again'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onCancel}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 30,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1A241B',
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: '#5C6B5E',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 12,
        width: '100%',
        marginBottom: 12,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    cancelButton: {
        paddingVertical: 12,
    },
    cancelButtonText: {
        color: '#8A9A8C',
        fontSize: 16,
        fontWeight: '600',
    },
});
