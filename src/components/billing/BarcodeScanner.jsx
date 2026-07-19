import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScan }) => {
  const scannerRef = useRef(null);
  const lastScanTime = useRef(0);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 150 } };
    
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      const now = Date.now();
      // 500ms debounce
      if (now - lastScanTime.current > 500) {
        lastScanTime.current = now;
        playBeep();
        onScan(decodedText);
      }
    };

    const qrCodeErrorCallback = (errorMessage) => {
      // Ignore background errors during continuous scanning
    };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      qrCodeSuccessCallback,
      qrCodeErrorCallback
    ).catch(err => {
      console.error("Error starting scanner: ", err);
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(err => console.error(err));
      }
    };
  }, [onScan]);

  const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Beep frequency
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div id="reader" className="w-full max-w-sm rounded-lg overflow-hidden border border-border"></div>
      <p className="text-sm text-muted mt-2">Camera is active. Point at barcode to scan.</p>
    </div>
  );
};

export default BarcodeScanner;
