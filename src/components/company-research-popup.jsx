import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const CompanyResearchPopup = ({ company, onClose, onSave }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [researchData, setResearchData] = useState(null);
  const [selectedData, setSelectedData] = useState({});

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/research/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: company.name,
          currentData: company
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch company data');
      }

      const data = await response.json();
      setResearchData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Fehler beim Laden der Daten');
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await onSave(selectedData);
      toast.success('Daten erfolgreich aktualisiert');
      onClose();
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Fehler beim Speichern der Daten');
    }
  };

  const toggleSelection = (category, field, value) => {
    setSelectedData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">KI-Recherche: {company.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
            <p className="text-gray-600">Recherchiere Unternehmensdaten...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(researchData || {}).map(([category, fields]) => (
              <section key={category} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">{category}</h3>
                <div className="space-y-2">
                  {Object.entries(fields).map(([field, value]) => (
                    <div key={field} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`${category}-${field}`}
                        checked={selectedData[category]?.[field] === value}
                        onChange={() => toggleSelection(category, field, value)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`${category}-${field}`} className="flex-1">
                        <span className="font-medium">{field}:</span>
                        <span className="ml-2">{value || 'Nicht verfügbar'}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ausgewählte Daten übernehmen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyResearchPopup; 