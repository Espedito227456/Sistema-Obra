import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import {
  ConstructionProject,
  LaborServiceRate,
  MaterialUnitPrices,
} from '../types/construction';
import {
  MARKET_LABOR_BENCHMARKS,
  MARKET_PROFILES_2026,
  MarketProfilePreset,
} from '../data/presets';
import { calcLaborUnitCost, formatBRL, formatNum } from '../utils/calculations';

interface Props {
  project: ConstructionProject;
  onUpdateLaborConfig: (
    patch: Partial<ConstructionProject['laborConfig']>
  ) => void;
  onAddLaborService: (service: LaborServiceRate) => void;
  onUpdateLaborService: (
    id: string,
    patch: Partial<LaborServiceRate>
  ) => void;
  onDeleteLaborService: (id: string) => void;
  onResetLaborDefaults: () => void;
  onUpdateMaterialPrices: (patch: Partial<MaterialUnitPrices>) => void;
  onResetMaterialPrices: () => void;
  onApplyMarketProfile: (profile: MarketProfilePreset) => void;
}

const REGION_SHORT_LABELS: Record<MarketProfilePreset['id'], string> = {
  economico: 'Interior / Econômico',
  competitivo: 'Média Mercado 2026',
  capital: 'Grandes Capitais',
};

export const LaborMatrixView: React.FC<Props> = ({
  project,
  onUpdateLaborConfig,
  onAddLaborService,
  onUpdateLaborService,
  onDeleteLaborService,
  onResetLaborDefaults,
  onUpdateMaterialPrices,
  onResetMaterialPrices,
  onApplyMarketProfile,
}) => {
  const { laborConfig, laborServices, materialPrices } = project;

  const [showMaterialPrices, setShowMaterialPrices] = useState(false);

  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newService, setNewService] = useState<Omit<LaborServiceRate, 'id'>>({
    nome: '',
    unidade: 'm²',
    produtividadeDia: 10,
    coefServente: 0.5,
    pciItemId: 4,
    corePlanilha: false,
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceDraft, setServiceDraft] = useState<LaborServiceRate | null>(
    null
  );
  const [confirmDeleteServiceId, setConfirmDeleteServiceId] = useState<
    string | null
  >(null);

  const startEditService = (srv: LaborServiceRate) => {
    setEditingServiceId(srv.id);
    setConfirmDeleteServiceId(null);
    setServiceDraft({ ...srv });
  };

  const saveEditService = () => {
    if (!editingServiceId || !serviceDraft) return;
    onUpdateLaborService(editingServiceId, {
      nome: serviceDraft.nome.trim() || 'Serviço de mão de obra',
      unidade: serviceDraft.unidade,
      produtividadeDia: Math.max(serviceDraft.produtividadeDia, 0.1),
      precoFixoUnit:
        serviceDraft.precoFixoUnit && serviceDraft.precoFixoUnit > 0
          ? serviceDraft.precoFixoUnit
          : undefined,
    });
    setEditingServiceId(null);
    setServiceDraft(null);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.nome.trim()) return;
    onAddLaborService({
      ...newService,
      id: `mo-${Date.now()}`,
      nome: newService.nome.trim(),
      produtividadeDia: Math.max(newService.produtividadeDia, 0.1),
      coefServente: Math.max(newService.coefServente, 0),
    });
    setNewService({
      nome: '',
      unidade: 'm²',
      produtividadeDia: 10,
      coefServente: 0.5,
      pciItemId: 4,
      corePlanilha: false,
    });
    setShowNewServiceForm(false);
  };

  const numInput = (
    val: number,
    onChange: (n: number) => void,
    step = '5',
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
      className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-right font-mono text-base font-semibold tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
    />
  );

  return (
    <div className="space-y-6">
      {/* Bloco 1: Diárias da Equipe + Atalhos de Região */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Users className="h-4 w-4 text-blue-700" />
            Diária da sua Equipe
          </h2>

          <button
            type="button"
            onClick={() =>
              onUpdateLaborConfig({
                incluirServente: !laborConfig.incluirServente,
              })
            }
            className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              laborConfig.incluirServente
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {laborConfig.incluirServente
              ? 'Incluindo Servente'
              : 'Só Pedreiro'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Diária do Pedreiro (R$)
            </label>
            {numInput(laborConfig.diariaPedreiro, (v) =>
              onUpdateLaborConfig({ diariaPedreiro: v })
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Diária do Servente (R$)
            </label>
            {numInput(laborConfig.diariaServente, (v) =>
              onUpdateLaborConfig({ diariaServente: v })
            )}
          </div>
        </div>

        {/* Botões rápidos de referência regional */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2.5 text-xs font-medium text-slate-500">
            Valores de referência por região:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {MARKET_PROFILES_2026.map((profile) => {
              const isSelected =
                laborConfig.diariaPedreiro === profile.diariaPedreiro &&
                laborConfig.diariaServente === profile.diariaServente;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => onApplyMarketProfile(profile)}
                  className={`min-h-[44px] rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50/70'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      {REGION_SHORT_LABELS[profile.id]}
                    </span>
                    {isSelected && (
                      <span className="text-[11px] font-semibold text-blue-700">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
                    Pedreiro {formatBRL(profile.diariaPedreiro)} · Servente{' '}
                    {formatBRL(profile.diariaServente)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bloco 2: Preço por m² */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Preço por m² ({laborServices.length} serviços)
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewServiceForm((v) => !v)}
              className="inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo Serviço
            </button>
            <button
              type="button"
              onClick={onResetLaborDefaults}
              className="inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Padrão
            </button>
          </div>
        </div>

        {showNewServiceForm && (
          <form
            onSubmit={handleCreateService}
            className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6"
          >
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Pintura acrílica 2 demãos"
                  value={newService.nome}
                  onChange={(e) =>
                    setNewService((s) => ({ ...s, nome: e.target.value }))
                  }
                  className="min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Unidade
                </label>
                <select
                  value={newService.unidade}
                  onChange={(e) =>
                    setNewService((s) => ({
                      ...s,
                      unidade: e.target.value as LaborServiceRate['unidade'],
                    }))
                  }
                  className="min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                >
                  <option value="m²">m²</option>
                  <option value="m³">m³</option>
                  <option value="m">metro</option>
                  <option value="un">unidade</option>
                  <option value="vb">verba</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Faz por dia
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={newService.produtividadeDia}
                  onChange={(e) =>
                    setNewService((s) => ({
                      ...s,
                      produtividadeDia: parseFloat(e.target.value) || 1,
                    }))
                  }
                  className="min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-right font-mono text-xs tabular-nums text-slate-900"
                />
              </div>
              <div className="flex items-center justify-end gap-1.5 sm:col-span-2">
                <button
                  type="submit"
                  className="min-h-[40px] flex-1 whitespace-nowrap rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewServiceForm(false)}
                  className="min-h-[40px] rounded-md border border-slate-300 bg-white px-2.5 text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="divide-y divide-slate-100">
          {laborServices.map((srv) => {
            const isEditingRow =
              editingServiceId === srv.id && serviceDraft !== null;
            const activeSrv = isEditingRow ? serviceDraft : srv;
            const { custoComEncargosUnit } = calcLaborUnitCost(
              activeSrv,
              laborConfig
            );
            const bench = MARKET_LABOR_BENCHMARKS[srv.id];
            const isHigh = Boolean(bench && custoComEncargosUnit > bench.max);

            return (
              <div
                key={srv.id}
                className={`px-5 py-3.5 sm:px-6 ${
                  isEditingRow ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                }`}
              >
                {isEditingRow ? (
                  <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-5">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Serviço
                      </label>
                      <input
                        type="text"
                        value={serviceDraft.nome}
                        onChange={(e) =>
                          setServiceDraft((d) =>
                            d ? { ...d, nome: e.target.value } : d
                          )
                        }
                        className="min-h-[38px] w-full rounded border border-blue-700 bg-white px-2.5 py-1 text-xs font-medium text-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Faz por dia ({serviceDraft.unidade})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        value={serviceDraft.produtividadeDia}
                        onChange={(e) =>
                          setServiceDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  produtividadeDia: Math.max(
                                    parseFloat(e.target.value) || 0.1,
                                    0.1
                                  ),
                                }
                              : d
                          )
                        }
                        className="min-h-[38px] w-full rounded border border-slate-300 bg-white px-2.5 py-1 text-right font-mono text-xs tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Preço fixo/{serviceDraft.unidade} (opcional)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="Pela diária"
                        value={serviceDraft.precoFixoUnit || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setServiceDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  precoFixoUnit:
                                    Number.isFinite(val) && val > 0
                                      ? val
                                      : undefined,
                                }
                              : d
                          );
                        }}
                        className="min-h-[38px] w-full rounded border border-slate-300 bg-white px-2.5 py-1 text-right font-mono text-xs tabular-nums"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1.5 sm:col-span-2">
                      <button
                        type="button"
                        onClick={saveEditService}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded bg-blue-700 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-800"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingServiceId(null);
                          setServiceDraft(null);
                        }}
                        className="min-h-[38px] rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {srv.nome}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono tabular-nums">
                          {formatNum(srv.produtividadeDia, 1)} {srv.unidade}/dia
                        </span>
                        {srv.precoFixoUnit && srv.precoFixoUnit > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-blue-700">
                              Preço fixo por {srv.unidade}
                            </span>
                          </>
                        )}
                        {isHigh && bench && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Acima da média ({bench.fonte})
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-mono text-base font-bold tabular-nums text-blue-700">
                          {formatBRL(custoComEncargosUnit)}
                        </span>
                        <span className="text-xs text-slate-500">
                          /{srv.unidade}
                        </span>
                      </div>

                      {confirmDeleteServiceId === srv.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteLaborService(srv.id);
                              setConfirmDeleteServiceId(null);
                            }}
                            className="min-h-[36px] rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteServiceId(null)}
                            className="min-h-[36px] rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditService(srv)}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteServiceId(srv.id)}
                            disabled={laborServices.length <= 1}
                            className="inline-flex min-h-[36px] items-center rounded border border-slate-200 bg-white p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            title="Excluir serviço"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bloco 3 (Recolhível): Preços dos Materiais */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setShowMaterialPrices((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6"
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-blue-700" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Preços dos Materiais (opcional)
              </h3>
              <p className="text-xs text-slate-500">
                Ajuste apenas se quiser incluir valores de loja no orçamento.
              </p>
            </div>
          </div>
          {showMaterialPrices ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {showMaterialPrices && (
          <div className="border-t border-slate-200 p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onResetMaterialPrices}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar preços padrão
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
