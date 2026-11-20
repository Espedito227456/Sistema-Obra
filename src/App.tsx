import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  CalendarRange,
  ClipboardCheck,
  Copy,
  FileSpreadsheet,
  FileText,
  HardHat,
  Menu,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  ConstructionProject,
  LaborServiceRate,
  MaterialUnitPrices,
  PciItemConfig,
  ProjectMetadata,
  ServiceEntry,
  ServicoAdicional,
  TabId,
} from './types/construction';
import {
  createInitialPciItems,
  DEFAULT_METADATA,
  DEFAULT_PROJECT,
  LABOR_SERVICES_DEFAULT,
  MarketProfilePreset,
  MATERIAL_PRICES_DEFAULT,
} from './data/presets';
import {
  applyParametricEstimateToPci,
  calcProjectSummary,
  formatBRL,
  formatNum,
  generateAutoSchedule,
} from './utils/calculations';
import { LaborMatrixView } from './components/LaborMatrixView';
import { MaterialsAndTakeoffView } from './components/MaterialsAndTakeoffView';
import { PciBudgetView } from './components/PciBudgetView';
import { ScheduleAndProjectView } from './components/ScheduleAndProjectView';
import { ConsolidatedReportView } from './components/ConsolidatedReportView';

const STORAGE_KEY = 'obrabase_projects_v2';

interface StoredState {
  projects: ConstructionProject[];
  activeId: string;
}

function loadInitialState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredState;
      if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback para projeto padrão
  }
  return {
    projects: [DEFAULT_PROJECT],
    activeId: DEFAULT_PROJECT.id,
  };
}

