import React from 'react';
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg';

interface IconProps {
    size?: number;
    color?: string;
    strokeWidth?: number;
}

export function HomeIcon({ size = 22, color = '#000', strokeWidth = 2 }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
            <Path d="M9 22V12h6v10" fill="#FFF" stroke="none" />
        </Svg>
    );
}

export function WorkoutIcon({ size = 22, color = '#000', strokeWidth = 2 }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M6 7.5h12M6 16.5h12" />
            <Rect x="2" y="5" width="4" height="14" rx="1" fill={color} />
            <Rect x="18" y="5" width="4" height="14" rx="1" fill={color} />
        </Svg>
    );
}

export function PlusIcon({ size = 22, color = '#FFF', strokeWidth = 3 }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <Line x1="12" y1="5" x2="12" y2="19" />
            <Line x1="5" y1="12" x2="19" y2="12" />
        </Svg>
    );
}

export function ScanIcon({ size = 22, color = '#FFF', strokeWidth = 3 }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            {/* Corners with rounded endpoints and arc */}
            <Path d="M6 10V8a2 2 0 0 1 2-2h2" />
            <Path d="M14 6h2a2 2 0 0 1 2 2v2" />
            <Path d="M6 14v2a2 2 0 0 0 2 2h2" />
            <Path d="M14 18h2a2 2 0 0 0 2-2v-2" />
            {/* Center Dash */}
            <Line x1="9" y1="12" x2="15" y2="12" />
        </Svg>
    );
}

export function KitchenIcon({ size = 22, color = '#000', strokeWidth = 2 }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <Path d="M7 2v20" />
            <Path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </Svg>
    );
}

export function AICoachIcon({ size = 22, color = '#000', strokeWidth = 2 }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 8V4H8" />
            <Rect width="16" height="12" x="4" y="8" rx="2" fill={color} />
            <Path d="M2 14h2" />
            <Path d="M20 14h2" />
            <Circle cx="9" cy="13" r="1.5" fill="#FFF" stroke="none" />
            <Circle cx="15" cy="13" r="1.5" fill="#FFF" stroke="none" />
        </Svg>
    );
}

export function ProfileIcon({ size = 22, color = '#888', strokeWidth = 2 }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
        </Svg>
    );
}

export function SettingsIcon({ size = 22, color = '#000', strokeWidth = 2 }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <Path
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.72v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.72l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                fill={color}
            />
            <Circle cx="12" cy="12" r="3" fill="#FFF" stroke="none" />
        </Svg>
    );
}

export function NotificationIcon({ size = 22, color = '#000', strokeWidth = 2 }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
            <Circle cx="19" cy="5" r="3" fill="#E74C3C" stroke="#FFF" strokeWidth={1.5} />
        </Svg>
    );
}
