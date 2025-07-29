export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

    if (!(/^([A-Fa-f0-9]{3}){1,2}$/.test(cleanHex))) {
        throw new Error('Color must be in hex format');
    }
    if (cleanHex.length === 3) {
        cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
    }
    const num = parseInt(cleanHex, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;

    return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));

    const toHex = (c: number) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgbAString(hex: string, alpha: number = 1): string {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function getRelativeLuminance(hex: string, alpha: number): number {
    alpha = Math.max(0, Math.min(1, alpha));
    const rgb = hexToRgb(hex);

    const r = Math.round(rgb.r * alpha + 255 * (1 - alpha));
    const g = Math.round(rgb.g * alpha + 255 * (1 - alpha));
    const b = Math.round(rgb.b * alpha + 255 * (1 - alpha));

    const sRGB = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

export function combineHexColors(hexColors: string[]): string {
    if (hexColors.length === 0) {
        return "#000000";
    }

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let validColorCount = 0;

    for (const hex of hexColors) {
        try {
            const rgb = hexToRgb(hex);
            totalR += rgb.r;
            totalG += rgb.g;
            totalB += rgb.b;
            validColorCount++;
        } catch (error) {
            return "#000000";
        }
    }

    if (validColorCount === 0) {
        return "#000000";
    }

    const avgR = totalR / validColorCount;
    const avgG = totalG / validColorCount;
    const avgB = totalB / validColorCount;

    return rgbToHex(avgR, avgG, avgB);
}

