import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {
  CalculatorType,
  ConstructionProject,
  ServiceEntry,
} from '../types/construction';
import { TRACOS_ARGAMASSA, TRACOS_CONCRETO } from '../data/presets';
import {
  calcEntryComputed,
  formatBRL,
  formatNum,
  ProjectSummary,
} from '../utils/calculations';

interface Props {
  project: ConstructionProject;
  summary: ProjectSummary;
  quoteMode: 'labor_only' | 'full';
  onChangeQuoteMode: (mode: 'labor_only' | 'full') => void;
  onAddEntry: (entry: ServiceEntry) => void;
  onUpdateEntry: (id: string, patch: Partial<ServiceEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onClearEntries: () => void;
  onUpdateMaterialMargin: (pct: number) => void;
}

interface SimpleServiceOption {
  type: CalculatorType;
  titulo: string;
  template: Omit<ServiceEntry, 'id'>;
}

const SIMPLE_OPTIONS: SimpleServiceOption[] = [
  {
    type: 'baldrame_direto',
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
    type: 'alvenaria_furado',
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
    type: 'chapisco',
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
    type: 'emboco',
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
    type: 'contrapiso',
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
    type: 'ceramica',
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
    type: 'piso_concreto',
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
    type: 'pilar_embutido',
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
    type: 'vigas',
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
    type: 'laje',
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
    type: 'alvenaria_macico',
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

export const EasyQuoteView: React.FC<Props> = ({
  project,
  summary,
  quoteMode,
  onChangeQuoteMode,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onClearEntries,
  onUpdateMaterialMargin,
}) => {
  const [selectedType, setSelectedType] =
    useState<CalculatorType>('alvenaria_furado');
  const [draft, setDraft] = useState<Omit<ServiceEntry, 'id'>>(
    SIMPLE_OPTIONS[0].template
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const handleSelectOption = (opt: SimpleServiceOption) => {
    setEditingEntryId(null);
    setSelectedType(opt.type);
    setDraft({ ...opt.template });
  };

  const handleStartEdit = (entry: ServiceEntry) => {
    const { id, ...rest } = entry;
    setEditingEntryId(id);
    setConfirmDeleteId(null);
    setSelectedType(entry.calculatorType);
    setDraft({ ...rest });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDraft = () => {
    if (editingEntryId) {
      onUpdateEntry(editingEntryId, { ...draft });
      setEditingEntryId(null);
      return;
    }
    onAddEntry({ ...draft, id: `srv-${Date.now()}` });
  };

  const draftPreview = useMemo(() => {
    const tempEntry: ServiceEntry = { id: 'preview', ...draft };
    return calcEntryComputed(
      tempEntry,
      project.laborConfig,
      project.laborServices,
      project.materialPrices
    );
  }, [
    draft,
    project.laborConfig,
    project.laborServices,
    project.materialPrices,
  ]);

  const isBaldrame =
    selectedType === 'baldrame_direto' || selectedType === 'baldrame_caixaria';
  const isPillar =
    selectedType === 'pilar_embutido' || selectedType === 'pilar_isolado';
  const isViga = selectedType === 'vigas';
  const isConcrete =
    isBaldrame ||
    isPillar ||
    isViga ||
    selectedType === 'piso_concreto' ||
    selectedType === 'laje';
  const usesCal =
    selectedType === 'alvenaria_furado' ||
    selectedType === 'alvenaria_macico' ||
    selectedType === 'emboco';

  const displayedTotal =
    quoteMode === 'labor_only'
      ? summary.totalAutoLabor
      : summary.totalAutoLabor + summary.totalAutoMaterialWithMargin;

  const numInput = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    step = '1'
  ) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-700">
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
        className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-right font-mono text-base font-semibold tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Resumo Direto + Seletor Só Mão de Obra vs Completo */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {quoteMode === 'labor_only'
                ? 'Total Só Mão de Obra'
                : 'Total Mão de Obra + Materiais'}
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-slate-900">
              {formatBRL(displayedTotal)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {project.entries.length}{' '}
              {project.entries.length === 1 ? 'serviço' : 'serviços'} · Prazo
              estimado:{' '}
              <span className="font-mono font-medium tabular-nums text-slate-700">
                ~{Math.ceil(summary.totalMasonDays)} dias
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => onChangeQuoteMode('labor_only')}
              className={`min-h-[40px] whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
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
              className={`min-h-[40px] whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                quoteMode === 'full'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mão de Obra + Materiais
            </button>
          </div>
        </div>

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

      {/* Passo 1: Escolher o Serviço e Digitar a Medida */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3.5 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900">
            {editingEntryId
              ? 'Editando Serviço'
              : '1. Escolha o serviço e digite o tamanho'}
          </h2>
        </div>

        {/* Grade de botões diretos */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:px-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {SIMPLE_OPTIONS.map((opt) => {
              const active =
                selectedType === opt.type ||
                (opt.type === 'baldrame_direto' && isBaldrame) ||
                (opt.type === 'pilar_embutido' &&
                  selectedType === 'pilar_isolado');
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`min-h-[44px] rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-colors ${
                    active
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {opt.titulo}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Apenas o essencial por padrão */}
          <div className="space-y-4 p-5 sm:p-6 lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-7">
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Nome do Serviço / Local
                </label>
                <input
                  type="text"
                  value={draft.descricao}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, descricao: e.target.value }))
                  }
                  placeholder="Ex.: Paredes da sala"
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
                />
              </div>

              <div className="sm:col-span-5">
                {isPillar ? (
                  numInput(
                    'Qtd. de Pilares (un)',
                    draft.quantidadeUnid,
                    (v) => setDraft((d) => ({ ...d, quantidadeUnid: v }))
                  )
                ) : isViga || isBaldrame ? (
                  numInput(
                    'Comprimento Total (m)',
                    draft.comprimentoM,
                    (v) => setDraft((d) => ({ ...d, comprimentoM: v }))
                  )
                ) : (
                  numInput(
                    'Área / Tamanho (m²)',
                    draft.areaM2,
                    (v) => setDraft((d) => ({ ...d, areaM2: v }))
                  )
                )}
              </div>
            </div>

            {isBaldrame && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Como será feito o baldrame?
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType('baldrame_direto');
                      setDraft((d) => ({
                        ...d,
                        calculatorType: 'baldrame_direto',
                        laborServiceId: 'baldrame_direto',
                        descricao: d.descricao.startsWith('Baldrame')
                          ? 'Baldrame direto no chão (15x30cm)'
                          : d.descricao,
                      }));
                    }}
                    className={`min-h-[44px] rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      selectedType === 'baldrame_direto'
                        ? 'border-blue-700 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold">
                      Direto no chão (sem caixaria)
                    </div>
                    <div className="mt-0.5 text-[11px] opacity-80">
                      Cavado direto na vala · Ref. R$ 40–80/m
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType('baldrame_caixaria');
                      setDraft((d) => ({
                        ...d,
                        calculatorType: 'baldrame_caixaria',
                        laborServiceId: 'baldrame_caixaria',
                        descricao: d.descricao.startsWith('Baldrame')
                          ? 'Baldrame com caixaria (15x30cm)'
                          : d.descricao,
                      }));
                    }}
                    className={`min-h-[44px] rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      selectedType === 'baldrame_caixaria'
                        ? 'border-blue-700 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold">
                      Com caixaria (fôrma de madeira)
                    </div>
                    <div className="mt-0.5 text-[11px] opacity-80">
                      Com tábuas laterais e desforma · Ref. R$ 80–150/m
                    </div>
                  </button>
                </div>
              </div>
            )}

            {isPillar && (
              <div className="sm:w-1/2">
                {numInput(
                  'Altura de cada Pilar (m)',
                  draft.alturaM,
                  (v) => setDraft((d) => ({ ...d, alturaM: v })),
                  '0.1'
                )}
              </div>
            )}

            {/* Ajustes opcionais recolhidos por padrão */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-700"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {showAdvanced
                  ? 'Ocultar opções avançadas'
                  : 'Mudar tipo, traço ou espessura (opcional)'}
                {showAdvanced ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">
                      Tabela de Preço da Mão de Obra
                    </label>
                    <select
                      value={draft.laborServiceId}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          laborServiceId: e.target.value,
                        }))
                      }
                      className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                    >
                      {project.laborServices.map((ls) => (
                        <option key={ls.id} value={ls.id}>
                          {ls.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {quoteMode === 'full' && selectedType !== 'ceramica' && (
                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700">
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
                                setDraft((d) => ({
                                  ...d,
                                  propCimento: t.cimento,
                                  propCal: 'cal' in t ? t.cal : 0,
                                  propAreia: t.areia,
                                  propBrita: 'brita' in t ? t.brita : 0,
                                }))
                              }
                              className="rounded border border-slate-300 bg-white px-2 py-1 font-mono text-[11px] text-blue-700 hover:bg-blue-50"
                            >
                              {t.cimento}:
                              {'cal' in t && t.cal > 0 ? `${t.cal}:` : ''}
                              {t.areia}
                              {'brita' in t && t.brita > 0 ? `:${t.brita}` : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {numInput(
                          'Cimento',
                          draft.propCimento,
                          (v) => setDraft((d) => ({ ...d, propCimento: v })),
                          '0.5'
                        )}
                        {usesCal &&
                          numInput(
                            'Cal',
                            draft.propCal,
                            (v) => setDraft((d) => ({ ...d, propCal: v })),
                            '0.5'
                          )}
                        {numInput(
                          'Areia',
                          draft.propAreia,
                          (v) => setDraft((d) => ({ ...d, propAreia: v })),
                          '0.5'
                        )}
                        {isConcrete &&
                          numInput(
                            'Brita',
                            draft.propBrita,
                            (v) => setDraft((d) => ({ ...d, propBrita: v })),
                            '0.5'
                          )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(selectedType === 'alvenaria_furado' ||
                      selectedType === 'alvenaria_macico') && (
                      <>
                        {numInput(
                          'Larg. Tijolo (cm)',
                          draft.larguraCm,
                          (v) => setDraft((d) => ({ ...d, larguraCm: v })),
                          '0.5'
                        )}
                        {numInput(
                          'Alt. Tijolo (cm)',
                          draft.alturaCm,
                          (v) => setDraft((d) => ({ ...d, alturaCm: v })),
                          '0.5'
                        )}
                        {numInput(
                          'Junta (cm)',
                          draft.juntaCm,
                          (v) => setDraft((d) => ({ ...d, juntaCm: v })),
                          '0.1'
                        )}
                      </>
                    )}

                    {(selectedType === 'emboco' ||
                      selectedType === 'contrapiso' ||
                      selectedType === 'piso_concreto' ||
                      selectedType === 'laje') &&
                      numInput(
                        'Espessura (cm)',
                        draft.espessuraCm,
                        (v) => setDraft((d) => ({ ...d, espessuraCm: v })),
                        '0.5'
                      )}

                    {selectedType === 'chapisco' &&
                      numInput(
                        'Espessura (mm)',
                        draft.espessuraMm,
                        (v) => setDraft((d) => ({ ...d, espessuraMm: v })),
                        '0.5'
                      )}

                    {selectedType === 'ceramica' && (
                      <>
                        {numInput(
                          'Peça Compr. (cm)',
                          draft.comprimentoCm,
                          (v) => setDraft((d) => ({ ...d, comprimentoCm: v }))
                        )}
                        {numInput(
                          'Peça Larg. (cm)',
                          draft.larguraCm,
                          (v) => setDraft((d) => ({ ...d, larguraCm: v }))
                        )}
                        {numInput(
                          'Junta (mm)',
                          draft.juntaMm,
                          (v) => setDraft((d) => ({ ...d, juntaMm: v })),
                          '0.5'
                        )}
                      </>
                    )}

                    {(isViga || isBaldrame) && (
                      <>
                        {numInput(
                          'Largura (cm)',
                          draft.larguraCm,
                          (v) => setDraft((d) => ({ ...d, larguraCm: v }))
                        )}
                        {numInput(
                          'Altura (cm)',
                          draft.alturaCm,
                          (v) => setDraft((d) => ({ ...d, alturaCm: v }))
                        )}
                      </>
                    )}

                    {isPillar && (
                      <>
                        {numInput(
                          'Larg. Pilar (cm)',
                          draft.larguraCm,
                          (v) => setDraft((d) => ({ ...d, larguraCm: v }))
                        )}
                        {numInput(
                          'Compr. Pilar (cm)',
                          draft.comprimentoCm,
                          (v) => setDraft((d) => ({ ...d, comprimentoCm: v }))
                        )}
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-slate-700">
                            Tipo de Pilar
                          </label>
                          <select
                            value={draft.calculatorType}
                            onChange={(e) => {
                              const nextType = e.target.value as CalculatorType;
                              setSelectedType(nextType);
                              setDraft((d) => ({
                                ...d,
                                calculatorType: nextType,
                              }));
                            }}
                            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900"
                          >
                            <option value="pilar_embutido">
                              Embutido (+20%)
                            </option>
                            <option value="pilar_isolado">Isolado</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resultado na Hora + Botão Principal */}
          <div className="flex flex-col justify-between bg-slate-50/70 p-5 sm:p-6 lg:col-span-5">
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    Mão de Obra
                  </span>
                  <span className="font-mono text-xl font-bold tabular-nums text-blue-700">
                    {formatBRL(draftPreview.laborCost)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatBRL(draftPreview.laborUnitCost)}/
                  {draftPreview.unidadeBase} · ~
                  <span className="font-mono font-medium text-slate-700 tabular-nums">
                    {formatNum(draftPreview.masonDays, 1)} dias
                  </span>
                </p>
              </div>

              {quoteMode === 'full' && (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Materiais (c/ {formatNum(summary.materialMarginPercent, 0)}% lucro)
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                      {formatBRL(draftPreview.materialClientCost)}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-700">
                    {draftPreview.materials.cimentoSacos50kg > 0 && (
                      <div className="flex justify-between">
                        <span>Cimento (50 kg)</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatNum(
                            Math.ceil(draftPreview.materials.cimentoSacos50kg),
                            0
                          )}{' '}
                          sacos
                        </span>
                      </div>
                    )}
                    {draftPreview.materials.calSacos20kg > 0 && (
                      <div className="flex justify-between">
                        <span>Cal (20 kg)</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatNum(
                            Math.ceil(draftPreview.materials.calSacos20kg),
                            0
                          )}{' '}
                          sacos
                        </span>
                      </div>
                    )}
                    {draftPreview.materials.areiaM3 > 0 && (
                      <div className="flex justify-between">
                        <span>Areia</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatNum(draftPreview.materials.areiaM3, 2)} m³
                        </span>
                      </div>
                    )}
                    {draftPreview.materials.britaM3 > 0 && (
                      <div className="flex justify-between">
                        <span>Brita</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatNum(draftPreview.materials.britaM3, 2)} m³
                        </span>
                      </div>
                    )}
                    {draftPreview.materials.tijolosFuradoUnid > 0 && (
                      <div className="flex justify-between">
                        <span>Tijolo furado</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatNum(
                            draftPreview.materials.tijolosFuradoUnid,
                            0
                          )}{' '}
                          un
                        </span>
                      </div>
                    )}
                    {draftPreview.materials.tijolosMacicoUnid > 0 && (
                      <div className="flex justify-between">
                        <span>Tijolo maciço</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatNum(
                            draftPreview.materials.tijolosMacicoUnid,
                            0
                          )}{' '}
                          un
                        </span>
                      </div>
                    )}
                    {draftPreview.materials.argamassaSacos20kg > 0 && (
                      <div className="flex justify-between">
                        <span>Argamassa colante</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatNum(
                            Math.ceil(
                              draftPreview.materials.argamassaSacos20kg
                            ),
                            0
                          )}{' '}
                          sacos
                        </span>
                      </div>
                    )}
                    {draftPreview.materials.rejunteKg > 0 && (
                      <div className="flex justify-between">
                        <span>Rejunte</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatNum(
                            Math.ceil(draftPreview.materials.rejunteKg),
                            0
                          )}{' '}
                          kg
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                {editingEntryId ? (
                  <>
                    <Check className="h-4 w-4" />
                    Salvar Alteração
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Colocar no Orçamento
                  </>
                )}
              </button>
              {editingEntryId && (
                <button
                  type="button"
                  onClick={() => setEditingEntryId(null)}
                  className="min-h-[46px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Passo 2: Lista Limpa de Serviços */}
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
              Escolha um serviço acima, digite o tamanho e clique em
              &ldquo;Colocar no Orçamento&rdquo;.
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

              return (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/70 sm:px-6"
                >
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
                          onClick={() => handleStartEdit(entry)}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
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
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
