'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useVoiceRecorder, formatDuration, createAudioUrl, revokeAudioUrl } from '@/lib/audio/voice-recorder';
import { formatFileSize } from '@/lib/storage/supabase-storage';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  onError, 
  className,
  disabled = false 
}: VoiceRecorderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
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
    format
  } = useVoiceRecorder({
    onRecordingComplete,
    onError
  });

  // Audio playback controls
  const handlePlayPause = () => {
    if (!audioBlob) return;

    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    if (!audioBlob) return;

    if (!audioRef.current) {
      const audio = new Audio(createAudioUrl(audioBlob));
      audioRef.current = audio;
      
      audio.onended = () => {
        stopPlayback();
      };
      
      audio.ontimeupdate = () => {
        setPlaybackTime(audio.currentTime);
      };
    }

    audioRef.current.play();
    setIsPlaying(true);
    
    // Update playback time
    playbackIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setPlaybackTime(audioRef.current.currentTime);
      }
    }, 100);
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setIsPlaying(false);
    
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      const audioUrl = audioRef.current.src;
      audioRef.current = null;
      revokeAudioUrl(audioUrl);
    }
    
    setIsPlaying(false);
    setPlaybackTime(0);
    
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  };

  const handleDiscard = () => {
    stopPlayback();
    discardRecording();
  };

  const handleStartRecording = async () => {
    stopPlayback();
    await startRecording();
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  // Recording wave animation
  const WaveAnimation = () => (
    <div className="flex items-center justify-center space-x-1 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-blue-500 rounded-full transition-all duration-300",
            state === 'recording' ? 'animate-pulse' : '',
            "w-1"
          )}
          style={{
            height: state === 'recording' 
              ? `${20 + Math.random() * 12}px` 
              : '4px',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );

  if (!isSupported) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Voice recording is not supported in this browser</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Recording Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              state === 'recording' ? 'bg-red-500 animate-pulse' : 
              state === 'paused' ? 'bg-yellow-500' : 
              state === 'stopped' ? 'bg-green-500' :
              'bg-gray-300'
            )} />
            <span className="text-sm font-medium">
              {state === 'idle' ? 'Ready to record' :
               state === 'recording' ? 'Recording...' :
               state === 'paused' ? 'Paused' :
               state === 'stopped' ? 'Recording complete' :
               state === 'error' ? 'Error' : 'Ready'}
            </span>
          </div>
          
          {format && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {format.split('/')[1]?.split(';')[0]?.toUpperCase() || 'AUDIO'}
            </span>
          )}
        </div>

        {/* Wave Animation (when recording) */}
        {state === 'recording' && (
          <div className="flex justify-center">
            <WaveAnimation />
          </div>
        )}

        {/* Duration Display */}
        <div className="text-center">
          <div className="text-2xl font-mono font-bold">
            {formatDuration(state === 'stopped' && isPlaying ? Math.floor(playbackTime) : duration)}
          </div>
          {audioBlob && (
            <div className="text-xs text-muted-foreground mt-1">
              Size: {formatFileSize(audioBlob.size)}
            </div>
          )}
        </div>

        {/* Progress Bar (for playback) */}
        {state === 'stopped' && audioBlob && (
          <div className="space-y-2">
            <Progress 
              value={duration > 0 ? (playbackTime / duration) * 100 : 0} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatDuration(Math.floor(playbackTime))}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-2">
          {state === 'idle' && (
            <Button
              onClick={handleStartRecording}
              disabled={disabled}
              size="lg"
              className="rounded-full w-12 h-12"
              aria-label="Start recording"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}

          {state === 'recording' && (
            <>
              <Button
                onClick={pauseRecording}
                disabled={disabled}
                variant="outline"
                size="sm"
                aria-label="Pause recording"
              >
                <Pause className="h-4 w-4" />
              </Button>
              <Button
                onClick={stopRecording}
                disabled={disabled}
                variant="destructive"
                size="sm"
                aria-label="Stop recording"
              >
                <Square className="h-4 w-4" />
              </Button>
            </>
          )}

          {state === 'paused' && (
            <>
              <Button
                onClick={resumeRecording}
                disabled={disabled}
                size="sm"
                aria-label="Resume recording"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                onClick={stopRecording}
                disabled={disabled}
                variant="destructive"
                size="sm"
                aria-label="Stop recording"
              >
                <Square className="h-4 w-4" />
              </Button>
            </>
          )}

          {state === 'stopped' && audioBlob && (
            <>
              <Button
                onClick={handlePlayPause}
                disabled={disabled}
                variant="outline"
                size="sm"
                aria-label={isPlaying ? "Pause playback" : "Play recording"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleStartRecording}
                disabled={disabled}
                variant="outline"
                size="sm"
                aria-label="Record again"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleDiscard}
                disabled={disabled}
                variant="destructive"
                size="sm"
                aria-label="Delete recording"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        {state === 'idle' && (
          <p className="text-xs text-center text-muted-foreground">
            Click the microphone to start recording
          </p>
        )}

        {state === 'recording' && (
          <p className="text-xs text-center text-muted-foreground">
            Click pause to pause or stop to finish recording
          </p>
        )}

        {state === 'stopped' && audioBlob && (
          <p className="text-xs text-center text-muted-foreground">
            Play to preview, record again to replace, or discard to start over
          </p>
        )}
      </CardContent>
    </Card>
  );
}