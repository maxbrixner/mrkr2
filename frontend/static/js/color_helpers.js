export function hexToRgb(hex) {
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
    if (!/^[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(cleanHex)) {
        return null;
    }
    let r = 0, g = 0, b = 0;
    if (cleanHex.length === 3) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
    }
    else if (cleanHex.length === 6) {
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
    }
    return { r, g, b };
}
export function hexToRgbA(hex, alpha = 1) {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        let c = hex.substring(1);
        if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        }
        const num = parseInt(c, 16);
        let r = (num >> 16) & 255;
        let g = (num >> 8) & 255;
        let b = num & 255;
        return 'rgba('
            + [r, g, b].join(',')
            + ', ' + alpha + ')';
    }
    throw new Error('Color must be in hex format');
}
export function rgbToHex(r, g, b) {
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));
    const toHex = (c) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
export function combineHexColors(hexColors) {
    if (hexColors.length === 0) {
        return "#000000";
    }
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let validColorCount = 0;
    for (const hex of hexColors) {
        const rgb = hexToRgb(hex);
        if (rgb) {
            totalR += rgb.r;
            totalG += rgb.g;
            totalB += rgb.b;
            validColorCount++;
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
export function getRelativeLuminance(color) {
    const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!rgba) {
        throw new Error('Invalid color format. Expected rgba(r,g,b,a) or rgb(r,g,b)');
    }
    const r = parseInt(rgba[1], 10);
    const g = parseInt(rgba[2], 10);
    const b = parseInt(rgba[3], 10);
    const sRGB = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}
