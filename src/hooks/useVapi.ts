import { useCallback, useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';

export type VoiceStatus = 'preview' | 'idle' | 'connecting' | 'connected' | 'listening' | 'thinking' | 'speaking' | 'ended' | 'error';
export type VoiceLine = { role: 'assistant' | 'caller'; text: string; id: string };

type VapiMessage = {
  type?: string;
  role?: string;
  transcript?: string;
  transcriptType?: string;
  [key: string]: unknown;
};

const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY?.trim() ?? '';
const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID?.trim() ?? '';

export function useVapi() {
  const client = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<VoiceStatus>(publicKey && assistantId ? 'idle' : 'preview');
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<VoiceLine[]>([]);
  const [error, setError] = useState('');
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!publicKey || !assistantId) return;
    const vapi = new Vapi(publicKey);
    client.current = vapi;

    const onCallStart = () => { setStatus('connected'); setError(''); };
    const onCallEnd = () => { setStatus('ended'); setMuted(false); setVolume(0); };
    const onSpeechStart = () => setStatus('speaking');
    const onSpeechEnd = () => setStatus('listening');
    const onVolume = (level: number) => setVolume(Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0);
    const onError = (event: unknown) => {
      const message = event instanceof Error ? event.message : 'The voice connection could not be completed.';
      setError(message);
      setStatus('error');
    };
    const onMessage = (raw: unknown) => {
      const message = raw as VapiMessage;
      if (message?.type !== 'transcript' || message.transcriptType !== 'final' || typeof message.transcript !== 'string') return;
      if (message.role !== 'assistant' && message.role !== 'user') return;
      if (message.role === 'user') setStatus('thinking');
      setTranscript(previous => [...previous, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role: message.role === 'user' ? 'caller' : 'assistant',
        text: message.transcript as string,
      }]);
    };

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('volume-level', onVolume);
    vapi.on('message', onMessage);
    vapi.on('error', onError);

    return () => {
      vapi.removeAllListeners();
      void vapi.stop();
      client.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    if (!publicKey || !assistantId || !client.current) {
      setStatus('preview');
      setError('Live voice is not configured yet. Add the Vapi public key and assistant ID, then rebuild the site.');
      return;
    }
    try {
      setTranscript([]);
      setError('');
      setStatus('connecting');
      await client.current.start(assistantId);
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Unable to start the call. Check microphone permission and Vapi settings.';
      setError(message);
    }
  }, []);

  const stop = useCallback(async () => {
    try { await client.current?.stop(); }
    catch { setError('The call could not be ended cleanly. Please refresh the page before trying again.'); }
    setStatus('ended');
    setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (!client.current) return;
    const next = !client.current.isMuted();
    client.current.setMuted(next);
    setMuted(next);
  }, []);

  const clearTranscript = useCallback(() => setTranscript([]), []);
  const configured = Boolean(publicKey && assistantId);
  const live = ['connecting', 'connected', 'listening', 'thinking', 'speaking'].includes(status);

  return { status, muted, transcript, error, volume, configured, live, start, stop, toggleMute, clearTranscript };
}
