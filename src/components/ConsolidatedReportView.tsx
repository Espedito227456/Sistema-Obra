import React, { useRef } from 'react';
import { Download, Printer, Upload } from 'lucide-react';
import { ConstructionProject } from '../types/construction';
import {
  calcLaborUnitCost,
  formatBRL,
  formatNum,
  formatPct,
  ProjectSummary,
} from '../utils/calculations';

interface Props {
  project: ConstructionProject;
  summary: ProjectSummary;
  onImportProjectJson: (proj: ConstructionProject) => void;
}

export const ConsolidatedReportView: React.FC<Props> = ({
  project,
  summary,
  onImportProjectJson,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { consolidatedMaterials: mat, pciComputed } = summary;
  const prices = project.materialPrices;

  const materialRows = [
    {
      item: 'Cimento Portland (saco 50 kg)',
      qty: mat.cimentoSacos50kg,
      unit: 'sacos',
      unitPrice: prices.cimento50kg,
    },
    {
      item: 'Cal Hidratada (saco 20 kg)',
      qty: mat.calSacos20kg,
      unit: 'sacos',
      unitPrice: prices.cal20kg,
    },
    {
      item: 'Areia Média/Fina',
      qty: mat.areiaM3,
      unit: `m³ (${formatNum(mat.areiaSacos20kg, 0)} sc 20kg)`,
      unitPrice: prices.areiaM3,
    },
    {
      item: 'Brita 1',
      qty: mat.britaM3,
      unit: `m³ (${formatNum(mat.britaSacos20kg, 0)} sc 20kg)`,
      unitPrice: prices.britaM3,
    },
    {
      item: 'Tijolo Cerâmico Furado (c/ 7% perda)',
      qty: mat.tijolosFuradoUnid,
      unit: 'unidades',
      unitPrice: prices.tijoloFuradoUnid,
    },
    {
      item: 'Tijolo Maciço (c/ 7% perda)',
      qty: mat.tijolosMacicoUnid,
      unit: 'unidades',
      unitPrice: prices.tijoloMacicoUnid,
    },
    {
      item: 'Argamassa Colante (saco 20 kg)',
      qty: mat.argamassaSacos20kg,
      unit: 'sacos',
      unitPrice: prices.argamassa20kg,
    },
    {
      item: 'Rejunte para Cerâmica',
      qty: mat.rejunteKg,
      unit: 'kg',
      unitPrice: prices.rejunteKg,
    },
  ].filter((r) => r.qty > 0.01);

  const handleExportCsv = () => {
    const lines: string[] = [
      'ITEM_PCI;SERVICO;MAO_DE_OBRA_R$;MATERIAL_R$;TOTAL_R$;INCIDENCIA_%;MIN_%;MAX_%;STATUS',
    ];
    for (const item of pciComputed) {
      lines.push(
        `${item.id};"${item.nome}";${item.totalLaborCost.toFixed(2)};${item.totalMaterialCost.toFixed(2)};${item.totalCost.toFixed(2)};${item.incidencePercent.toFixed(2)};${item.minIncidence.toFixed(2)};${item.maxIncidence.toFixed(2)};${item.status}`
      );
    }
    lines.push(
      `TOTAL;Custo Direto;;;${summary.custoDireto.toFixed(2)};100.00;;;`
    );
    lines.push(
      `BDI;${project.laborConfig.bdiPercent.toFixed(2)}%;;;${summary.valorBdi.toFixed(2)};;;;`
    );
    lines.push(
      `TOTAL_OBRA;Custo Total da Obra;;;${summary.custoTotalObra.toFixed(2)};;;;`
    );

    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PCI_Orcamento_${project.nomeObra.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
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
        // Ignora arquivo inválido silenciosamente
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Barra de Ações do Relatório */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Relatório Unificado para Impressão, Compra de Materiais e Exportação
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Consolida a Planilha de Mão de Obra, Lista de Compras da Calculadora
            de Materiais e o Resumo Oficial PCI CAIXA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Importar JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Backup JSON
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV (Excel)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Documento Imprimível */}
      <div className="space-y-8 rounded-lg border border-slate-200 bg-white p-8">
        {/* Cabeçalho do Relatório */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold text-blue-700">
              PROPOSTA DE CONSTRUÇÃO INDIVIDUAL · MÃO DE OBRA & MATERIAIS
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              {project.nomeObra}
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Proponente: {project.metadata.proponente} · CPF:{' '}
              {project.metadata.cpfProp} · Município:{' '}
              {project.metadata.municipio}/{project.metadata.uf}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              RT Projeto/Execução: {project.metadata.rteNome} · Registro:{' '}
              {project.metadata.rteRegistro}/{project.metadata.rteUf}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Custo Total da Obra (c/ BDI)</p>
            <p className="font-mono text-2xl font-bold tabular-nums text-slate-900">
              {formatBRL(summary.custoTotalObra)}
            </p>
            <p className="text-xs text-slate-500">
              {formatNum(project.metadata.areaConstruidaTotal, 2)} m² ·{' '}
              {formatBRL(summary.valorPorM2)}/m²
            </p>
          </div>
        </div>

        {/* 1. Lista Consolidada de Compras de Materiais */}
        <div className="print-break-inside-avoid">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            1. Lista Consolidada de Compra de Materiais Básicos (inclui perdas técnicas)
          </h3>
          {materialRows.length === 0 ? (
            <p className="text-xs text-slate-500">
              Nenhum material calculado nos serviços lançados.
            </p>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="px-3 py-2">Insumo</th>
                  <th className="px-3 py-2 text-right">Quantidade Estimada</th>
                  <th className="px-3 py-2">Unidade</th>
                  <th className="px-3 py-2 text-right">Preço Unit.</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materialRows.map((row) => (
                  <tr key={row.item}>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {row.item}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatNum(row.qty, row.unit === 'unidades' ? 0 : 2)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{row.unit}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-600">
                      {formatBRL(row.unitPrice)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatBRL(row.qty * row.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
                  <td colSpan={4} className="px-3 py-2 text-right text-slate-700">
                    Total dos Materiais Calculados:
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                    {formatBRL(summary.totalAutoMaterial)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* 2. Resumo de Mão de Obra por m² */}
        <div className="print-break-inside-avoid">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            2. Tabela Resumo de Mão de Obra (Diária Pedreiro:{' '}
            {formatBRL(project.laborConfig.diariaPedreiro)} · Servente:{' '}
            {project.laborConfig.incluirServente
              ? formatBRL(project.laborConfig.diariaServente)
              : 'Não incluído'}
            )
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {project.laborServices
              .filter((s) => s.corePlanilha)
              .map((srv) => {
                const { custoComEncargosUnit } = calcLaborUnitCost(
                  srv,
                  project.laborConfig
                );
                return (
                  <div
                    key={srv.id}
                    className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-xs"
                  >
                    <span className="truncate pr-2 text-slate-700">
                      {srv.nome}
                    </span>
                    <span className="whitespace-nowrap font-mono font-semibold tabular-nums text-slate-900">
                      {formatBRL(custoComEncargosUnit)}/{srv.unidade}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 3. Síntese do Orçamento PCI CAIXA */}
        <div className="print-break-inside-avoid">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            3. Síntese Orçamentária PCI CAIXA (20 Itens)
          </h3>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <th className="px-2 py-2 text-center">Item</th>
                <th className="px-2 py-2">Etapa</th>
                <th className="px-2 py-2 text-right">Mão de Obra</th>
                <th className="px-2 py-2 text-right">Materiais/Outros</th>
                <th className="px-2 py-2 text-right">Total</th>
                <th className="px-2 py-2 text-right">Incid. (%)</th>
                <th className="px-2 py-2 text-right">Faixa CAIXA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pciComputed.map((item) => (
                <tr key={item.id}>
                  <td className="px-2 py-1.5 text-center font-mono text-slate-600">
                    {item.id}
                  </td>
                  <td className="px-2 py-1.5 text-slate-800">{item.nome}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-slate-700">
                    {formatBRL(item.totalLaborCost)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-slate-700">
                    {formatBRL(item.totalMaterialCost)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                    {formatBRL(item.totalCost)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-slate-800">
                    {formatPct(item.incidencePercent, 2)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-slate-500">
                    {formatNum(item.minIncidence, 2)}–{formatNum(item.maxIncidence, 2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Assinaturas CAIXA */}
        <div className="print-break-inside-avoid grid grid-cols-1 gap-8 border-t border-slate-200 pt-8 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">
              Local e data: {project.metadata.localData}
            </p>
            <div className="mt-10 border-t border-slate-400 pt-2 text-xs text-slate-700">
              <p className="font-semibold">Cliente / Proponente</p>
              <p>
                {project.metadata.proponente} · CPF: {project.metadata.cpfProp}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">
              Declaração de veracidade técnica (PCI AE 130 026)
            </p>
            <div className="mt-10 border-t border-slate-400 pt-2 text-xs text-slate-700">
              <p className="font-semibold">Responsável Técnico</p>
              <p>
                {project.metadata.rteNome} · CAU/CREA:{' '}
                {project.metadata.rteRegistro}/{project.metadata.rteUf}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
