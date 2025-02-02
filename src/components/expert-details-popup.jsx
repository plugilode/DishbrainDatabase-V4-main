"use client";
import React, { useEffect, useState } from 'react';
import CompanyDetailsPopup from './company-details-popup';
import Image from 'next/image';
import ResearchAIAgentPopup from './research-ai-agent-popup';
import { toast } from 'react-hot-toast';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23CBD5E0' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

// Add this new component
const TrustScore = ({ score }) => {
  const getColorClass = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTextColorClass = (score) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="absolute top-2 left-2 bg-white rounded-lg shadow-md p-3 z-50">
      <div className="flex items-center gap-2 mb-2">
        <i className={`fas fa-shield-alt ${getTextColorClass(score)}`}></i>
        <span className="font-semibold">Vertrauenswürdigkeit</span>
      </div>
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${getColorClass(score)}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      <div className="mt-1 text-sm text-gray-600 flex justify-between">
        <span>{score}%</span>
        <button 
          className="text-blue-600 hover:underline"
          onClick={() => alert('Vertrauenswürdigkeit basiert auf:\n- Verifizierte Quellen\n- Offizielle Links\n- Firmenprofil\n- Vollständigkeit der Daten\n- Aktualität der Informationen')}
        >
          <i className="fas fa-info-circle"></i>
        </button>
      </div>
    </div>
  );
};

