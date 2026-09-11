const fs = require('fs');
const path = require('path');

const dir = './src/environments';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '',
  cloudinary: {
    cloudName: '${process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDNAME_CLOUD_NAME || ""}',
    uploadPreset: '${process.env.CLOUDINARY_UPLOAD_PRESET || ""}',
    apiKey: '${process.env.CLOUDINARY_API_KEY || ""}',
    apiSecret: '${process.env.CLOUDINARY_API_SECRET || ""}',
    MERCADOPAGO_PUBLIC_KEY: '${process.env.CLOUDINARY_MERCADOPAGO_PUBLIC_KEY || ""}'
  }
};
`;

fs.writeFileSync(path.join(dir, 'environment.prod.ts'), envConfigFile);
fs.writeFileSync(path.join(dir, 'environment.ts'), envConfigFile);

console.log('✅ Archivos de environment generados correctamente.');