export default function App() {
  const [store, setStore] = useState<StoredState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<TabId>('labor');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [confirmDeleteSidebar, setConfirmDeleteSidebar] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignora erro de cota do localStorage
    }
  }, [store]);

  const activeProject =
    store.projects.find((p) => p.id === store.activeId) ?? store.projects[0];

  const summary = useMemo(
    () => calcProjectSummary(activeProject),
    [activeProject]
  );

  const updateActiveProject = (
    updater: (prev: ConstructionProject) => ConstructionProject
  ) => {
    setStore((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === activeProject.id
          ? {
              ...updater(p),
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : p
      ),
    }));
  };

  const makeBlankProject = (indexLabel: number | string): ConstructionProject => ({
    id: `obra-${Date.now()}`,
    nomeObra: `Novo Orçamento (${indexLabel})`,
    updatedAt: new Date().toISOString().slice(0, 10),
    laborConfig: { ...DEFAULT_PROJECT.laborConfig },
    laborServices: LABOR_SERVICES_DEFAULT.map((s) => ({ ...s })),
    materialPrices: { ...MATERIAL_PRICES_DEFAULT },
    entries: [],
    pciItems: createInitialPciItems(false),
    servicosAdicionais: [],
    prazoMeses: 6,
    schedule: [
      { etapa: 'PréExc.', percentEtapa: 5 },
      { etapa: '1', percentEtapa: 15 },
      { etapa: '2', percentEtapa: 20 },
      { etapa: '3', percentEtapa: 20 },
      { etapa: '4', percentEtapa: 18 },
      { etapa: '5', percentEtapa: 12 },
      { etapa: '6', percentEtapa: 10 },
    ],
    metadata: {
      ...DEFAULT_METADATA,
      proponente: '',
      cpfProp: '',
      emailProp: '',
      telefoneProp: '',
      endereco: '',
      areaConstruidaTotal: 85,
      valorTerreno: 100000,
      justificativasPci: '',
      obrasExecutadas: '',
    },
  });

  const handleCreateBlankProject = () => {
    const blank = makeBlankProject(store.projects.length + 1);
    setStore((prev) => ({
      projects: [...prev.projects, blank],
      activeId: blank.id,
    }));
    setMobileMenuOpen(false);
  };

  const handleDuplicateProject = (targetId = activeProject.id) => {
    const source = store.projects.find((p) => p.id === targetId) ?? activeProject;
    const id = `obra-${Date.now()}`;
    const copy: ConstructionProject = {
      ...JSON.parse(JSON.stringify(source)),
      id,
      nomeObra: `${source.nomeObra} (Cópia)`,
    };
    setStore((prev) => ({
      projects: [...prev.projects, copy],
      activeId: id,
    }));
  };

  const handleUpdateProjectInfo = (
    id: string,
    patch: { nomeObra?: string; proponente?: string; areaConstruidaTotal?: number }
  ) => {
    setStore((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              nomeObra: patch.nomeObra !== undefined ? patch.nomeObra : p.nomeObra,
              updatedAt: new Date().toISOString().slice(0, 10),
              metadata: {
                ...p.metadata,
                proponente:
                  patch.proponente !== undefined
                    ? patch.proponente
                    : p.metadata.proponente,
                areaConstruidaTotal:
                  patch.areaConstruidaTotal !== undefined
                    ? patch.areaConstruidaTotal
                    : p.metadata.areaConstruidaTotal,
              },
            }
          : p
      ),
    }));
  };

  const handleDeleteProject = (id: string) => {
    setConfirmDeleteSidebar(false);
    setStore((prev) => {
      const remaining = prev.projects.filter((p) => p.id !== id);
      if (remaining.length === 0) {
        const blank = makeBlankProject(1);
        return {
          projects: [blank],
          activeId: blank.id,
        };
      }
      return {
        projects: remaining,
        activeId: prev.activeId === id ? remaining[0].id : prev.activeId,
      };
    });
  };

  const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'labor',
      label: 'Mão de Obra & Diárias',
      icon: <HardHat className="h-4 w-4" />,
    },
    {
      id: 'materials',
      label: 'Materiais & Serviços',
      icon: <Calculator className="h-4 w-4" />,
    },
    {
      id: 'pci',
      label: 'Planilha PCI CAIXA',
      icon: <FileSpreadsheet className="h-4 w-4" />,
    },
    {
      id: 'schedule',
      label: 'Cronograma & Ficha',
      icon: <CalendarRange className="h-4 w-4" />,
    },
    {
      id: 'report',
      label: 'Relatório & Exportação',
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  const handleImportJson = (imported: ConstructionProject) => {
    const newId = `obra-${Date.now()}`;
    const normalized: ConstructionProject = { ...imported, id: newId };
    setStore((prev) => ({
      projects: [...prev.projects, normalized],
      activeId: newId,
    }));
    setActiveTab('pci');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white">
      <div>
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            ObraBase
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Seletor de Obra */}
        <div className="border-b border-slate-200 p-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Obra Selecionada
          </label>
          <select
            value={activeProject.id}
            onChange={(e) =>
              setStore((prev) => ({ ...prev, activeId: e.target.value }))
            }
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-blue-700 focus:outline-none"
          >
            {store.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nomeObra}
              </option>
            ))}
          </select>

          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCreateBlankProject}
              className="inline-flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova Obra
            </button>
            <button
              type="button"
              onClick={() => handleDuplicateProject(activeProject.id)}
              className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
              title="Duplicar orçamento atual"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteSidebar((v) => !v)}
              className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
              title="Excluir orçamento atual"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {confirmDeleteSidebar && (
            <div className="mt-2 flex items-center justify-between gap-2 rounded border border-red-200 bg-red-50 px-2.5 py-2 text-xs">
              <span className="font-medium text-red-800">Excluir este orçamento?</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDeleteProject(activeProject.id)}
                  className="rounded bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSidebar(false)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                >
                  Não
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="space-y-1 p-3" aria-label="Módulos do sistema">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Resumo Fixo da Obra na Sidebar */}
      <div className="border-t border-slate-200 bg-slate-50 p-4 text-xs">
        <div className="flex items-center justify-between text-slate-500">
          <span>Total da Obra (c/ BDI)</span>
          <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <p className="mt-1 font-mono text-base font-bold tabular-nums text-slate-900">
          {formatBRL(summary.custoTotalObra)}
        </p>
        <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
          <div className="flex justify-between">
            <span>Mão de Obra Auto:</span>
            <span className="font-mono font-medium tabular-nums">
              {formatBRL(summary.totalAutoLabor)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Materiais Auto:</span>
            <span className="font-mono font-medium tabular-nums">
              {formatBRL(summary.totalAutoMaterial)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Valor/m²:</span>
            <span className="font-mono font-medium tabular-nums">
              {formatBRL(summary.valorPorM2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      {/* Sidebar Desktop */}
      <aside className="no-print hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Drawer Mobile */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 h-full w-72 border-r border-slate-200 bg-white">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Área Principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Abrir navegação"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              {editingTitle ? (
                <input
                  type="text"
                  autoFocus
                  value={activeProject.nomeObra}
                  onChange={(e) =>
                    updateActiveProject((p) => ({
                      ...p,
                      nomeObra: e.target.value,
                    }))
                  }
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditingTitle(false);
                  }}
                  className="w-72 max-w-full rounded border border-blue-700 px-2 py-1 text-sm font-semibold text-slate-900 focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <span className="hidden text-slate-400 sm:inline">Obras /</span>
                  <button
                    type="button"
                    onClick={() => setEditingTitle(true)}
                    className="truncate font-semibold text-slate-900 hover:text-blue-700"
                    title="Clique para renomear a obra"
                  >
                    {activeProject.nomeObra}
                  </button>
                  <span className="hidden text-slate-300 md:inline">·</span>
                  <span className="hidden whitespace-nowrap font-mono text-xs text-slate-500 tabular-nums md:inline">
                    {formatNum(activeProject.metadata.areaConstruidaTotal, 2)} m²
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="whitespace-nowrap shrink-0 rounded-md bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
            >
              Relatório & PDF
            </button>
          </div>
        </header>

        {/* Conteúdo da Aba Ativa */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {activeTab === 'labor' && (
            <LaborMatrixView
              project={activeProject}
              allProjects={store.projects}
              summary={summary}
              onSelectProject={(id: string) =>
                setStore((prev) => ({ ...prev, activeId: id }))
              }
              onCreateProject={handleCreateBlankProject}
              onDuplicateProject={handleDuplicateProject}
              onUpdateProjectInfo={handleUpdateProjectInfo}
              onDeleteProject={handleDeleteProject}
              onUpdateLaborConfig={(patch) =>
                updateActiveProject((p) => ({
                  ...p,
                  laborConfig: { ...p.laborConfig, ...patch },
                }))
              }
              onAddLaborService={(service: LaborServiceRate) =>
                updateActiveProject((p) => ({
                  ...p,
                  laborServices: [service, ...p.laborServices],
                }))
              }
              onUpdateLaborService={(id, patch: Partial<LaborServiceRate>) =>
                updateActiveProject((p) => ({
                  ...p,
                  laborServices: p.laborServices.map((s) =>
                    s.id === id ? { ...s, ...patch } : s
                  ),
                }))
              }
              onDeleteLaborService={(id: string) =>
                updateActiveProject((p) => {
                  const nextServices = p.laborServices.filter((s) => s.id !== id);
                  if (nextServices.length === 0) return p;
                  const fallbackId = nextServices[0].id;
                  return {
                    ...p,
                    laborServices: nextServices,
                    entries: p.entries.map((e) =>
                      e.laborServiceId === id
                        ? { ...e, laborServiceId: fallbackId }
                        : e
                    ),
                  };
                })
              }
              onResetLaborDefaults={() =>
                updateActiveProject((p) => ({
                  ...p,
                  laborServices: LABOR_SERVICES_DEFAULT.map((s) => ({ ...s })),
                }))
              }
              onUpdateMaterialPrices={(patch: Partial<MaterialUnitPrices>) =>
                updateActiveProject((p) => ({
                  ...p,
                  materialPrices: { ...p.materialPrices, ...patch },
                }))
              }
              onResetMaterialPrices={() =>
                updateActiveProject((p) => ({
                  ...p,
                  materialPrices: { ...MATERIAL_PRICES_DEFAULT },
                }))
              }
              onApplyMarketProfile={(profile: MarketProfilePreset) =>
                updateActiveProject((p) => ({
                  ...p,
                  laborConfig: {
                    ...p.laborConfig,
                    diariaPedreiro: profile.diariaPedreiro,
                    diariaServente: profile.diariaServente,
                    bdiPercent: profile.bdiPercent,
                  },
                  materialPrices: { ...profile.prices },
                }))
              }
            />
          )}

          {activeTab === 'materials' && (
            <MaterialsAndTakeoffView
              project={activeProject}
              summary={summary}
              onAddEntry={(entry: ServiceEntry) =>
                updateActiveProject((p) => ({
                  ...p,
                  entries: [entry, ...p.entries],
                }))
              }
              onUpdateEntry={(id: string, patch: Partial<ServiceEntry>) =>
                updateActiveProject((p) => ({
                  ...p,
                  entries: p.entries.map((e) =>
                    e.id === id ? { ...e, ...patch } : e
                  ),
                }))
              }
              onDeleteEntry={(id: string) =>
                updateActiveProject((p) => ({
                  ...p,
                  entries: p.entries.filter((e) => e.id !== id),
                }))
              }
            />
          )}

          {activeTab === 'pci' && (
            <PciBudgetView
              project={activeProject}
              summary={summary}
              onUpdatePciManual={(
                itemId: number,
                patch: Partial<
                  Pick<PciItemConfig, 'manualLaborCost' | 'manualMaterialCost'>
                >
              ) =>
                updateActiveProject((p) => ({
                  ...p,
                  pciItems: p.pciItems.map((item) =>
                    item.id === itemId ? { ...item, ...patch } : item
                  ),
                }))
              }
              onApplyParametricEstimate={() =>
                updateActiveProject((p) => ({
                  ...p,
                  pciItems: applyParametricEstimateToPci(p, summary),
                }))
              }
              onClearManualPci={() =>
                updateActiveProject((p) => ({
                  ...p,
                  pciItems: p.pciItems.map((item) => ({
                    ...item,
                    manualLaborCost: 0,
                    manualMaterialCost: 0,
                  })),
                }))
              }
              onAddAdicional={(item: ServicoAdicional) =>
                updateActiveProject((p) => ({
                  ...p,
                  servicosAdicionais: [...p.servicosAdicionais, item],
                }))
              }
              onUpdateAdicional={(
                id: string,
                patch: Partial<ServicoAdicional>
              ) =>
                updateActiveProject((p) => ({
                  ...p,
                  servicosAdicionais: p.servicosAdicionais.map((s) =>
                    s.id === id ? { ...s, ...patch } : s
                  ),
                }))
              }
              onDeleteAdicional={(id: string) =>
                updateActiveProject((p) => ({
                  ...p,
                  servicosAdicionais: p.servicosAdicionais.filter(
                    (s) => s.id !== id
                  ),
                }))
              }
              onUpdateJustificativa={(text: string) =>
                updateActiveProject((p) => ({
                  ...p,
                  metadata: { ...p.metadata, justificativasPci: text },
                }))
              }
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleAndProjectView
              project={activeProject}
              summary={summary}
              onChangePrazo={(meses: number) =>
                updateActiveProject((p) => {
                  const nextSchedule = generateAutoSchedule(
                    summary.pciComputed,
                    meses
                  );
                  return {
                    ...p,
                    prazoMeses: meses,
                    schedule: nextSchedule,
                  };
                })
              }
              onGenerateAutoSchedule={() =>
                updateActiveProject((p) => ({
                  ...p,
                  schedule: generateAutoSchedule(
                    summary.pciComputed,
                    p.prazoMeses
                  ),
                }))
              }
              onUpdateScheduleStage={(etapa: string, percentEtapa: number) =>
                updateActiveProject((p) => ({
                  ...p,
                  schedule: p.schedule.map((s) =>
                    s.etapa === etapa ? { ...s, percentEtapa } : s
                  ),
                }))
              }
              onUpdateMetadata={(patch: Partial<ProjectMetadata>) =>
                updateActiveProject((p) => ({
                  ...p,
                  metadata: { ...p.metadata, ...patch },
                }))
              }
            />
          )}

          {activeTab === 'report' && (
            <ConsolidatedReportView
              project={activeProject}
              summary={summary}
              onImportProjectJson={handleImportJson}
            />
          )}
        </main>
      </div>
    </div>
  );
}
