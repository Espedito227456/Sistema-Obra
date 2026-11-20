import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  TrendingDown,
  Users,
  Wrench,
} from 'lucide-react';
import {
  ConstructionProject,
  LaborServiceRate,
  MaterialUnitPrices,
} from '../types/construction';
import {
  LABOR_SERVICES_DEFAULT,
  MARKET_LABOR_BENCHMARKS,
  MARKET_PROFILES_2026,
  MarketProfilePreset,
  MATERIAL_PRICES_DEFAULT,
  PCI_REFERENCE_ITEMS,
} from '../data/presets';
import {
  calcLaborUnitCost,
  formatBRL,
  formatNum,
  ProjectSummary,
} from '../utils/calculations';

interface Props {
  project: ConstructionProject;
  summary: ProjectSummary;
  onUpdateLaborConfig: (
    patch: Partial<ConstructionProject['laborConfig']>
  ) => void;
  onUpdateLaborService: (
    id: string,
    patch: Partial<LaborServiceRate>
  ) => void;
  onResetLaborDefaults: () => void;
  onUpdateMaterialPrices: (patch: Partial<MaterialUnitPrices>) => void;
  onResetMaterialPrices: () => void;
  onApplyMarketProfile: (profile: MarketProfilePreset) => void;
}

export const LaborMatrixView: React.FC<Props> = ({
  project,
  summary,
  onUpdateLaborConfig,
  onUpdateLaborService,
  onResetLaborDefaults,
  onUpdateMaterialPrices,
  onResetMaterialPrices,
  onApplyMarketProfile,
}) => {
  const { laborConfig, laborServices, materialPrices } = project;

  const numInput = (
    val: number,
    onChange: (n: number) => void,
    step = '1',
    min = 0
  ) => (
    <input
      type="number"
      step={step}
      min={min}
      value={Number.isFinite(val) ? val : 0}
      onChange={(e) => {
        const parsed = parseFloat(e.target.value);
        onChange(Number.isFinite(parsed) ? Math.max(parsed, min) : 0);
      }}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-right font-mono text-sm tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
    />
  );

  return (
    <div className="space-y-8">
      {/* KPI Strip — Resumo Executivo de Mão de Obra */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            Custo Direto Total da Obra
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {formatBRL(summary.custoDireto)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Com BDI ({formatNum(laborConfig.bdiPercent, 1)}%):{' '}
            <span className="font-mono font-medium text-slate-700 tabular-nums">
              {formatBRL(summary.custoTotalObra)}
            </span>
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            Mão de Obra Calculada (Quantitativos)
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-blue-700">
            {formatBRL(summary.totalAutoLabor)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {project.entries.length} serviços vinculados à PCI
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            Esforço Estimado da Equipe
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {formatNum(summary.totalMasonDays, 1)} diárias
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Pedreiro ·{' '}
            <span className="font-mono tabular-nums">
              {formatNum(summary.totalHelperDays, 1)}
            </span>{' '}
            diárias servente
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            Valor Unitário da Obra
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {formatBRL(summary.valorPorM2)}/m²
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Ref. CUB 2026: R$ 2.170–2.450/m²
          </p>
        </div>
      </section>

      {/* Perfis de Mercado Competitivos (Referência SINAPI / CUB 2026) */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Perfis de Preço Competitivo (Referência Brasil 2026 — SINAPI & Mercado)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Aplique com 1 clique uma tabela de diárias, BDI e insumos calibrada
              para manter o orçamento atrativo e sem valores abusivos.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {MARKET_PROFILES_2026.map((profile) => {
            const isSelected =
              laborConfig.diariaPedreiro === profile.diariaPedreiro &&
              laborConfig.diariaServente === profile.diariaServente &&
              materialPrices.cimento50kg === profile.prices.cimento50kg;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onApplyMarketProfile(profile)}
                className={`rounded-md border p-3.5 text-left transition-colors ${
                  isSelected
                    ? 'border-blue-700 bg-blue-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900">
                    {profile.nome}
                  </span>
                  {isSelected && (
                    <span className="text-[11px] font-semibold text-blue-700">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600">{profile.subtitulo}</p>
                <p className="mt-1.5 font-mono text-[11px] text-slate-500 tabular-nums">
                  Cimento {formatBRL(profile.prices.cimento50kg)} · Areia{' '}
                  {formatBRL(profile.prices.areiaM3)}/m³ · Tijolo{' '}
                  {formatBRL(profile.prices.tijoloFuradoUnid)}/un
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Parâmetros de Diárias e Preços Básicos */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Users className="h-4 w-4 text-blue-700" />
                Parâmetros de Diárias e Encargos
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Faixa SINAPI/Mercado: Pedreiro R$ 185–280/dia · Servente R$
                120–170/dia.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Diária do Pedreiro (R$)
              </label>
              {numInput(
                laborConfig.diariaPedreiro,
                (v) => onUpdateLaborConfig({ diariaPedreiro: v }),
                '5'
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Diária do Servente / Ajudante (R$)
              </label>
              {numInput(
                laborConfig.diariaServente,
                (v) => onUpdateLaborConfig({ diariaServente: v }),
                '5'
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Encargos Sociais / Alimentação (%)
              </label>
              {numInput(
                laborConfig.encargosPercent,
                (v) => onUpdateLaborConfig({ encargosPercent: v }),
                '1'
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                BDI da Proposta PCI (%) — Máx. 20%
              </label>
              {numInput(
                laborConfig.bdiPercent,
                (v) => onUpdateLaborConfig({ bdiPercent: Math.min(v, 100) }),
                '0.5'
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Incluir custo do Servente/Ajudante
              </p>
              <p className="text-xs text-slate-500">
                Desative para visualizar apenas o custo por m² do pedreiro.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateLaborConfig({
                  incluirServente: !laborConfig.incluirServente,
                })
              }
              className={`whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                laborConfig.incluirServente
                  ? 'bg-blue-700 text-white hover:bg-blue-800'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {laborConfig.incluirServente
                ? 'Com Servente (Ativo)'
                : 'Apenas Pedreiro'}
            </button>
          </div>
        </div>

        {/* Tabela de Preços Unitários de Materiais */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Wrench className="h-4 w-4 text-blue-700" />
                Preços Unitários de Insumos Básicos
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Cotações competitivas de mercado 2026 (editáveis conforme sua
                região).
              </p>
            </div>
            <button
              type="button"
              onClick={onResetMaterialPrices}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              title="Restaurar preços competitivos"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Cimento 50 kg
              </label>
              {numInput(
                materialPrices.cimento50kg,
                (v) => onUpdateMaterialPrices({ cimento50kg: v }),
                '0.5'
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Cal 20 kg
              </label>
              {numInput(
                materialPrices.cal20kg,
                (v) => onUpdateMaterialPrices({ cal20kg: v }),
                '0.5'
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Areia (m³)
              </label>
              {numInput(
                materialPrices.areiaM3,
                (v) => onUpdateMaterialPrices({ areiaM3: v }),
                '5'
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Brita (m³)
              </label>
              {numInput(
                materialPrices.britaM3,
                (v) => onUpdateMaterialPrices({ britaM3: v }),
                '5'
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Tijolo Furado (un)
              </label>
              {numInput(
                materialPrices.tijoloFuradoUnid,
                (v) => onUpdateMaterialPrices({ tijoloFuradoUnid: v }),
                '0.05'
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Tijolo Maciço (un)
              </label>
              {numInput(
                materialPrices.tijoloMacicoUnid,
                (v) => onUpdateMaterialPrices({ tijoloMacicoUnid: v }),
                '0.05'
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Argamassa 20 kg
              </label>
              {numInput(
                materialPrices.argamassa20kg,
                (v) => onUpdateMaterialPrices({ argamassa20kg: v }),
                '0.5'
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Rejunte (kg)
              </label>
              {numInput(
                materialPrices.rejunteKg,
                (v) => onUpdateMaterialPrices({ rejunteKg: v }),
                '0.5'
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Referência competitiva:{' '}
            {formatBRL(MATERIAL_PRICES_DEFAULT.cimento50kg)}/sc cimento ·{' '}
            {formatBRL(MATERIAL_PRICES_DEFAULT.areiaM3)}/m³ areia ·{' '}
            {formatBRL(MATERIAL_PRICES_DEFAULT.britaM3)}/m³ brita ·{' '}
            {formatBRL(MATERIAL_PRICES_DEFAULT.tijoloFuradoUnid * 1000)}/milheiro.
          </p>
        </div>
      </section>

      {/* Tabela Matriz da Planilha de Cálculo de Mão de Obra */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Tabela de Custo de Mão de Obra por Unidade (Comparativo de Mercado)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Compara o valor unitário gerado pela sua diária com as faixas
              praticadas no mercado brasileiro para evitar preços fora de
              realidade.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetLaborDefaults}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Produtividades ({LABOR_SERVICES_DEFAULT.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-4 py-3">Serviço da Construção Civil</th>
                <th className="px-3 py-3 text-center">Unid.</th>
                <th className="px-3 py-3 text-right">Produtiv. / Dia</th>
                <th className="px-3 py-3 text-right">Coef. Serv.</th>
                <th className="px-3 py-3 text-right">Pedreiro</th>
                <th className="px-3 py-3 text-right">Servente</th>
                <th className="px-4 py-3 text-right">Seu Preço Unit.</th>
                <th className="px-4 py-3">Referência Mercado</th>
                <th className="px-4 py-3">Destino PCI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {laborServices.map((srv) => {
                const {
                  custoPedreiroUnit,
                  custoServenteUnit,
                  custoComEncargosUnit,
                } = calcLaborUnitCost(srv, laborConfig);
                const pciItem = PCI_REFERENCE_ITEMS.find(
                  (p) => p.id === srv.pciItemId
                );
                const bench = MARKET_LABOR_BENCHMARKS[srv.id];
                let compStatus: 'low' | 'ok' | 'high' = 'ok';
                if (bench) {
                  if (custoComEncargosUnit < bench.min) compStatus = 'low';
                  else if (custoComEncargosUnit > bench.max) compStatus = 'high';
                }

                return (
                  <tr
                    key={srv.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-900">
                        {srv.nome}
                      </div>
                      <div className="text-xs text-slate-500">
                        {srv.corePlanilha
                          ? 'Planilha Mão de Obra Padrão'
                          : 'Complemento Estrutural / Piso'}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-xs text-slate-600">
                      {srv.unidade}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        value={srv.produtividadeDia}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          onUpdateLaborService(srv.id, {
                            produtividadeDia: Number.isFinite(v)
                              ? Math.max(v, 0.1)
                              : 1,
                          });
                        }}
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={srv.coefServente}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          onUpdateLaborService(srv.id, {
                            coefServente: Number.isFinite(v)
                              ? Math.max(v, 0)
                              : 0,
                          });
                        }}
                        className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700">
                      {formatBRL(custoPedreiroUnit)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-600">
                      {laborConfig.incluirServente
                        ? formatBRL(custoServenteUnit)
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-blue-700">
                      {formatBRL(custoComEncargosUnit)}/{srv.unidade}
                    </td>
                    <td className="px-4 py-2.5">
                      {bench ? (
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium ${
                              compStatus === 'high'
                                ? 'text-amber-700'
                                : 'text-green-700'
                            }`}
                          >
                            {compStatus === 'low' && (
                              <>
                                <TrendingDown className="h-3.5 w-3.5" />
                                Muito competitivo
                              </>
                            )}
                            {compStatus === 'ok' && (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Competitivo (na faixa)
                              </>
                            )}
                            {compStatus === 'high' && (
                              <>
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Acima da média
                              </>
                            )}
                          </span>
                          <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                            {bench.fonte}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">
                      {pciItem
                        ? `${pciItem.id}. ${pciItem.nome.split('(')[0].trim()}`
                        : `Item ${srv.pciItemId}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
