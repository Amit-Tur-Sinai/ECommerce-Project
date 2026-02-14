import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

export interface ExportData {
  title: string;
  data: any[];
  columns?: string[];
  charts?: HTMLElement[];
}

// Export data to CSV
export const exportToCSV = (data: any[], filename: string = 'export.csv') => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to PDF
export const exportToPDF = async (
  elementId: string,
  filename: string = 'report.pdf',
  title?: string
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;

  let position = 0;

  if (title) {
    pdf.setFontSize(18);
    pdf.text(title, 105, 15, { align: 'center' });
    position = 25;
    heightLeft = imgHeight - 10;
  }

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
};

// Export chart to PDF
export const exportChartToPDF = async (
  chartElement: HTMLElement,
  filename: string = 'chart.pdf',
  title?: string
) => {
  const canvas = await html2canvas(chartElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 190;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (title) {
    pdf.setFontSize(18);
    pdf.text(title, 105, 15, { align: 'center' });
    pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
  } else {
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  }

  pdf.save(filename);
};

// Generate comprehensive report
export const generateReport = async (
  reportData: ExportData,
  includeCharts: boolean = true
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let yPosition = 20;

  // Add title
  pdf.setFontSize(20);
  pdf.text(reportData.title, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Add date
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPosition, { align: 'center' });
  yPosition += 10;

  // Add data table
  if (reportData.data.length > 0) {
    pdf.setFontSize(12);
    pdf.text('Data Summary', 10, yPosition);
    yPosition += 8;

    // Table headers
    const columns = reportData.columns || Object.keys(reportData.data[0]);
    const colWidth = 190 / columns.length;
    let xPosition = 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    columns.forEach((col) => {
      pdf.text(col.substring(0, 15), xPosition, yPosition);
      xPosition += colWidth;
    });
    yPosition += 7;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    reportData.data.slice(0, 20).forEach((row) => {
      if (yPosition > 280) {
        pdf.addPage();
        yPosition = 20;
      }
      xPosition = 10;
      columns.forEach((col) => {
        const value = String(row[col] || '').substring(0, 15);
        pdf.text(value, xPosition, yPosition);
        xPosition += colWidth;
      });
      yPosition += 7;
    });
  }

  pdf.save(`${reportData.title.replace(/\s+/g, '_')}_Report.pdf`);
};
