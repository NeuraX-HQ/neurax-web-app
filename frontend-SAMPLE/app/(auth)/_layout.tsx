import { Stack } from "expo-router";
import { Colors } from "../../constants/Theme";

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen name="welcome" />
            <Stack.Screen name="choice" />
            <Stack.Screen name="onboarding" />
        </Stack>
    );
}
