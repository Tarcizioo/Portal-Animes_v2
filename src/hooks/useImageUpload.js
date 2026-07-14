import { useState } from 'react';

export function useImageUpload() {
    const [uploading, setUploading] = useState(false);

    /**
     * Compresses an image and returns as Base64 string
     * @param {File} file 
     * @param {boolean} isBanner
     * @returns {Promise<string>}
     */
    const compressImage = (file, isBanner = false) => {
        return new Promise((resolve, reject) => {
            // Se for banner, usamos 1920px max e WebP para qualidade excelente abaixo de 1MB
            const maxWidth = isBanner ? 1920 : 800;
            const maxHeight = isBanner ? 800 : 800;
            const quality = isBanner ? 0.95 : 0.85;
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Retorna Base64 com WebP (muito menor que JPEG, sem perda visível)
                    const dataUrl = canvas.toDataURL('image/webp', quality);
                    resolve(dataUrl);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    /**
     * Processes image for profile (compression + base64)
     * Does NOT upload to Storage anymore to avoid CORS/Permissions issues.
     * @param {File} file
     * @param {string} path - identifies if it's a banner or avatar
     * @returns {Promise<string>} Base64 string
     */
    const uploadImage = async (file, path = '') => {
        if (!file) return null;

        setUploading(true);
        try {
            const isBanner = path.includes('banner');
            const base64String = await compressImage(file, isBanner);
            return base64String;
        } catch (error) {
            console.error("Erro ao processar imagem:", error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    return { uploadImage, uploading };
}
