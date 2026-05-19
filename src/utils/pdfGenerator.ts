import { Buffer } from 'buffer';
import { Alert } from 'react-native';
import { Dirs, FileSystem } from 'react-native-file-access';
import Share from 'react-native-share';
import type { Term } from '../constants/term.types';
import { TERM_STATUS } from '../constants/termStatus';

// No pdfmake. We generate raw PDF using standard Type1 fonts (Helvetica/Helvetica-Bold)
// which are built into every PDF viewer — no font embedding needed, no Hermes issues.

// ── PRIMITIVES ────────────────────────────────────────────────────────────────

/** Hex color → PDF "r g b" values (0.0–1.0 range) */
function rgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

/**
 * Encode a JS string as a PDF string literal.
 * - Replaces Turkish chars absent from WinAnsiEncoding (ş→s, ğ→g, ı→i, İ→I, Ş→S, Ğ→G).
 * - ü, ö, ç, Ü, Ö, Ç ARE in WinAnsiEncoding and render correctly.
 * - Non-ASCII bytes encoded as \NNN octal so the result is pure ASCII.
 */
function ps(str: string): string {
  const t = str
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ı/g, 'i').replace(/İ/g, 'I');
  let r = '';
  for (let i = 0; i < t.length; i++) {
    const code = t.charCodeAt(i);
    if (code === 40) { r += '\\('; }
    else if (code === 41) { r += '\\)'; }
    else if (code === 92) { r += '\\\\'; }
    else if (code < 128) { r += t[i]; }
    else { r += '\\' + code.toString(8).padStart(3, '0'); } // octal
  }
  return `(${r})`;
}

/** Approximate Helvetica text width in points (good enough for layout). */
function tw(text: string, size: number): number {
  let w = 0;
  for (const ch of text) {
    const cc = ch.charCodeAt(0);
    if ('il1.,;:!| '.includes(ch)) { w += 0.28; }
    else if ('mwMW'.includes(ch)) { w += 0.80; }
    else if (cc >= 65 && cc <= 90) { w += 0.67; } // uppercase
    else { w += 0.52; }
  }
  return w * size;
}

/** Format ISO date as DD.MM.YYYY without locale dependency (avoids Turkish month names). */
function fmt(iso: string): string {
  if (!iso) { return '-'; }
  const d = new Date(iso);
  if (isNaN(d.getTime())) { return iso; }
  return (
    String(d.getDate()).padStart(2, '0') + '.' +
    String(d.getMonth() + 1).padStart(2, '0') + '.' +
    d.getFullYear()
  );
}

// ── PDF CONTENT STREAM BUILDER ────────────────────────────────────────────────

