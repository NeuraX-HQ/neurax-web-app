import React, { useState, useRef } from "react";
import {
    View,
    Text,
    Pressable,
    FlatList,
    Dimensions,
    StyleSheet,
    Image,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Shadows } from "../../constants/Theme";

const { width } = Dimensions.get("window");

interface Slide {
    id: string;
    emoji: string;
    title: string;
    subtitle: string;
    highlight: string;
}

const slides: Slide[] = [
    {
        id: "1",
        emoji: "🎤",
        title: "Log bữa ăn chỉ 5 giây",
        subtitle: 'bằng giọng nói',
        highlight: '"Ê Bảo, vừa ăn phở bò"\n→ Instant tracking ✨',
    },
    {
        id: "2",
        emoji: "🤖",
        title: "AI Bảo giúp bạn đạt mục tiêu",
        subtitle: "",
        highlight: '💬 "45g protein? Over-delivered!\nRespect ✊"',
    },
    {
        id: "3",
        emoji: "🏆",
        title: "Thách thức bạn bè,",
        subtitle: "cùng nhau khỏe mạnh",
        highlight: "🏆 7-Day Protein Battle\nYou vs @john",
    },
    {
        id: "4",
        emoji: "🧊",
        title: "Tủ lạnh thông minh,",
        subtitle: "gợi ý công thức từ đồ có sẵn",
        highlight: "🧊 Scan groceries\n🍳 Get recipe suggestions",
    },
];

export default function WelcomeScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            router.replace("/(auth)/choice");
        }
    };

    const handleSkip = () => {
        router.replace("/(auth)/choice");
    };

    const renderSlide = ({ item }: { item: Slide }) => (
        <View style={styles.slide}>
            {/* Illustration placeholder */}
            <View style={styles.illustrationContainer}>
                <View style={styles.illustrationCircle}>
                    <Text style={styles.illustrationEmoji}>{item.emoji}</Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
                <View style={styles.highlightBox}>
                    <Text style={styles.highlight}>{item.highlight}</Text>
                </View>
            </View>
        </View>
    );

    const renderPagination = () => (
        <View style={styles.pagination}>
            {slides.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        index === currentIndex && styles.dotActive,
                    ]}
                />
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Skip button */}
            <Pressable style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Bỏ qua</Text>
            </Pressable>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onMomentumScrollEnd={(e) => {
                    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(newIndex);
                }}
            />

            {/* Pagination */}
            {renderPagination()}

            {/* Navigation buttons */}
            <View style={styles.buttons}>
                <Pressable style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient
                        colors={[Colors.primary, Colors.primaryDark]}
                        style={styles.nextButtonGradient}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentIndex === slides.length - 1 ? "Bắt đầu ngay!" : "Tiếp tục →"}
                        </Text>
                    </LinearGradient>
                </Pressable>
            </View>

            {/* Language selector */}
            <View style={styles.languageSelector}>
                <Pressable style={styles.languageButton}>
                    <Text style={styles.languageFlag}>🇻🇳</Text>
                    <Text style={styles.languageText}>Tiếng Việt</Text>
                </Pressable>
                <Text style={styles.languageDivider}>|</Text>
                <Pressable style={styles.languageButton}>
                    <Text style={styles.languageFlag}>🇬🇧</Text>
                    <Text style={styles.languageText}>English</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    skipButton: {
        position: "absolute",
        top: 60,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    skipText: {
        fontSize: 15,
        fontWeight: "500",
        color: Colors.textMedium,
    },
    slide: {
        width,
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    illustrationContainer: {
        alignItems: "center",
        marginBottom: 40,
    },
    illustrationCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        ...Shadows.soft,
    },
    illustrationEmoji: {
        fontSize: 80,
    },
    content: {
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "600",
        color: Colors.textDark,
        textAlign: "center",
        marginBottom: 8,
        fontFamily: "Playfair Display",
    },
    subtitle: {
        fontSize: 24,
        fontWeight: "600",
        color: Colors.textDark,
        textAlign: "center",
        marginBottom: 24,
        fontFamily: "Playfair Display",
    },
    highlightBox: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        ...Shadows.soft,
    },
    highlight: {
        fontSize: 16,
        lineHeight: 24,
        color: Colors.textMedium,
        textAlign: "center",
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        marginVertical: 24,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.textLight,
    },
    dotActive: {
        backgroundColor: Colors.primary,
        width: 24,
    },
    buttons: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    nextButton: {
        borderRadius: 16,
        overflow: "hidden",
    },
    nextButtonGradient: {
        paddingVertical: 16,
        alignItems: "center",
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.textOnPrimary,
    },
    languageSelector: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        paddingBottom: 24,
    },
    languageButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    languageFlag: {
        fontSize: 16,
    },
    languageText: {
        fontSize: 13,
        color: Colors.textMedium,
    },
    languageDivider: {
        color: Colors.textLight,
    },
});
