import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronUp,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {
  CalculatorType,
  ConstructionProject,
  MaterialsBreakdown,
  ServiceEntry,
} from '../types/construction';
import { TRACOS_ARGAMASSA, TRACOS_CONCRETO } from '../data/presets';
import {
  calcEntryComputed,
  calcLaborUnitCost,
  formatBRL,
  formatNum,
  getMinTeamDailyCost,
  getTeamCounts,
  ProjectSummary,
} from '../utils/calculations';

interface Props {
  project: ConstructionProject;
  summary: ProjectSummary;
  quoteMode: 'labor_only' | 'full';
  onChangeQuoteMode: (mode: 'labor_only' | 'full') => void;
  onAddEntries: (entries: ServiceEntry[]) => void;
  onReplaceEntries: (entries: ServiceEntry[]) => void;
  onUpdateEntry: (id: string, patch: Partial<ServiceEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onClearEntries: () => void;
  onUpdateMaterialMargin: (pct: number) => void;
  onUpdateLaborConfig: (
    patch: Partial<ConstructionProject['laborConfig']>
  ) => void;
}

interface SimpleServiceOption {
  key: string;
  titulo: string;
  template: Omit<ServiceEntry, 'id'>;
}

const SIMPLE_OPTIONS: SimpleServiceOption[] = [
  {
    key: 'baldrame',
    titulo: 'Fundação / Baldrame',
    template: {
      descricao: 'Baldrame direto no chão (15x30cm)',
      calculatorType: 'baldrame_direto',
      laborServiceId: 'baldrame_direto',
      pciItemId: 2,
      propCimento: 1,
      propCal: 0,
      propAreia: 2.5,
      propBrita: 3,
      areaM2: 0,
      larguraCm: 15,
      alturaCm: 30,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 40,
      espessuraCm: 0,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    key: 'alvenaria_furado',
    titulo: 'Parede (Tijolo)',
    template: {
      descricao: 'Parede de alvenaria (tijolo furado)',
      calculatorType: 'alvenaria_furado',
      laborServiceId: 'alvenaria_9',
      pciItemId: 4,
      propCimento: 1,
      propCal: 2,
      propAreia: 9,
      propBrita: 0,
      areaM2: 40,
      larguraCm: 9,
      alturaCm: 19,
      comprimentoCm: 19,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 0,
      espessuraMm: 0,
      juntaCm: 1.5,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    key: 'chapisco',
    titulo: 'Chapisco',
    template: {
      descricao: 'Chapisco em parede',
      calculatorType: 'chapisco',
      laborServiceId: 'chapisco',
      pciItemId: 9,
      propCimento: 1,
      propCal: 0,
      propAreia: 4,
      propBrita: 0,
      areaM2: 80,
      larguraCm: 0,
      alturaCm: 0,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 0,
      espessuraMm: 4,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    key: 'emboco',
    titulo: 'Reboco / Emboço',
    template: {
      descricao: 'Reboco / emboço em paredes',
      calculatorType: 'emboco',
      laborServiceId: 'emboco_interno',
      pciItemId: 9,
      propCimento: 1,
      propCal: 2,
      propAreia: 9,
      propBrita: 0,
      areaM2: 80,
      larguraCm: 0,
      alturaCm: 0,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 2,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    key: 'contrapiso',
    titulo: 'Contrapiso',
    template: {
      descricao: 'Contrapiso de cimento e areia',
      calculatorType: 'contrapiso',
      laborServiceId: 'contrapiso',
      pciItemId: 12,
      propCimento: 1,
      propCal: 0,
      propAreia: 5,
      propBrita: 0,
      areaM2: 50,
      larguraCm: 0,
      alturaCm: 0,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 3,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    key: 'ceramica',
    titulo: 'Piso / Cerâmica',
    template: {
      descricao: 'Assentamento de piso / cerâmica',
      calculatorType: 'ceramica',
      laborServiceId: 'ceramica_grande',
      pciItemId: 12,
      propCimento: 0,
      propCal: 0,
      propAreia: 0,
      propBrita: 0,
      areaM2: 45,
      larguraCm: 60,
      alturaCm: 0,
      comprimentoCm: 60,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 0,
      espessuraMm: 8,
      juntaCm: 0,
      juntaMm: 4,
      quantidadeUnid: 0,
    },
  },
  {
    key: 'piso_concreto',
    titulo: 'Piso Concreto',
    template: {
      descricao: 'Piso de concreto / calçada',
      calculatorType: 'piso_concreto',
      laborServiceId: 'piso_concreto',
      pciItemId: 12,
      propCimento: 1,
      propCal: 0,
      propAreia: 2.5,
      propBrita: 3.5,
      areaM2: 40,
      larguraCm: 0,
      alturaCm: 0,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 7,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    key: 'pilares',
    titulo: 'Pilares',
    template: {
      descricao: 'Pilares em concreto (14x25cm)',
      calculatorType: 'pilar_embutido',
      laborServiceId: 'pilares_concreto',
      pciItemId: 3,
      propCimento: 1,
      propCal: 0,
      propAreia: 2.5,
      propBrita: 3,
      areaM2: 0,
      larguraCm: 14,
      alturaCm: 0,
      comprimentoCm: 25,
      alturaM: 3,
      comprimentoM: 0,
      espessuraCm: 0,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 8,
    },
  },
  {
    key: 'vigas',
    titulo: 'Vigas / Cintas',
    template: {
      descricao: 'Vigas e cintas de amarração',
      calculatorType: 'vigas',
      laborServiceId: 'vigas_concreto',
      pciItemId: 3,
      propCimento: 1,
      propCal: 0,
      propAreia: 2.5,
      propBrita: 3,
      areaM2: 0,
      larguraCm: 14,
      alturaCm: 30,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 45,
      espessuraCm: 0,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    key: 'laje',
    titulo: 'Laje',
    template: {
      descricao: 'Concretagem de laje',
      calculatorType: 'laje',
      laborServiceId: 'laje_concreto',
      pciItemId: 3,
      propCimento: 1,
      propCal: 0,
      propAreia: 2.5,
      propBrita: 3,
      areaM2: 70,
      larguraCm: 0,
      alturaCm: 0,
      comprimentoCm: 0,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 5,
      espessuraMm: 0,
      juntaCm: 0,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
  {
    key: 'alvenaria_macico',
    titulo: 'Tijolo Maciço',
    template: {
      descricao: 'Parede de tijolo maciço',
      calculatorType: 'alvenaria_macico',
      laborServiceId: 'alvenaria_macico',
      pciItemId: 4,
      propCimento: 1,
      propCal: 1,
      propAreia: 6,
      propBrita: 0,
      areaM2: 25,
      larguraCm: 9,
      alturaCm: 5.5,
      comprimentoCm: 19,
      alturaM: 0,
      comprimentoM: 0,
      espessuraCm: 0,
      espessuraMm: 0,
      juntaCm: 1.2,
      juntaMm: 0,
      quantidadeUnid: 0,
    },
  },
];

const INITIAL_SELECTED_KEYS = [
  'baldrame',
  'alvenaria_furado',
  'chapisco',
  'emboco',
  'contrapiso',
];

function createInitialDrafts(): Record<string, Omit<ServiceEntry, 'id'>> {
  const map: Record<string, Omit<ServiceEntry, 'id'>> = {};
  for (const opt of SIMPLE_OPTIONS) {
    map[opt.key] = { ...opt.template };
  }
  return map;
}

const EMPTY_MATS: MaterialsBreakdown = {
  cimentoSacos50kg: 0,
  calSacos20kg: 0,
  areiaM3: 0,
  areiaSacos20kg: 0,
  britaM3: 0,
  britaSacos20kg: 0,
  tijolosFuradoUnid: 0,
  tijolosMacicoUnid: 0,
  argamassaSacos20kg: 0,
  rejunteKg: 0,
};

export const EasyQuoteView: React.FC<Props> = ({
  project,
  summary,
  quoteMode,
  onChangeQuoteMode,
  onAddEntries,
  onReplaceEntries,
  onUpdateEntry,
  onDeleteEntry,
  onClearEntries,
  onUpdateMaterialMargin,
  onUpdateLaborConfig,
}) => {
  const { qtdPedreiros, qtdServentes } = getTeamCounts(project.laborConfig);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    INITIAL_SELECTED_KEYS
  );
  const [drafts, setDrafts] = useState<Record<string, Omit<ServiceEntry, 'id'>>>(
    createInitialDrafts
  );
  const [expandedOptionKey, setExpandedOptionKey] = useState<string | null>(
    null
  );
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const toggleSelectKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const applyQuickPack = (keys: string[]) => {
    setSelectedKeys(keys);
  };

  const updateDraftField = (
    key: string,
    patch: Partial<Omit<ServiceEntry, 'id'>>
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  const computedOptions = useMemo(() => {
    const out: Record<
      string,
      ReturnType<typeof calcEntryComputed>
    > = {};
    for (const opt of SIMPLE_OPTIONS) {
      const draft = drafts[opt.key];
      out[opt.key] = calcEntryComputed(
        { id: `preview-${opt.key}`, ...draft },
        project.laborConfig,
        project.laborServices,
        project.materialPrices
      );
    }
    return out;
  }, [
    drafts,
    project.laborConfig,
    project.laborServices,
    project.materialPrices,
  ]);

  const minDailyLabor = getMinTeamDailyCost(project.laborConfig);

  const selectionSummary = useMemo(() => {
    let laborRaw = 0;
    let materialRaw = 0;
    let materialClient = 0;
    let masonDays = 0;
    const mats: MaterialsBreakdown = { ...EMPTY_MATS };

    for (const opt of SIMPLE_OPTIONS) {
      if (!selectedKeys.includes(opt.key)) continue;
      const comp = computedOptions[opt.key];
      if (!comp) continue;
      laborRaw += comp.laborCost;
      materialRaw += comp.materialCost;
      materialClient += comp.materialClientCost;
      masonDays += comp.masonDays;
      mats.cimentoSacos50kg += comp.materials.cimentoSacos50kg;
      mats.calSacos20kg += comp.materials.calSacos20kg;
      mats.areiaM3 += comp.materials.areiaM3;
      mats.britaM3 += comp.materials.britaM3;
      mats.tijolosFuradoUnid += comp.materials.tijolosFuradoUnid;
      mats.tijolosMacicoUnid += comp.materials.tijolosMacicoUnid;
      mats.argamassaSacos20kg += comp.materials.argamassaSacos20kg;
      mats.rejunteKg += comp.materials.rejunteKg;
    }

    const minApplied =
      selectedKeys.length > 0 && laborRaw > 0 && laborRaw < minDailyLabor;
    const laborFinal = minApplied ? minDailyLabor : laborRaw;
    const daysFinal = minApplied ? Math.max(masonDays, 1) : masonDays;
    const totalFinal =
      quoteMode === 'labor_only' ? laborFinal : laborFinal + materialClient;

    return {
      count: selectedKeys.length,
      laborRaw,
      laborFinal,
      minApplied,
      materialRaw,
      materialClient,
      totalFinal,
      daysFinal,
      mats,
    };
  }, [selectedKeys, computedOptions, minDailyLabor, quoteMode]);

  const buildSelectedEntries = (): ServiceEntry[] => {
    const baseTime = Date.now();
    return SIMPLE_OPTIONS.filter((opt) => selectedKeys.includes(opt.key)).map(
      (opt, idx) => ({
        ...drafts[opt.key],
        id: `srv-${baseTime}-${idx}`,
      })
    );
  };

  const handleAddSelectedToBudget = () => {
    const entries = buildSelectedEntries();
    if (entries.length === 0) return;
    onAddEntries(entries);
  };

  const handleReplaceWithSelected = () => {
    const entries = buildSelectedEntries();
    if (entries.length === 0) return;
    onReplaceEntries(entries);
  };

  const displayedTotal =
    quoteMode === 'labor_only'
      ? summary.totalAutoLabor
      : summary.totalAutoLabor + summary.totalAutoMaterialWithMargin;

  const compactNumInput = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    step = '1'
  ) => (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-600">
        {label}
      </label>
      <input
        type="number"
        step={step}
        min="0"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value);
          onChange(Number.isFinite(parsed) ? Math.max(parsed, 0) : 0);
        }}
        className="min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-right font-mono text-sm font-semibold tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
      />
    </div>
  );

  const renderAdvancedFields = (
    draft: Omit<ServiceEntry, 'id'>,
    onChangeDraft: (patch: Partial<Omit<ServiceEntry, 'id'>>) => void
  ) => {
    const cType = draft.calculatorType;
    const isBaldrame =
      cType === 'baldrame_direto' || cType === 'baldrame_caixaria';
    const isPillar = cType === 'pilar_embutido' || cType === 'pilar_isolado';
    const isViga = cType === 'vigas';
    const isConcrete =
      isBaldrame ||
      isPillar ||
      isViga ||
      cType === 'piso_concreto' ||
      cType === 'laje';
    const usesCal =
      cType === 'alvenaria_furado' ||
      cType === 'alvenaria_macico' ||
      cType === 'emboco';

    return (
      <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600">
              Nome do Serviço no Orçamento
            </label>
            <input
              type="text"
              value={draft.descricao}
              onChange={(e) => onChangeDraft({ descricao: e.target.value })}
              className="min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600">
              Tabela de Mão de Obra
            </label>
            <select
              value={draft.laborServiceId}
              onChange={(e) =>
                onChangeDraft({ laborServiceId: e.target.value })
              }
              className="min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
            >
              {project.laborServices.map((ls) => (
                <option key={ls.id} value={ls.id}>
                  {ls.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {quoteMode === 'full' && cType !== 'ceramica' && (
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-600">
                Traço da Mistura
              </span>
              <div className="flex flex-wrap gap-1">
                {(isConcrete
                  ? TRACOS_CONCRETO.slice(0, 3)
                  : TRACOS_ARGAMASSA.slice(0, 3)
                ).map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      onChangeDraft({
                        propCimento: t.cimento,
                        propCal: 'cal' in t ? t.cal : 0,
                        propAreia: t.areia,
                        propBrita: 'brita' in t ? t.brita : 0,
                      })
                    }
                    className="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-[11px] text-blue-700 hover:bg-blue-50"
                  >
                    {t.cimento}:{'cal' in t && t.cal > 0 ? `${t.cal}:` : ''}
                    {t.areia}
                    {'brita' in t && t.brita > 0 ? `:${t.brita}` : ''}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {compactNumInput(
                'Cimento',
                draft.propCimento,
                (v) => onChangeDraft({ propCimento: v }),
                '0.5'
              )}
              {usesCal &&
                compactNumInput(
                  'Cal',
                  draft.propCal,
                  (v) => onChangeDraft({ propCal: v }),
                  '0.5'
                )}
              {compactNumInput(
                'Areia',
                draft.propAreia,
                (v) => onChangeDraft({ propAreia: v }),
                '0.5'
              )}
              {isConcrete &&
                compactNumInput(
                  'Brita',
                  draft.propBrita,
                  (v) => onChangeDraft({ propBrita: v }),
                  '0.5'
                )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {(cType === 'alvenaria_furado' || cType === 'alvenaria_macico') && (
            <>
              {compactNumInput(
                'Larg. Tijolo (cm)',
                draft.larguraCm,
                (v) => onChangeDraft({ larguraCm: v }),
                '0.5'
              )}
              {compactNumInput(
                'Alt. Tijolo (cm)',
                draft.alturaCm,
                (v) => onChangeDraft({ alturaCm: v }),
                '0.5'
              )}
              {compactNumInput(
                'Junta (cm)',
                draft.juntaCm,
                (v) => onChangeDraft({ juntaCm: v }),
                '0.1'
              )}
            </>
          )}

          {(cType === 'emboco' ||
            cType === 'contrapiso' ||
            cType === 'piso_concreto' ||
            cType === 'laje') &&
            compactNumInput(
              'Espessura (cm)',
              draft.espessuraCm,
              (v) => onChangeDraft({ espessuraCm: v }),
              '0.5'
            )}

          {cType === 'chapisco' &&
            compactNumInput(
              'Espessura (mm)',
              draft.espessuraMm,
              (v) => onChangeDraft({ espessuraMm: v }),
              '0.5'
            )}

          {cType === 'ceramica' && (
            <>
              {compactNumInput(
                'Peça Compr. (cm)',
                draft.comprimentoCm,
                (v) => onChangeDraft({ comprimentoCm: v })
              )}
              {compactNumInput(
                'Peça Larg. (cm)',
                draft.larguraCm,
                (v) => onChangeDraft({ larguraCm: v })
              )}
              {compactNumInput(
                'Junta (mm)',
                draft.juntaMm,
                (v) => onChangeDraft({ juntaMm: v }),
                '0.5'
              )}
            </>
          )}

          {(isViga || isBaldrame) && (
            <>
              {compactNumInput(
                'Largura (cm)',
                draft.larguraCm,
                (v) => onChangeDraft({ larguraCm: v })
              )}
              {compactNumInput(
                'Altura (cm)',
                draft.alturaCm,
                (v) => onChangeDraft({ alturaCm: v })
              )}
            </>
          )}

          {isPillar && (
            <>
              {compactNumInput(
                'Larg. Pilar (cm)',
                draft.larguraCm,
                (v) => onChangeDraft({ larguraCm: v })
              )}
              {compactNumInput(
                'Compr. Pilar (cm)',
                draft.comprimentoCm,
                (v) => onChangeDraft({ comprimentoCm: v })
              )}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">
                  Tipo de Pilar
                </label>
                <select
                  value={draft.calculatorType}
                  onChange={(e) =>
                    onChangeDraft({
                      calculatorType: e.target.value as CalculatorType,
                    })
                  }
                  className="min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900"
                >
                  <option value="pilar_embutido">Embutido (+20%)</option>
                  <option value="pilar_isolado">Isolado</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Total Atual do Orçamento + Modo */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {quoteMode === 'labor_only'
                ? 'Total do Orçamento (Só Mão de Obra)'
                : 'Total do Orçamento (Mão de Obra + Materiais)'}
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-slate-900">
              {formatBRL(displayedTotal)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {project.entries.length}{' '}
              {project.entries.length === 1 ? 'serviço' : 'serviços'} somados
              · Prazo estimado:{' '}
              <span className="font-mono font-medium tabular-nums text-slate-700">
                ~{Math.ceil(summary.totalMasonDays)} dias
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => onChangeQuoteMode('labor_only')}
              className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
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
              className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                quoteMode === 'full'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mão de Obra + Materiais
            </button>
          </div>
        </div>

        {/* Seleção de Quantidade de Profissionais na Equipe */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Pedreiros:</span>
              <div className="flex items-center overflow-hidden rounded-md border border-slate-300 bg-white">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateLaborConfig({
                      qtdPedreiros: Math.max(1, qtdPedreiros - 1),
                    })
                  }
                  disabled={qtdPedreiros <= 1}
                  className="min-h-[34px] min-w-[32px] px-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-35"
                  aria-label="Diminuir pedreiros"
                >
                  −
                </button>
                <span className="min-w-[28px] text-center font-mono text-xs font-bold tabular-nums text-slate-900">
                  {qtdPedreiros}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateLaborConfig({ qtdPedreiros: qtdPedreiros + 1 })
                  }
                  className="min-h-[34px] min-w-[32px] px-2 font-semibold text-slate-700 hover:bg-slate-100"
                  aria-label="Aumentar pedreiros"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Serventes:</span>
              <div className="flex items-center overflow-hidden rounded-md border border-slate-300 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(0, qtdServentes - 1);
                    onUpdateLaborConfig({
                      qtdServentes: next,
                      incluirServente: next > 0,
                    });
                  }}
                  disabled={qtdServentes <= 0}
                  className="min-h-[34px] min-w-[32px] px-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-35"
                  aria-label="Diminuir serventes"
                >
                  −
                </button>
                <span className="min-w-[28px] text-center font-mono text-xs font-bold tabular-nums text-slate-900">
                  {qtdServentes}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateLaborConfig({
                      qtdServentes: qtdServentes + 1,
                      incluirServente: true,
                    })
                  }
                  className="min-h-[34px] min-w-[32px] px-2 font-semibold text-slate-700 hover:bg-slate-100"
                  aria-label="Aumentar serventes"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="text-slate-600">
            Diária total da equipe:{' '}
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {formatBRL(minDailyLabor)}/dia
            </span>
          </div>
        </div>

        {summary.minDailyApplied && (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
            Mínimo de 1 diária da equipe (
            <span className="font-mono font-semibold tabular-nums">
              {formatBRL(summary.minDailyLabor)}
            </span>
            ) aplicado ao orçamento (pelo m² daria{' '}
            <span className="font-mono tabular-nums">
              {formatBRL(summary.totalAutoLaborRaw)}
            </span>
            ) para evitar prejuízo com pedreiro e servente.
          </div>
        )}

        {quoteMode === 'full' && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-700">
                Lucro nos Materiais:
              </span>
              {[10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onUpdateMaterialMargin(pct)}
                  className={`min-h-[34px] rounded-md border px-2.5 py-1 font-mono text-xs font-semibold transition-colors ${
                    summary.materialMarginPercent === pct
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={summary.materialMarginPercent}
                  onChange={(e) =>
                    onUpdateMaterialMargin(
                      Math.max(0, parseFloat(e.target.value) || 0)
                    )
                  }
                  className="min-h-[34px] w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-right font-mono text-xs font-semibold tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
                />
                <span className="text-slate-500">%</span>
              </div>
            </div>

            <div className="text-slate-600">
              Custo loja:{' '}
              <span className="font-mono font-medium tabular-nums text-slate-800">
                {formatBRL(summary.totalAutoMaterial)}
              </span>{' '}
              · Seu lucro nos materiais:{' '}
              <span className="font-mono font-semibold tabular-nums text-green-700">
                +{formatBRL(summary.totalAutoMaterialMargin)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Passo 1: Seleção Múltipla de Serviços + Soma em Tempo Real */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              1. Marque os serviços que vai fazer e digite as medidas
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Você pode marcar vários serviços juntos (baldrame, parede,
              chapisco, reboco, contrapiso...) para somar tudo de uma vez.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyQuickPack(INITIAL_SELECTED_KEYS)}
              className="min-h-[36px] whitespace-nowrap shrink-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Obra Básica (5)
            </button>
            <button
              type="button"
              onClick={() =>
                applyQuickPack(['chapisco', 'emboco', 'contrapiso', 'ceramica'])
              }
              className="min-h-[36px] whitespace-nowrap shrink-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Acabamento (4)
            </button>
            <button
              type="button"
              onClick={() =>
                applyQuickPack(
                  selectedKeys.length === SIMPLE_OPTIONS.length
                    ? []
                    : SIMPLE_OPTIONS.map((o) => o.key)
                )
              }
              className="min-h-[36px] whitespace-nowrap shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {selectedKeys.length === SIMPLE_OPTIONS.length
                ? 'Desmarcar Todos'
                : 'Marcar Todos'}
            </button>
            {selectedKeys.length > 0 &&
              selectedKeys.length < SIMPLE_OPTIONS.length && (
                <button
                  type="button"
                  onClick={() => applyQuickPack([])}
                  className="min-h-[36px] whitespace-nowrap shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  Limpar
                </button>
              )}
          </div>
        </div>

        {/* Lista de Serviços Marcáveis */}
        <div className="divide-y divide-slate-100">
          {SIMPLE_OPTIONS.map((opt) => {
            const checked = selectedKeys.includes(opt.key);
            const draft = drafts[opt.key];
            const comp = computedOptions[opt.key];
            const isExpanded = expandedOptionKey === opt.key;
            const isBaldrame = opt.key === 'baldrame';
            const isPillar = opt.key === 'pilares';
            const isLinear = opt.key === 'baldrame' || opt.key === 'vigas';

            const activeService =
              project.laborServices.find(
                (s) => s.id === draft.laborServiceId
              ) ?? project.laborServices[0];
            const unitRate = activeService
              ? calcLaborUnitCost(activeService, project.laborConfig)
                  .custoComEncargosUnit
              : 0;

            const rowValue =
              quoteMode === 'labor_only'
                ? comp.laborCost
                : comp.totalClientCost;

            return (
              <div
                key={opt.key}
                className={`px-5 py-3.5 transition-colors sm:px-6 ${
                  checked ? 'bg-blue-50/35' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Checkbox + Título */}
                  <button
                    type="button"
                    onClick={() => toggleSelectKey(opt.key)}
                    className="flex min-h-[40px] min-w-[190px] flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        checked
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">
                        {opt.titulo}
                      </span>
                      <span className="ml-2 font-mono text-xs text-slate-500 tabular-nums">
                        {formatBRL(unitRate)}/{comp.unidadeBase}
                      </span>
                    </div>
                  </button>

                  {/* Campos de Medida e Subtotal quando marcado */}
                  {checked ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {isBaldrame && (
                        <div className="flex items-center gap-1 rounded-md bg-slate-100 p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateDraftField(opt.key, {
                                calculatorType: 'baldrame_direto',
                                laborServiceId: 'baldrame_direto',
                                descricao: 'Baldrame direto no chão (15x30cm)',
                              })
                            }
                            className={`min-h-[34px] whitespace-nowrap rounded px-2.5 py-1 text-[11px] font-semibold ${
                              draft.calculatorType === 'baldrame_direto'
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Direto no chão
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateDraftField(opt.key, {
                                calculatorType: 'baldrame_caixaria',
                                laborServiceId: 'baldrame_caixaria',
                                descricao: 'Baldrame com caixaria (15x30cm)',
                              })
                            }
                            className={`min-h-[34px] whitespace-nowrap rounded px-2.5 py-1 text-[11px] font-semibold ${
                              draft.calculatorType === 'baldrame_caixaria'
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Com caixaria
                          </button>
                        </div>
                      )}

                      {isPillar ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={draft.quantidadeUnid}
                              onChange={(e) =>
                                updateDraftField(opt.key, {
                                  quantidadeUnid: Math.max(
                                    0,
                                    parseFloat(e.target.value) || 0
                                  ),
                                })
                              }
                              aria-label="Quantidade de pilares"
                              className="min-h-[38px] w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-right font-mono text-xs font-semibold tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
                            />
                            <span className="text-xs text-slate-500">un</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={draft.alturaM}
                              onChange={(e) =>
                                updateDraftField(opt.key, {
                                  alturaM: Math.max(
                                    0,
                                    parseFloat(e.target.value) || 0
                                  ),
                                })
                              }
                              aria-label="Altura de cada pilar"
                              className="min-h-[38px] w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-right font-mono text-xs font-semibold tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
                            />
                            <span className="text-xs text-slate-500">m alt</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={isLinear ? draft.comprimentoM : draft.areaM2}
                            onChange={(e) => {
                              const val = Math.max(
                                0,
                                parseFloat(e.target.value) || 0
                              );
                              if (isLinear) {
                                updateDraftField(opt.key, {
                                  comprimentoM: val,
                                });
                              } else {
                                updateDraftField(opt.key, { areaM2: val });
                              }
                            }}
                            aria-label={`Tamanho de ${opt.titulo}`}
                            className="min-h-[38px] w-24 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-right font-mono text-sm font-semibold tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                          />
                          <span className="w-6 text-xs font-medium text-slate-500">
                            {isLinear ? 'm' : 'm²'}
                          </span>
                        </div>
                      )}

                      <div className="min-w-[115px] text-right">
                        <div className="font-mono text-sm font-bold tabular-nums text-blue-700">
                          {formatBRL(rowValue)}
                        </div>
                        <div className="font-mono text-[11px] tabular-nums text-slate-500">
                          ~{formatNum(comp.masonDays, 1)} dias
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOptionKey(isExpanded ? null : opt.key)
                        }
                        className="inline-flex min-h-[36px] items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Ajustar
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Clique para incluir
                    </span>
                  )}
                </div>

                {checked &&
                  isExpanded &&
                  renderAdvancedFields(draft, (patch) =>
                    updateDraftField(opt.key, patch)
                  )}
              </div>
            );
          })}
        </div>

        {/* Rodapé com a SOMA TOTAL dos Serviços Marcados */}
        <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-600">
                Soma dos {selectionSummary.count}{' '}
                {selectionSummary.count === 1
                  ? 'serviço selecionado'
                  : 'serviços selecionados'}
                {selectionSummary.count > 0 && (
                  <>
                    {' '}
                    · Prazo estimado:{' '}
                    <span className="font-mono font-semibold tabular-nums text-slate-800">
                      ~{formatNum(selectionSummary.daysFinal, 1)} dias
                    </span>
                  </>
                )}
              </p>

              <div className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                <span className="font-mono text-2xl font-bold tabular-nums text-blue-700">
                  {formatBRL(selectionSummary.totalFinal)}
                </span>

                {quoteMode === 'full' && selectionSummary.count > 0 && (
                  <span className="text-xs text-slate-600">
                    Mão de Obra{' '}
                    <span className="font-mono font-semibold tabular-nums text-slate-900">
                      {formatBRL(selectionSummary.laborFinal)}
                    </span>{' '}
                    + Materiais c/ {formatNum(summary.materialMarginPercent, 0)}
                    % lucro{' '}
                    <span className="font-mono font-semibold tabular-nums text-slate-900">
                      {formatBRL(selectionSummary.materialClient)}
                    </span>
                  </span>
                )}
              </div>

              {selectionSummary.minApplied && (
                <p className="mt-2 text-xs text-amber-800">
                  Aplicado mínimo de 1 diária da equipe (
                  <span className="font-mono font-semibold tabular-nums">
                    {formatBRL(minDailyLabor)}
                  </span>
                  ) porque a soma proporcional ({formatBRL(selectionSummary.laborRaw)}
                  ) ficaria abaixo de 1 dia de trabalho.
                </p>
              )}

              {quoteMode === 'full' && selectionSummary.count > 0 && (
                <p className="mt-2 text-xs text-slate-600">
                  Materiais estimados:{' '}
                  {[
                    selectionSummary.mats.cimentoSacos50kg > 0
                      ? `${Math.ceil(selectionSummary.mats.cimentoSacos50kg)} sc cimento`
                      : null,
                    selectionSummary.mats.calSacos20kg > 0
                      ? `${Math.ceil(selectionSummary.mats.calSacos20kg)} sc cal`
                      : null,
                    selectionSummary.mats.areiaM3 > 0
                      ? `${formatNum(selectionSummary.mats.areiaM3, 2)} m³ areia`
                      : null,
                    selectionSummary.mats.britaM3 > 0
                      ? `${formatNum(selectionSummary.mats.britaM3, 2)} m³ brita`
                      : null,
                    selectionSummary.mats.tijolosFuradoUnid > 0
                      ? `${Math.ceil(selectionSummary.mats.tijolosFuradoUnid)} tijolos`
                      : null,
                    selectionSummary.mats.tijolosMacicoUnid > 0
                      ? `${Math.ceil(selectionSummary.mats.tijolosMacicoUnid)} tijolos maciços`
                      : null,
                    selectionSummary.mats.argamassaSacos20kg > 0
                      ? `${Math.ceil(selectionSummary.mats.argamassaSacos20kg)} sc argamassa`
                      : null,
                    selectionSummary.mats.rejunteKg > 0
                      ? `${Math.ceil(selectionSummary.mats.rejunteKg)} kg rejunte`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Nenhum'}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={selectionSummary.count === 0}
                onClick={handleAddSelectedToBudget}
                className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Somar {selectionSummary.count > 0 ? `${selectionSummary.count} ` : ''}
                {selectionSummary.count === 1 ? 'Serviço' : 'Serviços'} no
                Orçamento
              </button>

              {project.entries.length > 0 && selectionSummary.count > 0 && (
                <button
                  type="button"
                  onClick={handleReplaceWithSelected}
                  className="inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Usar Só Estes no Orçamento
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Passo 2: Lista de Serviços Somados no Orçamento */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900">
            2. Serviços no Orçamento ({project.entries.length})
          </h2>

          {project.entries.length > 0 && (
            <div>
              {confirmClearAll ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-red-700">
                    Zerar lista?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearEntries();
                      setConfirmClearAll(false);
                      setEditingEntryId(null);
                    }}
                    className="min-h-[34px] rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="min-h-[34px] rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="min-h-[34px] rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700"
                >
                  Limpar Lista
                </button>
              )}
            </div>
          )}
        </div>

        {project.entries.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              Nenhum serviço adicionado ainda.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Marque os serviços que deseja fazer acima e clique em &ldquo;Somar
              Serviços no Orçamento&rdquo;.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {project.entries.map((entry) => {
              const comp = summary.entriesComputed[entry.id];
              if (!comp) return null;
              const isPillarRow =
                entry.calculatorType === 'pilar_embutido' ||
                entry.calculatorType === 'pilar_isolado';
              const isLinearRow =
                entry.calculatorType === 'vigas' ||
                entry.calculatorType === 'baldrame_direto' ||
                entry.calculatorType === 'baldrame_caixaria';
              const isEditingThis = editingEntryId === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`px-5 py-3.5 transition-colors sm:px-6 ${
                    isEditingThis ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.descricao}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        <span className="font-mono tabular-nums">
                          ~{Math.ceil(comp.masonDays)} dias
                        </span>
                        {quoteMode === 'full' && (
                          <>
                            {' '}
                            · MO{' '}
                            <span className="font-mono tabular-nums text-slate-700">
                              {formatBRL(comp.laborCost)}
                            </span>{' '}
                            · Mat.{' '}
                            <span className="font-mono tabular-nums text-slate-700">
                              {formatBRL(comp.materialClientCost)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={
                            isPillarRow
                              ? entry.quantidadeUnid
                              : isLinearRow
                              ? entry.comprimentoM
                              : entry.areaM2
                          }
                          onChange={(e) => {
                            const val = Math.max(
                              0,
                              parseFloat(e.target.value) || 0
                            );
                            if (isPillarRow) {
                              onUpdateEntry(entry.id, { quantidadeUnid: val });
                            } else if (isLinearRow) {
                              onUpdateEntry(entry.id, { comprimentoM: val });
                            } else {
                              onUpdateEntry(entry.id, { areaM2: val });
                            }
                          }}
                          className="min-h-[38px] w-20 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-right font-mono text-xs font-semibold tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none"
                        />
                        <span className="text-xs text-slate-500">
                          {isPillarRow ? 'un' : isLinearRow ? 'm' : 'm²'}
                        </span>
                      </div>

                      <div className="min-w-[100px] text-right font-mono text-sm font-bold tabular-nums text-blue-700">
                        {formatBRL(
                          quoteMode === 'labor_only'
                            ? comp.laborCost
                            : comp.totalClientCost
                        )}
                      </div>

                      {confirmDeleteId === entry.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (editingEntryId === entry.id) {
                                setEditingEntryId(null);
                              }
                              onDeleteEntry(entry.id);
                              setConfirmDeleteId(null);
                            }}
                            className="min-h-[36px] rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[36px] rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteId(null);
                              setEditingEntryId(
                                isEditingThis ? null : entry.id
                              );
                            }}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {isEditingThis ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                Fechar
                              </>
                            ) : (
                              <>
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(entry.id)}
                            className="inline-flex min-h-[36px] items-center rounded-md border border-slate-200 bg-white p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Excluir serviço"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditingThis && (
                    <div>
                      {renderAdvancedFields(entry, (patch) =>
                        onUpdateEntry(entry.id, patch)
                      )}
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingEntryId(null)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Concluir Edição
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
