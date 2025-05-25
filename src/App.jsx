import React, { useState, useRef, useEffect } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [summary, setSummary] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [devices, setDevices] = useState([]);
  const [copiedExtracted, setCopiedExtracted] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const extractedTextRef = useRef(null);
  const summaryRef = useRef(null);

  // Get available camera devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setDevices(videoDevices);
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    };
    getDevices();
  }, []);

  // Start camera stream when showCamera is true
  useEffect(() => {
    if (showCamera && videoRef.current) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showCamera]);

  // Reset copied indicators after 2 seconds
  useEffect(() => {
    if (copiedExtracted) {
      const timer = setTimeout(() => setCopiedExtracted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedExtracted]);

  useEffect(() => {
    if (copiedSummary) {
      const timer = setTimeout(() => setCopiedSummary(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedSummary]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode: "environment" }, // Use rear camera by default
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], "captured-image.jpg", {
          type: "image/jpeg",
        });
        setImage(file);
        setShowCamera(false);
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
  };

  const extractText = async () => {
    if (!image) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch("https://extract-text-from-images-using-tesseract-ovvh.onrender.com/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setExtractedText(data.text);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const summarizeText = async () => {
    if (!extractedText) return;

    setIsSummarizing(true);
    try {
      const response = await fetch("https://extract-text-from-images-using-tesseract-ovvh.onrender.com/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: extractedText }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Summarization failed");
      setSummary(data.summary);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const copyToClipboard = (text, type) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'extracted') {
        setCopiedExtracted(true);
      } else {
        setCopiedSummary(true);
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-md p-8">

          <div className="flex items-center justify-center">

            <img className="w-18 h-18" src="summery.png"/>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
              SUMMEXT
            </h1>

          </div>
          <h1 className="text-1xl font-semibold text-gray-800 mb-8 text-center">
            Image Text Extractor & Summarizer
          </h1>

          {/* Image Upload Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              {/* Upload Image Button */}
              <label className="flex-1">
                <div className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg cursor-pointer transition-colors text-center">
                  Upload Image
                  <input
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    type="file"
                    onChange={handleImageUpload}
                    capture={false}
                  />
                </div>
              </label>

              {/* Camera Button */}
              <button
                className={`flex-1 font-medium py-3 px-6 rounded-lg transition-colors ${
                  showCamera
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
                onClick={() => setShowCamera(!showCamera)}
              >
                {showCamera ? "Close Camera" : "Take Photo"}
              </button>
            </div>

            {image && (
              <div className="text-center text-gray-600 mt-2">
                File Name: <span className="font-medium">{image.name}</span>
              </div>
            )}
          </div>

          {/* Camera View */}
          {showCamera && (
            <div className="mb-8 bg-black rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-96 object-contain"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  onClick={captureImage}
                  className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 bg-red-500 rounded-full border-4 border-gray-200"></div>
                </button>
              </div>
            </div>
          )}

          {/* Extract Text Button */}
          <div className="flex justify-center mb-8">
            <button
              className={`bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition-colors ${
                !image || isExtracting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={extractText}
              disabled={!image || isExtracting}
            >
              {isExtracting ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extracting...
                </span>
              ) : (
                "Extract Text"
              )}
            </button>
          </div>

          {/* Results Section */}
          {extractedText && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Extracted Text */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Extracted Text</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full">
                      {extractedText.split(/\s+/).length} words
                    </span>
                    <button
                      onClick={() => copyToClipboard(extractedText, 'extracted')}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedExtracted ? (
                        <span className="flex items-center text-sm text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Copied!
                        </span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-white p-4 rounded border border-gray-200 h-96 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">{extractedText}</p>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Summary</h2>
                  {summary && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-green-100 text-green-800 py-1 px-3 rounded-full">
                        {summary.split(/\s+/).length} words
                      </span>
                      <button
                        onClick={() => copyToClipboard(summary, 'summary')}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedSummary ? (
                          <span className="flex items-center text-sm text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Copied!
                          </span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {!summary ? (
                  <div className="flex flex-col items-center justify-center h-96 bg-white rounded border border-gray-200">
                    <button
                      className={`bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors ${
                        !extractedText || isSummarizing
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      onClick={summarizeText}
                      disabled={!extractedText || isSummarizing}
                    >
                      {isSummarizing ? (
                        <span className="inline-flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Summarizing...
                        </span>
                      ) : (
                        "Summarize Text"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded border border-gray-200 h-96 overflow-y-auto">
                    <p className="text-gray-700">{summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;