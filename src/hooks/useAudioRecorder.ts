import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
  type RecordingStatus,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export interface AudioRecording {
  uri: string;
  durationMs: number;
}

export interface UseAudioRecorderOptions {
  options?: RecordingOptions;
  progressUpdateIntervalMs?: number;
  onStatusUpdate?: (status: RecordingStatus) => void;
}

export interface UseAudioRecorderResult {
  isRecording: boolean;
  isPreparing: boolean;
  hasPermission: boolean | null;
  durationMs: number;
  uri: string | null;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<AudioRecording | null>;
  cancel: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  reset: () => void;
}

const toErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
};

export function useAudioRecorder(
  options?: UseAudioRecorderOptions,
): UseAudioRecorderResult {
  const isMountedRef = useRef<boolean>(true);
  const onStatusUpdateRef = useRef(options?.onStatusUpdate);
  onStatusUpdateRef.current = options?.onStatusUpdate;

  const recordingOptions = options?.options ?? RecordingPresets.HIGH_QUALITY;
  const progressUpdateIntervalMs = options?.progressUpdateIntervalMs ?? 250;
  const recorder = useExpoAudioRecorder(recordingOptions, (status) => {
    onStatusUpdateRef.current?.(status);
    if (status.hasError && isMountedRef.current) {
      setError(status.error ?? 'Recording failed.');
    }
  });
  const recorderState = useAudioRecorderState(
    recorder,
    progressUpdateIntervalMs,
  );

  const [isPreparing, setIsPreparing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [completedDurationMs, setCompletedDurationMs] = useState(0);
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const safeSet = useCallback(<T,>(setter: (value: T) => void, value: T) => {
    if (isMountedRef.current) setter(value);
  }, []);

  const restorePlaybackMode = useCallback(async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
      });
    } catch {
      // best-effort, ignore
    }
  }, []);

  const stopActiveRecording = useCallback(async (): Promise<AudioRecording | null> => {
    try {
      await recorder.stop();
    } catch {
      // already stopped or failed mid-recording
    }

    let finalUri: string | null = null;
    let finalDuration = 0;
    try {
      const status = recorder.getStatus();
      finalUri = recorder.uri ?? status.url;
      finalDuration = status.durationMillis ?? 0;
    } catch {
      // The native shared object can be released during reload/unmount.
    }

    await restorePlaybackMode();
    safeSet(setUri, finalUri ?? null);
    safeSet(setCompletedDurationMs, finalDuration);
    return finalUri ? { uri: finalUri, durationMs: finalDuration } : null;
  }, [recorder, restorePlaybackMode, safeSet]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      try {
        recorder.stop().catch(() => undefined);
        restorePlaybackMode().catch(() => undefined);
      } catch {
        // The recorder may already be released by the native module.
      }
    };
  }, [recorder, restorePlaybackMode]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const current = await getRecordingPermissionsAsync();
      if (current.granted) {
        safeSet(setHasPermission, true);
        return true;
      }
      if (!current.canAskAgain) {
        safeSet(setHasPermission, false);
        safeSet(
          setError,
          'Microphone permission was denied. Enable it in system settings.',
        );
        return false;
      }
      const next = await requestRecordingPermissionsAsync();
      const granted = next.granted;
      safeSet(setHasPermission, granted);
      if (!granted) {
        safeSet(
          setError,
          'Microphone permission is required to record answers.',
        );
      }
      return granted;
    } catch (err) {
      const msg = toErrorMessage(err, 'Failed to request microphone access.');
      safeSet(setError, msg);
      safeSet(setHasPermission, false);
      return false;
    }
  }, [safeSet]);

  const start = useCallback(async (): Promise<void> => {
    if (recorder.isRecording || isPreparing) return;

    safeSet(setError, null);
    safeSet(setUri, null);
    safeSet(setCompletedDurationMs, 0);
    safeSet(setIsPreparing, true);

    try {
      const granted = await requestPermission();
      if (!granted) {
        safeSet(setIsPreparing, false);
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });
      await recorder.prepareToRecordAsync(recordingOptions);
      recorder.record();

      safeSet(setIsPreparing, false);
    } catch (err) {
      const msg = toErrorMessage(
        err,
        Platform.OS === 'ios'
          ? 'Recording is not supported on the iOS Simulator. Try a device.'
          : 'Could not start recording.',
      );
      safeSet(setError, msg);
      safeSet(setIsPreparing, false);
      await stopActiveRecording().catch(() => undefined);
    }
  }, [
    isPreparing,
    recorder,
    recordingOptions,
    requestPermission,
    safeSet,
    stopActiveRecording,
  ]);

  const stop = useCallback(async (): Promise<AudioRecording | null> => {
    try {
      return await stopActiveRecording();
    } catch (err) {
      const msg = toErrorMessage(err, 'Could not stop recording.');
      safeSet(setError, msg);
      await restorePlaybackMode().catch(() => undefined);
      return null;
    }
  }, [restorePlaybackMode, safeSet, stopActiveRecording]);

  const cancel = useCallback(async (): Promise<void> => {
    await stopActiveRecording().catch(() => undefined);
    safeSet(setUri, null);
    safeSet(setCompletedDurationMs, 0);
  }, [safeSet, stopActiveRecording]);

  const reset = useCallback(() => {
    safeSet(setError, null);
    safeSet(setUri, null);
    safeSet(setCompletedDurationMs, 0);
  }, [safeSet]);

  const durationMs = recorderState.isRecording
    ? recorderState.durationMillis
    : completedDurationMs;

  return {
    isRecording: recorderState.isRecording,
    isPreparing,
    hasPermission,
    durationMs,
    uri,
    error,
    start,
    stop,
    cancel,
    requestPermission,
    reset,
  };
}
