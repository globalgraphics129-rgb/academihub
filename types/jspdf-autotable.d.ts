import { jsPDF } from 'jspdf'

declare module 'jspdf-autotable' {
  interface AutoTableOptions {
    head?: (string | number)[][]
    body?: (string | number)[][]
    startY?: number
    theme?: 'striped' | 'grid' | 'plain'
    headStyles?: Record<string, unknown>
    bodyStyles?: Record<string, unknown>
    columnStyles?: Record<number, Record<string, unknown>>
    margin?: Record<string, number>
  }

  export default function autoTable(
    doc: jsPDF,
    options: AutoTableOptions
  ): void
}

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number }
    getNumberOfPages(): number
    setPage(n: number): jsPDF
  }
}
