import * as XLSX from 'xlsx';
import { ClientRecord, Modality, StudentClassSchedule, DayOfWeek, StudentStatus } from '../types';

export interface FileParseResult {
  fileType: 'excel' | 'csv' | 'tsv' | 'txt' | 'json';
  fileName: string;
  sheetsCount?: number;
  totalRows: number;
  columns: string[];
  sampleData: Record<string, any>[];
  detectedClients: ClientRecord[];
  detectedSchedules: {
    modalities: Modality[];
    schedules: StudentClassSchedule[];
  };
  hasClientData: boolean;
  hasScheduleData: boolean;
}

// Fix common encoding issues from legacy Brazilian software/exports
export function fixEncoding(str: string): string {
  if (!str) return '';
  return str
    .replace(/Irm[\ufffd]/g, 'Irmã')
    .replace(/M[\ufffd]e/g, 'Mãe')
    .replace(/GL[\ufffd]TEO/gi, 'GLÚTEO')
    .replace(/TER[\ufffd]A/gi, 'TERÇA')
    .replace(/FOGA[\ufffd]A/gi, 'FOGAÇA')
    .replace(/LE[\ufffd]O/gi, 'LEÃO')
    .replace(/N[\ufffd]TALIA/gi, 'NÁTALIA')
    .replace(/LU[\ufffd]S/gi, 'LUÍS')
    .replace(/PEN[\ufffd]LOPE/gi, 'PENÉLOPE')
    .replace(/S[\ufffd]/gi, 'SÁ')
    .replace(/ANT[\ufffd]NIO/gi, 'ANTÔNIO')
    .replace(/EDIN[\ufffd]IA/gi, 'EDINÉIA')
    .replace(/SIM[\ufffd]O/gi, 'SIMÃO')
    .replace(/GON[\ufffd]ALVES/gi, 'GONÇALVES')
    .replace(/ARA[\ufffd]JO/gi, 'ARAÚJO')
    .replace(/[\ufffd]LVARO/gi, 'ÁLVARO')
    .replace(/JOS[\ufffd]/gi, 'JOSÉ')
    .replace(/JO[\ufffd]O/gi, 'JOÃO')
    .replace(/J[\ufffd]LIA/gi, 'JÚLIA')
    .replace(/L[\ufffd]BERA/gi, 'LÍBERA')
    .replace(/L[\ufffd]CIA/gi, 'LÚCIA')
    .replace(/VAL[\ufffd]RIO/gi, 'VALÉRIO')
    .replace(/GAR[\ufffd][\ufffd]O/gi, 'GARÇÃO')
    .replace(/CONCEI[\ufffd][\ufffd]O/gi, 'CONCEIÇÃO')
    .replace(/CANSA[\ufffd][\ufffd]O/gi, 'CANSAÇÃO')
    .replace(/Z[\ufffd]PORA/gi, 'ZÁPORA')
    .replace(/K[\ufffd]LE/gi, 'KÁLE')
    .replace(/R[\ufffd]RIG/gi, 'RÖRIG')
    .replace(/ELO[\ufffd]/gi, 'ELOÁ')
    .replace(/MICHEL[\ufffd]O/gi, 'MICHELÃO')
    .replace(/IBAN[\ufffd]Z/gi, 'IBANÊZ')
    .replace(/GER[\ufffd]NIMO/gi, 'GERÔNIMO')
    .replace(/ESP[\ufffd]SITO/gi, 'ESPÓSITO')
    .replace(/GALV[\ufffd]O/gi, 'GALVÃO')
    .replace(/AD[\ufffd]O/gi, 'ADÃO')
    .replace(/V[\ufffd]NIA/gi, 'VÂNIA')
    .replace(/MAR[\ufffd]AL/gi, 'MARÇAL')
    .replace(/GUIMAR[\ufffd]ES/gi, 'GUIMARÃES')
    .replace(/C[\ufffd]NDIDO/gi, 'CÂNDIDO')
    .replace(/SIDN[\ufffd]IA/gi, 'SIDNÉIA')
    .replace(/[\ufffd]/g, '');
}

