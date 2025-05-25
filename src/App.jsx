import React, { useState } from 'react';

function App() {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');   
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
  };

  const extractText = async (event) => {
  const file = image;
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('http://127.0.0.1:5000/ocr', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - the browser will set it automatically with the boundary
    });

    const data = await response.json();
    if (response.ok) {
      console.log('Extracted text:', data.text);
      setExtractedText(data.text);
      // Use the extracted text in your React component
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};


const summarizeText = async () => {

  const text = extractedText
  if (!extractedText) return;

  setIsSummarizing(true);
  try {
    const response = await fetch('http://127.0.0.1:5000/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Summarization failed');

    setSummary(data.summary)
    
    console.log(data.summary)
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
      setIsSummarizing(false);
    }
};


  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="my-8">
        <h1 className="text-3xl font-bold mb-6">Image Text Extractor & Summarizer</h1>
        
        <div className="mb-6">
          <label className="inline-block">
            <span className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded cursor-pointer transition-colors">
              Upload Image
            </span>
            <input
              accept="image/*"
              className="hidden"
              id="image-upload"
              type="file"
              onChange={handleImageUpload}
            />
          </label>
          {image && (
            <span className="ml-3 inline-block text-gray-700">
              {image.name}
            </span>
          )}
        </div>
        
        <button
          className={`bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded mb-4 transition-colors ${(!image || isExtracting) ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={extractText}
          disabled={!image || isExtracting}
        >
          {isExtracting ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Extracting...
            </span>
          ) : 'Extract Text'}
        </button>
        
        {extractedText && (
          <>
            <div className="bg-white shadow-md rounded-lg p-4 mb-4 max-h-80 overflow-auto">
              <h2 className="text-xl font-semibold mb-2">Extracted Text:</h2>
              <p className="whitespace-pre-wrap text-gray-800">
                {extractedText}
              </p>
            </div>
            
            <button
              className={`bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded mb-4 transition-colors ${(!extractedText || isSummarizing) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={summarizeText}
              disabled={!extractedText || isSummarizing}
            >
              {isSummarizing ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Summarizing...
                </span>
              ) : 'Summarize Text'}
            </button>
          </>
        )}
        
        {summary && (
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Summary:</h2>
            <p className="text-gray-800">{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;