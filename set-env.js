try {
  require('dotenv').config();
} catch (e) {
  // Si dotenv no está instalado (como en Cloudflare Pages), omite el error y usa process.env directo
}

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'environments');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const apiUrl = process.env.API_URL || "https://api.pulsegym.uk";
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESE || "";
const apiKey = process.env.CLOUDINARY_API_KEY || "";
const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
const mercadoPagoKey = process.env.CLOUDINARY_MERCADOPAGO_PUBLIC_KEY || process.env.CLOUDINARY_MERCADOPAGO || "";

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  cloudinary: {
    cloudName: '${cloudName}',
    uploadPreset: '${uploadPreset}',
    apiKey: '${apiKey}',
    apiSecret: '${apiSecret}',
    MERCADOPAGO_PUBLIC_KEY: '${mercadoPagoKey}'
  }
};
`;

fs.writeFileSync(path.join(dir, 'environment.prod.ts'), envConfigFile);
fs.writeFileSync(path.join(dir, 'environment.ts'), envConfigFile);

console.log('✅ Archivos de environment generados.');