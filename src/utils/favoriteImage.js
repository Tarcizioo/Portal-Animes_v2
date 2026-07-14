const MAX_FILE_BYTES = 8 * 1024 * 1024;
const TARGET_BYTES = 220 * 1024;
const MAX_WIDTH = 720;
const MAX_HEIGHT = 1080;

export function normalizeImageUrl(value = '') {
  const trimmed = String(value).trim();
  if (!trimmed) throw new Error('Informe uma URL de imagem.');

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Informe uma URL valida.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Use uma URL HTTPS para evitar bloqueios no navegador.');
  }

  return parsed.toString();
}

export function estimateDataUrlBytes(dataUrl = '') {
  const encoded = String(dataUrl).split(',')[1] || '';
  return Math.ceil((encoded.length * 3) / 4);
}

function loadLocalImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Nao foi possivel ler essa imagem.'));
    };
    image.src = objectUrl;
  });
}

function renderImage(image, scale, quality) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Seu navegador nao suporta o processamento da imagem.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const webp = canvas.toDataURL('image/webp', quality);
  return webp.startsWith('data:image/webp')
    ? webp
    : canvas.toDataURL('image/jpeg', quality);
}

export async function compressFavoriteImage(file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('A imagem deve ter no maximo 8 MB.');
  }

  const { image, objectUrl } = await loadLocalImage(file);
  try {
    const baseScale = Math.min(
      1,
      MAX_WIDTH / image.naturalWidth,
      MAX_HEIGHT / image.naturalHeight,
    );
    const qualities = [0.86, 0.74, 0.62, 0.5, 0.4];
    let scale = baseScale;
    let result = '';

    for (let pass = 0; pass < 3; pass += 1) {
      for (const quality of qualities) {
        result = renderImage(image, scale, quality);
        if (estimateDataUrlBytes(result) <= TARGET_BYTES) return result;
      }
      scale *= 0.75;
    }

    return result;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
