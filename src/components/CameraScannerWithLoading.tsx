import React, { useState } from 'react';
import { Modal } from 'react-native';
import { CameraScanner } from './CameraScanner';
import { LoadingAnalysis } from './LoadingAnalysis';

interface CameraScannerWithLoadingProps {
    visible: boolean;
    onClose: () => void;
}

export function CameraScannerWithLoading({ visible, onClose }: CameraScannerWithLoadingProps) {
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
                <LoadingAnalysis message="Đang phân tích món ăn" />
            </Modal>
        </>
    );
}
