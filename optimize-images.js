// backend/optimize-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const mediaDir = path.join(__dirname, 'media');
const optimizedDir = path.join(__dirname, 'media-optimized');

// Dimensiunea standard pentru toate imaginile
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 800;

// Asigură-te că folderul de destinație există
if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
}

// Listează toate fișierele din media
const files = fs.readdirSync(mediaDir);

// Filtrează doar imaginile (jpg, jpeg, png, webp)
const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png|webp)$/i.test(file)
);

console.log(`📸 Found ${imageFiles.length} images to optimize`);

const optimizeImages = async () => {
    let processed = 0;
    let errors = 0;

    for (const file of imageFiles) {
        const inputPath = path.join(mediaDir, file);
        const outputPath = path.join(optimizedDir, file);
        
        try {
            // Redimensionează și optimizează imaginea
            await sharp(inputPath)
                .resize(TARGET_WIDTH, TARGET_HEIGHT, {
                    fit: 'cover', // Crop pentru a se potrivi exact
                    position: 'centre' // Centrează imaginea
                })
                .jpeg({
                    quality: 85, // Calitate bună, dimensiune redusă
                    progressive: true
                })
                .toFile(outputPath);
            
            processed++;
            console.log(`✅ Optimized: ${file} → ${TARGET_WIDTH}x${TARGET_HEIGHT}`);
            
            // Afișează dimensiunile originale pentru referință
            const metadata = await sharp(inputPath).metadata();
            console.log(`   Original: ${metadata.width}x${metadata.height}`);
            
        } catch (error) {
            errors++;
            console.error(`❌ Error optimizing ${file}:`, error.message);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Processed: ${processed} images`);
    console.log(`   ❌ Errors: ${errors} images`);
    console.log(`   📁 Optimized images saved to: ${optimizedDir}`);
    
    if (processed > 0) {
        console.log(`\n🚀 Next step: Replace files in /media with optimized versions.`);
        console.log(`   Run: cp -r media-optimized/* media/`);
        console.log(`   OR: copy and paste the files manually.`);
    }
};

optimizeImages();