// Universal text delimiter detector
export function detectDelimiter(text: string): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 10);
  if (lines.length === 0) return ',';

  const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0, '|': 0 };
  for (const line of lines) {
    for (const d of [';', ',', '\t', '|']) {
      counts[d] += (line.split(d).length - 1);
    }
  }

  let best = ';';
  let max = -1;
  for (const d of Object.keys(counts)) {
    if (counts[d] > max) {
      max = counts[d];
      best = d;
    }
  }
  return max > 0 ? best : ';';
}

// Convert CSV/TSV/text lines into structured JSON
export function parseDelimitedTextToRows(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const fixedText = fixEncoding(text);
  const delimiter = detectDelimiter(fixedText);
  const rawLines = fixedText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (rawLines.length === 0) return { headers: [], rows: [] };

  const splitLine = (line: string): string[] => {
    // Regex to handle quoted strings with commas/semicolons inside
    const regex = new RegExp(`(?:^|${delimiter === '|' ? '\\|' : delimiter})(?:"([^"]*)"|([^"${delimiter === '|' ? '\\|' : delimiter}]*))`, 'g');
    const result: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      let val = match[1] !== undefined ? match[1] : match[2] !== undefined ? match[2] : '';
      result.push(val.trim());
    }
    // Fallback simple split if regex misses
    if (result.length <= 1 && line.includes(delimiter)) {
      return line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
    }
    return result;
  };

  const headers = splitLine(rawLines[0]).map((h, idx) => h || `Coluna_${idx + 1}`);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const values = splitLine(rawLines[i]);
    if (values.length === 0 || values.every((v) => !v)) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

// Fuzzy find column name
function findKey(row: Record<string, any>, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const found = keys.find((k) => k.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === cand.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (found) return found;
  }
  for (const cand of candidates) {
    const found = keys.find((k) => k.toLowerCase().includes(cand.toLowerCase()));
    if (found) return found;
  }
  return undefined;
}

// Convert arbitrary table rows into ClientRecord[]
export function rowsToClientRecords(rows: Record<string, any>[]): ClientRecord[] {
  if (rows.length === 0) return [];

  const first = rows[0];
  const nameKey = findKey(first, ['clientes', 'cliente', 'nome', 'aluno', 'aluna', 'student', 'nome_completo', 'razao_social']);
  const idKey = findKey(first, ['idcliente', 'id_cliente', 'id', 'matricula', 'código', 'codigo', 'cod', 'matrícula']);
  const profKey = findKey(first, ['professor', 'prof', 'instrutor', 'docente']);
  const consultKey = findKey(first, ['consultor', 'consultora', 'vendedor', 'atendente']);
  const personalKey = findKey(first, ['personal', 'personal_trainer', 'treinador']);
  const statusKey = findKey(first, ['status', 'situacao', 'situação', 'estado']);
  const phoneKey = findKey(first, ['telefone', 'celular', 'whatsapp', 'fone', 'tel', 'phone']);
  const sisterKey = findKey(first, ['irmã', 'irma', 'irmão', 'irmao']);
  const motherKey = findKey(first, ['mãe', 'mae']);
  const emailKey = findKey(first, ['email', 'e-mail', 'mail']);

  return rows.map((r, idx) => {
    const name = nameKey ? String(r[nameKey] || '').trim() : String(Object.values(r)[0] || '').trim();
    const id = idKey ? String(r[idKey] || '').trim() : String(idx + 1);
    const professor = profKey ? String(r[profKey] || '').trim() : '';
    const consultor = consultKey ? String(r[consultorKey(r, consultKey)] || '').trim() : '';
    const personal = personalKey ? String(r[personalKey] || '').trim() : '';
    const rawStatus = statusKey ? String(r[statusKey] || '').trim() : 'Ativo';
    const sister = sisterKey ? String(r[sisterKey] || '').trim() : '';
    const mother = motherKey ? String(r[motherKey] || '').trim() : '';
    const phone = phoneKey ? String(r[phoneKey] || '').trim() : '';
    const email = emailKey ? String(r[emailKey] || '').trim() : '';

    const notesParts = [
      professor ? `Prof: ${professor}` : '',
      consultor ? `Consultor: ${consultor}` : '',
      personal ? `Personal: ${personal}` : '',
      sister ? `Irmã: ${sister}` : '',
      mother ? `Mãe: ${mother}` : '',
    ].filter(Boolean);

    return {
      id: id || `cli-${Date.now()}-${idx}`,
      name: fixEncoding(name),
      professor: fixEncoding(professor),
      consultor: fixEncoding(consultor),
      personal: fixEncoding(personal),
      status: fixEncoding(rawStatus) || 'Ativo',
      sisterName: fixEncoding(sister),
      motherName: fixEncoding(mother),
      phone,
      email,
      notes: notesParts.join(' • '),
    };
  }).filter((c) => c.name && c.name.length > 1);
}

function consultorKey(r: Record<string, any>, defaultKey?: string): string {
  if (defaultKey && r[defaultKey] !== undefined) return defaultKey;
  return 'Consultor';
}

// Convert spreadsheet rows into Modalities & Schedules
export function rowsToSchedules(
  rows: Record<string, any>[],
  sheetName: string = 'Importado'
): { modalities: Modality[]; schedules: StudentClassSchedule[] } {
  if (rows.length === 0) return { modalities: [], schedules: [] };

  const first = rows[0];
  const nameKey = findKey(first, ['aluno', 'aluna', 'nome', 'cliente', 'student']);
  const phoneKey = findKey(first, ['telefone', 'whatsapp', 'celular', 'fone']);
  const dayKey = findKey(first, ['dias', 'dia', 'dias_semana', 'diasdasemana', 'dia_da_semana']);
  const timeKey = findKey(first, ['horario', 'hora', 'horário', 'inicio', 'início']);
  const planKey = findKey(first, ['plano', 'mensalidade', 'tipo_plano', 'pacote']);
  const modKey = findKey(first, ['modalidade', 'aba', 'turma', 'categoria', 'curso']);
  const statusKey = findKey(first, ['status', 'situação', 'situacao']);
  const notesKey = findKey(first, ['observacao', 'observação', 'obs', 'detalhes', 'notas']);

  const modalityMap = new Map<string, Modality>();
  const schedules: StudentClassSchedule[] = [];

  const defaultColors = ['#0D9488', '#E11D48', '#8B5CF6', '#D97706', '#2563EB', '#059669', '#DB2777'];

  rows.forEach((r, idx) => {
    const rawName = nameKey ? String(r[nameKey] || '').trim() : '';
    if (!rawName) return;

    const studentName = fixEncoding(rawName);
    const modalityTitle = fixEncoding(modKey ? String(r[modKey] || sheetName).trim() : sheetName) || 'Geral';
    const modId = modalityTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (!modalityMap.has(modId)) {
      modalityMap.set(modId, {
        id: modId,
        name: modalityTitle,
        sheetTabName: modalityTitle,
        color: defaultColors[modalityMap.size % defaultColors.length],
        iconName: 'Activity',
        description: `Modalidade importada: ${modalityTitle}`,
        defaultDurationMinutes: 60,
        maxStudentsPerSlot: 4,
      });
    }

    const rawDay = dayKey ? String(r[dayKey] || 'Segunda') : 'Segunda';
    const days = parseDays(rawDay);

    const rawTime = timeKey ? String(r[timeKey] || '08:00').trim() : '08:00';
    const startTime = formatTime(rawTime);
    const endTime = addMinutes(startTime, 60);

    const rawStatus = statusKey ? String(r[statusKey] || 'ativo').toLowerCase() : 'ativo';
    const status: StudentStatus =
      rawStatus.includes('inativ') || rawStatus.includes('tranc')
        ? 'trancado'
        : rawStatus.includes('pend')
        ? 'pendente'
        : rawStatus.includes('feria') || rawStatus.includes('férias')
        ? 'ferias'
        : 'ativo';

    schedules.push({
      id: `sched-imp-${Date.now()}-${idx}`,
      modalityId: modId,
      modalityName: modalityTitle,
      studentName,
      phone: phoneKey ? String(r[phoneKey] || '').trim() : '',
      daysOfWeek: days,
      startTime,
      endTime,
      durationMinutes: 60,
      status,
      plan: planKey ? String(r[planKey] || 'Mensal').trim() : 'Mensal',
      startDate: new Date().toISOString().split('T')[0],
      notes: notesKey ? fixEncoding(String(r[notesKey] || '')) : undefined,
      attendanceHistory: [],
    });
  });

  return {
    modalities: Array.from(modalityMap.values()),
    schedules,
  };
}

