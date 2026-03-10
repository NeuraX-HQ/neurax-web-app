import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

export interface AudioRecordingResult {
    success: boolean;
    uri?: string;
    base64?: string;
    duration?: number;
    error?: string;
}

let recording: Audio.Recording | null = null;

/**
 * Request audio recording permissions
 */
export async function requestAudioPermissions(): Promise<boolean> {
    try {
        const { status } = await Audio.requestPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error requesting audio permissions:', error);
        return false;
    }
}

/**
 * Start recording audio
 */
export async function startRecording(): Promise<boolean> {
    try {
        // Request permissions
        const hasPermission = await requestAudioPermissions();
        if (!hasPermission) {
            return false;
        }

        // Configure audio mode
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });

        // Use M4A/AAC recording for Gemini compatibility
        const recordingOptions: Audio.RecordingOptions = {
            isMeteringEnabled: true,
            android: {
                extension: '.m4a',
                outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                audioEncoder: Audio.AndroidAudioEncoder.AAC,
                sampleRate: 44100,
                numberOfChannels: 1,
                bitRate: 128000,
            },
            ios: {
                extension: '.m4a',
                audioQuality: Audio.IOSAudioQuality.HIGH,
                sampleRate: 44100,
                numberOfChannels: 1,
                bitRate: 128000,
                linearPCMBitDepth: 16,
                linearPCMIsBigEndian: false,
                linearPCMIsFloat: false,
                outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            },
            web: {
                mimeType: 'audio/webm',
                bitsPerSecond: 128000,
            },
        };

        // Create and start recording
        const { recording: newRecording } = await Audio.Recording.createAsync(
            recordingOptions
        );

        recording = newRecording;
        console.log('Recording started successfully (m4a/AAC format)');
        return true;
    } catch (error) {
        console.error('Failed to start recording:', error);
        return false;
    }
}

/**
 * Stop recording and get audio file
 */
export async function stopRecording(): Promise<AudioRecordingResult> {
    try {
        if (!recording) {
            return {
                success: false,
                error: 'No active recording',
            };
        }

        // Get recording duration before stopping
        let duration = 0;
        try {
            const status = await recording.getStatusAsync();
            duration = (status as any).durationMillis || 0;
        } catch (e) {
            console.warn('Could not get recording status:', e);
        }

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (!uri) {
            recording = null;
            return {
                success: false,
                error: 'Failed to get recording URI',
            };
        }

        // Read file as base64
        let base64 = '';
        try {
            if (typeof window !== 'undefined' && uri.startsWith('blob:')) {
                // Web platform: fetch the blob and convert to base64
                const response = await fetch(uri);
                const blob = await response.blob();
                base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const dataUrl = reader.result as string;
                        // Strip the "data:audio/webm;base64," prefix
                        const b64 = dataUrl.split(',')[1] || '';
                        resolve(b64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } else {
                // Native platform: use expo-file-system
                base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: 'base64' as any,
                });
            }
        } catch (fsError) {
            console.error('FileSystem error:', fsError);
            recording = null;
            return {
                success: false,
                error: 'Failed to read audio file.',
            };
        }

        // Clean up
        recording = null;

        return {
            success: true,
            uri: uri || undefined,
            base64,
            duration,
        };
    } catch (error) {
        console.error('Failed to stop recording:', error);
        recording = null;
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to stop recording',
        };
    }
}

/**
 * Cancel recording without saving
 */
export async function cancelRecording(): Promise<void> {
    try {
        if (recording) {
            await recording.stopAndUnloadAsync();
            recording = null;
        }
    } catch (error) {
        console.error('Failed to cancel recording:', error);
        recording = null;
    }
}

/**
 * Check if currently recording
 */
export function isRecording(): boolean {
    return recording !== null;
}
