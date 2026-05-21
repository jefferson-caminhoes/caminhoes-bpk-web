import type { HistoryPoint, ProjectReport } from "@/lib/project-reporting";

type ExportSummary = {
  selectionLabel: string;
  totalProjects: number;
  totalProtocols: number;
  activeProtocols: number;
  monitoredProtocols: number;
  divergentProtocols: number;
  notFoundProtocols: number;
  trend: HistoryPoint[];
  trendComparison: {
    current: number;
    previous: number;
    delta: number;
  };
  projects: ProjectReport[];
  recentEvents: ProjectReport["recentEvents"];
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function wrapText(value: string, maxLength = 88) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [value];
}

function buildPdfPages(summary: ExportSummary) {
  const pages: string[][] = [];
  const header = [
    `Relatorio de empreendimentos - ${summary.selectionLabel}`,
    `Projetos: ${summary.totalProjects} | Protocolos: ${summary.totalProtocols} | Monitorados: ${summary.monitoredProtocols}`,
    `Divergentes: ${summary.divergentProtocols} | Nao encontrados: ${summary.notFoundProtocols}`,
    `Atividade 30d: ${summary.trendComparison.current} eventos | 30d anteriores: ${summary.trendComparison.previous} | Delta: ${summary.trendComparison.delta.toFixed(1)}%`,
    "",
    "Tendencia historica:",
    ...summary.trend.map((point) => `${point.label}: ${point.value}`),
    "",
    "Empreendimentos prioritarios:",
    ...summary.projects
      .slice()
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 12)
      .flatMap((report) =>
        wrapText(
          `${report.project.name} | risco ${report.riskScore} | protocolos ${report.totalProtocols} | divergentes ${report.divergentProtocols} | nao encontrados ${report.notFoundProtocols}`,
        ),
      ),
  ];

  const events = [
    "Mudancas recentes:",
    ...summary.recentEvents.map((event) =>
      `${event.projectName}${event.protocolLabel ? ` / ${event.protocolLabel}` : ""} | ${event.action} | ${event.description} | ${event.createdAt ?? "sem data"}`,
    ),
  ];

  const linesPerPage = 36;
  for (let index = 0; index < header.length; index += linesPerPage) {
    pages.push(header.slice(index, index + linesPerPage));
  }
  for (let index = 0; index < events.length; index += linesPerPage) {
    pages.push(events.slice(index, index + linesPerPage));
  }

  return pages;
}

function buildPdfDocument(pages: string[][]) {
  const objects: string[] = [];
  const pageObjects: number[] = [];

  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const fontRef = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  for (const lines of pages) {
    const contentLines = [
      "BT",
      "/F1 12 Tf",
      "1 0 0 1 40 800 Tm",
      ...lines.flatMap((line, index) => {
        const escaped = escapePdfText(line);
        const y = 800 - index * 18;
        return [`1 0 0 1 40 ${y} Tm`, `(${escaped}) Tj`];
      }),
      "ET",
    ];
    const content = contentLines.join("\n");
    const contentRef = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageRef = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRef} 0 R >> >> /Contents ${contentRef} 0 R >>`,
    );
    pageObjects.push(pageRef);
  }

  const pagesKids = pageObjects.map((ref) => `${ref} 0 R`).join(" ");
  const pagesRef = addObject(`<< /Type /Pages /Kids [${pagesKids}] /Count ${pageObjects.length} >>`);
  objects[pageObjects[0] - 1] = objects[pageObjects[0] - 1].replace("/Parent 0 0 R", `/Parent ${pagesRef} 0 R`);
  for (const ref of pageObjects.slice(1)) {
    objects[ref - 1] = objects[ref - 1].replace("/Parent 0 0 R", `/Parent ${pagesRef} 0 R`);
  }

  const catalogRef = addObject(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function buildSpreadsheetXml(summary: ExportSummary) {
  const headerRows = [
    ["Indicador", "Valor"],
    ["Escopo", summary.selectionLabel],
    ["Projetos", String(summary.totalProjects)],
    ["Protocolos", String(summary.totalProtocols)],
    ["Monitorados", String(summary.monitoredProtocols)],
    ["Divergentes", String(summary.divergentProtocols)],
    ["Nao encontrados", String(summary.notFoundProtocols)],
    ["Eventos 30d", String(summary.trendComparison.current)],
    ["Eventos 30d anteriores", String(summary.trendComparison.previous)],
    ["Delta de eventos", `${summary.trendComparison.delta.toFixed(1)}%`],
  ];

  const projectRows = [
    [
      "Projeto",
      "Protocolos",
      "Ativos",
      "Monitorados",
      "Divergentes",
      "Nao encontrados",
      "Risco",
      "Ultima atividade",
    ],
    ...summary.projects.map((report) => [
      report.project.name,
      String(report.totalProtocols),
      String(report.activeProtocols),
      String(report.monitoredProtocols),
      String(report.divergentProtocols),
      String(report.notFoundProtocols),
      String(report.riskScore),
      report.lastActivityAt ?? "",
    ]),
  ];

  const eventRows = [
    ["Projeto", "Alvo", "Acao", "Descricao", "Data"],
    ...summary.recentEvents.map((event) => [
      event.projectName,
      event.protocolLabel ?? "",
      event.action,
      event.description,
      event.createdAt ?? "",
    ]),
  ];

  const sheet = (name: string, rows: string[][]) => `
    <Worksheet ss:Name="${escapeXml(name)}">
      <Table>
        ${rows
          .map(
            (row) =>
              `<Row>${row
                .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`)
                .join("")}</Row>`,
          )
          .join("")}
      </Table>
    </Worksheet>`;

  return `<?xml version="1.0"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    ${sheet("Resumo", headerRows)}
    ${sheet("Empreendimentos", projectRows)}
    ${sheet("Mudancas", eventRows)}
  </Workbook>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportProjectsPdf(summary: ExportSummary) {
  const blob = buildPdfDocument(buildPdfPages(summary));
  downloadBlob(blob, `relatorio-empreendimentos.pdf`);
}

export function exportProjectsExcel(summary: ExportSummary) {
  const xml = buildSpreadsheetXml(summary);
  downloadBlob(new Blob([xml], { type: "application/vnd.ms-excel" }), "relatorio-empreendimentos.xls");
}
