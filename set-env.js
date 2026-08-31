const fs = require('fs');

const targetPath = './src/environments/environment.prod.ts';
const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL || "https://api.pulsegym.uk"}',
  cloudinary: {
    cloudName: '${process.env.CLOUDNAME_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || ""}',
    uploadPreset: '${process.env.CLOUDINARY_UPLOAD_PRESET || ""}',
    apiKey: '${process.env.CLOUDINARY_API_KEY || ""}',
    apiSecret: '${process.env.CLOUDINARY_API_SECRET || ""}'
  }
};
`;

fs.writeFileSync(targetPath, envConfigFile);
