// components/Webcam.tsx
import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

const WebCamera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      // await faceapi.nets.faceExpressionNet.loadFromUri("/models");
      setModelsLoaded(true);
    };

    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: {} })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("error:", err));
    };

    loadModels().then(startVideo);
  }, []);

  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    };

    // Ensure video dimensions are valid before proceeding
    if (displaySize.width === 0 || displaySize.height === 0) {
      console.error("Video dimensions are not set correctly:", displaySize);
      return;
    }

    canvasRef.current.width = displaySize.width;
    canvasRef.current.height = displaySize.height;

    faceapi.matchDimensions(canvasRef.current, displaySize);

    const saveVideoSnapshot = () => {
      if (!videoRef.current) return;

      // Create a temporary canvas element
      const tempCanvas = document.createElement("canvas");
      const tempContext = tempCanvas.getContext("2d");

      // Set canvas dimensions to match video dimensions
      tempCanvas.width = videoRef.current.videoWidth;
      tempCanvas.height = videoRef.current.videoHeight;

      // Draw the current video frame onto the canvas
      tempContext?.drawImage(
        videoRef.current,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      );

      // Convert canvas to data URL
      const dataURL = tempCanvas.toDataURL("image/png");

      // Create a link element to download the PNG
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "video-snapshot.png";
      link.click();
    };

    const intervalId = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        // Create a temporary canvas element
        const tempCanvas = document.createElement("canvas");
        const tempContext = tempCanvas.getContext("2d");

        // Set canvas dimensions to match video dimensions
        tempCanvas.width = videoRef.current.videoWidth;
        tempCanvas.height = videoRef.current.videoHeight;

        // Draw the current video frame onto the canvas
        tempContext?.drawImage(
          videoRef.current,
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );

        // Convert canvas to data URL
        const dataURL = tempCanvas.toDataURL("image/png");

        console.log(dataURL);

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks();

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        const context = canvasRef.current.getContext("2d");
        if (context) {
          context.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }

        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        // faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
        if (resizedDetections.length > 0) {
          setFaceDetected(true);
        } else {
          setFaceDetected(false);
        }
      }
    }, 100);

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  };

  useEffect(() => {
    if (!modelsLoaded || !videoRef.current || !canvasRef.current) return;
    handleVideoPlay();
    videoRef.current.addEventListener("play", handleVideoPlay);

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("play", handleVideoPlay);
      }
    };
  }, [modelsLoaded]);

  return (
    <div>
      <h2 className="text-center mb-5 text-2xl font-bold">
        Web Face Detection (face-api.js)
      </h2>
      <div className="relative mb-5">
        <video
          className="rounded-lg mb-5"
          ref={videoRef}
          autoPlay
          muted
          onPlay={handleVideoPlay}
          style={{ width: "100%", maxWidth: "800px" }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
          }}
        />
      </div>
      <div>
        <div className="flex flex-col">
          <div>
            Package:{" "}
            <a
              target="_blank"
              className="text-sky-600"
              href="https://github.com/justadudewhohacks/face-api.js"
            >
              face-api.js
            </a>
          </div>
          <div>
            Model:{" "}
            <a
              target="_blank"
              className="text-sky-600"
              href="https://github.com/justadudewhohacks/face-api.js-models/tree/master/tiny_face_detector"
            >
              Tiny Face Detector
            </a>
          </div>
          <div className="flex flex-row gap-2 font-bold text-lg mt-5">
            Result:{" "}
            {faceDetected ? (
              <p className="text-green-500">Face Detected!</p>
            ) : (
              <p className="text-rose-500">No Face Detected!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebCamera;