const ExpertDetailsPopup = ({ expert, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [editedExpert, setEditedExpert] = useState(expert);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showResearchAgent, setShowResearchAgent] = useState(false);

  // Add debug logging
  useEffect(() => {
    console.log('Expert data in popup:', expert);
  }, [expert]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Helper function to render text with ellipsis if too long
  const renderText = (text, maxLength = 50) => {
    if (!text || text === '-') return '-';
    const textString = String(text); // Convert to string
    if (textString.length <= maxLength) return textString;
    return (
      <span title={textString}>
        {textString.substring(0, maxLength)}...
      </span>
    );
  };

  // Helper function to render clickable URLs
  const renderUrl = (url, label = url) => {
    if (!url || url === '-') return '-';
    return (
      <a 
        href={url.startsWith('http') ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline break-all"
      >
        {label}
      </a>
    );
  };

  const renderExpertiseWithSources = () => {
    const expertise = getExpertiseArray(expert);
    
    if (!expertise?.length) {
      return (
        <div className="text-gray-500 italic">
          Keine Expertise angegeben
          <div className="text-xs text-gray-400 mt-1">
            Quelle: Keine Daten verfügbar
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {expertise.map((item, index) => {
          const source = expert.sources?.find(source => 
            source.type === 'expertise' && source.tags?.includes(item)
          );

          return (
            <div key={index} className="flex flex-col">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm w-fit">
                {item}
              </span>
              <div className="text-xs text-gray-500 mt-1 ml-2">
                {source ? (
                  <>
                    Quelle: 
                    <a 
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      {source.url}
                    </a>
                    <span className="text-gray-400 ml-1">
                      (Verifiziert: {source.date_accessed})
                    </span>
                  </>
                ) : (
                  <>
                    Quelle: KI-basierte Extraktion aus öffentlichen Profildaten
                    <i className="fas fa-robot ml-1 text-gray-400" title="Automatisch extrahiert"></i>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleSave = async () => {
    try {
      // Preserve AI enrichment data
      const updatedExpert = {
        ...editedExpert,
        ai_enrichment: expert.ai_enrichment, // Keep the original AI enrichment data
        personalInfo: {
          ...editedExpert.personalInfo,
          imageUrl: editedExpert.personalInfo?.imageUrl // Ensure imageUrl is preserved
        }
      };

      await onUpdate(updatedExpert);
      setIsEditing(false);
      toast.success('Änderungen gespeichert');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Fehler beim Speichern der Änderungen');
    }
  };

  const handleResearchResults = async (selectedData) => {
    try {
      const updatedExpert = {
        ...expert,
        ...selectedData,
        personalInfo: {
          ...expert.personalInfo,
          ...selectedData.personalInfo,
          // Handle profile image separately with validation
          ...(selectedData.profile_image && {
            image: selectedData.profile_image.trim()
          })
        }
      };
      
      // Remove profile_image from the root level if it exists
      if ('profile_image' in updatedExpert) {
        delete updatedExpert.profile_image;
      }

      // Validate the image URL before saving
      if (updatedExpert.personalInfo?.image) {
        const imageUrl = updatedExpert.personalInfo.image;
        // Only save if it's a valid image URL
        if (!imageUrl.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i)) {
          delete updatedExpert.personalInfo.image;
        }
      }
      
      await onUpdate(updatedExpert);
      
      // Show success message
      console.log('Expert data updated with AI research results');
    } catch (error) {
      console.error('Error updating expert with research results:', error);
    }
  };

  const handleEnrichment = async () => {
    setShowResearchAgent(true);
  };

  const renderAIEnrichment = () => {
    return (
      <div className="mt-6">
        <section className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">
            <i className="fas fa-robot text-blue-500 mr-2"></i>
            KI-Anreicherung
          </h3>
          <div className="space-y-4">
            {/* Confidence Score */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Konfidenz Score:</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      expert.ai_enrichment?.confidence >= 80 ? 'bg-emerald-500' :
                      expert.ai_enrichment?.confidence >= 50 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${expert.ai_enrichment?.confidence || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {expert.ai_enrichment?.confidence || 0}%
                </span>
              </div>
            </div>

            {/* Last Enrichment */}
            <div className="text-sm text-gray-600">
              <span className="font-medium">Letzte Anreicherung:</span>
              <span className="ml-2">
                {expert.ai_enrichment?.last_updated || 'Noch nicht angereichert'}
              </span>
            </div>

            {/* Enriched Fields */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Angereicherte Felder:
              </h4>
              <div className="flex flex-wrap gap-2">
                {expert.ai_enrichment?.enriched_fields?.map((field, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                  >
                    {field}
                  </span>
                )) || (
                  <span className="text-gray-500 text-sm">
                    Keine Felder angereichert
                  </span>
                )}
              </div>
            </div>

            {/* Sources Used */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Verwendete Quellen:
              </h4>
              <div className="space-y-1">
                {expert.ai_enrichment?.sources?.map((source, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <i className="fas fa-link text-gray-400"></i>
                    <a 
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {source.name || source.url}
                    </a>
                    <span className="text-gray-500 text-xs">
                      ({source.type})
                    </span>
                  </div>
                )) || (
                  <span className="text-gray-500 text-sm">
                    Keine Quellen verwendet
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // Add this helper function to render editable fields
  const renderEditableField = (label, value, fieldName, type = "text") => {
    return (
      <>
        <span className="text-gray-500">{label}:</span>
        {isEditing ? (
          <input
            type={type}
            value={editedExpert[fieldName] || ''}
            onChange={(e) => setEditedExpert({
              ...editedExpert,
              [fieldName]: e.target.value
            })}
            className="border rounded px-2 py-1 w-full"
          />
        ) : (
          <span className="break-words">{renderText(value)}</span>
        )}
      </>
    );
  };

  // Add this helper function to get expertise array
  const getExpertiseArray = (expert) => {
    if (Array.isArray(expert.expertise)) {
      return expert.expertise;
    }
    if (expert.expertise?.primary) {
      return expert.expertise.primary;
    }
    return [];
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Trust Score */}
        {expert.trust_score && (
          <TrustScore score={expert.trust_score.score} />
        )}

        {/* Header with Edit and Close buttons */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Experte bearbeiten' : 'Experten Details'}
          </h2>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Bearbeiten
                </button>
                <button
                  onClick={handleEnrichment}
                  className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center"
                  disabled={isEnriching}
                >
                  {isEnriching ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Lädt...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic mr-2"></i>
                      KI-Anreicherung
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <i className="fas fa-save mr-2"></i>
                  Speichern
                </button>
                <button
                  onClick={() => {
                    setEditedExpert(expert);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Abbrechen
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Keep only this image section */}
        <div className="flex items-center gap-6 mb-8 mt-16">
          <div className="w-32 h-32 relative">
            <img
              src={expert.id === "exp_buyx" 
                ? expert.personalInfo?.imageUrl 
                : (expert.personalInfo?.imageUrl || expert.imageUrl || DEFAULT_AVATAR)}
              alt={expert.personalInfo?.fullName || expert.name}
              className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
              onError={(e) => {
                e.target.src = DEFAULT_AVATAR;
                e.target.onerror = null;
              }}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {expert.personalInfo?.fullName || expert.name}
            </h2>
            <p className="text-lg text-gray-600">{expert.position || 'Position nicht angegeben'}</p>
            {expert.company && (
              <button 
                onClick={() => setShowCompanyDetails(true)}
                className="flex items-center gap-2 text-gray-500 mt-1 hover:text-blue-600 transition-colors"
              >
                <i className="fas fa-building"></i>
                <span className="hover:underline">{expert.company.name}</span>
                <i className="fas fa-external-link-alt text-sm"></i>
              </button>
            )}
          </div>
        </div>

        {/* Image URL input when editing */}
        {isEditing && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profilbild URL
            </label>
            <input
              type="url"
              value={editedExpert.personalInfo?.imageUrl || editedExpert.imageUrl || ''}
              onChange={(e) => {
                if (editedExpert.id === "exp_buyx") {
                  setEditedExpert({
                    ...editedExpert,
                    personalInfo: {
                      ...editedExpert.personalInfo,
                      imageUrl: e.target.value
                    }
                  });
                } else {
                  setEditedExpert({
                    ...editedExpert,
                    imageUrl: e.target.value
                  });
                }
              }}
              className="w-full p-2 border rounded-lg"
              placeholder="https://example.com/expert-image.jpg"
            />
          </div>
        )}

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Personal Information */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                <i className="fas fa-user text-blue-500 mr-2"></i>
                Persönliche Informationen
              </h3>
              <div className="grid grid-cols-[120px,1fr] gap-2">
                {renderEditableField('Name', expert.personalInfo?.fullName || expert.name, 'name')}
                {renderEditableField('Titel', expert.personalInfo?.title || expert.title, 'title')}
                {renderEditableField('Position', expert.position, 'position')}
                {renderEditableField('Email', expert.email, 'email', 'email')}
                {renderEditableField('Telefon', expert.phone, 'phone', 'tel')}
              </div>
            </section>

            {/* Organization Information */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                <i className="fas fa-building text-blue-500 mr-2"></i>
                Organisation
              </h3>
              <div className="grid grid-cols-[120px,1fr] gap-2">
                {renderEditableField('Institution', expert.institution, 'institution')}
                {renderEditableField('Abteilung', expert.department, 'department')}
                {renderEditableField('Gründung', expert.founded, 'founded')}
                {renderEditableField('Mitarbeiter', expert.employee_count, 'employee_count')}
                {renderEditableField('Finanzierung', expert.funding, 'funding')}
              </div>
            </section>

            {/* Location Information */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                <i className="fas fa-map-marker-alt text-blue-500 mr-2"></i>
                Standort
              </h3>
              <div className="grid grid-cols-[120px,1fr] gap-2">
                {renderEditableField('Adresse', expert.address, 'address')}
                {renderEditableField('Stadt', expert.city, 'city')}
                {renderEditableField('Bundesland', expert.state, 'state')}
                {renderEditableField('Land', expert.country, 'country')}
                {renderEditableField('PLZ', expert.postal_code, 'postal_code')}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Online Presence */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                <i className="fas fa-globe text-blue-500 mr-2"></i>
                Online Präsenz
              </h3>
              <div className="grid grid-cols-[120px,1fr] gap-2">
                {isEditing ? (
                  <>
                    <span className="text-gray-500">Website:</span>
                    <input
                      type="url"
                      value={editedExpert.url || ''}
                      onChange={(e) => setEditedExpert({
                        ...editedExpert,
                        url: e.target.value
                      })}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </>
                ) : (
                  <>
                    <span className="text-gray-500">Website:</span>
                    <span className="break-all">
                      {expert.url ? (
                        <a 
                          href={expert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {expert.url}
                        </a>
                      ) : (
                        'Keine Website angegeben'
                      )}
                    </span>
                  </>
                )}
                {renderEditableField('LinkedIn', expert.linkedin_url, 'linkedin_url', 'url')}
                {renderEditableField('Twitter', expert.twitter_url, 'twitter_url', 'url')}
                {renderEditableField('Facebook', expert.facebook_url, 'facebook_url', 'url')}
              </div>
            </section>

            {/* Expertise - Special handling for arrays */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                <i className="fas fa-brain text-blue-500 mr-2"></i>
                Expertise
              </h3>
              {isEditing ? (
                <div className="space-y-2">
                  {getExpertiseArray(editedExpert).map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newExpertise = [...getExpertiseArray(editedExpert)];
                          newExpertise[index] = e.target.value;
                          setEditedExpert({
                            ...editedExpert,
                            expertise: Array.isArray(editedExpert.expertise) 
                              ? newExpertise 
                              : { 
                                  ...editedExpert.expertise,
                                  primary: newExpertise 
                                }
                          });
                        }}
                        className="border rounded px-2 py-1 flex-1"
                      />
                      <button
                        onClick={() => {
                          const newExpertise = getExpertiseArray(editedExpert)
                            .filter((_, i) => i !== index);
                          setEditedExpert({
                            ...editedExpert,
                            expertise: Array.isArray(editedExpert.expertise)
                              ? newExpertise
                              : {
                                  ...editedExpert.expertise,
                                  primary: newExpertise
                                }
                          });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const currentExpertise = getExpertiseArray(editedExpert);
                      setEditedExpert({
                        ...editedExpert,
                        expertise: Array.isArray(editedExpert.expertise)
                          ? [...currentExpertise, '']
                          : {
                              ...editedExpert.expertise,
                              primary: [...currentExpertise, '']
                            }
                      });
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Expertise hinzufügen
                  </button>
                </div>
              ) : (
                renderExpertiseWithSources()
              )}
            </section>
          </div>
        </div>

        {/* Description */}
        <section className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">
            <i className="fas fa-info-circle text-blue-500 mr-2"></i>
            Beschreibung
          </h3>
          {isEditing ? (
            <textarea
              value={editedExpert.description || ''}
              onChange={(e) => setEditedExpert({...editedExpert, description: e.target.value})}
              className="border rounded px-2 py-1 w-full h-32"
            />
          ) : (
            <p className="text-gray-700 whitespace-pre-line">
              {expert.description}
            </p>
          )}
        </section>

        {/* Sources Section */}
        {expert.sources && expert.sources.length > 0 && (
          <div className="mt-6">
            <section className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                <i className="fas fa-link text-blue-500 mr-2"></i>
                Quellen
              </h3>
              <div className="space-y-2">
                {expert.sources.map((source, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2 text-sm">
                    <i className={`fas fa-${source.verified ? 'check-circle text-emerald-500' : 'info-circle text-gray-400'}`}></i>
                    <a 
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {source.url}
                    </a>
                    <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {source.type.replace('_', ' ')}
                    </span>
                    <span className="text-gray-400">
                      Zuletzt geprüft: {source.date_accessed}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Add AI Enrichment section */}
        {renderAIEnrichment()}
      </div>

      {/* Company Details Popup */}
      {showCompanyDetails && (
        <CompanyDetailsPopup
          companyId={expert.company.id}
          onClose={() => setShowCompanyDetails(false)}
        />
      )}

      {showResearchAgent && (
        <ResearchAIAgentPopup
          expert={expert}
          onClose={() => setShowResearchAgent(false)}
          onSave={handleResearchResults}
        />
      )}
    </div>
  );
};

export default ExpertDetailsPopup;
