import { jsPDF } from 'jspdf';
import type { Lesson } from './lesson.ts';
import { printSections } from './lesson.ts';

export function lessonPdf(lesson: Lesson) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 20;
  const width = 170;
  let y = 24;
  pdf.setProperties({ title: lesson.title, subject: 'Planejamento de EBD Jovens' });
  function line(text: string, bold: boolean, size: number) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    const step = size * .47;
    for (const part of pdf.splitTextToSize(text, width) as string[]) {
      if (y + step > 279) {
        pdf.addPage();
        y = 24;
      }
      pdf.text(part, margin, y);
      y += step;
    }
  }
  line('Escola Bíblica Dominical · Jovens', false, 10);
  line(lesson.title, true, 21);
  for (const [heading, text] of printSections(lesson)) {
    if (y > 260) {
      pdf.addPage();
      y = 24;
    } else y += 4;
    line(heading, true, 12);
    line(text, false, 11);
  }
  return pdf;
}
