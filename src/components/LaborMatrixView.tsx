import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  FolderOpen,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  TrendingDown,
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
  LABOR_SERVICES_DEFAULT,
  MARKET_LABOR_BENCHMARKS,
  MARKET_PROFILES_2026,
  MarketProfilePreset,
  MATERIAL_PRICES_DEFAULT,
  PCI_REFERENCE_ITEMS,
} from '../data/presets';
import {
  calcLaborUnitCost,
  calcProjectSummary,
  formatBRL,
  formatNum,
  ProjectSummary,
} from '../utils/calculations';

interface Props {
  project: ConstructionProject;
  allProjects: ConstructionProject[];
  summary: ProjectSummary;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDuplicateProject: (id: string) => void;
  onUpdateProjectInfo: (
    id: string,
    patch: { nomeObra?: string; proponente?: string; areaConstruidaTotal?: number }
  ) => void;
  onDeleteProject: (id: string) => void;
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

export const LaborMatrixView: React.FC<Props> = ({
  project,
  allProjects,
  summary,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onUpdateProjectInfo,
  onDeleteProject,
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

  // Estados de edição / exclusão de orçamentos salvos
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState({
    nomeObra: '',
    proponente: '',
    areaConstruidaTotal: 0,
  });
  const [confirmDeleteBudgetId, setConfirmDeleteBudgetId] = useState<
    string | null
  >(null);

  // Estados de criação / edição / exclusão de serviços de mão de obra
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

  const startEditBudget = (proj: ConstructionProject) => {
    setEditingBudgetId(proj.id);
    setConfirmDeleteBudgetId(null);
    setBudgetDraft({
      nomeObra: proj.nomeObra,
      proponente: proj.metadata.proponente,
      areaConstruidaTotal: proj.metadata.areaConstruidaTotal,
    });
  };

  const saveEditBudget = () => {
    if (!editingBudgetId) return;
    onUpdateProjectInfo(editingBudgetId, {
      nomeObra: budgetDraft.nomeObra.trim() || 'Orçamento sem título',
      proponente: budgetDraft.proponente,
      areaConstruidaTotal: Math.max(budgetDraft.areaConstruidaTotal, 0),
    });
    setEditingBudgetId(null);
  };

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
      coefServente: Math.max(serviceDraft.coefServente, 0),
      pciItemId: serviceDraft.pciItemId,
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

      {/* Gerenciador de Orçamentos de Mão de Obra (Editar / Excluir / Criar) */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <FolderOpen className="h-4 w-4 text-blue-700" />
              Orçamentos de Mão de Obra Salvos ({allProjects.length})
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Selecione, edite nome/cliente/área, duplique ou exclua qualquer
              orçamento salvo.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateProject}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Orçamento
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {allProjects.map((proj) => {
            const isActive = proj.id === project.id;
            const projSummary = isActive ? summary : calcProjectSummary(proj);
            const isEditing = editingBudgetId === proj.id;
            const isConfirmingDelete = confirmDeleteBudgetId === proj.id;

            return (
              <div
                key={proj.id}
                className={`px-6 py-3.5 transition-colors ${
                  isActive ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                }`}
              >
                {isEditing ? (
                  <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-5">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Nome do Orçamento / Obra
                      </label>
                      <input
                        type="text"
                        value={budgetDraft.nomeObra}
                        onChange={(e) =>
                          setBudgetDraft((d) => ({
                            ...d,
                            nomeObra: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Cliente / Proponente
                      </label>
                      <input
                        type="text"
                        value={budgetDraft.proponente}
                        onChange={(e) =>
                          setBudgetDraft((d) => ({
                            ...d,
                            proponente: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Área (m²)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={budgetDraft.areaConstruidaTotal}
                        onChange={(e) =>
                          setBudgetDraft((d) => ({
                            ...d,
                            areaConstruidaTotal:
                              parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1.5 sm:col-span-2">
                      <button
                        type="button"
                        onClick={saveEditBudget}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingBudgetId(null)}
                        className="inline-flex items-center rounded border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                        aria-label="Cancelar edição"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectProject(proj.id)}
                          className={`text-left text-sm font-semibold transition-colors ${
                            isActive
                              ? 'text-blue-700'
                              : 'text-slate-900 hover:text-blue-700'
                          }`}
                        >
                          {proj.nomeObra}
                        </button>
                        {isActive && (
                          <span className="text-xs font-medium text-blue-700">
                            · Em edição
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Cliente: {proj.metadata.proponente || 'Não informado'} ·{' '}
                        <span className="font-mono tabular-nums">
                          {formatNum(proj.metadata.areaConstruidaTotal, 0)} m²
                        </span>{' '}
                        · Mão de obra:{' '}
                        <span className="font-mono font-medium text-slate-700 tabular-nums">
                          {formatBRL(projSummary.totalAutoLabor)}
                        </span>{' '}
                        · Total c/ BDI:{' '}
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatBRL(projSummary.custoTotalObra)}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => onSelectProject(proj.id)}
                          className="whitespace-nowrap rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Abrir
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startEditBudget(proj)}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateProject(proj.id)}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        title="Duplicar orçamento"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Duplicar
                      </button>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteProject(proj.id);
                              setConfirmDeleteBudgetId(null);
                            }}
                            className="whitespace-nowrap rounded bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Confirmar Exclusão
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteBudgetId(null)}
                            className="whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBudgetId(null);
                            setConfirmDeleteBudgetId(proj.id);
                          }}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
              Tabela de Custo de Mão de Obra por Unidade ({laborServices.length} serviços)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Adicione, edite ou exclua composições de mão de obra e compare com
              as faixas praticadas no mercado brasileiro.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewServiceForm((v) => !v)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo Serviço MO
            </button>
            <button
              type="button"
              onClick={onResetLaborDefaults}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar Padrão ({LABOR_SERVICES_DEFAULT.length})
            </button>
          </div>
        </div>

        {/* Formulário para Adicionar Novo Serviço de Mão de Obra */}
        {showNewServiceForm && (
          <form
            onSubmit={handleCreateService}
            className="border-b border-slate-200 bg-slate-50 px-6 py-4"
          >
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
              <div className="sm:col-span-4">
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
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Unid.
                </label>
                <select
                  value={newService.unidade}
                  onChange={(e) =>
                    setNewService((s) => ({
                      ...s,
                      unidade: e.target.value as LaborServiceRate['unidade'],
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                >
                  <option value="m²">m²</option>
                  <option value="m³">m³</option>
                  <option value="m">m</option>
                  <option value="un">un</option>
                  <option value="vb">vb</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Produtiv./Dia
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
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Servente
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newService.coefServente}
                  onChange={(e) =>
                    setNewService((s) => ({
                      ...s,
                      coefServente: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Item PCI
                </label>
                <select
                  value={newService.pciItemId}
                  onChange={(e) =>
                    setNewService((s) => ({
                      ...s,
                      pciItemId: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                >
                  {PCI_REFERENCE_ITEMS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id}. {item.nome.split('(')[0].trim()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-1.5 sm:col-span-2">
                <button
                  type="submit"
                  className="whitespace-nowrap rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewServiceForm(false)}
                  className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>
        )}

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
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {laborServices.map((srv) => {
                const isEditingRow =
                  editingServiceId === srv.id && serviceDraft !== null;
                const activeSrv = isEditingRow ? serviceDraft : srv;
                const {
                  custoPedreiroUnit,
                  custoServenteUnit,
                  custoComEncargosUnit,
                } = calcLaborUnitCost(activeSrv, laborConfig);
                const pciItem = PCI_REFERENCE_ITEMS.find(
                  (p) => p.id === activeSrv.pciItemId
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
                    className={`transition-colors ${
                      isEditingRow ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      {isEditingRow ? (
                        <input
                          type="text"
                          value={serviceDraft.nome}
                          onChange={(e) =>
                            setServiceDraft((d) =>
                              d ? { ...d, nome: e.target.value } : d
                            )
                          }
                          className="w-full min-w-[200px] rounded border border-blue-700 bg-white px-2.5 py-1 text-xs font-medium text-slate-900 focus:outline-none"
                        />
                      ) : (
                        <>
                          <div className="font-medium text-slate-900">
                            {srv.nome}
                          </div>
                          <div className="text-xs text-slate-500">
                            {srv.corePlanilha
                              ? 'Planilha Mão de Obra Padrão'
                              : 'Composição Complementar'}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-xs text-slate-600">
                      {isEditingRow ? (
                        <select
                          value={serviceDraft.unidade}
                          onChange={(e) =>
                            setServiceDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    unidade: e.target
                                      .value as LaborServiceRate['unidade'],
                                  }
                                : d
                            )
                          }
                          className="rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-900"
                        >
                          <option value="m²">m²</option>
                          <option value="m³">m³</option>
                          <option value="m">m</option>
                          <option value="un">un</option>
                          <option value="vb">vb</option>
                        </select>
                      ) : (
                        srv.unidade
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        value={activeSrv.produtividadeDia}
                        onChange={(e) => {
                          const v = Math.max(parseFloat(e.target.value) || 0.1, 0.1);
                          if (isEditingRow) {
                            setServiceDraft((d) =>
                              d ? { ...d, produtividadeDia: v } : d
                            );
                          } else {
                            onUpdateLaborService(srv.id, {
                              produtividadeDia: v,
                            });
                          }
                        }}
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={activeSrv.coefServente}
                        onChange={(e) => {
                          const v = Math.max(parseFloat(e.target.value) || 0, 0);
                          if (isEditingRow) {
                            setServiceDraft((d) =>
                              d ? { ...d, coefServente: v } : d
                            );
                          } else {
                            onUpdateLaborService(srv.id, { coefServente: v });
                          }
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
                      {formatBRL(custoComEncargosUnit)}/{activeSrv.unidade}
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
                        <span className="text-xs text-slate-400">Personalizado</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">
                      {isEditingRow ? (
                        <select
                          value={serviceDraft.pciItemId}
                          onChange={(e) =>
                            setServiceDraft((d) =>
                              d
                                ? { ...d, pciItemId: Number(e.target.value) }
                                : d
                            )
                          }
                          className="w-36 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                        >
                          {PCI_REFERENCE_ITEMS.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.id}. {item.nome.split('(')[0].trim()}
                            </option>
                          ))}
                        </select>
                      ) : pciItem ? (
                        `${pciItem.id}. ${pciItem.nome.split('(')[0].trim()}`
                      ) : (
                        `Item ${srv.pciItemId}`
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {isEditingRow ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={saveEditService}
                            className="rounded bg-blue-700 p-1.5 text-white hover:bg-blue-800"
                            title="Salvar alterações"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingServiceId(null);
                              setServiceDraft(null);
                            }}
                            className="rounded border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                            title="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : confirmDeleteServiceId === srv.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteLaborService(srv.id);
                              setConfirmDeleteServiceId(null);
                            }}
                            className="whitespace-nowrap rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteServiceId(null)}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditService(srv)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                            title="Editar serviço"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingServiceId(null);
                              setConfirmDeleteServiceId(srv.id);
                            }}
                            disabled={laborServices.length <= 1}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Excluir serviço"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
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
