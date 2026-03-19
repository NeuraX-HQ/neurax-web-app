import React, { useState } from 'react';
import { Modal } from 'react-native';
import { CameraScanner } from './CameraScanner';
import { LoadingAnalysis } from './LoadingAnalysis';
import { useAppLanguage } from '../i18n/LanguageProvider';

interface CameraScannerWithLoadingProps {
    visible: boolean;
    onClose: () => void;
}

export function CameraScannerWithLoading({ visible, onClose }: CameraScannerWithLoadingProps) {
    const { t } = useAppLanguage();
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleClose = () => {
        if (!isAnalyzing) {
            onClose();
        }
    };

    return (
        <>
            <CameraScanner 
                visible={visible && !isAnalyzing} 
                onClose={handleClose}
                onAnalyzing={setIsAnalyzing}
            />
            
            <Modal
                visible={isAnalyzing}
                animationType="fade"
                transparent={false}
            >
                <LoadingAnalysis message={t('camera.analyzing')} />
            </Modal>
        </>
    );
}
