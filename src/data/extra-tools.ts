import type { ToolDef } from "@/lib/tools";

type ExtraTool = Omit<ToolDef, "need" | "v1">;

function server(tool: ExtraTool): ToolDef {
  return { ...tool, need: "vps", v1: false };
}

function pair(
  slug: string,
  title: string,
  category: string,
  inputs: string[],
  output: string,
  purpose: string,
  engine = "server",
) {
  return server({ slug, title, category, inputs, output, purpose, engine });
}

function family(
  formats: string[],
  output: string,
  category: string,
  engine: string,
  purpose: (format: string) => string,
) {
  return formats.map((format) => {
    const slugFrom = format.replace(/\./g, "-");
    const slugTo = output.replace(/\./g, "-");
    return pair(
      `${slugFrom}-to-${slugTo}`,
      `${format.toUpperCase()} to ${output.toUpperCase()}`,
      category,
      [format],
      output,
      purpose(format.toUpperCase()),
      engine,
    );
  });
}

const curated: ToolDef[] = [
  pair("pdf-editor", "PDF editor", "PDF", ["pdf"], "pdf", "Edit PDF text, images, shapes, and annotations."),
  pair("compress-pdf", "Compress PDF", "PDF", ["pdf"], "pdf", "Reduce PDF file size while preserving readable quality."),
  pair("pdf-annotator", "PDF annotator", "PDF", ["pdf"], "pdf", "Highlight, draw, comment, and annotate PDF pages."),
  pair("protect-pdf", "Protect PDF", "PDF", ["pdf"], "pdf", "Encrypt a PDF with a password."),
  pair("pdf-ocr", "PDF OCR", "PDF", ["pdf"], "txt", "Recognize text inside scanned PDF pages.", "ocr"),
  pair("pdf-to-pdfa", "PDF to PDF/A", "PDF", ["pdf"], "pdfa", "Create an archival PDF/A document."),
  pair("pdf-to-xlsx", "PDF to Excel", "PDF", ["pdf"], "xlsx", "Extract tables from PDF into an Excel workbook.", "ocr"),
  pair("pdf-to-pptx", "PDF to PowerPoint", "PDF", ["pdf"], "pptx", "Turn PDF pages into a PowerPoint deck."),
  pair("pdf-scanner", "PDF scanner", "PDF", ["jpg", "jpeg", "png", "heic"], "pdf", "Clean photographed pages and combine them into a PDF.", "ocr"),
  pair("share-pdf", "Share PDF", "PDF", ["pdf"], "url", "Upload a PDF and create a shareable link.", "storage"),
  pair("pdf-ai-summary", "AI PDF summarizer", "PDF", ["pdf"], "txt", "Summarize long PDF documents with AI.", "ai"),
  pair("chat-with-pdf", "Chat with PDF", "PDF", ["pdf"], "txt", "Ask questions about a PDF document.", "ai"),
  pair("translate-pdf", "Translate PDF", "PDF", ["pdf"], "pdf", "Translate PDF text while retaining document structure.", "ai"),

  pair("doc-to-pdf", "DOC to PDF", "Dokumen", ["doc"], "pdf", "Convert legacy Microsoft Word DOC files to PDF.", "libreoffice"),
  pair("doc-to-docx", "DOC to DOCX", "Dokumen", ["doc"], "docx", "Upgrade a legacy Word document to DOCX.", "libreoffice"),
  pair("docm-to-pdf", "DOCM to PDF", "Dokumen", ["docm"], "pdf", "Convert macro-enabled Word documents to PDF.", "libreoffice"),
  pair("docm-to-docx", "DOCM to DOCX", "Dokumen", ["docm"], "docx", "Create a macro-free Word document.", "libreoffice"),
  pair("odt-to-pdf", "ODT to PDF", "Dokumen", ["odt"], "pdf", "Convert OpenDocument text files to PDF.", "libreoffice"),
  pair("odt-to-docx", "ODT to Word", "Dokumen", ["odt"], "docx", "Convert an OpenDocument text file to Word.", "libreoffice"),
  pair("rtf-to-pdf", "RTF to PDF", "Dokumen", ["rtf"], "pdf", "Convert Rich Text Format documents to PDF.", "libreoffice"),
  pair("rtf-to-docx", "RTF to Word", "Dokumen", ["rtf"], "docx", "Convert Rich Text Format to a Word document.", "libreoffice"),
  pair("pages-to-pdf", "Pages to PDF", "Dokumen", ["pages"], "pdf", "Convert Apple Pages documents to PDF.", "libreoffice"),
  pair("pages-to-docx", "Pages to Word", "Dokumen", ["pages"], "docx", "Convert Apple Pages to a Word document.", "libreoffice"),
  pair("hwp-to-pdf", "HWP to PDF", "Dokumen", ["hwp", "hwpx"], "pdf", "Convert Hangul Word Processor documents to PDF.", "libreoffice"),
  pair("hwp-to-docx", "HWP to Word", "Dokumen", ["hwp", "hwpx"], "docx", "Convert Hangul Word Processor documents to Word.", "libreoffice"),
  pair("md-to-pdf", "Markdown to PDF", "Dokumen", ["md"], "pdf", "Render Markdown as a PDF document."),
  pair("md-to-docx", "Markdown to Word", "Dokumen", ["md"], "docx", "Convert Markdown into a Word document."),
  pair("tex-to-pdf", "TeX to PDF", "Dokumen", ["tex"], "pdf", "Compile TeX source into a PDF.", "latex"),
  pair("xps-to-pdf", "XPS to PDF", "Dokumen", ["xps"], "pdf", "Convert XPS documents to PDF."),
  pair("djvu-to-pdf", "DJVU to PDF", "Dokumen", ["djvu"], "pdf", "Convert DJVU documents to PDF."),
  pair("wps-to-pdf", "WPS to PDF", "Dokumen", ["wps"], "pdf", "Convert Microsoft Works or WPS documents to PDF.", "libreoffice"),
  pair("wps-to-docx", "WPS to Word", "Dokumen", ["wps"], "docx", "Convert a WPS document to Word.", "libreoffice"),
  pair("html-to-docx", "HTML to Word", "Dokumen", ["html", "htm"], "docx", "Turn an HTML page into an editable Word document.", "libreoffice"),
  pair("eml-to-pdf", "EML to PDF", "Dokumen", ["eml"], "pdf", "Save an email message as a PDF."),

  pair("xls-to-xlsx", "XLS to XLSX", "Spreadsheet", ["xls"], "xlsx", "Upgrade a legacy Excel workbook to XLSX.", "libreoffice"),
  pair("xls-to-pdf", "XLS to PDF", "Spreadsheet", ["xls"], "pdf", "Convert a legacy Excel spreadsheet to PDF.", "libreoffice"),
  pair("xls-to-csv", "XLS to CSV", "Spreadsheet", ["xls"], "csv", "Export a legacy Excel workbook to CSV.", "libreoffice"),
  pair("xlsm-to-xlsx", "XLSM to XLSX", "Spreadsheet", ["xlsm"], "xlsx", "Create a macro-free XLSX workbook.", "libreoffice"),
  pair("xlsm-to-pdf", "XLSM to PDF", "Spreadsheet", ["xlsm"], "pdf", "Convert a macro-enabled workbook to PDF.", "libreoffice"),
  pair("xlsm-to-csv", "XLSM to CSV", "Spreadsheet", ["xlsm"], "csv", "Export a macro-enabled workbook to CSV.", "libreoffice"),
  pair("ods-to-xlsx", "ODS to XLSX", "Spreadsheet", ["ods"], "xlsx", "Convert an OpenDocument spreadsheet to Excel.", "libreoffice"),
  pair("ods-to-pdf", "ODS to PDF", "Spreadsheet", ["ods"], "pdf", "Convert an OpenDocument spreadsheet to PDF.", "libreoffice"),
  pair("ods-to-csv", "ODS to CSV", "Spreadsheet", ["ods"], "csv", "Export an OpenDocument spreadsheet to CSV.", "libreoffice"),
  pair("numbers-to-xlsx", "Numbers to Excel", "Spreadsheet", ["numbers"], "xlsx", "Convert Apple Numbers to XLSX.", "libreoffice"),
  pair("numbers-to-pdf", "Numbers to PDF", "Spreadsheet", ["numbers"], "pdf", "Convert Apple Numbers to PDF.", "libreoffice"),
  pair("numbers-to-csv", "Numbers to CSV", "Spreadsheet", ["numbers"], "csv", "Export Apple Numbers to CSV.", "libreoffice"),
  pair("xlsx-to-ods", "Excel to ODS", "Spreadsheet", ["xlsx"], "ods", "Convert an Excel workbook to OpenDocument.", "libreoffice"),

  pair("ppt-to-pptx", "PPT to PPTX", "Presentasi", ["ppt"], "pptx", "Upgrade a legacy PowerPoint file to PPTX.", "libreoffice"),
  pair("ppt-to-pdf", "PPT to PDF", "Presentasi", ["ppt"], "pdf", "Convert a legacy PowerPoint presentation to PDF.", "libreoffice"),
  pair("pptm-to-pdf", "PPTM to PDF", "Presentasi", ["pptm"], "pdf", "Convert a macro-enabled presentation to PDF.", "libreoffice"),
  pair("pptm-to-pptx", "PPTM to PPTX", "Presentasi", ["pptm"], "pptx", "Create a macro-free PowerPoint file.", "libreoffice"),
  pair("odp-to-pptx", "ODP to PPTX", "Presentasi", ["odp"], "pptx", "Convert an OpenDocument presentation to PowerPoint.", "libreoffice"),
  pair("odp-to-pdf", "ODP to PDF", "Presentasi", ["odp"], "pdf", "Convert an OpenDocument presentation to PDF.", "libreoffice"),
  pair("key-to-pptx", "Keynote to PowerPoint", "Presentasi", ["key"], "pptx", "Convert Apple Keynote to PPTX.", "libreoffice"),
  pair("key-to-pdf", "Keynote to PDF", "Presentasi", ["key"], "pdf", "Convert Apple Keynote to PDF.", "libreoffice"),

  pair("epub-to-pdf", "EPUB to PDF", "E-book", ["epub"], "pdf", "Convert an EPUB ebook to a fixed-layout PDF.", "ebook"),
  pair("epub-to-mobi", "EPUB to MOBI", "E-book", ["epub"], "mobi", "Convert EPUB for older Kindle readers.", "ebook"),
  pair("mobi-to-epub", "MOBI to EPUB", "E-book", ["mobi"], "epub", "Convert MOBI to the modern EPUB format.", "ebook"),
  pair("mobi-to-pdf", "MOBI to PDF", "E-book", ["mobi"], "pdf", "Convert a MOBI ebook to PDF.", "ebook"),
  pair("azw-to-pdf", "AZW to PDF", "E-book", ["azw", "azw3", "azw4"], "pdf", "Convert a Kindle ebook to PDF.", "ebook"),
  pair("azw-to-epub", "AZW to EPUB", "E-book", ["azw", "azw3", "azw4"], "epub", "Convert a Kindle ebook to EPUB.", "ebook"),
  pair("cbz-to-pdf", "CBZ to PDF", "E-book", ["cbz"], "pdf", "Convert a comic archive to PDF.", "ebook"),
  pair("cbr-to-pdf", "CBR to PDF", "E-book", ["cbr"], "pdf", "Convert a comic archive to PDF.", "ebook"),
  pair("fb2-to-epub", "FB2 to EPUB", "E-book", ["fb2"], "epub", "Convert FictionBook files to EPUB.", "ebook"),
  pair("fb2-to-pdf", "FB2 to PDF", "E-book", ["fb2"], "pdf", "Convert a FictionBook ebook to PDF.", "ebook"),

  pair("rar-to-zip", "RAR to ZIP", "Arsip", ["rar"], "zip", "Convert a RAR archive to ZIP.", "archive"),
  pair("7z-to-zip", "7Z to ZIP", "Arsip", ["7z"], "zip", "Convert a 7Z archive to ZIP.", "archive"),
  pair("7z-to-tar", "7Z to TAR", "Arsip", ["7z"], "tar", "Convert a 7Z archive to TAR.", "archive"),
  pair("tar-to-zip", "TAR to ZIP", "Arsip", ["tar"], "zip", "Convert a TAR archive to ZIP.", "archive"),
  pair("tar-gz-to-zip", "TAR.GZ to ZIP", "Arsip", ["gz", "tgz"], "zip", "Convert a compressed TAR archive to ZIP.", "archive"),
  pair("zip-to-7z", "ZIP to 7Z", "Arsip", ["zip"], "7z", "Convert a ZIP archive to 7Z.", "archive"),
  pair("zip-to-tar", "ZIP to TAR", "Arsip", ["zip"], "tar", "Convert a ZIP archive to TAR.", "archive"),
  pair("extract-archive", "Extract archive", "Arsip", ["zip", "rar", "7z", "tar", "gz"], "files", "Open an archive and download its contents.", "archive"),

  pair("ai-to-svg", "AI to SVG", "Vektor", ["ai"], "svg", "Convert an Adobe Illustrator file to SVG.", "vector"),
  pair("ai-to-pdf", "AI to PDF", "Vektor", ["ai"], "pdf", "Convert an Adobe Illustrator file to PDF.", "vector"),
  pair("eps-to-svg", "EPS to SVG", "Vektor", ["eps"], "svg", "Convert Encapsulated PostScript to SVG.", "vector"),
  pair("eps-to-pdf", "EPS to PDF", "Vektor", ["eps"], "pdf", "Convert Encapsulated PostScript to PDF.", "vector"),
  pair("cdr-to-svg", "CDR to SVG", "Vektor", ["cdr"], "svg", "Convert CorelDRAW artwork to SVG.", "vector"),
  pair("svg-to-eps", "SVG to EPS", "Vektor", ["svg"], "eps", "Convert SVG artwork to EPS.", "vector"),
  pair("wmf-to-svg", "WMF to SVG", "Vektor", ["wmf"], "svg", "Convert Windows Metafile artwork to SVG.", "vector"),

  pair("raw-to-jpg", "RAW to JPG", "Gambar", ["raw"], "jpg", "Develop a camera RAW image into JPG.", "raw"),
  pair("cr2-to-jpg", "CR2 to JPG", "Gambar", ["cr2"], "jpg", "Develop a Canon RAW photo into JPG.", "raw"),
  pair("cr3-to-jpg", "CR3 to JPG", "Gambar", ["cr3"], "jpg", "Develop a Canon CR3 photo into JPG.", "raw"),
  pair("nef-to-jpg", "NEF to JPG", "Gambar", ["nef"], "jpg", "Develop a Nikon RAW photo into JPG.", "raw"),
  pair("arw-to-jpg", "ARW to JPG", "Gambar", ["arw"], "jpg", "Develop a Sony RAW photo into JPG.", "raw"),
  pair("dng-to-jpg", "DNG to JPG", "Gambar", ["dng"], "jpg", "Develop a Digital Negative into JPG.", "raw"),
  pair("orf-to-jpg", "ORF to JPG", "Gambar", ["orf"], "jpg", "Develop an Olympus RAW photo into JPG.", "raw"),
  pair("rw2-to-jpg", "RW2 to JPG", "Gambar", ["rw2"], "jpg", "Develop a Panasonic RAW photo into JPG.", "raw"),
  pair("raf-to-jpg", "RAF to JPG", "Gambar", ["raf"], "jpg", "Develop a Fujifilm RAW photo into JPG.", "raw"),
  pair("psd-to-png", "PSD to PNG", "Gambar", ["psd"], "png", "Flatten a Photoshop document into PNG.", "image-server"),
  pair("psd-to-jpg", "PSD to JPG", "Gambar", ["psd"], "jpg", "Flatten a Photoshop document into JPG.", "image-server"),
  pair("xcf-to-png", "XCF to PNG", "Gambar", ["xcf"], "png", "Flatten a GIMP image into PNG.", "image-server"),
  pair("tga-to-png", "TGA to PNG", "Gambar", ["tga"], "png", "Convert a Targa image to PNG.", "image-server"),
  pair("ppm-to-png", "PPM to PNG", "Gambar", ["ppm"], "png", "Convert a portable pixmap to PNG.", "image-server"),

  pair("dwg-to-dxf", "DWG to DXF", "CAD", ["dwg"], "dxf", "Convert an AutoCAD drawing to DXF.", "cad"),
  pair("dwg-to-pdf", "DWG to PDF", "CAD", ["dwg"], "pdf", "Render an AutoCAD drawing as PDF.", "cad"),
  pair("dxf-to-pdf", "DXF to PDF", "CAD", ["dxf"], "pdf", "Render a DXF drawing as PDF.", "cad"),
  pair("dxf-to-dwg", "DXF to DWG", "CAD", ["dxf"], "dwg", "Convert a DXF drawing to DWG.", "cad"),
  pair("stp-to-obj", "STEP to OBJ", "CAD", ["stp", "step"], "obj", "Convert a STEP model to OBJ.", "cad"),

  pair("otf-to-ttf", "OTF to TTF", "Font", ["otf"], "ttf", "Convert an OpenType font to TrueType.", "woff2"),
  pair("eot-to-woff2", "EOT to WOFF2", "Font", ["eot"], "woff2", "Convert a legacy EOT font to WOFF2.", "woff2"),
  pair("ttf-to-woff", "TTF to WOFF", "Font", ["ttf"], "woff", "Convert a TrueType font to WOFF.", "woff2"),
  pair("woff2-to-ttf", "WOFF2 to TTF", "Font", ["woff2"], "ttf", "Convert a WOFF2 webfont back to TTF.", "woff2"),
];

