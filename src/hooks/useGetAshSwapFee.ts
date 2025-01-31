import { useState, useEffect } from 'react';

export function useGetAshSwapFee() {
    const [fee, setFee] = useState(0.003); // Default 0.3% fee

    useEffect(() => {
        // Here you would typically fetch the fee from the AshSwap contract
        // For now, we'll use a static fee
    }, []);

    return { fee };
} 