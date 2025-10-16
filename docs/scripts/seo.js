// Auto-add alt texts, internal links, and performance
document.addEventListener('DOMContentLoaded', function() {
    // Add alt texts to all images
    document.querySelectorAll('img').forEach(img => {
        if (!img.alt) {
            if (img.src.includes('logo')) img.alt = 'Soyosoyo SACCO Logo';
            if (img.src.includes('header')) img.alt = 'Soyosoyo SACCO Hero Image';
            if (img.src.includes('phone')) img.alt = 'Soyosoyo SACCO Mobile App';
        }
    });
    
    // Preload critical resources
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = './assets/141dd3faa98da9737b591161deac509a.jpg';
    link.as = 'image';
    document.head.appendChild(link);
});
