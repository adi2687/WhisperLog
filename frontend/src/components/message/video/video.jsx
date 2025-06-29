import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');

const VideoCallRoom = () => {
  const [room, setRoom] = useState("default");
  const peerConnections = useRef({});
  const localStream = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef(null);

  const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room") || "default";
    setRoom(roomParam);

    startLocalStream(roomParam);

    socket.on("video-all-users", async (users) => {
      for (const userId of users) {
        const pc = createPeerConnection(userId);
        peerConnections.current[userId] = pc;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("video-offer", {
          target: userId,
          offer
        });
      }
    });

    socket.on("video-user-joined", (userId) => {
      console.log("User joined:", userId);
    });

    socket.on("video-offer", async ({ sender, offer }) => {
      const pc = createPeerConnection(sender);
      peerConnections.current[sender] = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("video-answer", {
        target: sender,
        answer
      });
    });

    socket.on("video-answer", async ({ sender, answer }) => {
      const pc = peerConnections.current[sender];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("video-ice-candidate", async ({ sender, candidate }) => {
      const pc = peerConnections.current[sender];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      }
    });

    socket.on("video-user-left", (id) => {
      const video = document.getElementById(`video-${id}`);
      if (video) {
        video.remove();
      }
      if (peerConnections.current[id]) {
        peerConnections.current[id].close();
        delete peerConnections.current[id];
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startLocalStream = async (roomParam) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localVideoRef.current.srcObject = stream;
      localStream.current = stream;

      socket.emit("server-join", roomParam);
    } catch (err) {
      console.error("Error accessing media:", err);
    }
  };

  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("video-ice-candidate", {
          target: userId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      let remoteVideo = document.getElementById(`video-${userId}`);
      if (!remoteVideo) {
        remoteVideo = document.createElement("video");
        remoteVideo.id = `video-${userId}`;
        remoteVideo.autoplay = true;
        remoteVideo.playsInline = true;
        remoteVideo.style.width = "45%";
        remoteVideo.style.border = "1px solid gray";
        remoteVideosRef.current.appendChild(remoteVideo);
      }
      remoteVideo.srcObject = event.streams[0];
    };

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.current);
      });
    }

    return pc;
  };

  return (
    <div>
      <h2>Room: {room}</h2>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '45%', border: '1px solid black' }}
        />
        <div ref={remoteVideosRef} style={{ display: 'flex', flexDirection: 'row', border: '1px solid red' }} />
      </div>
    </div>
  );
};

export default VideoCallRoom;
