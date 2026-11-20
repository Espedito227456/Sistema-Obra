import React, { useState } from 'react';
import {
  ConstructionProject,
  PciItemConfig,
  ProjectMetadata,
  ServicoAdicional,
} from '../types/construction';
import { ProjectSummary } from '../utils/calculations';
import { PciBudgetView } from './PciBudgetView';
import { ScheduleAndProjectView } from './ScheduleAndProjectView';

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
  onChangePrazo: (meses: number) => void;
  onGenerateAutoSchedule: () => void;
  onUpdateScheduleStage: (etapa: string, percentEtapa: number) => void;
  onUpdateMetadata: (patch: Partial<ProjectMetadata>) => void;
}

export const PciAndScheduleView: React.FC<Props> = (props) => {
  const [subTab, setSubTab] = useState<'pci' | 'schedule'>('pci');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Modo Financiamento CAIXA (PCI e Cronograma)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Use esta área quando precisar entregar a planilha oficial AE 130
            026 com faixas de incidência e cronograma mensal.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setSubTab('pci')}
            className={`min-h-[38px] whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              subTab === 'pci'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Planilha PCI (20 itens)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('schedule')}
            className={`min-h-[38px] whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              subTab === 'schedule'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cronograma & Ficha CAIXA
          </button>
        </div>
      </div>

      {subTab === 'pci' ? (
        <PciBudgetView
          project={props.project}
          summary={props.summary}
          onUpdatePciManual={props.onUpdatePciManual}
          onApplyParametricEstimate={props.onApplyParametricEstimate}
          onClearManualPci={props.onClearManualPci}
          onAddAdicional={props.onAddAdicional}
          onUpdateAdicional={props.onUpdateAdicional}
          onDeleteAdicional={props.onDeleteAdicional}
          onUpdateJustificativa={props.onUpdateJustificativa}
        />
      ) : (
        <ScheduleAndProjectView
          project={props.project}
          summary={props.summary}
          onChangePrazo={props.onChangePrazo}
          onGenerateAutoSchedule={props.onGenerateAutoSchedule}
          onUpdateScheduleStage={props.onUpdateScheduleStage}
          onUpdateMetadata={props.onUpdateMetadata}
        />
      )}
    </div>
  );
};
