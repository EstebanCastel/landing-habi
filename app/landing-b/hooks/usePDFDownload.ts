"use client";

import React, { useState } from "react";
import { pdf } from "@react-pdf/renderer";

interface UsePDFDownloadProps {
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: Error) => void;
}

export const usePDFDownload = ({
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
}: UsePDFDownloadProps = {}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const downloadPDF = async (
    DocumentComponent: React.ComponentType<any>,
    data: any,
    filename: string = "reporte-financiero.pdf"
  ) => {
    /* eslint-enable @typescript-eslint/no-explicit-any */
    try {
      setIsDownloading(true);
      onDownloadStart?.();

      // Create PDF document with data
      const doc = pdf(React.createElement(DocumentComponent, { data }));

      // Generate the blob
      const blob = await doc.toBlob();

      // Create temporary URL
      const url = URL.createObjectURL(blob);

      // Create download element
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      // Add to DOM temporarily and click
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onDownloadComplete?.();
    } catch (error) {
      console.error("Error al generar PDF:", error);
      onDownloadError?.(error as Error);
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadPDF,
    isDownloading,
  };
};
