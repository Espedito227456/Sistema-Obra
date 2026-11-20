import React, { useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Printer,
  Upload,
} from 'lucide-react';
import { ConstructionProject, ProjectMetadata } from '../types/construction';
import {
  formatBRL,
  formatNum,
  ProjectSummary,
} from '../utils/calculations';

interface Props {
  project: ConstructionProject;
  summary: ProjectSummary;
  quoteMode: 'labor_only' | 'full';
  onChangeQuoteMode: (mode: 'labor_only' | 'full') => void;
  onUpdateProjectTitle: (nomeObra: string) => void;
  onUpdateMetadata: (patch: Partial<ProjectMetadata>) => void;
  onImportProjectJson: (proj: ConstructionProject) => void;
}

export const ConsolidatedReportView: React.FC<Props> = ({
  project,
  summary,
  quoteMode,
  onChangeQuoteMode,
  onUpdateProjectTitle,
  onUpdateMetadata,
  onImportProjectJson,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [includeMaterialsInLaborMode, setIncludeMaterialsInLaborMode] =
    useState(false);
  const [showExportExtras, setShowExportExtras] = useState(false);

  const { consolidatedMaterials: mat } = summary;
  const prices = project.materialPrices;

  const materialRows = [
    {
      item: 'Cimento (saco 50 kg)',
      qty: Math.ceil(mat.cimentoSacos50kg),
      unit: 'sacos',
      unitPrice: prices.cimento50kg,
    },
    {
      item: 'Cal (saco 20 kg)',
      qty: Math.ceil(mat.calSacos20kg),
      unit: 'sacos',
      unitPrice: prices.cal20kg,
    },
    {
      item: 'Areia Média',
      qty: Number(mat.areiaM3.toFixed(2)),
      unit: 'm³',
      unitPrice: prices.areiaM3,
    },
    {
      item: 'Brita 1',
      qty: Number(mat.britaM3.toFixed(2)),
      unit: 'm³',
      unitPrice: prices.britaM3,
    },
    {
      item: 'Tijolo Furado',
      qty: Math.ceil(mat.tijolosFuradoUnid),
      unit: 'unid',
      unitPrice: prices.tijoloFuradoUnid,
    },
    {
      item: 'Tijolo Maciço',
      qty: Math.ceil(mat.tijolosMacicoUnid),
      unit: 'unid',
      unitPrice: prices.tijoloMacicoUnid,
    },
    {
      item: 'Argamassa Colante (20 kg)',
      qty: Math.ceil(mat.argamassaSacos20kg),
      unit: 'sacos',
      unitPrice: prices.argamassa20kg,
    },
    {
      item: 'Rejunte',
      qty: Math.ceil(mat.rejunteKg),
      unit: 'kg',
      unitPrice: prices.rejunteKg,
    },
  ].filter((r) => r.qty > 0);

  const showMaterialList =
    quoteMode === 'full' || includeMaterialsInLaborMode;

  const totalDisplayed =
    quoteMode === 'labor_only'
      ? summary.totalAutoLabor
      : summary.totalAutoLabor + summary.totalAutoMaterialWithMargin;

  const buildWhatsAppText = () => {
    const lines: string[] = [
      `*ORÇAMENTO DE OBRA — ${project.nomeObra}*`,
      project.metadata.proponente
        ? `Cliente: ${project.metadata.proponente}`
        : '',
      `Prazo estimado: ~${Math.ceil(summary.totalMasonDays)} dias de serviço`,
      '',
      '*SERVIÇOS:*',
    ].filter(Boolean);

    for (const entry of project.entries) {
      const comp = summary.entriesComputed[entry.id];
      if (!comp) continue;
      const val =
        quoteMode === 'labor_only' ? comp.laborCost : comp.totalClientCost;
      lines.push(
        `• ${entry.descricao} (${formatNum(comp.quantidadeBase, 0)} ${comp.unidadeBase}): *${formatBRL(val)}*`
      );
    }

    lines.push('');
    lines.push(
      `*TOTAL MÃO DE OBRA:* ${formatBRL(summary.totalAutoLabor)}`
    );
    if (quoteMode === 'full') {
      lines.push(
        `*TOTAL MATERIAIS:* ${formatBRL(summary.totalAutoMaterialWithMargin)}`
      );
      lines.push(`*TOTAL GERAL:* ${formatBRL(totalDisplayed)}`);
    }

    if (showMaterialList && materialRows.length > 0) {
      lines.push('');
      lines.push('*LISTA DE MATERIAIS PARA COMPRA (c/ perda):*');
      for (const m of materialRows) {
        lines.push(`- ${m.qty} ${m.unit} de ${m.item}`);
      }
    }

    if (project.metadata.rteNome) {
      lines.push('');
      lines.push(`Responsável: ${project.metadata.rteNome}`);
    }

    return lines.join('\n');
  };

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(buildWhatsAppText());
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    } catch {
      // Silencioso caso clipboard esteja bloqueado
    }
  };

  const handleExportCsv = () => {
    const lines: string[] = [
      'SERVICO;QUANTIDADE;UNIDADE;MAO_DE_OBRA_R$;MATERIAIS_R$;TOTAL_R$',
    ];
    for (const entry of project.entries) {
      const comp = summary.entriesComputed[entry.id];
      if (!comp) continue;
      const matVal =
        quoteMode === 'labor_only' ? 0 : comp.materialClientCost;
      const totVal =
        quoteMode === 'labor_only' ? comp.laborCost : comp.totalClientCost;
      lines.push(
        `"${entry.descricao}";${comp.quantidadeBase.toFixed(2)};${comp.unidadeBase};${comp.laborCost.toFixed(2)};${matVal.toFixed(2)};${totVal.toFixed(2)}`
      );
    }
    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Orcamento_${project.nomeObra.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ObraBase_${project.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && parsed.laborConfig && Array.isArray(parsed.pciItems)) {
          onImportProjectJson(parsed);
        }
      } catch {
        // Ignora arquivo inválido
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações Direta */}
      <div className="no-print space-y-3 rounded-lg border border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => onChangeQuoteMode('labor_only')}
              className={`min-h-[38px] whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                quoteMode === 'labor_only'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Só Mão de Obra
            </button>
            <button
              type="button"
              onClick={() => onChangeQuoteMode('full')}
              className={`min-h-[38px] whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                quoteMode === 'full'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mão de Obra + Materiais
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-md bg-green-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-green-800"
            >
              {copiedWhatsApp ? (
                <>
                  <Check className="h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar p/ WhatsApp
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-md bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </button>

            <button
              type="button"
              onClick={() => setShowExportExtras((v) => !v)}
              className="inline-flex min-h-[40px] items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Mais opções
              {showExportExtras ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Edição rápida de Cliente / Seu Nome + Opção de Lista de Materiais */}
        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-500">
              Título do Orçamento
            </label>
            <input
              type="text"
              value={project.nomeObra}
              onChange={(e) => onUpdateProjectTitle(e.target.value)}
              className="min-h-[38px] w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-500">
              Nome do Cliente
            </label>
            <input
              type="text"
              placeholder="Ex.: Sr. João da Silva"
              value={project.metadata.proponente}
              onChange={(e) => onUpdateMetadata({ proponente: e.target.value })}
              className="min-h-[38px] w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-500">
              Seu Nome (Mestre / Empreiteiro)
            </label>
            <input
              type="text"
              placeholder="Ex.: Mestre Raimundo"
              value={project.metadata.rteNome}
              onChange={(e) => onUpdateMetadata({ rteNome: e.target.value })}
              className="min-h-[38px] w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
            />
          </div>
        </div>

        {quoteMode === 'labor_only' && (
          <label className="inline-flex cursor-pointer items-center gap-2 pt-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={includeMaterialsInLaborMode}
              onChange={(e) => setIncludeMaterialsInLaborMode(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
            />
            Anexar lista de materiais para o cliente comprar
          </label>
        )}

        {showExportExtras && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar Excel (CSV)
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Salvar Backup
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Abrir Backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Proposta Limpa para o Cliente */}
      <div className="space-y-8 rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold text-blue-700">
              ORÇAMENTO DE SERVIÇOS
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              {project.nomeObra}
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Cliente: {project.metadata.proponente || 'A definir'} · Prazo
              estimado:{' '}
              <span className="font-mono font-medium tabular-nums">
                ~{Math.ceil(summary.totalMasonDays)} dias
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">
              {quoteMode === 'labor_only'
                ? 'Total Mão de Obra'
                : 'Total Mão de Obra + Materiais'}
            </p>
            <p className="font-mono text-2xl font-bold tabular-nums text-slate-900">
              {formatBRL(totalDisplayed)}
            </p>
          </div>
        </div>

        {/* 1. Serviços Orçados */}
        <div className="print-break-inside-avoid">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            1. Serviços Orçados
          </h3>
          {project.entries.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhum serviço lançado.</p>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="px-3 py-2.5">Serviço</th>
                  <th className="px-3 py-2.5 text-right">Tamanho</th>
                  {quoteMode === 'full' && (
                    <>
                      <th className="px-3 py-2.5 text-right">Mão de Obra</th>
                      <th className="px-3 py-2.5 text-right">
                        Materiais (est.)
                      </th>
                    </>
                  )}
                  <th className="px-3 py-2.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {project.entries.map((entry) => {
                  const comp = summary.entriesComputed[entry.id];
                  if (!comp) return null;
                  return (
                    <tr key={entry.id}>
                      <td className="px-3 py-2.5 font-medium text-slate-800">
                        {entry.descricao}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600">
                        {formatNum(comp.quantidadeBase, 1)} {comp.unidadeBase}
                      </td>
                      {quoteMode === 'full' && (
                        <>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700">
                            {formatBRL(comp.laborCost)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700">
                            {formatBRL(comp.materialClientCost)}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                        {formatBRL(
                          quoteMode === 'labor_only'
                            ? comp.laborCost
                            : comp.totalClientCost
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                  <td
                    colSpan={2}
                    className="px-3 py-2.5 text-right text-slate-700"
                  >
                    TOTAL:
                  </td>
                  {quoteMode === 'full' && (
                    <>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-900">
                        {formatBRL(summary.totalAutoLabor)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-900">
                        {formatBRL(summary.totalAutoMaterialWithMargin)}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2.5 text-right font-mono text-sm font-bold tabular-nums text-blue-700">
                    {formatBRL(totalDisplayed)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* 2. Lista de Compras de Materiais (exibida apenas no modo Completo ou quando marcado) */}
        {showMaterialList && (
          <div className="print-break-inside-avoid">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              2. Lista de Materiais para Compra (quantidades c/ perda)
            </h3>
            {materialRows.length === 0 ? (
              <p className="text-xs text-slate-500">
                Nenhum material calculado.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {materialRows.map((row) => (
                  <div
                    key={row.item}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-3.5 py-2.5 text-xs"
                  >
                    <span className="font-medium text-slate-800">
                      {row.item}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-slate-900">
                      {row.qty} {row.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assinaturas */}
        <div className="print-break-inside-avoid grid grid-cols-1 gap-8 border-t border-slate-200 pt-8 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Cliente / Contratante</p>
            <div className="mt-10 border-t border-slate-400 pt-2 text-xs text-slate-700">
              <p className="font-semibold">
                {project.metadata.proponente || 'Assinatura do Cliente'}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">Responsável pela Obra</p>
            <div className="mt-10 border-t border-slate-400 pt-2 text-xs text-slate-700">
              <p className="font-semibold">
                {project.metadata.rteNome || 'Mestre de Obras / Empreiteiro'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
