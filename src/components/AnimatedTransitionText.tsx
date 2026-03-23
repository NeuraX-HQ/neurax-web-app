import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextStyle, StyleProp, View } from 'react-native';

interface AnimatedTransitionTextProps {
    text: string;
    style?: StyleProp<TextStyle>;
    direction?: 'up' | 'down';
}

/**
 * A Text component that animates its content smoothly when the string changes.
 * It uses opacity cross-fading and subtle Y-axis sliding.
 */
export default function AnimatedTransitionText({ text, style, direction = 'up' }: AnimatedTransitionTextProps) {
    const [displayValue, setDisplayValue] = useState(text);
    
    // Animate between 0 (hidden) and 1 (visible)
    const anim = useRef(new Animated.Value(1)).current;
    
    // We keep track of the current prop text to detect changes
    const prevText = useRef(text);

    useEffect(() => {
        if (text !== prevText.current) {
            // Re-assign immediately so it doesn't loop
            prevText.current = text;
            
            // Fade out
            Animated.timing(anim, {
                toValue: 0,
                duration: 120,
                useNativeDriver: true,
            }).start(() => {
                // Swap text while invisible
                setDisplayValue(text);
                
                // Fade in
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }).start();
            });
        }
    }, [text, anim]);

    // Calculate Y drift: when anim is 0, drift is 5 or -5.
    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [direction === 'up' ? 5 : -5, 0],
    });

    return (
        <Animated.Text
            style={[
                style,
                {
                    opacity: anim,
                    transform: [{ translateY }],
                },
            ]}
        >
            {displayValue}
        </Animated.Text>
    );
}
