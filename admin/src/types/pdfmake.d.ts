declare module 'pdfmake/build/pdfmake' {
  const pdfMake: any
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: any
  export default pdfFonts
}

declare global {
  interface Window {
    pdfMake?: any
  }
}

export {}


