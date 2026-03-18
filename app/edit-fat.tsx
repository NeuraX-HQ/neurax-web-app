import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function EditFatScreen() {
    const router = useRouter();
    useEffect(() => { router.replace('/edit-calories'); }, []);
    return null;
}

