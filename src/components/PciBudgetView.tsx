import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  ConstructionProject,
  PciItemConfig,
  ServicoAdicional,
} from '../types/construction';
import {
  formatBRL,
  formatNum,
  formatPct,
  ProjectSummary,
} from '../utils/calculations';

interface Props {
  project: ConstructionProject;
  summary: ProjectSummary;
  onUpdatePciManual: (
    itemId: number,
    patch: Partial<Pick<PciItemConfig, 'manualLaborCost' | 'manualMaterialCost'>>
  ) => void;
  onApplyParametricEstimate: () => void;
  onClearManualPci: () => void;
  onAddAdicional: (item: ServicoAdicional) => void;
  onUpdateAdicional: (id: string, patch: Partial<ServicoAdicional>) => void;
  onDeleteAdicional: (id: string) => void;
  onUpdateJustificativa: (text: string) => void;
}

export const PciBudgetView: React.FC<Props> = ({
  project,
  summary,
  onUpdatePciManual,
  onApplyParametricEstimate,
  onClearManualPci,
  onAddAdicional,
  onUpdateAdicional,
  onDeleteAdicional,
  onUpdateJustificativa,
}) => {
  const moneyInput = (value: number, onChange: (v: number) => void) => (
    <input
      type="number"
      step="100"
      min="0"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const parsed = parseFloat(e.target.value);
        onChange(Number.isFinite(parsed) ? Math.max(parsed, 0) : 0);
      }}
      className="w-28 rounded border border-slate-200 bg-white px-2 py-1 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
    />
  );

  return (
    <div className="space-y-8">
      {/* Resumo dos Custos PCI CAIXA */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Custo Direto</p>
          <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-slate-900">
            {formatBRL(summary.custoDireto)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Automático: {formatBRL(summary.totalAutoLabor + summary.totalAutoMaterial)}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            BDI ({formatNum(project.laborConfig.bdiPercent, 1)}%)
          </p>
          <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-slate-900">
            {formatBRL(summary.valorBdi)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Faixa CAIXA: 0% a 20%</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            Custo Total da Obra
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold tabular-nums text-blue-700">
            {formatBRL(summary.custoTotalObra)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Valor/m²: {formatBRL(summary.valorPorM2)}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            Terreno + Edificação
          </p>
          <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-slate-900">
            {formatBRL(summary.custoTotalTerrenoEdificacao)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Terreno: {formatBRL(project.metadata.valorTerreno)}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            Conformidade das Incidências
          </p>
          <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-slate-900">
            {summary.pciConformCount}/20 itens
          </p>
          <p
            className={`mt-1 text-xs font-medium ${
              summary.pciOutOfRangeCount === 0
                ? 'text-green-700'
                : 'text-amber-700'
            }`}
          >
            {summary.pciOutOfRangeCount === 0
              ? 'Todos na faixa aceitável'
              : `${summary.pciOutOfRangeCount} item(ns) fora da faixa`}
          </p>
        </div>
      </section>

      {/* Tabela Oficial 20 Itens PCI CAIXA */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Quadro de Custos e Incidências — Proposta Individual CAIXA (AE 130 026)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Soma os valores calculados automaticamente nos lançamentos de Mão
              de Obra + Materiais com os complementos diretos por etapa.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onApplyParametricEstimate}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Estimar Restantes ({formatNum(project.metadata.areaConstruidaTotal, 0)} m² ·{' '}
              {project.metadata.padraoAcabamento})
            </button>
            <button
              type="button"
              onClick={onClearManualPci}
              className="whitespace-nowrap shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Zerar Manuais
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-3 py-3 text-center">Item</th>
                <th className="px-3 py-3">Serviços Componentes do Projeto</th>
                <th className="px-3 py-3 text-right">Auto (Calc.)</th>
                <th className="px-3 py-3 text-right">Compl. Mão de Obra</th>
                <th className="px-3 py-3 text-right">Compl. Material</th>
                <th className="px-3 py-3 text-right">Custo Total</th>
                <th className="px-3 py-3 text-right">Incidência</th>
                <th className="px-3 py-3">Faixa CAIXA (Mín–Máx)</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.pciComputed.map((item) => {
                const autoSum = item.autoLaborCost + item.autoMaterialCost;
                const scaleMax = Math.max(item.maxIncidence * 1.25, 20);
                const minLeft = (item.minIncidence / scaleMax) * 100;
                const maxWidth =
                  ((item.maxIncidence - item.minIncidence) / scaleMax) * 100;
                const currPos = Math.min(
                  (item.incidencePercent / scaleMax) * 100,
                  100
                );

                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-3 py-2.5 text-center font-mono text-xs font-semibold text-slate-600">
                      {item.id}
                    </td>
                    <td className="max-w-xs px-3 py-2.5">
                      <div className="font-medium text-slate-900">
                        {item.nome}
                      </div>
                      {autoSum > 0 && (
                        <div className="text-xs text-blue-700">
                          MO Auto: {formatBRL(item.autoLaborCost)} · Mat. Auto:{' '}
                          {formatBRL(item.autoMaterialCost)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700">
                      {autoSum > 0 ? formatBRL(autoSum) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {moneyInput(item.manualLaborCost, (v) =>
                        onUpdatePciManual(item.id, { manualLaborCost: v })
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {moneyInput(item.manualMaterialCost, (v) =>
                        onUpdatePciManual(item.id, { manualMaterialCost: v })
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                      {formatBRL(item.totalCost)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                      {formatPct(item.incidencePercent, 2)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="w-36">
                        <div className="mb-1 flex justify-between font-mono text-[11px] text-slate-500 tabular-nums">
                          <span>{formatNum(item.minIncidence, 2)}%</span>
                          <span>{formatNum(item.maxIncidence, 2)}%</span>
                        </div>
                        <div className="relative h-2 w-full rounded bg-slate-100">
                          <div
                            className="absolute top-0 h-2 rounded bg-slate-300"
                            style={{
                              left: `${minLeft}%`,
                              width: `${Math.max(maxWidth, 2)}%`,
                            }}
                          />
                          <div
                            className={`absolute -top-0.5 h-3 w-1.5 -translate-x-1/2 rounded-sm ${
                              item.status === 'ok'
                                ? 'bg-green-600'
                                : 'bg-red-600'
                            }`}
                            style={{ left: `${currPos}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {summary.custoDireto === 0 ? (
                        <span className="text-xs text-slate-400">Sem valor</span>
                      ) : item.status === 'ok' ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Conforme
                        </span>
                      ) : item.status === 'below' ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Abaixo mín.
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-red-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Acima máx.
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900">
                <td colSpan={5} className="px-4 py-3 text-right">
                  TOTAIS — Custo Direto / BDI / Total da Obra:
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-blue-700">
                  {formatBRL(summary.custoDireto)}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">
                  {summary.custoDireto > 0 ? '100,00%' : '0,00%'}
                </td>
                <td colSpan={2} className="px-3 py-3 font-mono tabular-nums">
                  Total c/ BDI: {formatBRL(summary.custoTotalObra)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Serviços Adicionais e Justificativas */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Outros Serviços / Serviços Adicionais (Item 20)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Fundações especiais, cortes, aterros, contenções, piscina, etc.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onAddAdicional({
                  id: `add-${Date.now()}`,
                  descricao: 'Serviço adicional especificado',
                  custo: 0,
                })
              }
              className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </button>
          </div>

          {project.servicosAdicionais.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              Nenhum serviço adicional cadastrado. Clique em Adicionar caso
              exista item fora dos custos referenciais.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {project.servicosAdicionais.map((srv) => (
                <div key={srv.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={srv.descricao}
                    onChange={(e) =>
                      onUpdateAdicional(srv.id, { descricao: e.target.value })
                    }
                    className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                  {moneyInput(srv.custo, (v) =>
                    onUpdateAdicional(srv.id, { custo: v })
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteAdicional(srv.id)}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-6">
          <h3 className="text-sm font-semibold text-slate-900">
            Justificativas para Itens Fora das Referências de Incidência
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Obrigatório pela CAIXA caso algum dos 20 itens ultrapasse os limites
            Mínimo % ou Máximo % da planilha.
          </p>
          <textarea
            rows={4}
            value={project.metadata.justificativasPci}
            onChange={(e) => onUpdateJustificativa(e.target.value)}
            placeholder="Descreva as justificativas técnicas para eventuais desvios de incidência (ex: fundação profunda devido ao solo, esquadrias especiais, etc.)..."
            className="mt-3 w-full rounded-md border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
          />
        </div>
      </section>
    </div>
  );
};
