export function drawBlockyRect(ctx, x, y, w, h, color) {
    // Legacy support or fallback? 
    // Keeping it for now in case of missing assets or particles, but might eventually remove.
    const depth = 10;
    const sideColor = shadeColor(color, -20);

    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - h);
    ctx.lineTo(x + w / 2 + depth, y - h + depth);
    ctx.lineTo(x + w / 2 + depth, y + depth);
    ctx.lineTo(x + w / 2, y);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - w / 2 + depth, y + depth);
    ctx.lineTo(x + w / 2 + depth, y + depth);
    ctx.lineTo(x + w / 2, y);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, y - h, w, h);
}

export function drawSprite(ctx, image, x, y, width, height, angle = 0, opacity = 1) {
    if (!image) return;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Draw centered
    // We assume the sprite is roughly centered in the image.
    // If we want a specific size, we drawImage with width/height
    ctx.drawImage(image, -width / 2, -height / 2, width, height);

    ctx.restore();
}

export function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;
    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    return "#" + (0x1000000 + (Math.round(R) * 0x10000 + Math.round(G) * 0x100 + Math.round(B))).toString(16).slice(1);
}

export function createTransparentSprite(img) {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check for near-white
        if (r > 230 && g > 230 && b > 230) {
            data[i + 3] = 0; // Alpha 0
        }
    }

    ctx.putImageData(imgData, 0, 0);

    const newImg = new Image();
    newImg.src = c.toDataURL();
    return newImg;
}

export function drawHealthBar(ctx, x, y, width, hp, maxHp) {
    if (hp >= maxHp) return;

    const barW = width;
    const barH = 5;
    const pct = Math.max(0, hp / maxHp);

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(x - barW / 2, y - width / 2 - 10, barW, barH); // Position above sprite

    // Fill
    ctx.fillStyle = pct > 0.5 ? '#00ff00' : (pct > 0.25 ? '#ffff00' : '#ff0000');
    ctx.fillRect(x - barW / 2, y - width / 2 - 10, barW * pct, barH);
}
