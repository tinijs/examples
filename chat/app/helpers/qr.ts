import QRCode from 'easyqrcodejs';
import {
  Html5QrcodeScanner,
  QrcodeSuccessCallback,
  QrcodeErrorCallback,
} from 'html5-qrcode';

interface CreateScannerOptions {
  elementId: string;
  containerDimensions?: [number, number];
}

export function createQRCode(element: HTMLElement, text: string) {
  return new QRCode(element, {text});
}

export function createScanner(
  {elementId, containerDimensions}: CreateScannerOptions,
  onSuccess: QrcodeSuccessCallback,
  onError?: QrcodeErrorCallback
) {
  const scanner = new Html5QrcodeScanner(
    elementId,
    {
      fps: 10,
      aspectRatio: !containerDimensions
        ? undefined
        : containerDimensions[0] / containerDimensions[1],
      qrbox: !containerDimensions
        ? 250
        : Math.min(Math.min(...containerDimensions) / 1.75, 500),
    },
    false
  );
  scanner.render(onSuccess, onError);
  return scanner;
}
