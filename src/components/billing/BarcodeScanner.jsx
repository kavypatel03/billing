import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera } from 'lucide-react';

const BarcodeScanner = ({ onScan }) => {
  const scannerRef = useRef(null);
  const lastScanTime = useRef(0);
  const scannerIdRef = useRef(`reader-${Math.random().toString(36).substring(7)}`);
  
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);

  // Initialize and get cameras once
  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        // Try to filter for back cameras. If none found, use all devices.
        const backCameras = devices.filter(d => d.label.toLowerCase().includes('back'));
        const availableCameras = backCameras.length > 0 ? backCameras : devices;
        setCameras(availableCameras);
        
        // Pick the first non-ultra one as default, or just the first available
        const primaryBack = availableCameras.find(d => !d.label.toLowerCase().includes('ultra')) || availableCameras[0];
        setActiveCameraId(primaryBack.id);
      }
    }).catch(err => console.error("Error getting cameras", err));
  }, []);

  // Handle scanning when activeCameraId is set
  useEffect(() => {
    if (!activeCameraId) return;
    
    let isComponentMounted = true;
    const html5QrCode = new Html5Qrcode(scannerIdRef.current);
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          activeCameraId,
          { fps: 10, qrbox: { width: 250, height: 150 } },
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

    startScanner();

    return () => {
      isComponentMounted = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(err => console.error(err));
      }
    };
  }, [activeCameraId, onScan]);

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setActiveCameraId(cameras[nextIndex].id);
  };

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
      <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-border">
        <div id={scannerIdRef.current} className="w-full"></div>
        {cameras.length > 1 && (
          <button 
            type="button"
            onClick={handleSwitchCamera}
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-all"
            title="Switch Camera"
          >
            <Camera size={20} />
          </button>
        )}
      </div>
      <p className="text-sm text-muted mt-2">Camera is active. Point at barcode to scan.</p>
    </div>
  );
};

export default BarcodeScanner;
