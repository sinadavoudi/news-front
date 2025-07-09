


import React, { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import 'pdfjs-dist/web/pdf_viewer.css';

// Set the workerSrc to the local worker in public/
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface PDFFile {
  id: number;
  title: string;
  date: string;
  upload_date: string;
  pdf_file: string;
}

interface NewspaperViewerProps {
  currentPage: number;
  pdfFile?: PDFFile;
  setNumPages: (n: number) => void;
}

const NewspaperViewer: React.FC<NewspaperViewerProps> = ({ currentPage, pdfFile, setNumPages }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Debug logs
  console.log('Rendering NewspaperViewer', { pdfFile, currentPage });

  // Check if pdfFile is undefined or null first
  if (!pdfFile || !pdfFile.pdf_file) {
    console.log('No PDF file available, showing message');
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center text-gray-500">
          <FileText className="w-24 h-24 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium mb-2">روزنامه‌ای برای این تاریخ موجود نیست</h3>
          <p className="text-gray-400">لطفاً تاریخ دیگری انتخاب کنید یا از پنل مدیریت روزنامه آپلود کنید</p>
        </div>
      </div>
    );
  }

  // If pdfFile.pages exists and has images, show the image for the current page
  const hasImages = pdfFile && Array.isArray((pdfFile as any).pages) && (pdfFile as any).pages.length > 0;
  const currentPageImage = hasImages ? (pdfFile as any).pages.find((p: any) => p.page_number === currentPage) : null;

  if (hasImages && currentPageImage) {
    setNumPages((pdfFile as any).pages.length);
    return (
      <div className="flex justify-center">
        <div className="bg-white shadow-lg">
          <img
            src={currentPageImage.image.startsWith('http') ? currentPageImage.image : `http://localhost:8000${currentPageImage.image}`}
            alt={`صفحه ${currentPage}`}
            className="w-full h-auto max-w-4xl"
            style={{ background: '#fff' }}
          />
        </div>
      </div>
    );
  }

  // Set numPages when pdfFile changes
  useEffect(() => {
    let cancelled = false;
    const loadNumPages = async () => {
      if (!pdfFile || !pdfFile.pdf_file) return;
      try {
        const url = pdfFile.pdf_file;
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        if (!cancelled) setNumPages(pdf.numPages);
      } catch {}
    };
    loadNumPages();
    return () => { cancelled = true; };
  }, [pdfFile, setNumPages]);

  useEffect(() => {
    let cancelled = false;
    let renderTask: any = null;

    const renderPage = async () => {
      if (!pdfFile || !pdfFile.pdf_file) {
        console.log('No pdfFile or pdf_file');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const url = pdfFile.pdf_file;
        console.log('PDF.js loading URL:', url);
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        console.log('PDF loaded, numPages:', pdf.numPages);
        const page = await pdf.getPage(currentPage);
        console.log('Got page:', currentPage);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) {
          console.log('No canvas');
          return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
          console.log('No context');
          return;
        }
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        if (renderTask && renderTask.cancel) {
          renderTask.cancel();
        }
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        console.log('Page rendered');
      } catch (err) {
        if (!cancelled) {
          console.error('PDF.js error:', err);
          setError('خطا در بارگذاری یا نمایش PDF');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTask && renderTask.cancel) {
        renderTask.cancel();
      }
    };
  }, [pdfFile, currentPage]);

  // This check is now handled at the top of the component

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center text-gray-500">
          <FileText className="w-24 h-24 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium mb-2">{error}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="bg-white shadow-lg" style={{ position: 'relative' }}>
        <canvas ref={canvasRef} className="w-full h-auto max-w-4xl" />
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
          >
            <div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewspaperViewer;