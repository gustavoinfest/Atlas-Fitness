import * as XLSX from 'xlsx';
import { Modality, StudentClassSchedule, DayOfWeek, StudentStatus } from '../types';

export const SPREADSHEET_HEADERS = [
  'Nome do Aluno',
  'Dias da Semana',
  'Horário de Início',
  'Horário de Término',
  'Duração (min)',
  'Status',
  'Telefone / WhatsApp',
  'E-mail',
  'Plano / Pacote',
  'Mensalidade (R$)',
  'Data de Início',
  'Espaço / Sala',
  'Observações / Restrições',
];

/**
 * Generates an Excel (.xlsx) file where each Modality is placed in its own Tab (Worksheet)
 */
export function exportAllToExcelFile(modalities: Modality[], schedules: StudentClassSchedule[]) {
  const workbook = XLSX.utils.book_new();

  modalities.forEach((modality) => {
    const modalitySchedules = schedules.filter((s) => s.modalityId === modality.id || s.modalityName.toLowerCase() === modality.sheetTabName.toLowerCase());

    const rows = modalitySchedules.map((s) => ({
      'Nome do Aluno': s.studentName,
      'Dias da Semana': s.daysOfWeek.join(', '),
      'Horário de Início': s.startTime,
      'Horário de Término': s.endTime,
      'Duração (min)': s.durationMinutes,
      'Status': s.status === 'ativo' ? 'Ativo' : s.status === 'pendente' ? 'Pendente' : s.status === 'ferias' ? 'Férias' : 'Trancado',
      'Telefone / WhatsApp': s.phone || '',
      'E-mail': s.email || '',
      'Plano / Pacote': s.plan || '',
      'Mensalidade (R$)': s.monthlyFee || '',
      'Data de Início': s.startDate || '',
      'Espaço / Sala': s.roomOrLocation || '',
      'Observações / Restrições': s.notes || '',
    }));

    // If no students in this modality, provide an empty row template
    const dataToExport = rows.length > 0 ? rows : [
      {
        'Nome do Aluno': 'Exemplo - Novo Aluno',
        'Dias da Semana': 'Segunda, Quarta',
        'Horário de Início': '08:00',
        'Horário de Término': '08:50',
        'Duração (min)': modality.defaultDurationMinutes || 50,
        'Status': 'Ativo',
        'Telefone / WhatsApp': '5511999999999',
        'E-mail': 'aluno@email.com',
        'Plano / Pacote': 'Mensal',
        'Mensalidade (R$)': 250,
        'Data de Início': new Date().toISOString().split('T')[0],
        'Espaço / Sala': 'Sala Principal',
        'Observações / Restrições': 'Nenhuma restrição',
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Nome
      { wch: 20 }, // Dias
      { wch: 15 }, // Início
      { wch: 15 }, // Fim
      { wch: 12 }, // Duração
      { wch: 12 }, // Status
      { wch: 20 }, // Telefone
      { wch: 22 }, // Email
      { wch: 20 }, // Plano
      { wch: 15 }, // Mensalidade
      { wch: 14 }, // Data Início
      { wch: 18 }, // Sala
      { wch: 35 }, // Observações
    ];

    const tabName = modality.sheetTabName.replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, tabName);
  });

  // Trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Controle_Aulas_Modalidades_${dateStr}.xlsx`);
}

/**
 * Parses an uploaded .xlsx or .xls file.
 * Each sheet/tab is converted into a Modality and its rows into StudentClassSchedule objects.
 */
export async function parseExcelFile(file: File): Promise<{
  modalities: Modality[];
  schedules: StudentClassSchedule[];
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const newModalities: Modality[] = [];
  const newSchedules: StudentClassSchedule[] = [];

  const MODALITY_PALETTE = ['#0D9488', '#2563EB', '#0284C7', '#EA580C', '#7C3AED', '#DC2626', '#059669', '#D97706'];
  const ICON_PALETTE = ['Dumbbell', 'Sparkles', 'Waves', 'Flame', 'HeartHandshake', 'Shield', 'Trophy', 'Activity'];

  workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const modalityId = `mod-${sheetName.toLowerCase().replace(/[^a-z0-9]/g, '-') || index}`;
    
    newModalities.push({
      id: modalityId,
      name: sheetName,
      sheetTabName: sheetName,
      color: MODALITY_PALETTE[index % MODALITY_PALETTE.length],
      iconName: ICON_PALETTE[index % ICON_PALETTE.length],
      description: `Modalidade importada da aba "${sheetName}"`,
      defaultDurationMinutes: 50,
    });

    rawJson.forEach((row, rowIndex) => {
      // Find name key with flexible matching
      const studentName = row['Nome do Aluno'] || row['Nome'] || row['Aluno'] || row['Student Name'] || `Aluno ${rowIndex + 1}`;
      if (!studentName || studentName.toString().toLowerCase().includes('exemplo')) return;

      const daysRaw = row['Dias da Semana'] || row['Dias'] || row['Dia'] || 'Segunda';
      const daysArray = parseDaysOfWeek(daysRaw.toString());

      const startTime = normalizeTime(row['Horário de Início'] || row['Horario de Inicio'] || row['Horário'] || row['Hora'] || '08:00');
      const duration = Number(row['Duração (min)'] || row['Duracao'] || 50);
      const endTime = normalizeTime(row['Horário de Término'] || row['Horario de Termino'] || calculateEndTime(startTime, duration));

      const statusRaw = (row['Status'] || 'Ativo').toString().toLowerCase();
      let status: StudentStatus = 'ativo';
      if (statusRaw.includes('pend')) status = 'pendente';
      else if (statusRaw.includes('férias') || statusRaw.includes('ferias')) status = 'ferias';
      else if (statusRaw.includes('tranc')) status = 'trancado';

      newSchedules.push({
        id: `sched-${modalityId}-${rowIndex}-${Date.now()}`,
        modalityId: modalityId,
        modalityName: sheetName,
        studentName: String(studentName).trim(),
        phone: String(row['Telefone / WhatsApp'] || row['Telefone'] || row['WhatsApp'] || '').replace(/\D/g, ''),
        email: String(row['E-mail'] || row['Email'] || ''),
        daysOfWeek: daysArray,
        startTime: startTime,
        endTime: endTime,
        durationMinutes: duration,
        status: status,
        plan: String(row['Plano / Pacote'] || row['Plano'] || 'Padrão'),
        monthlyFee: Number(row['Mensalidade (R$)'] || row['Valor'] || row['Mensalidade'] || 0) || undefined,
        startDate: String(row['Data de Início'] || row['Inicio'] || new Date().toISOString().split('T')[0]),
        notes: String(row['Observações / Restrições'] || row['Observações'] || row['Notas'] || ''),
        roomOrLocation: String(row['Espaço / Sala'] || row['Sala'] || ''),
        attendanceHistory: [],
      });
    });
  });

  return {
    modalities: newModalities,
    schedules: newSchedules,
  };
}

function parseDaysOfWeek(str: string): DayOfWeek[] {
  const result: DayOfWeek[] = [];
  const normalized = str.toLowerCase();
  
  if (normalized.includes('seg')) result.push('Segunda');
  if (normalized.includes('ter')) result.push('Terça');
  if (normalized.includes('qua')) result.push('Quarta');
  if (normalized.includes('qui')) result.push('Quinta');
  if (normalized.includes('sex')) result.push('Sexta');
  if (normalized.includes('sáb') || normalized.includes('sab')) result.push('Sábado');
  if (normalized.includes('dom')) result.push('Domingo');

  return result.length > 0 ? result : ['Segunda'];
}

function normalizeTime(val: any): string {
  if (!val) return '08:00';
  const str = String(val).trim();
  if (str.includes(':')) {
    const parts = str.split(':');
    const h = parts[0].padStart(2, '0');
    const m = (parts[1] || '00').slice(0, 2).padEnd(2, '0');
    return `${h}:${m}`;
  }
  // Decimal or hour number like 8 or 8.5
  const num = parseFloat(str);
  if (!isNaN(num)) {
    const hours = Math.floor(num);
    const mins = Math.round((num - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  return '08:00';
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMins = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/**
 * Google Sheets API Helper: Creates a complete multi-tab Google Sheet in the user's Drive.
 */
export async function createGoogleSheetsSpreadsheet(
  title: string,
  modalities: Modality[],
  schedules: StudentClassSchedule[],
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const sheetsPayload = modalities.map((modality, index) => {
    const tabName = modality.sheetTabName.replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
    return {
      properties: {
        sheetId: index + 1,
        title: tabName,
        gridProperties: {
          rowCount: 100,
          columnCount: SPREADSHEET_HEADERS.length + 2,
          frozenRowCount: 1,
        },
      },
    };
  });

  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || 'Controle de Aulas e Alunos por Modalidade',
      },
      sheets: sheetsPayload,
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    throw new Error(`Falha ao criar planilha no Google Sheets: ${errText}`);
  }

  const result = await createResponse.json();
  const spreadsheetId = result.spreadsheetId;
  const spreadsheetUrl = result.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Now populate each tab with its header row and students
  const dataUpdates = modalities.map((modality) => {
    const tabName = modality.sheetTabName.replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
    const modalitySchedules = schedules.filter(
      (s) => s.modalityId === modality.id || s.modalityName.toLowerCase() === modality.sheetTabName.toLowerCase()
    );

    const values = [
      SPREADSHEET_HEADERS,
      ...modalitySchedules.map((s) => [
        s.studentName,
        s.daysOfWeek.join(', '),
        s.startTime,
        s.endTime,
        s.durationMinutes,
        s.status === 'ativo' ? 'Ativo' : s.status === 'pendente' ? 'Pendente' : s.status === 'ferias' ? 'Férias' : 'Trancado',
        s.phone || '',
        s.email || '',
        s.plan || '',
        s.monthlyFee || '',
        s.startDate || '',
        s.roomOrLocation || '',
        s.notes || '',
      ]),
    ];

    return {
      range: `'${tabName}'!A1:M${values.length}`,
      values: values,
    };
  });

  // Batch update spreadsheet values
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: dataUpdates,
    }),
  });

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
}

/**
 * Fetches all tabs and row data from an existing Google Sheet
 */
export async function loadSpreadsheetFromGoogle(
  spreadsheetId: string,
  accessToken: string
): Promise<{ modalities: Modality[]; schedules: StudentClassSchedule[]; title: string; tabNames: string[] }> {
  // Get spreadsheet metadata to list sheets
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    throw new Error(`Não foi possível acessar a planilha. Verifique o ID/permissões.`);
  }

  const metaData = await metaRes.json();
  const title = metaData.properties?.title || 'Minha Planilha';
  const sheets = metaData.sheets || [];

  const tabNames = sheets.map((s: any) => s.properties.title);

  // Fetch all tab ranges in batch
  const ranges = tabNames.map((name: string) => `'${name}'!A1:Z100`);
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges.map((r: string) => `ranges=${encodeURIComponent(r)}`).join('&')}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!valuesRes.ok) {
    throw new Error(`Falha ao ler os dados das abas da planilha.`);
  }

  const valuesData = await valuesRes.json();
  const valueRanges = valuesData.valueRanges || [];

  const newModalities: Modality[] = [];
  const newSchedules: StudentClassSchedule[] = [];
  const MODALITY_PALETTE = ['#0D9488', '#2563EB', '#0284C7', '#EA580C', '#7C3AED', '#DC2626', '#059669', '#D97706'];
  const ICON_PALETTE = ['Sparkles', 'Dumbbell', 'Waves', 'Flame', 'HeartHandshake', 'Shield', 'Trophy', 'Activity'];

  tabNames.forEach((sheetName: string, index: number) => {
    const modalityId = `mod-${sheetName.toLowerCase().replace(/[^a-z0-9]/g, '-') || index}`;
    
    newModalities.push({
      id: modalityId,
      name: sheetName,
      sheetTabName: sheetName,
      color: MODALITY_PALETTE[index % MODALITY_PALETTE.length],
      iconName: ICON_PALETTE[index % ICON_PALETTE.length],
      description: `Aba sincronizada com o Google Sheets: "${sheetName}"`,
      defaultDurationMinutes: 50,
    });

    const rangeObj = valueRanges.find((vr: any) => vr.range.includes(`'${sheetName}'`) || vr.range.startsWith(`${sheetName}!`));
    if (rangeObj && rangeObj.values && rangeObj.values.length > 1) {
      const headerRow: string[] = rangeObj.values[0].map((h: any) => String(h).trim().toLowerCase());
      const dataRows = rangeObj.values.slice(1);

      // Map column indexes dynamically
      const nameCol = headerRow.findIndex((h) => h.includes('nome') || h.includes('aluno') || h.includes('student'));
      const daysCol = headerRow.findIndex((h) => h.includes('dia') || h.includes('semana') || h.includes('days'));
      const startCol = headerRow.findIndex((h) => h.includes('início') || h.includes('inicio') || h.includes('start') || (h.includes('horário') && !h.includes('término')));
      const endCol = headerRow.findIndex((h) => h.includes('término') || h.includes('termino') || h.includes('fim') || h.includes('end'));
      const durCol = headerRow.findIndex((h) => h.includes('duração') || h.includes('duracao') || h.includes('min'));
      const statusCol = headerRow.findIndex((h) => h.includes('status') || h.includes('situação'));
      const phoneCol = headerRow.findIndex((h) => h.includes('telefone') || h.includes('whats') || h.includes('contato') || h.includes('phone'));
      const emailCol = headerRow.findIndex((h) => h.includes('mail') || h.includes('email'));
      const planCol = headerRow.findIndex((h) => h.includes('plano') || h.includes('pacote') || h.includes('plan'));
      const feeCol = headerRow.findIndex((h) => h.includes('mensalidade') || h.includes('valor') || h.includes('preço') || h.includes('fee'));
      const dateCol = headerRow.findIndex((h) => h.includes('data') || h.includes('início') || h.includes('matricula'));
      const roomCol = headerRow.findIndex((h) => h.includes('sala') || h.includes('espaço') || h.includes('local') || h.includes('room'));
      const notesCol = headerRow.findIndex((h) => h.includes('observ') || h.includes('restriç') || h.includes('notas') || h.includes('obs'));

      dataRows.forEach((row: any[], rIndex: number) => {
        const studentName = nameCol >= 0 ? row[nameCol] : row[0];
        if (!studentName || String(studentName).trim() === '') return;

        const daysRaw = daysCol >= 0 ? row[daysCol] : 'Segunda';
        const daysArray = parseDaysOfWeek(String(daysRaw || 'Segunda'));

        const startTime = normalizeTime(startCol >= 0 ? row[startCol] : '08:00');
        const duration = Number(durCol >= 0 && row[durCol] ? row[durCol] : 50);
        const endTime = normalizeTime(endCol >= 0 && row[endCol] ? row[endCol] : calculateEndTime(startTime, duration));

        const statusRaw = String(statusCol >= 0 && row[statusCol] ? row[statusCol] : 'ativo').toLowerCase();
        let status: StudentStatus = 'ativo';
        if (statusRaw.includes('pend')) status = 'pendente';
        else if (statusRaw.includes('feria') || statusRaw.includes('férias')) status = 'ferias';
        else if (statusRaw.includes('tranc')) status = 'trancado';

        newSchedules.push({
          id: `sched-${modalityId}-${rIndex}-${Date.now()}`,
          modalityId: modalityId,
          modalityName: sheetName,
          studentName: String(studentName).trim(),
          phone: phoneCol >= 0 ? String(row[phoneCol] || '').replace(/\D/g, '') : '',
          email: emailCol >= 0 ? String(row[emailCol] || '') : '',
          daysOfWeek: daysArray,
          startTime: startTime,
          endTime: endTime,
          durationMinutes: duration,
          status: status,
          plan: planCol >= 0 ? String(row[planCol] || 'Mensal') : 'Mensal',
          monthlyFee: feeCol >= 0 && row[feeCol] ? Number(String(row[feeCol]).replace(/[^0-9.]/g, '')) || undefined : undefined,
          startDate: dateCol >= 0 && row[dateCol] ? String(row[dateCol]) : new Date().toISOString().split('T')[0],
          notes: notesCol >= 0 ? String(row[notesCol] || '') : '',
          roomOrLocation: roomCol >= 0 ? String(row[roomCol] || '') : '',
          attendanceHistory: [],
        });
      });
    }
  });

  return {
    modalities: newModalities,
    schedules: newSchedules,
    title,
    tabNames,
  };
}

/**
 * Extracts spreadsheet ID from full Google Sheets URL or raw ID
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}
