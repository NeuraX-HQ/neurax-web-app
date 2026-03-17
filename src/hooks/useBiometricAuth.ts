import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';

export const useBiometricAuth = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const { authenticateWithBiometric, biometricEnabled } = useAuthStore();

    const requireAuth = async (
        action: () => void | Promise<void>,
        message: string = 'Authenticate to continue'
    ): Promise<void> => {
        if (!biometricEnabled) {
            // If biometric is not enabled, execute action directly
            await action();
            return;
        }

        const success = await authenticateWithBiometric(message);

        if (success) {
            await action();
        } else {
            Alert.alert('Authentication Failed', 'Please try again.');
        }
    };

    return {
        requireAuth,
        showPrompt,
        setShowPrompt,
    };
};
