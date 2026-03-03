import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { useAuthStore } from '../src/store/authStore';

export default function SettingsScreen() {
    const router = useRouter();
    const [darkMode, setDarkMode] = useState(false);
    const [pushNotif, setPushNotif] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(false);
    
    const {
        biometricEnabled,
        biometricSupported,
        biometricEnrolled,
        setBiometricEnabled,
        checkBiometricAvailability,
        logout,
    } = useAuthStore();

    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const handleBiometricToggle = async (value: boolean) => {
        if (value) {
            Alert.alert(
                'Enable Biometric Authentication',
                'Require biometric authentication when opening the app?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Enable',
                        onPress: async () => {
                            await setBiometricEnabled(true);
                        },
                    },
                ]
            );
        } else {
            await setBiometricEnabled(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* ACCOUNT */}
                <Text style={styles.sectionLabel}>ACCOUNT</Text>
                <TouchableOpacity style={[styles.item, Shadows.small]}>
                    <Text style={styles.itemIcon}>👤</Text>
                    <Text style={styles.itemLabel}>Edit Profile</Text>
                    <Text style={styles.itemArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, Shadows.small]}>
                    <Text style={styles.itemIcon}>🔒</Text>
                    <Text style={styles.itemLabel}>Change Password</Text>
                    <Text style={styles.itemArrow}>›</Text>
                </TouchableOpacity>

                {/* PREFERENCES */}
                <Text style={styles.sectionLabel}>PREFERENCES</Text>
                <TouchableOpacity style={[styles.item, Shadows.small]}>
                    <Text style={styles.itemIcon}>🌐</Text>
                    <Text style={styles.itemLabel}>Language</Text>
                    <Text style={styles.itemValue}>Vietnamese</Text>
                    <Text style={styles.itemArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, Shadows.small]}>
                    <Text style={styles.itemIcon}>📏</Text>
                    <Text style={styles.itemLabel}>Units</Text>
                    <Text style={styles.itemValue}>Metric (kg, cm)</Text>
                    <Text style={styles.itemArrow}>›</Text>
                </TouchableOpacity>
                <View style={[styles.item, Shadows.small]}>
                    <Text style={styles.itemIcon}>🌙</Text>
                    <Text style={styles.itemLabel}>Dark Mode</Text>
                    <Switch
                        value={darkMode}
                        onValueChange={setDarkMode}
                        trackColor={{ false: '#E0E0E0', true: Colors.accent }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                {/* NOTIFICATIONS */}
                <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
                <View style={[styles.item, Shadows.small]}>
                    <Text style={styles.itemIcon}>🔔</Text>
                    <Text style={styles.itemLabel}>Push Notifications</Text>
                    <Switch
                        value={pushNotif}
                        onValueChange={setPushNotif}
                        trackColor={{ false: '#E0E0E0', true: Colors.accent }}
                        thumbColor="#FFFFFF"
                    />
                </View>
                <View style={[styles.item, Shadows.small]}>
                    <Text style={styles.itemIcon}>📧</Text>
                    <Text style={styles.itemLabel}>Email Updates</Text>
                    <Switch
                        value={emailUpdates}
                        onValueChange={setEmailUpdates}
                        trackColor={{ false: '#E0E0E0', true: Colors.accent }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                {/* SECURITY */}
                <Text style={styles.sectionLabel}>SECURITY</Text>
                <View style={[styles.item, Shadows.small]}>
                    <Text style={styles.itemIcon}>🔐</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemLabel}>Biometric Authentication</Text>
                        {!biometricSupported && (
                            <Text style={styles.itemSubtext}>Not supported on this device</Text>
                        )}
                        {biometricSupported && !biometricEnrolled && (
                            <Text style={styles.itemSubtext}>No biometric enrolled</Text>
                        )}
                    </View>
                    <Switch
                        value={biometricEnabled}
                        onValueChange={handleBiometricToggle}
                        disabled={!biometricSupported || !biometricEnrolled}
                        trackColor={{ false: '#E0E0E0', true: Colors.accent }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                {/* PRIVACY */}
                <Text style={styles.sectionLabel}>PRIVACY</Text>
                <TouchableOpacity style={[styles.item, Shadows.small]}>
                    <Text style={styles.itemIcon}>📋</Text>
                    <Text style={styles.itemLabel}>Privacy Policy</Text>
                    <Text style={styles.itemArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, Shadows.small]}>
                    <Text style={styles.itemIcon}>📄</Text>
                    <Text style={styles.itemLabel}>Terms of Service</Text>
                    <Text style={styles.itemArrow}>›</Text>
                </TouchableOpacity>

                {/* Log Out */}
                <TouchableOpacity style={[styles.logoutBtn]} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    backArrow: { fontSize: 24, color: Colors.primary },
    title: { fontSize: 22, fontWeight: '700', color: Colors.primary },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 1,
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 12,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 10,
        gap: 14,
    },
    itemIcon: { fontSize: 20 },
    itemLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.text },
    itemValue: { fontSize: 14, color: Colors.textSecondary },
    itemSubtext: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
    itemArrow: { fontSize: 24, color: Colors.textLight },
    logoutBtn: {
        marginHorizontal: 20,
        marginTop: 24,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.red,
        alignItems: 'center',
    },
    logoutText: { fontSize: 16, fontWeight: '600', color: Colors.red },
});
