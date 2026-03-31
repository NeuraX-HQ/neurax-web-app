import React, { useRef, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet from '@gorhom/bottom-sheet';
import LogSheet from '../../components/LogSheet';
import { Colors, Shadows } from '../../constants/Theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TabBarIcon = ({ name, color, focused }: { name: IconName; color: string; focused: boolean }) => {
  return <Ionicons name={name} size={24} color={color} />;
};

export default function TabLayout() {
  const logSheetRef = useRef<BottomSheet>(null);

  const handleOpenLogSheet = useCallback(() => {
    logSheetRef.current?.expand();
  }, []);

  const handleCloseLogSheet = useCallback(() => {
    logSheetRef.current?.close();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textLight,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: -4,
          },
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopWidth: 0,
            height: 80,
            paddingTop: 8,
            paddingBottom: 24,
            ...Shadows.soft,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? 'home' : 'home-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="challenges"
          options={{
            title: 'Challenges',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? 'trophy' : 'trophy-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: '',
            tabBarButton: () => (
              <Pressable
                style={styles.centerButton}
                onPress={handleOpenLogSheet}
              >
                <View style={styles.centerButtonBorder}>
                  <LinearGradient
                    colors={['#10B981', '#005C45']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.centerButtonGradient}
                  >
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                  </LinearGradient>
                </View>
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="kitchen"
          options={{
            title: 'Kitchen',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? 'nutrition' : 'nutrition-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? 'person' : 'person-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>

      {/* Log Bottom Sheet */}
      <LogSheet
        ref={logSheetRef}
        onVoice={() => {
          handleCloseLogSheet();
          // Navigate to voice logging
        }}
        onPhoto={() => {
          handleCloseLogSheet();
          // Navigate to photo logging
        }}
        onManual={() => {
          handleCloseLogSheet();
          // Navigate to manual logging
        }}
        onClose={handleCloseLogSheet}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centerButton: {
    top: -24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surface,
    padding: 4,
    ...Shadows.float,
    shadowColor: '#005C45',
  },
  centerButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