const catalog: ToolDef[] = [
  ...family(
    ["abw", "dot", "dotx", "lwp", "rst", "sdw", "wpd", "zabw"],
    "pdf",
    "Dokumen",
    "libreoffice",
    (format) => `Convert a ${format} document to PDF.`,
  ),
  ...family(
    ["abw", "dot", "dotx", "lwp", "rst", "wpd", "zabw"],
    "docx",
    "Dokumen",
    "libreoffice",
    (format) => `Convert a ${format} document to Word.`,
  ),
  pair("txt-to-docx", "TXT to Word", "Dokumen", ["txt"], "docx", "Turn a plain-text file into a Word document.", "libreoffice"),

  ...family(
    ["et", "sdc"],
    "xlsx",
    "Spreadsheet",
    "libreoffice",
    (format) => `Convert a ${format} spreadsheet to Excel.`,
  ),
  ...family(
    ["et", "sdc"],
    "pdf",
    "Spreadsheet",
    "libreoffice",
    (format) => `Convert a ${format} spreadsheet to PDF.`,
  ),

  pair("dps-to-pdf", "DPS to PDF", "Presentasi", ["dps"], "pdf", "Convert a WPS presentation to PDF.", "libreoffice"),
  pair("dps-to-pptx", "DPS to PPTX", "Presentasi", ["dps"], "pptx", "Convert a WPS presentation to PowerPoint.", "libreoffice"),
  pair("sda-to-pdf", "SDA to PDF", "Presentasi", ["sda"], "pdf", "Convert a StarOffice presentation to PDF.", "libreoffice"),
  pair("pot-to-pptx", "POT to PPTX", "Presentasi", ["pot"], "pptx", "Turn a PowerPoint template into a presentation.", "libreoffice"),
  pair("potx-to-pptx", "POTX to PPTX", "Presentasi", ["potx"], "pptx", "Turn a modern PowerPoint template into a presentation.", "libreoffice"),
  pair("pps-to-pdf", "PPS to PDF", "Presentasi", ["pps"], "pdf", "Convert a PowerPoint slideshow to PDF.", "libreoffice"),
  pair("pps-to-pptx", "PPS to PPTX", "Presentasi", ["pps"], "pptx", "Convert a PowerPoint slideshow to an editable deck.", "libreoffice"),
  pair("ppsx-to-pptx", "PPSX to PPTX", "Presentasi", ["ppsx", "ppsk"], "pptx", "Convert a slideshow file to an editable PowerPoint deck.", "libreoffice"),
  pair("ppsx-to-pdf", "PPSX to PDF", "Presentasi", ["ppsx", "ppsk"], "pdf", "Convert a PowerPoint slideshow to PDF.", "libreoffice"),

  ...family(
    ["azw3", "azw4", "cbc", "chm", "htmlz", "lit", "lrf", "oeb", "pdb", "pml", "prc", "rb", "snb", "tcr", "txtz"],
    "epub",
    "E-book",
    "ebook",
    (format) => `Convert a ${format} ebook to EPUB.`,
  ),
  ...family(
    ["azw3", "cbc", "chm", "htmlz", "lit", "lrf", "pdb", "prc"],
    "pdf",
    "E-book",
    "ebook",
    (format) => `Convert a ${format} ebook to PDF.`,
  ),
  pair("epub-to-azw3", "EPUB to AZW3", "E-book", ["epub"], "azw3", "Convert EPUB for newer Kindle readers.", "ebook"),

  pair("ace-to-zip", "ACE to ZIP", "Arsip", ["ace"], "zip", "Convert an ACE archive to ZIP.", "archive"),
  pair("alz-to-zip", "ALZ to ZIP", "Arsip", ["alz"], "zip", "Convert an ALZ archive to ZIP.", "archive"),
  pair("arc-to-zip", "ARC to ZIP", "Arsip", ["arc"], "zip", "Convert an ARC archive to ZIP.", "archive"),
  pair("arj-to-zip", "ARJ to ZIP", "Arsip", ["arj"], "zip", "Convert an ARJ archive to ZIP.", "archive"),
  pair("bz2-to-zip", "BZ2 to ZIP", "Arsip", ["bz2", "bz"], "zip", "Convert a BZip2 archive to ZIP.", "archive"),
  pair("cab-to-zip", "CAB to ZIP", "Arsip", ["cab"], "zip", "Convert a Cabinet archive to ZIP.", "archive"),
  pair("cpio-to-zip", "CPIO to ZIP", "Arsip", ["cpio"], "zip", "Convert a CPIO archive to ZIP.", "archive"),
  pair("deb-to-zip", "DEB to ZIP", "Arsip", ["deb"], "zip", "Convert a Debian package to ZIP.", "archive"),
  pair("dmg-to-zip", "DMG to ZIP", "Arsip", ["dmg"], "zip", "Convert a disk image to ZIP.", "archive"),
  pair("img-to-zip", "IMG to ZIP", "Arsip", ["img"], "zip", "Convert a disk image to ZIP.", "archive"),
  pair("iso-to-zip", "ISO to ZIP", "Arsip", ["iso"], "zip", "Extract an ISO disc image into ZIP.", "archive"),
  pair("jar-to-zip", "JAR to ZIP", "Arsip", ["jar"], "zip", "Convert a JAR archive to ZIP.", "archive"),
  pair("lha-to-zip", "LHA to ZIP", "Arsip", ["lha"], "zip", "Convert an LHA archive to ZIP.", "archive"),
  pair("lz-to-zip", "LZ to ZIP", "Arsip", ["lz", "lzma", "lzo"], "zip", "Convert an LZ archive to ZIP.", "archive"),
  pair("rpm-to-zip", "RPM to ZIP", "Arsip", ["rpm"], "zip", "Convert an RPM package to ZIP.", "archive"),
  pair("xz-to-zip", "XZ to ZIP", "Arsip", ["xz", "rz"], "zip", "Convert an XZ archive to ZIP.", "archive"),
  pair("z-to-zip", "Z to ZIP", "Arsip", ["z"], "zip", "Convert a UNIX compress archive to ZIP.", "archive"),
  pair("tar-bz2-to-zip", "TAR.BZ2 to ZIP", "Arsip", ["bz2", "tbz", "tbz2"], "zip", "Convert a bzip2 TAR archive to ZIP.", "archive"),
  pair("tar-xz-to-zip", "TAR.XZ to ZIP", "Arsip", ["xz", "tz"], "zip", "Convert an xz TAR archive to ZIP.", "archive"),
  pair("tar-7z-to-zip", "TAR.7Z to ZIP", "Arsip", ["7z"], "zip", "Convert a 7Z TAR archive to ZIP.", "archive"),

  pair("cgm-to-svg", "CGM to SVG", "Vektor", ["cgm"], "svg", "Convert Computer Graphics Metafile artwork to SVG.", "vector"),
  pair("emf-to-svg", "EMF to SVG", "Vektor", ["emf"], "svg", "Convert an Enhanced Metafile to SVG.", "vector"),
  pair("emf-to-pdf", "EMF to PDF", "Vektor", ["emf"], "pdf", "Convert an Enhanced Metafile to PDF.", "vector"),
  pair("sk-to-svg", "SK to SVG", "Vektor", ["sk"], "svg", "Convert a Sketch/sK1 drawing to SVG.", "vector"),
  pair("sk1-to-svg", "SK1 to SVG", "Vektor", ["sk1"], "svg", "Convert an sK1 drawing to SVG.", "vector"),
  pair("svgz-to-svg", "SVGZ to SVG", "Vektor", ["svgz"], "svg", "Decompress an SVGZ file to SVG.", "vector"),
  pair("vsd-to-svg", "VSD to SVG", "Vektor", ["vsd"], "svg", "Convert a Visio drawing to SVG.", "vector"),
  pair("vsd-to-pdf", "VSD to PDF", "Vektor", ["vsd"], "pdf", "Convert a Visio drawing to PDF.", "vector"),

  pair("dmf-to-dxf", "DMF to DXF", "CAD", ["dmf"], "dxf", "Convert a DMF drawing to DXF.", "cad"),
  pair("dmf-to-pdf", "DMF to PDF", "CAD", ["dmf"], "pdf", "Render a DMF drawing as PDF.", "cad"),

  ...family(
    ["3fr", "crm", "crw", "dcr", "erf", "mos", "mrw", "pef", "rm2", "x3f"],
    "jpg",
    "Gambar",
    "raw",
    (format) => `Develop a ${format} camera RAW photo into JPG.`,
  ),
  pair("icns-to-png", "ICNS to PNG", "Gambar", ["icns", "icons"], "png", "Convert a macOS icon to PNG.", "image-server"),
  pair("odg-to-png", "ODG to PNG", "Gambar", ["odg", "odd"], "png", "Raster an OpenDocument drawing to PNG.", "image-server"),
  pair("ps-to-png", "PS to PNG", "Gambar", ["ps"], "png", "Raster a PostScript file to PNG.", "image-server"),
  pair("ps-to-pdf", "PS to PDF", "Gambar", ["ps"], "pdf", "Convert a PostScript file to PDF.", "image-server"),
  pair("psb-to-png", "PSB to PNG", "Gambar", ["psb"], "png", "Flatten a large Photoshop document to PNG.", "image-server"),
  pair("pub-to-pdf", "PUB to PDF", "Gambar", ["pub"], "pdf", "Convert a Microsoft Publisher file to PDF.", "image-server"),
  pair("xps-to-png", "XPS to PNG", "Gambar", ["xps"], "png", "Raster an XPS document to PNG.", "image-server"),

  pair("mkv-to-webm", "MKV to WEBM", "Video", ["mkv"], "webm", "Convert MKV to a web-playable WEBM file.", "ffmpeg"),
  pair("mkv-to-mp4", "MKV to MP4", "Video", ["mkv"], "mp4", "Convert MKV to a widely supported MP4 file.", "ffmpeg"),
  pair("avi-to-mp4", "AVI to MP4", "Video", ["avi"], "mp4", "Convert AVI to a modern MP4 file.", "ffmpeg"),
  pair("webm-to-mp4", "WEBM to MP4", "Video", ["webm"], "mp4", "Convert WEBM to MP4.", "ffmpeg"),
  pair("mp4-to-webm", "MP4 to WEBM", "Video", ["mp4"], "webm", "Convert MP4 to WEBM.", "ffmpeg"),
  pair("wmv-to-mp4", "WMV to MP4", "Video", ["wmv"], "mp4", "Convert Windows Media Video to MP4.", "ffmpeg"),
  pair("flv-to-mp4", "FLV to MP4", "Video", ["flv"], "mp4", "Convert Flash video to MP4.", "ffmpeg"),
  pair("mpeg-to-mp4", "MPEG to MP4", "Video", ["mpeg", "mpg"], "mp4", "Convert MPEG video to MP4.", "ffmpeg"),
  ...family(
    ["3g2", "3gp", "m2ts", "m4v", "mod", "mts", "mxf", "ogv", "rm", "rmvb", "swf", "ts", "vob", "wtv", "cavs", "dv", "dvr"],
    "mp4",
    "Video",
    "ffmpeg",
    (format) => `Convert ${format} video to MP4.`,
  ),

  pair("wav-to-mp3", "WAV to MP3", "Audio", ["wav"], "mp3", "Compress WAV audio to MP3.", "ffmpeg"),
  pair("flac-to-m4a", "FLAC to M4A", "Audio", ["flac"], "m4a", "Convert lossless FLAC to portable M4A.", "ffmpeg"),
  pair("flac-to-mp3", "FLAC to MP3", "Audio", ["flac"], "mp3", "Convert lossless FLAC to MP3.", "ffmpeg"),
  pair("ogg-to-aac", "OGG to AAC", "Audio", ["ogg", "oga"], "aac", "Convert OGG audio to AAC.", "ffmpeg"),
  pair("ogg-to-mp3", "OGG to MP3", "Audio", ["ogg", "oga"], "mp3", "Convert OGG audio to MP3.", "ffmpeg"),
  pair("aac-to-mp3", "AAC to MP3", "Audio", ["aac"], "mp3", "Convert AAC audio to MP3.", "ffmpeg"),
  pair("m4a-to-mp3", "M4A to MP3", "Audio", ["m4a"], "mp3", "Convert M4A audio to MP3.", "ffmpeg"),
  pair("wma-to-mp3", "WMA to MP3", "Audio", ["wma"], "mp3", "Convert Windows Media Audio to MP3.", "ffmpeg"),
  pair("aiff-to-mp3", "AIFF to MP3", "Audio", ["aiff", "aif", "aifc"], "mp3", "Convert AIFF audio to MP3.", "ffmpeg"),
  pair("opus-to-mp3", "OPUS to MP3", "Audio", ["opus"], "mp3", "Convert Opus audio to MP3.", "ffmpeg"),
  pair("mp3-to-wav", "MP3 to WAV", "Audio", ["mp3"], "wav", "Convert MP3 to uncompressed WAV.", "ffmpeg"),
  ...family(
    ["ac3", "amr", "au", "caf", "dss", "m4b", "voc", "weba"],
    "mp3",
    "Audio",
    "ffmpeg",
    (format) => `Convert ${format} audio to MP3.`,
  ),
  pair("sf2-to-wav", "SF2 to WAV", "Audio", ["sf2"], "wav", "Render a SoundFont bank to WAV.", "ffmpeg"),
];

const seen = new Set<string>();
export const extraTools: ToolDef[] = [...curated, ...catalog].filter((tool) => {
  if (seen.has(tool.slug)) return false;
  seen.add(tool.slug);
  return true;
});