function buildPDF(term: Term, companyName: string): string {
  const W = 595; // A4 width  (pt)
  const H = 842; // A4 height (pt)
  const L = 50;  // left margin
  const RX = 545; // right edge (W - 50)
  const CW = 495; // content width

  const ops: string[] = [];

  /** Filled rectangle: x, y_bottom, w, h */
  const fr = (x: number, y: number, w: number, h: number, hex: string) => {
    ops.push(`${rgb(hex)} rg`);
    ops.push(`${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`);
    ops.push('0 0 0 rg'); // reset to black
  };

  /** Text left-aligned. F1=Helvetica, F2=Helvetica-Bold */
  const tl = (x: number, y: number, text: string, font: string, size: number, hex: string) => {
    ops.push(
      `BT /${font} ${size} Tf ${rgb(hex)} rg ` +
      `${x.toFixed(1)} ${y.toFixed(1)} Td ${ps(text)} Tj ET`
    );
    ops.push('0 0 0 rg');
  };

  /** Text right-aligned (rx = right boundary). */
  const tr = (rx: number, y: number, text: string, font: string, size: number, hex: string) => {
    tl(rx - tw(text, size), y, text, font, size, hex);
  };

  /** Text center-aligned (cx = center x). */
  const tc = (cx: number, y: number, text: string, font: string, size: number, hex: string) => {
    tl(cx - tw(text, size) / 2, y, text, font, size, hex);
  };

  /** Horizontal line. */
  const hl = (y: number, x1: number, x2: number, hex: string, lw = 0.5) => {
    ops.push(
      `${lw} w ${rgb(hex)} RG ` +
      `${x1.toFixed(1)} ${y.toFixed(1)} m ${x2.toFixed(1)} ${y.toFixed(1)} l S`
    );
    ops.push('0 0 0 RG');
  };

  // ── HEADER (y 737–792, h 55) ─────────────────────────────────────────────
  fr(L, 737, CW, 55, '#1e3a8a');
  tl(L + 16, 777, 'SAHA CRM', 'F2', 7, '#93c5fd');
  tl(L + 16, 754, 'TEKLIF BELGESI', 'F2', 19, '#ffffff');

  const termNo = `#${String(term.id).padStart(5, '0')}`;
  const todayStr = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  tr(RX - 6, 778, 'Teklif No', 'F1', 7, '#93c5fd');
  tr(RX - 6, 759, termNo, 'F2', 13, '#ffffff');
  tr(RX - 6, 743, todayStr, 'F1', 7, '#93c5fd');

  // ── COMPANY + STAGE BADGE (y 700–730) ────────────────────────────────────
  tl(L, 722, 'ALICI', 'F2', 7, '#64748b');
  tl(L, 706, companyName, 'F2', 13, '#1e293b');

  const sLabel =
    term.stage === 'kazanildi' ? 'Kazanildi' :
    term.stage === 'kaybedildi' ? 'Kaybedildi' :
    term.stage === 'teklif_verildi' ? 'Teklif Verildi' : 'Firsat';
  const sBg =
    term.stage === 'kazanildi' ? '#d1fae5' :
    term.stage === 'kaybedildi' ? '#fee2e2' : '#dbeafe';
  const sFg =
    term.stage === 'kazanildi' ? '#065f46' :
    term.stage === 'kaybedildi' ? '#991b1b' : '#2563eb';
  const sbW = tw(sLabel, 9) + 16;
  fr(RX - sbW, 704, sbW, 18, sBg);
  tl(RX - sbW + 8, 709, sLabel, 'F2', 9, sFg);

  // ── PRODUCT TABLE ─────────────────────────────────────────────────────────
  tl(L, 682, 'URUN / HIZMET', 'F2', 7, '#64748b');

  // Header row (y 660–680, h 20)
  fr(L, 660, CW, 20, '#2563eb');
  tl(L + 10, 666, 'Urun / Hizmet Adi', 'F2', 9, '#ffffff');
  tc(395, 666, 'Durum', 'F2', 9, '#ffffff');
  tr(RX - 10, 666, 'Tutar', 'F2', 9, '#ffffff');

  // Data row (y 618–660, h 42)
  fr(L, 618, CW, 42, '#f8fafc');
  hl(660, L, RX, '#e2e8f0', 0.5);
  hl(618, L, RX, '#e2e8f0', 0.5);

  const pName = term.productName.length > 38
    ? term.productName.slice(0, 35) + '...'
    : term.productName;
  tl(L + 10, 634, pName, 'F2', 10, '#1e293b');

  const statusText =
    term.status === TERM_STATUS.ARRIVED ? 'Teslim Alindi' :
    term.status === TERM_STATUS.ORDERED ? 'Siparis Verildi' : 'Beklemede';
  tc(395, 634, statusText, 'F1', 9, '#64748b');

  const priceVal = term.price ?? 0;
  const pStr = priceVal > 0
    ? `${priceVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${term.currency || 'TRY'}`
    : 'Belirtilmedi';
  tr(RX - 10, 634, pStr, 'F2', 10, '#2563eb');

  // ── TOTAL BOX (optional) ──────────────────────────────────────────────────
  let curY = 608;
  if (priceVal > 0) {
    fr(RX - 220, 588, 220, 27, '#dbeafe');
    tr(RX - 10, 607, 'TOPLAM TUTAR', 'F2', 7, '#2563eb');
    tr(RX - 10, 592, pStr, 'F2', 13, '#2563eb');
    curY = 578;
  }

  // ── DATE CARDS ────────────────────────────────────────────────────────────
  tl(L, curY - 10, 'TARIH VE SURE', 'F2', 7, '#64748b');

  const cardsBot = curY - 62;
  const cardH = 46;
  const cardW = 161;
  const gap = 6;
  const c2x = L + cardW + gap;
  const c3x = L + (cardW + gap) * 2;

  fr(L, cardsBot, cardW, cardH, '#f1f5f9');
  fr(c2x, cardsBot, cardW, cardH, '#f1f5f9');
  fr(c3x, cardsBot, RX - c3x, cardH, '#f1f5f9');

  // inner vertical dividers (thin lines between cards)
  hl(cardsBot, L + cardW + 1, c2x - 1, '#e2e8f0', 0.5);
  hl(cardsBot + cardH, L + cardW + 1, c2x - 1, '#e2e8f0', 0.5);
  hl(cardsBot, c2x + cardW + 1, c3x - 1, '#e2e8f0', 0.5);
  hl(cardsBot + cardH, c2x + cardW + 1, c3x - 1, '#e2e8f0', 0.5);

  tl(L + 10, cardsBot + cardH - 13, 'Siparis Tarihi', 'F2', 7, '#64748b');
  tl(L + 10, cardsBot + 11, fmt(term.orderDate), 'F2', 10, '#1e293b');

  tl(c2x + 10, cardsBot + cardH - 13, 'Beklenen Teslimat', 'F2', 7, '#64748b');
  tl(c2x + 10, cardsBot + 11, fmt(term.expectedDate), 'F2', 10, '#1e293b');

  tl(c3x + 10, cardsBot + cardH - 13, 'Sure', 'F2', 7, '#64748b');
  tl(c3x + 10, cardsBot + 11, term.termDuration || '-', 'F2', 10, '#1e293b');

  // ── DIVIDER + FOOTER ──────────────────────────────────────────────────────
  const divY = cardsBot - 18;
  hl(divY, L, RX, '#e2e8f0', 0.5);

  tc(W / 2, divY - 20, 'Bizi tercih ettiginiz icin tesekkur ederiz.', 'F1', 10, '#64748b');
  tc(W / 2, divY - 36, 'Bu teklif Saha CRM ile hazirlanmistir.', 'F1', 8, '#93c5fd');

  // ── ASSEMBLE PDF ──────────────────────────────────────────────────────────
  const cs = ops.join('\n'); // content stream (pure ASCII)

  const o1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const o2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const o3 =
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] ` +
    `/Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> ` +
    `/ProcSet [/PDF /Text] >> >>\nendobj\n`;
  const o4 =
    `4 0 obj\n<< /Length ${cs.length} >>\nstream\n${cs}\nendstream\nendobj\n`;
  const o5 =
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica ' +
    '/Encoding /WinAnsiEncoding >>\nendobj\n';
  const o6 =
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold ' +
    '/Encoding /WinAnsiEncoding >>\nendobj\n';

  const header = '%PDF-1.4\n';
  const parts = [o1, o2, o3, o4, o5, o6];

  // Compute byte offsets (all content is ASCII so .length === byte count)
  const offsets: number[] = [];
  let off = header.length;
  for (const p of parts) {
    offsets.push(off);
    off += p.length;
  }

  // xref: each entry must be exactly 20 bytes → "NNNNNNNNNN GGGGG X \n"
  const xrefLines = [
    'xref',
    `0 ${parts.length + 1}`,
    '0000000000 65535 f \n' + offsets.map(o => `${String(o).padStart(10, '0')} 00000 n `).join('\n'),
  ];
  const xref = xrefLines.join('\n') + '\n';
  const trailer = `trailer\n<< /Size ${parts.length + 1} /Root 1 0 R >>\nstartxref\n${off}\n%%EOF\n`;

  return header + parts.join('') + xref + trailer;
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────

export const generateAndSharePDF = async (
  term: Term,
  companyName: string,
): Promise<void> => {
  try {
    const pdf = buildPDF(term, companyName);

    if (!pdf.startsWith('%PDF-')) {
      throw new Error('PDF generation failed (missing header)');
    }

    const base64 = Buffer.from(pdf, 'latin1').toString('base64');

    const termNo = String(term.id).padStart(5, '0');
    const safeName = (term.productName || 'Teklif')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .slice(0, 20);
    const fileName = `Teklif_${termNo}_${safeName}.pdf`;
    const filePath = `${Dirs.CacheDir}/${fileName}`;

    await FileSystem.writeFile(filePath, base64, 'base64');

    await Share.open({
      url: `file://${filePath}`,
      type: 'application/pdf',
      title: 'Teklifi Paylas',
      filename: fileName,
    });
  } catch (error: any) {
    const msg: string = error?.message ?? error?.error ?? '';
    if (
      msg !== 'User did not share' &&
      !msg.toLowerCase().includes('dismiss') &&
      !msg.toLowerCase().includes('cancel') &&
      error?.error !== 'User did not share'
    ) {
      console.error('[pdfGenerator]', error);
      Alert.alert('Hata', 'PDF olusturulamadi. Lutfen tekrar deneyin.');
    }
  }
};
