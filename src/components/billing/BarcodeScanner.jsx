import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScan }) => {
  const scannerRef = useRef(null);
  const lastScanTime = useRef(0);
  const scannerIdRef = useRef(`reader-${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    let html5QrCode;
    let isComponentMounted = true;

    const initScanner = async () => {
      html5QrCode = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = html5QrCode;
      
      try {
        let cameraIdToUse;
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Try to find standard back camera (avoiding ultra-wide if possible)
          const backCameras = devices.filter(d => d.label.toLowerCase().includes('back'));
          
          if (backCameras.length > 0) {
            // Often, the first back camera is the primary one. 
            // In some devices it's the last. We'll pick the first one that doesn't explicitly say "ultra"
            const primaryBack = backCameras.find(d => !d.label.toLowerCase().includes('ultra')) || backCameras[0];
            cameraIdToUse = primaryBack.id;
          } else {
            cameraIdToUse = devices[0].id; // Fallback to first camera
          }
        }

        const config = { fps: 10, qrbox: { width: 250, height: 150 } };
        
        // If we found a specific camera ID, use it, otherwise fallback to environment
        const startParams = cameraIdToUse ? cameraIdToUse : { facingMode: "environment" };

        await html5QrCode.start(
          startParams,
          config,
          (decodedText) => {
            const now = Date.now();
            if (now - lastScanTime.current > 500) {
              lastScanTime.current = now;
              playBeep();
              onScan(decodedText);
            }
          },
          () => {} // Ignore continuous errors
        );

        if (!isComponentMounted && html5QrCode.isScanning) {
          await html5QrCode.stop();
          html5QrCode.clear();
        }
      } catch (err) {
        if (isComponentMounted) {
          console.error("Error starting scanner: ", err);
        }
      }
    };

    initScanner();

    return () => {
      isComponentMounted = false;
      if (html5QrCode && html5QrCode.isScanning) {
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
      <div id={scannerIdRef.current} className="w-full max-w-sm rounded-lg overflow-hidden border border-border"></div>
      <p className="text-sm text-muted mt-2">Camera is active. Point at barcode to scan.</p>
    </div>
  );
};

export default BarcodeScanner;
