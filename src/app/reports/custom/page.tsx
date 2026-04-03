'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, FileOutput, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { generateCustomSelectionReport } from '@/lib/pdfService';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { PART_PRICES } from '@/lib/dataMigration';

interface ManualCost {
  id: string;
  name: string;
  price: number;
}

export default function CustomReportPage() {
  const bikes = useStore((state) => state.bikes);
  
  const [selectedBikeIds, setSelectedBikeIds] = useState<string[]>([]);
  const [manualCosts, setManualCosts] = useState<ManualCost[]>([]);
  const [newCostName, setNewCostName] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  
  const [generating, setGenerating] = useState(false);

  // Toggle selection
  const toggleBike = (id: string) => {
    setSelectedBikeIds(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedBikeIds.length === bikes.length) {
      setSelectedBikeIds([]);
    } else {
      setSelectedBikeIds(bikes.map(b => b.id));
    }
  };

  // Manual costs
  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostName.trim() || !newCostPrice.trim()) return;
    
    setManualCosts(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      name: newCostName.trim(),
      price: parseInt(newCostPrice, 10) || 0
    }]);
    
    setNewCostName('');
    setNewCostPrice('');
  };

  const removeCost = (id: string) => {
    setManualCosts(prev => prev.filter(c => c.id !== id));
  };

  // Calculations
  const selectedBikesList = useMemo(() => {
    return bikes.filter(b => selectedBikeIds.includes(b.id));
  }, [bikes, selectedBikeIds]);

  const bikesPartsCost = useMemo(() => {
    return selectedBikesList.reduce((acc, bike) => {
      let bikeCost = 0;
      bike.parts.forEach(p => {
        if (p.status === 'replace') {
          bikeCost += (PART_PRICES[p.name] || 0);
        }
      });
      return acc + bikeCost;
    }, 0);
  }, [selectedBikesList]);

  const totalManualCost = useMemo(() => {
    return manualCosts.reduce((acc, cost) => acc + cost.price, 0);
  }, [manualCosts]);

  const grandTotal = bikesPartsCost + totalManualCost;

  const handleGenerate = () => {
    setGenerating(true);
    try {
      generateCustomSelectionReport(selectedBikesList, manualCosts);
    } finally {
      setTimeout(() => setGenerating(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cc-bg)] flex flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-4 bg-[var(--cc-surface)] border-b border-[var(--cc-border)] sticky top-0 z-10 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/reports" className="p-2 -ml-2 hover:bg-[var(--cc-border-subtle)] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--cc-text-muted)]" />
          </Link>
          <h1 className="text-xl font-semibold text-[var(--cc-text)]">Rapport Personnalisé</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-6 sm:px-6 space-y-8 flex-1">
        
        {/* En-tête / Total Général */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-[var(--cc-surface)] p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--cc-text)] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-500" />
              Aperçu du Devis
            </h2>
            <p className="text-[var(--cc-text-muted)] text-sm mt-1">
              Coût des pièces : {bikesPartsCost} FCFA <br/>
              Frais manuels : {totalManualCost} FCFA
            </p>
          </div>
          <div className="text-center md:text-right">
            <div className="text-xs uppercase tracking-wider font-semibold text-indigo-500 mb-1">Total Général</div>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
              {grandTotal.toLocaleString('fr-FR')} <span className="text-xl">FCFA</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Sélection des Vélos */}
          <section className="bg-[var(--cc-surface)] rounded-2xl p-5 border border-[var(--cc-border)] shadow-[var(--cc-shadow-sm)] flex flex-col max-h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--cc-text)]">Sélection des Vélos ({selectedBikeIds.length}/{bikes.length})</h3>
              <button onClick={selectAll} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                {selectedBikeIds.length === bikes.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {bikes.length === 0 ? (
                <p className="text-sm text-[var(--cc-text-muted)] italic text-center py-8">Aucun vélo enregistré.</p>
              ) : (
                bikes.map(bike => {
                  const isSelected = selectedBikeIds.includes(bike.id);
                  const statusLabel = bike.stickerNumber ? `${bike.id} (${bike.stickerNumber})` : bike.id;
                  return (
                    <button
                      key={bike.id}
                      onClick={() => toggleBike(bike.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' 
                          : 'border-[var(--cc-borderSubtle)] hover:border-[var(--cc-border)] hover:bg-[var(--cc-bg)]'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-500 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-[var(--cc-text-muted)] shrink-0" />
                      )}
                      <div className="flex-1 text-left">
                        <div className={`font-medium text-sm ${isSelected ? 'text-[var(--cc-text)]' : 'text-[var(--cc-text-muted)]'}`}>
                          {statusLabel}
                        </div>
                        <div className="text-xs text-[var(--cc-text-faint)]">
                          {bike.parts.filter(p => p.status !== 'ok').length} pannes
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Frais Manuels */}
          <section className="bg-[var(--cc-surface)] rounded-2xl p-5 border border-[var(--cc-border)] shadow-[var(--cc-shadow-sm)] flex flex-col">
            <h3 className="font-semibold text-[var(--cc-text)] mb-4">Frais Additionnels (Manuels)</h3>
            
            <form onSubmit={handleAddCost} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Ex: Cadre, Panneau"
                value={newCostName}
                onChange={(e) => setNewCostName(e.target.value)}
                className="flex-1 bg-[var(--cc-bg)] border border-[var(--cc-border)] rounded-xl px-3 py-2 text-sm text-[var(--cc-text)] placeholder-[var(--cc-text-faint)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
              />
              <input
                type="number"
                placeholder="Prix"
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(e.target.value)}
                className="w-24 bg-[var(--cc-bg)] border border-[var(--cc-border)] rounded-xl px-3 py-2 text-sm text-[var(--cc-text)] placeholder-[var(--cc-text-faint)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
              />
              <button
                type="submit"
                disabled={!newCostName.trim() || !newCostPrice.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2">
              {manualCosts.length === 0 ? (
                <p className="text-sm text-[var(--cc-text-muted)] italic text-center py-8">Aucun frais manuel ajouté.</p>
              ) : (
                manualCosts.map(cost => (
                  <div key={cost.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--cc-bg)] border border-[var(--cc-borderSubtle)]">
                    <span className="text-sm font-medium text-[var(--cc-text)]">{cost.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-[var(--cc-text-muted)]">{cost.price} F</span>
                      <button
                        onClick={() => removeCost(cost.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

      </main>

      {/* Footer avec Bouton de Génération */}
      <div className="bg-[var(--cc-surface)] border-t border-[var(--cc-border)] p-4 sm:p-6 sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <div className="text-sm text-[var(--cc-text-muted)]">Total des vélos sélectionnés</div>
            <div className="font-semibold text-[var(--cc-text)]">{selectedBikesList.length} vélo(s)</div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || (selectedBikesList.length === 0 && manualCosts.length === 0)}
            className="flex-1 sm:flex-none w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-indigo-600/20"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Génération...</span>
              </>
            ) : (
              <>
                <FileOutput className="w-5 h-5" />
                <span>Générer le Devis PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
