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
        
        // 1. Check if user already manually selected a preferred camera
        const savedCameraId = localStorage.getItem('preferredCameraId');
        
        // Try to filter for back cameras to populate the switch list
        const backCameras = devices.filter(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('environment')
        );
        const availableCameras = backCameras.length > 0 ? backCameras : devices;
        setCameras(availableCameras);

        if (savedCameraId && availableCameras.find(d => d.id === savedCameraId)) {
          setActiveCameraId(savedCameraId);
          return;
        }
        
        // 2. Smart heuristic for Main Camera (50MP) on Samsung / Android
        const scoreCamera = (label) => {
          const l = label.toLowerCase();
          let score = 0;
          
          // Samsung A-series usually maps the main 50MP camera to "camera2 0"
          if (l.includes('camera2 0')) score += 10; 
          // Standard main lens index
          if (l.match(/\b0\b/)) score += 5; 
          // Penalize ultra-wide, macro, and depth lenses
          if (l.includes('ultra') || l.includes('wide')) score -= 10;
          if (l.includes('macro')) score -= 10;
          if (l.includes('depth')) score -= 10;
          
          return score;
        };

        const sortedCameras = [...availableCameras].sort((a, b) => scoreCamera(b.label) - scoreCamera(a.label));
        setActiveCameraId(sortedCameras[0].id);
      }
    }).catch(err => console.error("Error getting cameras", err));
  }, []);

  const onScanRef = useRef(onScan);
  
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

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
              onScanRef.current(decodedText);
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
  }, [activeCameraId]);

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;
    
    setActiveCameraId(nextCameraId);
    localStorage.setItem('preferredCameraId', nextCameraId);
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
