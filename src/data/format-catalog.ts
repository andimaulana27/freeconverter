export type CatalogGroup = {
  category: string;
  label: string;
  formats: string[];
  common: { slug: string; from: string; to: string; note: string }[];
};

export const FORMAT_CATALOG: CatalogGroup[] = [
  {
    category: "Dokumen",
    label: "Documents",
    formats: ["abw", "djvu", "doc", "docm", "docx", "dot", "dotx", "html", "hwp", "hwpx", "lwp", "md", "odt", "pages", "pdf", "rst", "rtf", "sdw", "tex", "txt", "wpd", "wps", "zabw"],
    common: [
      { slug: "pdf-to-docx", from: "pdf", to: "docx", note: "editable Word document" },
      { slug: "docx-to-pdf", from: "docx", to: "pdf", note: "print-ready PDF" },
      { slug: "html-to-txt", from: "html", to: "txt", note: "plain text export" },
    ],
  },
  {
    category: "Gambar",
    label: "Images",
    formats: ["3fr", "arw", "avif", "bmp", "cr2", "cr3", "crm", "dcr", "dng", "eps", "erf", "gif", "heic", "heif", "icns", "ico", "jif", "jpeg", "jpg", "mos", "mrw", "nef", "odd", "odg", "orf", "pef", "png", "ppm", "ps", "psb", "psd", "pub", "raf", "raw", "rm2", "tga", "tif", "tiff", "webp", "x3f", "xcf", "xps"],
    common: [
      { slug: "heic-to-jpg", from: "heic", to: "jpg", note: "camera roll compatibility" },
      { slug: "svg-to-png", from: "svg", to: "png", note: "raster image output" },
      { slug: "tiff-to-webp", from: "tiff", to: "webp", note: "smaller web image" },
    ],
  },
  {
    category: "Video",
    label: "Video",
    formats: ["3g2", "3gp", "3gpp", "avi", "cavs", "dv", "dvr", "flv", "m2ts", "m4v", "mkv", "mod", "mov", "mp4", "mpeg", "mpg", "mts", "mxf", "ogg", "ogv", "rm", "rmvb", "swf", "ts", "vob", "webm", "wmv", "wtv"],
    common: [
      { slug: "mov-to-mp4", from: "mov", to: "mp4", note: "browser-friendly video" },
      { slug: "mkv-to-webm", from: "mkv", to: "webm", note: "web playback" },
      { slug: "avi-to-mp4", from: "avi", to: "mp4", note: "device compatibility" },
    ],
  },
  {
    category: "Audio",
    label: "Audio",
    formats: ["aac", "ac3", "aif", "aifc", "aiff", "amr", "au", "caf", "dss", "flac", "m4a", "m4b", "mp3", "oga", "opus", "sf2", "voc", "wav", "weba", "wma"],
    common: [
      { slug: "wav-to-mp3", from: "wav", to: "mp3", note: "compressed audio" },
      { slug: "flac-to-m4a", from: "flac", to: "m4a", note: "portable lossless library" },
      { slug: "ogg-to-aac", from: "ogg", to: "aac", note: "mobile playback" },
    ],
  },
  {
    category: "Spreadsheet",
    label: "Spreadsheets",
    formats: ["csv", "et", "numbers", "ods", "sdc", "xls", "xlsm", "xlsx"],
    common: [
      { slug: "xlsx-to-csv", from: "xlsx", to: "csv", note: "data export" },
      { slug: "ods-to-xlsx", from: "ods", to: "xlsx", note: "Excel workflow" },
      { slug: "numbers-to-pdf", from: "numbers", to: "pdf", note: "shareable report" },
    ],
  },
  {
    category: "Presentasi",
    label: "Slides",
    formats: ["dps", "key", "odp", "pot", "potx", "pps", "ppsk", "ppsx", "ppt", "pptm", "pptx", "sda"],
    common: [
      { slug: "pptx-to-pdf", from: "pptx", to: "pdf", note: "deck handoff" },
      { slug: "key-to-pptx", from: "key", to: "pptx", note: "PowerPoint editing" },
      { slug: "odp-to-pdf", from: "odp", to: "pdf", note: "review copy" },
    ],
  },
  {
    category: "E-book",
    label: "E-books",
    formats: ["azw", "azw3", "azw4", "cbc", "cbr", "cbz", "chm", "epub", "fb2", "htm", "htmlz", "lit", "lrf", "mobi", "oeb", "pdb", "pml", "prc", "rb", "snb", "tcr", "txtz"],
    common: [
      { slug: "epub-to-pdf", from: "epub", to: "pdf", note: "fixed-layout reading" },
      { slug: "mobi-to-epub", from: "mobi", to: "epub", note: "modern reader format" },
      { slug: "azw-to-pdf", from: "azw", to: "pdf", note: "document archive" },
    ],
  },
  {
    category: "Arsip",
    label: "Archives",
    formats: ["7z", "ace", "alz", "arc", "arj", "bz", "bz2", "cab", "cpio", "deb", "dmg", "eml", "gz", "img", "iso", "jar", "lha", "lz", "lzma", "lzo", "rar", "rpm", "rz", "tar", "tar.7z", "tar.bz", "tar.bz2", "tar.gz", "tar.lzo", "tar.xz", "tar.z", "tbz", "tbz2", "tgz", "tz", "tzo", "xz", "z", "zip"],
    common: [
      { slug: "rar-to-zip", from: "rar", to: "zip", note: "standard archive" },
      { slug: "7z-to-tar", from: "7z", to: "tar", note: "server workflow" },
      { slug: "tar-gz-to-zip", from: "tar.gz", to: "zip", note: "desktop sharing" },
    ],
  },
  {
    category: "Vektor",
    label: "Vector",
    formats: ["ai", "cdr", "cgm", "emf", "sk", "sk1", "svg", "svgz", "vsd", "wmf"],
    common: [
      { slug: "svg-to-png", from: "svg", to: "png", note: "web preview" },
      { slug: "ai-to-svg", from: "ai", to: "svg", note: "vector handoff" },
      { slug: "eps-to-pdf", from: "eps", to: "pdf", note: "print proof" },
    ],
  },
  {
    category: "CAD",
    label: "CAD",
    formats: ["dmf", "dwg", "dxf"],
    common: [
      { slug: "dwg-to-dxf", from: "dwg", to: "dxf", note: "CAD interchange" },
      { slug: "dxf-to-pdf", from: "dxf", to: "pdf", note: "review drawing" },
      { slug: "stp-to-obj", from: "stp", to: "obj", note: "3D workflow" },
    ],
  },
  {
    category: "Font",
    label: "Fonts",
    formats: ["eot", "otf", "ttf", "woff", "woff2"],
    common: [
      { slug: "ttf-to-woff2", from: "ttf", to: "woff2", note: "web font delivery" },
      { slug: "otf-to-ttf", from: "otf", to: "ttf", note: "desktop compatibility" },
      { slug: "woff-to-woff2", from: "woff", to: "woff2", note: "smaller web font" },
    ],
  },
];

export const formatCatalogCount = FORMAT_CATALOG.reduce((sum, group) => sum + group.formats.length, 0);
