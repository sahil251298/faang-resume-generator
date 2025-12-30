import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('upload'); // upload, review, result
  const [resumeData, setResumeData] = useState(null);
  const [generatedPdf, setGeneratedPdf] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/resume/process', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to process resume');
      }

      const data = await res.json();
      setResumeData(data);
      setStep('review');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (format = 'pdf') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resume/generate?format=${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumeData),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate ${format.toUpperCase()}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      if (format === 'pdf') {
        setGeneratedPdf(url);
        setStep('result');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `FAANG_Resume.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (format === 'pdf') setLoading(false);
    }
  };

  const handleDataChange = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setResumeData(prev => {
      const newArr = [...prev[field]];
      newArr[index] = value;
      return { ...prev, [field]: newArr };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
          FAANG Resume Generator
        </h1>
        <p className="text-gray-600">Transform your resume into a recruiter-ready masterpiece in 2mins.</p>
      </header>

      <main className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8 min-h-[400px] transition-all duration-300">
        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="w-full max-w-md p-10 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 transition-colors flex flex-col items-center text-center">
              <svg className="w-12 h-12 text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                  Select a PDF or DOCX file
                </span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,.docx" onChange={handleFileChange} />
              </label>
              <p className="mt-1 text-xs text-gray-500">PDF, DOCX up to 10MB</p>
            </div>

            {file && (
              <div className="text-sm text-gray-700 font-medium">
                Selected: {file.name}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`px-8 py-3 rounded-full text-white font-bold shadow-md transition-transform transform active:scale-95 ${!file || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg'
                }`}
            >
              {loading ? 'Processing...' : 'Upload & Analyze'}
            </button>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}

        {step === 'review' && resumeData && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Review Extracted Data</h2>
            <p className="text-sm text-gray-500">We've enhanced your content. Reorder sections or make final tweaks.</p>

            {/* Reordering Controls */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Section Order (Up/Down)</h3>
              <div className="flex flex-wrap gap-2">
                {(resumeData.section_order || ["education", "skills", "experience", "projects", "course_work"]).map((sec, idx, arr) => (
                  <div key={sec} className="flex items-center bg-white px-3 py-1 rounded shadow text-sm border capitalize">
                    <span className="mr-2 font-medium text-gray-800">{sec.replace('_', ' ')}</span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => {
                          if (idx === 0) return;
                          const newOrder = [...arr];
                          [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
                          handleDataChange('section_order', newOrder);
                        }}
                        disabled={idx === 0}
                        className="text-xs text-gray-500 hover:text-indigo-600 disabled:opacity-30 leading-none mb-0.5"
                      >▲</button>
                      <button
                        onClick={() => {
                          if (idx === arr.length - 1) return;
                          const newOrder = [...arr];
                          [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
                          handleDataChange('section_order', newOrder);
                        }}
                        disabled={idx === arr.length - 1}
                        className="text-xs text-gray-500 hover:text-indigo-600 disabled:opacity-30 leading-none"
                      >▼</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                <textarea
                  value={resumeData.contact || ''}
                  onChange={(e) => handleDataChange('contact', e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  rows="2"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                <textarea
                  value={resumeData.summary || ''}
                  onChange={(e) => handleDataChange('summary', e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                />
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education (Edit items)</label>
                {(resumeData.education || []).map((edu, idx) => (
                  <textarea
                    key={`edu-${idx}`}
                    value={edu}
                    onChange={(e) => handleArrayChange('education', idx, e.target.value)}
                    className="w-full p-2 border rounded-md mb-2 text-sm"
                    rows="2"
                  />
                ))}
                <button
                  onClick={() => setResumeData(prev => ({ ...prev, education: [...(prev.education || []), ""] }))}
                  className="text-indigo-600 text-xs hover:underline"
                >+ Add Education</button>
              </div>

              {/* Course Work */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Work (Edit items)</label>
                {(resumeData.course_work || []).map((cw, idx) => (
                  <input
                    key={`cw-${idx}`}
                    value={cw}
                    onChange={(e) => handleArrayChange('course_work', idx, e.target.value)}
                    className="w-full p-2 border rounded-md mb-2 text-sm"
                  />
                ))}
                <button
                  onClick={() => setResumeData(prev => ({ ...prev, course_work: [...(prev.course_work || []), ""] }))}
                  className="text-indigo-600 text-xs hover:underline"
                >+ Add Course Work</button>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                {(resumeData.skills || []).map((skill, idx) => (
                  <input
                    key={`skill-${idx}`}
                    value={skill}
                    onChange={(e) => handleArrayChange('skills', idx, e.target.value)}
                    className="w-full p-2 border rounded-md mb-2 text-sm"
                    placeholder="Category: Skill1, Skill2..."
                  />
                ))}
                <button
                  onClick={() => setResumeData(prev => ({ ...prev, skills: [...(prev.skills || []), ""] }))}
                  className="text-indigo-600 text-xs hover:underline"
                >+ Add Linked Skill Group</button>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Edit items)</label>
                {(resumeData.experience || []).map((exp, idx) => (
                  <textarea
                    key={`exp-${idx}`}
                    value={exp}
                    onChange={(e) => handleArrayChange('experience', idx, e.target.value)}
                    className="w-full p-2 border rounded-md mb-2 text-sm"
                    rows="4"
                  />
                ))}
                <button
                  onClick={() => setResumeData(prev => ({ ...prev, experience: [...(prev.experience || []), ""] }))}
                  className="text-indigo-600 text-xs hover:underline"
                >+ Add Experience</button>
              </div>

              {/* Projects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Projects (Edit items)</label>
                {(resumeData.projects || []).map((proj, idx) => (
                  <textarea
                    key={`proj-${idx}`}
                    value={proj}
                    onChange={(e) => handleArrayChange('projects', idx, e.target.value)}
                    className="w-full p-2 border rounded-md mb-2 text-sm"
                    rows="3"
                  />
                ))}
                <button
                  onClick={() => setResumeData(prev => ({ ...prev, projects: [...(prev.projects || []), ""] }))}
                  className="text-indigo-600 text-xs hover:underline"
                >+ Add Project</button>
              </div>

            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={() => handleGenerate('pdf')}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md"
              >
                {loading ? 'Processing...' : 'Generate FAANG Resume'}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}

        {step === 'result' && generatedPdf && (
          <div className="flex flex-col items-center justify-center p-10 space-y-6 animate-fadeIn">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Resume Ready!</h2>
            <p className="text-gray-600 text-center max-w-md">
              Your FAANG-ready resume has been generated. Good luck with your applications!
            </p>

            <div className="flex space-x-4">
              <a
                href={generatedPdf}
                download="FAANG_Resume.pdf"
                className="px-8 py-3 bg-green-600 text-white rounded-full font-bold shadow-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download PDF
              </a>

              <button
                onClick={() => handleGenerate('docx')}
                className="px-8 py-3 bg-white text-green-600 border border-green-600 rounded-full font-bold shadow-lg hover:bg-green-50 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Download DOCX
              </button>
            </div>

            <button
              onClick={() => { setStep('upload'); setFile(null); setResumeData(null); }}
              className="text-indigo-600 hover:underline mt-4"
            >
              Create Another
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
