import type { HistoryPoint, ProjectReport } from "@/lib/project-reporting";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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

function buildBar(value: number, max: number, width = 28) {
  if (max <= 0) return "";
  const filled = Math.max(1, Math.round((value / max) * width));
  return "#".repeat(filled).padEnd(width, "-");
}

type PdfLine = {
  text: string;
  font: "F1" | "F2";
  size: number;
  x: number;
  y: number;
};

function buildPdfPages(summary: ExportSummary) {
  const pages: PdfLine[][] = [];
  const pageHeight = 842;
  const margin = 40;
  let currentPage: PdfLine[] = [];
  let cursorY = pageHeight - margin;

  const pushLine = (text: string, font: PdfLine["font"], size: number, spacing = 18) => {
    if (cursorY < margin + spacing) {
      pages.push(currentPage);
      currentPage = [];
      cursorY = pageHeight - margin;
    }
    currentPage.push({ text, font, size, x: margin, y: cursorY });
    cursorY -= spacing;
  };

  const pushSection = (title: string) => {
    pushLine(title, "F2", 14, 22);
  };

  const addWrappedLines = (text: string) => {
    wrapText(text, 96).forEach((line) => pushLine(line, "F1", 11));
  };

  pushLine("Relatorio de empreendimentos", "F2", 20, 28);
  pushLine(summary.selectionLabel, "F1", 12, 22);

  pushSection("Metricas chave");
  pushLine(`Projetos: ${summary.totalProjects}`, "F2", 16, 22);
  pushLine(`Protocolos: ${summary.totalProtocols}`, "F2", 16, 22);
  pushLine(`Monitorados: ${summary.monitoredProtocols}`, "F2", 16, 22);
  pushLine(`Divergentes: ${summary.divergentProtocols}`, "F2", 16, 22);
  pushLine(`Nao encontrados: ${summary.notFoundProtocols}`, "F2", 16, 22);

  const chartMax = Math.max(
    1,
    summary.monitoredProtocols,
    summary.divergentProtocols,
    summary.notFoundProtocols,
  );
  pushSection("Grafico rapido (volume)");
  pushLine(
    `Monitorados  | ${buildBar(summary.monitoredProtocols, chartMax)} ${summary.monitoredProtocols}`,
    "F1",
    11,
  );
  pushLine(
    `Divergentes  | ${buildBar(summary.divergentProtocols, chartMax)} ${summary.divergentProtocols}`,
    "F1",
    11,
  );
  pushLine(
    `Nao encontrados | ${buildBar(summary.notFoundProtocols, chartMax)} ${summary.notFoundProtocols}`,
    "F1",
    11,
  );

  pushSection("Resumo geral");
  addWrappedLines(
    `Projetos: ${summary.totalProjects} | Protocolos: ${summary.totalProtocols} | Monitorados: ${summary.monitoredProtocols}`,
  );
  addWrappedLines(
    `Divergentes: ${summary.divergentProtocols} | Nao encontrados: ${summary.notFoundProtocols}`,
  );
  addWrappedLines(
    `Atividade 30d: ${summary.trendComparison.current} eventos | 30d anteriores: ${summary.trendComparison.previous} | Delta: ${summary.trendComparison.delta.toFixed(1)}%`,
  );

  pushSection("Tendencia historica");
  summary.trend.forEach((point) =>
    pushLine(`${point.label}: ${point.value}`, "F1", 11),
  );

  pushSection("Empreendimentos prioritarios");
  summary.projects
    .slice()
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 12)
    .forEach((report) => {
      addWrappedLines(
        `- ${report.project.name} | risco ${report.riskScore} | protocolos ${report.totalProtocols} | divergentes ${report.divergentProtocols} | nao encontrados ${report.notFoundProtocols}`,
      );
    });

  pushSection("Mudancas recentes");
  summary.recentEvents.forEach((event) => {
    addWrappedLines(
      `${event.projectName}${event.protocolLabel ? ` / ${event.protocolLabel}` : ""} | ${event.action} | ${event.description} | ${event.createdAt ?? "sem data"}`,
    );
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function buildPdfDocument(pages: PdfLine[][]) {
  const objects: string[] = [];
  const pageObjects: number[] = [];

  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const fontRef = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontRef = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  for (const lines of pages) {
    const contentLines = [
      "BT",
      ...lines.flatMap((line) => {
        const escaped = escapePdfText(line.text);
        return [
          `/${line.font} ${line.size} Tf`,
          `1 0 0 1 ${line.x} ${line.y} Tm`,
          `(${escaped}) Tj`,
        ];
      }),
      "ET",
    ];
    const content = contentLines.join("\n");
    const contentRef = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageRef = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRef} 0 R /F2 ${boldFontRef} 0 R >> >> /Contents ${contentRef} 0 R >>`,
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
        <Column ss:Width="240" />
        <Column ss:Width="200" />
        ${rows
          .map((row, rowIndex) =>
            `<Row>${row
              .map((cell, cellIndex) => {
                const styleId = rowIndex === 0
                  ? "Header"
                  : cellIndex === 0
                    ? "Key"
                    : "Body";
                return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
              })
              .join("")}</Row>`,
          )
          .join("")}
      </Table>
    </Worksheet>`;

  const tableSheet = (name: string, rows: string[][]) => `
    <Worksheet ss:Name="${escapeXml(name)}">
      <Table>
        ${rows[0]?.map(() => "<Column ss:Width=\"150\" />").join("") ?? ""}
        ${rows
          .map(
            (row) =>
              `<Row>${row
                .map((cell, index) => {
                  const styleId = row === rows[0]
                    ? "Header"
                    : index === 0
                      ? "Key"
                      : "Body";
                  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
                })
                .join("")}</Row>`,
          )
          .join("")}
      </Table>
    </Worksheet>`;

  const metricsSheet = (name: string, rows: string[][]) => `
    <Worksheet ss:Name="${escapeXml(name)}">
      <Table>
        <Column ss:Width="180" />
        <Column ss:Width="120" />
        <Column ss:Width="220" />
        ${rows
          .map((row, rowIndex) =>
            `<Row>${row
              .map((cell, cellIndex) => {
                if (rowIndex === 0) {
                  return `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
                }
                const styleId = cellIndex === 1 ? "Metric" : cellIndex === 0 ? "Key" : "Body";
                return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
              })
              .join("")}</Row>`,
          )
          .join("")}
      </Table>
    </Worksheet>`;

  const chartMax = Math.max(
    1,
    summary.monitoredProtocols,
    summary.divergentProtocols,
    summary.notFoundProtocols,
  );
  const metricsRows = [
    ["Indicador", "Valor", "Grafico"],
    ["Projetos", String(summary.totalProjects), buildBar(summary.totalProjects, summary.totalProjects || 1, 18)],
    ["Protocolos", String(summary.totalProtocols), buildBar(summary.totalProtocols, summary.totalProtocols || 1, 18)],
    ["Monitorados", String(summary.monitoredProtocols), buildBar(summary.monitoredProtocols, chartMax, 18)],
    ["Divergentes", String(summary.divergentProtocols), buildBar(summary.divergentProtocols, chartMax, 18)],
    ["Nao encontrados", String(summary.notFoundProtocols), buildBar(summary.notFoundProtocols, chartMax, 18)],
  ];

  return `<?xml version="1.0"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    <Styles>
      <Style ss:ID="Header">
        <Font ss:Bold="1" ss:Color="#FFFFFF" />
        <Interior ss:Color="#092946" ss:Pattern="Solid" />
        <Alignment ss:Horizontal="Center" ss:Vertical="Center" />
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB" />
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB" />
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB" />
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB" />
        </Borders>
      </Style>
      <Style ss:ID="Key">
        <Font ss:Bold="1" />
        <Interior ss:Color="#F1F5F9" ss:Pattern="Solid" />
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
        </Borders>
      </Style>
      <Style ss:ID="Body">
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
        </Borders>
      </Style>
      <Style ss:ID="Metric">
        <Font ss:Bold="1" ss:Size="13" />
        <Interior ss:Color="#FFF1F2" ss:Pattern="Solid" />
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FBCFE8" />
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FBCFE8" />
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FBCFE8" />
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FBCFE8" />
        </Borders>
      </Style>
    </Styles>
    ${sheet("Resumo", headerRows)}
    ${metricsSheet("Metricas", metricsRows)}
    ${tableSheet("Empreendimentos", projectRows)}
    ${tableSheet("Mudancas", eventRows)}
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
  // Fallback to legacy generator if running server-side
  if (typeof document === "undefined") {
    const blob = buildPdfDocument(buildPdfPages(summary));
    downloadBlob(blob, `relatorio-empreendimentos.pdf`);
    return;
  }

  (async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();

      // Load logo from public folder
      let logoBytes: ArrayBuffer | null = null;
      try {
        const res = await fetch("/logo-sistema.png");
        if (res.ok) logoBytes = await res.arrayBuffer();
      } catch (e) {
        logoBytes = null;
      }

      if (logoBytes) {
        const logoImage = await pdfDoc.embedPng(logoBytes);
        const imgWidth = 96;
        const imgHeight = (logoImage.height / logoImage.width) * imgWidth;
        page.drawImage(logoImage, { x: (width - imgWidth) / 2, y: height - 80, width: imgWidth, height: imgHeight });
      }

      const now = new Date();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      page.drawText("Relatorio de empreendimentos", { x: 40, y: height - 110, size: 18, font: bold });
      page.drawText(`Escopo: ${summary.selectionLabel}`, { x: 40, y: height - 128, size: 10, font });
      page.drawText(`Gerado em: ${now.toLocaleString()}`, { x: width - 220, y: height - 110, size: 10, font, color: rgb(0.35, 0.35, 0.35) });

      // Build a small PNG chart and embed
      const chartDataUrl = buildChartDataUrl(summary, 520, 140);
      const chartResp = await fetch(chartDataUrl);
      const chartBytes = await chartResp.arrayBuffer();
      const chartImage = await pdfDoc.embedPng(chartBytes);
      const chartDrawWidth = 520;
      const chartDrawHeight = (chartImage.height / chartImage.width) * chartDrawWidth;
      page.drawImage(chartImage, { x: (width - chartDrawWidth) / 2, y: height - 340, width: chartDrawWidth, height: chartDrawHeight });

      // Key metrics
      const metricsX = 40;
      let metricsY = height - 380 - chartDrawHeight;
      const metricSpacing = 16;
      page.drawText(`Projetos: ${summary.totalProjects}`, { x: metricsX, y: metricsY, size: 12, font: bold });
      metricsY -= metricSpacing;
      page.drawText(`Protocolos: ${summary.totalProtocols}`, { x: metricsX, y: metricsY, size: 12, font: bold });
      metricsY -= metricSpacing;
      page.drawText(`Monitorados: ${summary.monitoredProtocols}`, { x: metricsX, y: metricsY, size: 12, font: bold });
      metricsY -= metricSpacing;
      page.drawText(`Divergentes: ${summary.divergentProtocols}`, { x: metricsX, y: metricsY, size: 12, font: bold });
      metricsY -= metricSpacing;
      page.drawText(`Nao encontrados: ${summary.notFoundProtocols}`, { x: metricsX, y: metricsY, size: 12, font: bold });

      const pdfBytes = await pdfDoc.save();
      downloadBlob(new Blob([pdfBytes], { type: "application/pdf" }), `relatorio-empreendimentos.pdf`);
    } catch (err) {
      // Fallback to legacy implementation on error
      const blob = buildPdfDocument(buildPdfPages(summary));
      downloadBlob(blob, `relatorio-empreendimentos.pdf`);
    }
  })();
}

function buildChartDataUrl(summary: ExportSummary, width = 520, height = 140) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const padding = 24;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const values = [summary.monitoredProtocols, summary.divergentProtocols, summary.notFoundProtocols];
  const labels = ["Monitorados", "Divergentes", "Nao encontrados"];
  const colors = ["#0ea5e9", "#fb7185", "#f97316"];
  const max = Math.max(1, ...values);

  const barGap = 16;
  const barWidth = (chartW - barGap * (values.length - 1)) / values.length;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const h = Math.round((v / max) * chartH);
    const x = padding + i * (barWidth + barGap);
    const y = padding + (chartH - h);
    ctx.fillStyle = colors[i];
    ctx.fillRect(x, y, barWidth, h);

    // value label
    ctx.fillStyle = "#000000";
    ctx.font = "12px sans-serif";
    ctx.fillText(String(v), x + 4, y - 6);

    // label
    ctx.fillStyle = "#334155";
    ctx.font = "11px sans-serif";
    const label = labels[i];
    const labelX = x + 2;
    ctx.fillText(label, labelX, padding + chartH + 14);
  }

  return canvas.toDataURL("image/png");
}

export function exportProjectsExcel(summary: ExportSummary) {
  const xml = buildSpreadsheetXml(summary);
  downloadBlob(new Blob([xml], { type: "application/vnd.ms-excel" }), "relatorio-empreendimentos.xls");
}