function parseDays(dayStr: string): DayOfWeek[] {
  const s = dayStr.toLowerCase();
  const days: DayOfWeek[] = [];
  if (s.includes('seg')) days.push('Segunda');
  if (s.includes('ter')) days.push('Terça');
  if (s.includes('qua')) days.push('Quarta');
  if (s.includes('qui')) days.push('Quinta');
  if (s.includes('sex')) days.push('Sexta');
  if (s.includes('sáb') || s.includes('sab')) days.push('Sábado');
  if (s.includes('dom')) days.push('Domingo');
  return days.length > 0 ? days : ['Segunda'];
}

function formatTime(t: string): string {
  const match = t.match(/(\d{1,2})[:h](\d{2})?/i);
  if (!match) return '08:00';
  const hours = match[1].padStart(2, '0');
  const minutes = match[2] ? match[2].padStart(2, '0') : '00';
  return `${hours}:${minutes}`;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h || 0) * 60 + (m || 0) + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// Main Universal File Parser
export async function parseAnyFile(file: File): Promise<FileParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // 1. JSON
  if (extension === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : parsed.clients || parsed.data || [parsed];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const detectedClients = rowsToClientRecords(rows);
    const detectedSchedules = rowsToSchedules(rows, file.name.replace('.json', ''));

    return {
      fileType: 'json',
      fileName: file.name,
      totalRows: rows.length,
      columns,
      sampleData: rows.slice(0, 5),
      detectedClients,
      detectedSchedules,
      hasClientData: detectedClients.length > 0,
      hasScheduleData: detectedSchedules.schedules.length > 0,
    };
  }

  // 2. CSV / TSV / TXT
  if (['csv', 'tsv', 'txt'].includes(extension)) {
    const text = await file.text();
    const { headers, rows } = parseDelimitedTextToRows(text);
    const detectedClients = rowsToClientRecords(rows);
    const detectedSchedules = rowsToSchedules(rows, file.name.replace(/\.[^/.]+$/, ''));

    return {
      fileType: extension as any,
      fileName: file.name,
      totalRows: rows.length,
      columns: headers,
      sampleData: rows.slice(0, 5),
      detectedClients,
      detectedSchedules,
      hasClientData: detectedClients.length > 0,
      hasScheduleData: detectedSchedules.schedules.length > 0,
    };
  }

  // 3. Excel (.xlsx, .xls, .xlsm, .xlsb)
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const allRows: Record<string, any>[] = [];
  const allModalities: Modality[] = [];
  const allSchedules: StudentClassSchedule[] = [];
  let primaryColumns: string[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const sheetJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
    if (sheetJson.length > 0) {
      if (primaryColumns.length === 0) {
        primaryColumns = Object.keys(sheetJson[0]);
      }
      allRows.push(...sheetJson);

      const parsedSched = rowsToSchedules(sheetJson, sheetName);
      allModalities.push(...parsedSched.modalities);
      allSchedules.push(...parsedSched.schedules);
    }
  });

  const detectedClients = rowsToClientRecords(allRows);

  return {
    fileType: 'excel',
    fileName: file.name,
    sheetsCount: workbook.SheetNames.length,
    totalRows: allRows.length,
    columns: primaryColumns,
    sampleData: allRows.slice(0, 5),
    detectedClients,
    detectedSchedules: {
      modalities: allModalities,
      schedules: allSchedules,
    },
    hasClientData: detectedClients.length > 0,
    hasScheduleData: allSchedules.length > 0,
  };
}

// Parse Raw Text pasted directly in the UI
export function parseRawPastedText(pastedText: string, defaultName: string = 'Texto Colado'): FileParseResult {
  const { headers, rows } = parseDelimitedTextToRows(pastedText);
  const detectedClients = rowsToClientRecords(rows);
  const detectedSchedules = rowsToSchedules(rows, defaultName);

  return {
    fileType: 'txt',
    fileName: defaultName,
    totalRows: rows.length,
    columns: headers,
    sampleData: rows.slice(0, 5),
    detectedClients,
    detectedSchedules,
    hasClientData: detectedClients.length > 0,
    hasScheduleData: detectedSchedules.schedules.length > 0,
  };
}
