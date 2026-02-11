import { useState, useRef, useEffect, useCallback } from 'react';
import type { AudioRecorderState, RecordingSession } from '@/types/journal';

interface UseVoiceRecorderOptions {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
  onError?: (error: string) => void;
}

interface UseVoiceRecorderReturn {
  state: AudioRecorderState;
  duration: number;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  discardRecording: () => void;
  isSupported: boolean;
  error: string | null;
  format: string | null;
}

// Supported audio formats in order of preference
const SUPPORTED_FORMATS = [
  'audio/webm;codecs=opus', // Chrome, Firefox
  'audio/webm',             // Chrome, Firefox fallback
  'audio/mp4',              // Safari, Chrome
  'audio/wav',              // Universal fallback
  'audio/ogg;codecs=opus',  // Firefox alternative
];

function getSupportedFormat(): string | null {
  if (!window.MediaRecorder) return null;
  
  for (const format of SUPPORTED_FORMATS) {
    if (MediaRecorder.isTypeSupported(format)) {
      return format;
    }
  }
  
  // Last resort - let browser choose
  return '';
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const { onRecordingComplete, onError } = options;
  
  const [state, setState] = useState<AudioRecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedTimeRef = useRef<number>(0);
  
  const isSupported = typeof window !== 'undefined' && 
                     !!window.MediaRecorder && 
                     !!navigator.mediaDevices?.getUserMedia;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    mediaRecorderRef.current = null;
  }, []);

  // Update duration timer
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
      setDuration(Math.floor(elapsed / 1000));
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setState('recording');
      
      // Check browser support
      if (!isSupported) {
        throw new Error('Audio recording is not supported in this browser');
      }

      // Get supported format
      const supportedFormat = getSupportedFormat();
      if (supportedFormat === null) {
        throw new Error('No supported audio format found');
      }
      setFormat(supportedFormat);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Create MediaRecorder
      const options: MediaRecorderOptions = {};
      if (supportedFormat) {
        options.mimeType = supportedFormat;
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { 
          type: supportedFormat || 'audio/webm' 
        });
        
        setAudioBlob(blob);
        setState('stopped');
        stopTimer();
        
        if (onRecordingComplete) {
          onRecordingComplete(blob, duration);
        }
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        const error = 'Recording error occurred';
        setError(error);
        setState('error');
        cleanup();
        onError?.(error);
      };

      // Start recording
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setDuration(0);
      startTimer();
      
      mediaRecorder.start(250); // Collect data every 250ms

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      setState('error');
      cleanup();
      onError?.(errorMessage);
    }
  }, [isSupported, duration, cleanup, startTimer, stopTimer, onRecordingComplete, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    stopTimer();
  }, [stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState('paused');
      stopTimer();
      pausedTimeRef.current += Date.now() - startTimeRef.current;
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState('recording');
      startTimeRef.current = Date.now();
      startTimer();
    }
  }, [startTimer]);

  const discardRecording = useCallback(() => {
    cleanup();
    setState('idle');
    setDuration(0);
    setAudioBlob(null);
    setError(null);
    audioChunksRef.current = [];
    pausedTimeRef.current = 0;
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
    isSupported,
    error,
    format,
  };
}

// Utility functions for audio handling

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(audioBlob);
    
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio metadata'));
    };
    
    audio.src = url;
  });
}

export function createAudioUrl(audioBlob: Blob): string {
  return URL.createObjectURL(audioBlob);
}

export function revokeAudioUrl(url: string): void {
  URL.revokeObjectURL(url);
}

// Browser compatibility check
export function checkAudioRecordingSupport(): {
  supported: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  if (typeof window === 'undefined') {
    reasons.push('Server-side rendering detected');
    return { supported: false, reasons };
  }
  
  if (!window.MediaRecorder) {
    reasons.push('MediaRecorder API not supported');
  }
  
  if (!navigator.mediaDevices?.getUserMedia) {
    reasons.push('getUserMedia API not supported');
  }
  
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    reasons.push('HTTPS required for microphone access');
  }
  
  const supportedFormat = getSupportedFormat();
  if (supportedFormat === null) {
    reasons.push('No supported audio formats');
  }
  
  return {
    supported: reasons.length === 0,
    reasons
  };
}