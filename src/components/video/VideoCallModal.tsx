import React, { useState } from 'react';
import { X, Video, PhoneOff, AlertTriangle, ShieldCheck, Maximize2, Minimize2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomUrl: string;
  callsRemaining?: number;
  maxCalls?: number;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  roomUrl,
  callsRemaining,
  maxCalls,
}) => {
  const { showToast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const handleEndCall = () => {
    showToast('Video consultation session ended.', 'info');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className={`w-full bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden transition-all ${
          isFullscreen ? 'fixed inset-2 z-50 max-w-none h-[calc(100vh-1rem)]' : 'max-w-4xl h-[85vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600/30 text-teal-400 flex items-center justify-center">
              <Video className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">RECURA Live Tele-Physio Room</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-[11px] text-zinc-400">
                Encrypted WebRTC Session • {callsRemaining !== undefined ? `${callsRemaining} calls remaining this month` : 'Active'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleEndCall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Leave Session</span>
            </button>
          </div>
        </div>

        {/* Video Frame */}
        <div className="flex-1 bg-black relative">
          <iframe
            src={roomUrl}
            title="RECURA Video Session"
            className="w-full h-full border-0"
            allow="camera; microphone; display-capture; fullscreen; autoplay"
          />
        </div>

        {/* Footer Medical Disclaimer */}
        <div className="px-5 py-2.5 bg-zinc-900/90 border-t border-zinc-800 text-[11px] text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shrink-0">
          <span className="text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            <span>Recura does not diagnose or replace emergency care. In medical emergencies call 1122.</span>
          </span>
          <span className="text-zinc-400 font-medium">Jitsi Meet WebRTC Secure Link</span>
        </div>
      </div>
    </div>
  );
};
