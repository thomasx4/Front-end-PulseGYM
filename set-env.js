const fs = require('fs');
const path = require('path');

const dir = './src/environments';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL || "https://api.pulsegym.uk"}',
  cloudinary: {
    cloudName: '${process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDNAME_CLOUD_NAME || ""}',
    uploadPreset: '${process.env.CLOUDINARY_UPLOAD_PRESET || ""}',
    apiKey: '${process.env.CLOUDINARY_API_KEY || ""}',
    apiSecret: '${process.env.CLOUDINARY_API_SECRET || ""}'
  }
};
`;

fs.writeFileSync(path.join(dir, 'environment.prod.ts'), envConfigFile);
fs.writeFileSync(path.join(dir, 'environment.ts'), envConfigFile);

console.log('✅ Archivos de environment generados correctamente.');