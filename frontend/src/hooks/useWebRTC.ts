import { useEffect, useRef } from 'react';

export function useWebRTC(cameraId: string, remoteVideoRef: React.RefObject<HTMLVideoElement | null>) {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:5000');

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({ type: 'register_camera', cameraId }));
    };

    ws.current.onmessage = async (message) => {
      const data = JSON.parse(message.data);

      if (data.type === 'offer') {
        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            ws.current?.send(JSON.stringify({
              type: 'ice-candidate',
              targetId: cameraId,
              candidate: event.candidate
            }));
          }
        };

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        ws.current?.send(JSON.stringify({ type: 'answer', targetId: cameraId, answer }));
      } else if (data.type === 'ice-candidate' && peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    return () => {
      ws.current?.close();
      peerConnection.current?.close();
    };
  }, [cameraId, remoteVideoRef]);
}
